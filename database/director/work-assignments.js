
const { sql, getPool } = require("../connection");

async function listWorkAssignments() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            WorkAssignmentID,
            EventID,
            (
                CASE WHEN PersonnelID IS NOT NULL THEN 1 ELSE 0 END
                +
                CASE WHEN VolunteerID IS NOT NULL THEN 1 ELSE 0 END
            ) AS AssignedWorkers,
            WorkRole,
            HoursWorked,
            StartDate,
            EndDate
        FROM dbo.Work_Assignment
        ORDER BY WorkAssignmentID;
    `);

    return result.recordset;
}


// GENERATE LABOR COST REPORT

async function generateLaborCostReport(startDate, endDate) {
    const pool = await getPool();

    const result = await pool.request()
        .input("StartDate", sql.Date, startDate)
        .input("EndDate", sql.Date, endDate)
        .query(`
            -- RESULT SET 1: Overall report summary

            SELECT
                COUNT(*) AS TotalAssignments,

                COUNT(DISTINCT PersonnelID) AS TotalEmployees,

                COALESCE(SUM(HoursWorked), 0) AS TotalHoursWorked,

                SUM(LaborCost) AS KnownRateLaborCostSubtotal,

                CASE
                    WHEN COUNT(
                        CASE
                            WHEN HourlyRate IS NULL
                                OR HoursWorked IS NULL
                            THEN 1
                        END
                    ) > 0
                    THEN NULL

                    ELSE COALESCE(SUM(LaborCost), 0)
                END AS TotalLaborCost,

                COUNT(
                    CASE
                        WHEN HourlyRate IS NULL THEN 1
                    END
                ) AS AssignmentsMissingHourlyRate,

                COUNT(
                    CASE
                        WHEN HoursWorked IS NULL THEN 1
                    END
                ) AS AssignmentsMissingHours

            FROM dbo.LaborCostReport

            WHERE
                StartDate IS NOT NULL
                AND StartDate < DATEADD(DAY, 1, @EndDate)
                AND (
                    EndDate IS NULL
                    OR EndDate >= @StartDate
                );


            -- RESULT SET 2: Employee and assignment breakdown

            SELECT
                PersonnelID,

                CONCAT(Fname, ' ', Lname) AS EmployeeName,

                PositionName,

                WorkAssignmentID,
                WorkRole,
                EventName,

                StartDate,
                EndDate,

                HoursWorked,
                HourlyRate,
                LaborCost

            FROM dbo.LaborCostReport

            WHERE
                StartDate IS NOT NULL
                AND StartDate < DATEADD(DAY, 1, @EndDate)
                AND (
                    EndDate IS NULL
                    OR EndDate >= @StartDate
                )

            ORDER BY
                Lname,
                Fname,
                StartDate,
                WorkAssignmentID;
        `);

    return {
        summary: result.recordsets[0][0],
        assignments: result.recordsets[1]
    };
}


module.exports = {
    listWorkAssignments,
    generateLaborCostReport
};
