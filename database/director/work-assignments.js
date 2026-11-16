
const { sql, getPool } = require("../connection");


// LIST WORK ASSIGNMENTS

async function listWorkAssignments() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            WA.WorkAssignmentID,
            WA.AssignmentName,
            WA.Description,
            WA.StartDate,
            WA.EndDate,
            COUNT(DISTINCT AP.PersonnelID) AS EmployeeCount

        FROM dbo.Work_Assignment WA

        LEFT JOIN dbo.Assignment_Personnel AP
            ON WA.WorkAssignmentID = AP.WorkAssignmentID

        GROUP BY
            WA.WorkAssignmentID,
            WA.AssignmentName,
            WA.Description,
            WA.StartDate,
            WA.EndDate

        ORDER BY WA.WorkAssignmentID;
    `);

    return result.recordset;
}


// CREATE WORK ASSIGNMENT

async function createWorkAssignment({
    assignmentName,
    description,
    startDate,
    endDate
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("AssignmentName", sql.NVarChar(100), assignmentName)
        .input("Description", sql.NVarChar(500), description || null)
        .input("StartDate", sql.Date, startDate || null)
        .input("EndDate", sql.Date, endDate || null)
        .query(`
            INSERT INTO dbo.Work_Assignment (
                AssignmentName,
                Description,
                StartDate,
                EndDate
            )
            OUTPUT
                INSERTED.WorkAssignmentID,
                INSERTED.AssignmentName,
                INSERTED.Description,
                INSERTED.StartDate,
                INSERTED.EndDate
            VALUES (
                @AssignmentName,
                @Description,
                @StartDate,
                @EndDate
            );
        `);

    return result.recordset[0];
}


// UPDATE WORK ASSIGNMENT

async function updateWorkAssignment({
    workAssignmentID,
    assignmentName,
    description,
    startDate,
    endDate
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("WorkAssignmentID", sql.Int, workAssignmentID)
        .input("AssignmentName", sql.NVarChar(100), assignmentName)
        .input("Description", sql.NVarChar(500), description || null)
        .input("StartDate", sql.Date, startDate || null)
        .input("EndDate", sql.Date, endDate || null)
        .query(`
            UPDATE dbo.Work_Assignment

            SET
                AssignmentName = @AssignmentName,
                Description = @Description,
                StartDate = @StartDate,
                EndDate = @EndDate

            OUTPUT
                INSERTED.WorkAssignmentID,
                INSERTED.AssignmentName,
                INSERTED.Description,
                INSERTED.StartDate,
                INSERTED.EndDate

            WHERE WorkAssignmentID = @WorkAssignmentID;
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    return result.recordset[0];
}


// LIST PERSONNEL ASSIGNED TO A WORK ASSIGNMENT

async function listAssignedPersonnel(workAssignmentID) {
    const pool = await getPool();

    const result = await pool.request()
        .input("WorkAssignmentID", sql.Int, workAssignmentID)
        .query(`
            SELECT
                AP.AssignmentPersonnelID,
                AP.WorkAssignmentID,
                AP.PersonnelID,
                AP.WorkRole,

                P.Fname,
                P.Mname,
                P.Lname

            FROM dbo.Assignment_Personnel AP

            INNER JOIN dbo.Personnel P
                ON AP.PersonnelID = P.PersonnelID

            WHERE AP.WorkAssignmentID = @WorkAssignmentID

            ORDER BY
                P.Lname,
                P.Fname;
        `);

    return result.recordset;
}


// ASSIGN PERSONNEL TO A WORK ASSIGNMENT

async function assignPersonnelToWorkAssignment({
    workAssignmentID,
    personnelID,
    workRole
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("WorkAssignmentID", sql.Int, workAssignmentID)
        .input("PersonnelID", sql.Int, personnelID)
        .input("WorkRole", sql.NVarChar(100), workRole)
        .query(`
            SET XACT_ABORT ON;

            BEGIN TRANSACTION;

            IF NOT EXISTS (
                SELECT 1
                FROM dbo.Work_Assignment
                WHERE WorkAssignmentID = @WorkAssignmentID
            )
            BEGIN
                THROW 50001, 'Work assignment not found.', 1;
            END;

            IF NOT EXISTS (
                SELECT 1
                FROM dbo.Personnel
                WHERE PersonnelID = @PersonnelID
            )
            BEGIN
                THROW 50002, 'Personnel record not found.', 1;
            END;

            IF EXISTS (
                SELECT 1
                FROM dbo.Assignment_Personnel WITH (UPDLOCK, HOLDLOCK)
                WHERE
                    WorkAssignmentID = @WorkAssignmentID
                    AND PersonnelID = @PersonnelID
            )
            BEGIN
                THROW 50003, 'Employee is already assigned to this work assignment.', 1;
            END;

            INSERT INTO dbo.Assignment_Personnel (
                WorkAssignmentID,
                PersonnelID,
                WorkRole
            )
            OUTPUT
                INSERTED.AssignmentPersonnelID,
                INSERTED.WorkAssignmentID,
                INSERTED.PersonnelID,
                INSERTED.WorkRole
            VALUES (
                @WorkAssignmentID,
                @PersonnelID,
                @WorkRole
            );

            COMMIT TRANSACTION;
        `);

    return result.recordset[0];
}



 // LIST WORK SESSIONS

async function listWorkSessions(assignmentPersonnelID) {
    const pool = await getPool();

    const result = await pool.request()
        .input("AssignmentPersonnelID", sql.Int, assignmentPersonnelID)
        .query(`
            SELECT
                WS.SessionID,
                WS.AssignmentPersonnelID,
                WS.WorkDate,
                WS.HoursWorked,
                WS.HourlyRateAtTime,

                WS.HoursWorked * WS.HourlyRateAtTime AS LaborCost

            FROM dbo.Personnel_Work_Session WS

            WHERE WS.AssignmentPersonnelID = @AssignmentPersonnelID

            ORDER BY
                WS.WorkDate DESC,
                WS.SessionID DESC;
        `);

    return result.recordset;
}


// CREATE WORK SESSION

async function createWorkSession({
    assignmentPersonnelID,
    workDate,
    hoursWorked,
    hourlyRateAtTime
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("AssignmentPersonnelID", sql.Int, assignmentPersonnelID)
        .input("WorkDate", sql.Date, workDate)
        .input("HoursWorked", sql.Decimal(5, 2), hoursWorked)
        .input("HourlyRateAtTime", sql.Decimal(10, 2), hourlyRateAtTime)
        .query(`
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.Assignment_Personnel
                WHERE AssignmentPersonnelID = @AssignmentPersonnelID
            )
            BEGIN
                THROW 50004, 'Assigned employee not found.', 1;
            END;

            INSERT INTO dbo.Personnel_Work_Session (
                AssignmentPersonnelID,
                WorkDate,
                HoursWorked,
                HourlyRateAtTime
            )
            OUTPUT
                INSERTED.SessionID,
                INSERTED.AssignmentPersonnelID,
                INSERTED.WorkDate,
                INSERTED.HoursWorked,
                INSERTED.HourlyRateAtTime
            VALUES (
                @AssignmentPersonnelID,
                @WorkDate,
                @HoursWorked,
                @HourlyRateAtTime
            );
        `);

    return result.recordset[0];
}


// UPDATE WORK SESSION

async function updateWorkSession({
    sessionID,
    assignmentPersonnelID,
    workDate,
    hoursWorked,
    hourlyRateAtTime
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("SessionID", sql.Int, sessionID)
        .input("AssignmentPersonnelID", sql.Int, assignmentPersonnelID)
        .input("WorkDate", sql.Date, workDate)
        .input("HoursWorked", sql.Decimal(5, 2), hoursWorked)
        .input("HourlyRateAtTime", sql.Decimal(10, 2), hourlyRateAtTime)
        .query(`
            UPDATE dbo.Personnel_Work_Session

            SET
                WorkDate = @WorkDate,
                HoursWorked = @HoursWorked,
                HourlyRateAtTime = @HourlyRateAtTime

            OUTPUT
                INSERTED.SessionID,
                INSERTED.AssignmentPersonnelID,
                INSERTED.WorkDate,
                INSERTED.HoursWorked,
                INSERTED.HourlyRateAtTime

            WHERE
                SessionID = @SessionID
                AND AssignmentPersonnelID = @AssignmentPersonnelID;
        `);

    return result.recordset[0] || null;
}


// DELETE WORK SESSION

async function deleteWorkSession({
    sessionID,
    assignmentPersonnelID
}) {
    const pool = await getPool();

    const result = await pool.request()
        .input("SessionID", sql.Int, sessionID)
        .input("AssignmentPersonnelID", sql.Int, assignmentPersonnelID)
        .query(`
            DELETE FROM dbo.Personnel_Work_Session

            OUTPUT
                DELETED.SessionID

            WHERE
                SessionID = @SessionID
                AND AssignmentPersonnelID = @AssignmentPersonnelID;
        `);

    return result.recordset.length > 0;
}


// GENERATE LABOR COST REPORT


// GENERATE LABOR COST REPORT

async function generateLaborCostReport(
    startDate,
    endDate,
    personnelID = null,
    positionID = null
) {
    const pool = await getPool();

    const result = await pool.request()
        .input("StartDate", sql.Date, startDate)
        .input("EndDate", sql.Date, endDate)
        .input("PersonnelID", sql.Int, personnelID)
        .input("PositionID", sql.Int, positionID)
        .query(`
            -- RESULT SET 1: Overall Report Summary

            SELECT
                COUNT(DISTINCT WorkAssignmentID) AS TotalAssignments,

                COUNT(DISTINCT PersonnelID) AS TotalEmployees,

                COUNT(*) AS TotalSessions,

                COALESCE(
                    SUM(HoursWorked),
                    0
                ) AS TotalHoursWorked,

                COALESCE(
                    SUM(LaborCost),
                    0
                ) AS KnownRateLaborCostSubtotal,

                CASE
                    WHEN COUNT(
                        CASE
                            WHEN LaborCost IS NULL THEN 1
                        END
                    ) > 0
                    THEN NULL

                    ELSE COALESCE(
                        SUM(LaborCost),
                        0
                    )
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
                WorkDate >= @StartDate
                AND WorkDate <= @EndDate

                AND (
                    @PersonnelID IS NULL
                    OR PersonnelID = @PersonnelID
                )

                AND (
                    @PositionID IS NULL
                    OR PositionID = @PositionID
                );


            -- RESULT SET 2: Employee and Assignment Breakdown

            SELECT
                PersonnelID,

                CONCAT(Fname, ' ', Lname) AS EmployeeName,

                PositionID,
                PositionName,

                WorkAssignmentID,
                AssignmentName,
                WorkRole,

                MIN(WorkDate) AS StartDate,
                MAX(WorkDate) AS EndDate,

                COUNT(*) AS SessionCount,

                SUM(HoursWorked) AS HoursWorked,

                CASE
                    WHEN MIN(HourlyRate) = MAX(HourlyRate)
                        AND COUNT(HourlyRate) = COUNT(*)
                    THEN MIN(HourlyRate)
                    ELSE NULL
                END AS HourlyRate,

                SUM(LaborCost) AS KnownLaborCostSubtotal,

                CASE
                    WHEN COUNT(
                        CASE
                            WHEN LaborCost IS NULL THEN 1
                        END
                    ) > 0
                    THEN NULL
                    ELSE COALESCE(
                        SUM(LaborCost),
                        0
                    )
                END AS LaborCost,

                COUNT(
                    CASE
                        WHEN LaborCost IS NULL THEN 1
                    END
                ) AS SessionsMissingCost

            FROM dbo.LaborCostReport

            WHERE
                WorkDate >= @StartDate
                AND WorkDate <= @EndDate

                AND (
                    @PersonnelID IS NULL
                    OR PersonnelID = @PersonnelID
                )

                AND (
                    @PositionID IS NULL
                    OR PositionID = @PositionID
                )

            GROUP BY
                PersonnelID,
                Fname,
                Lname,
                PositionID,
                PositionName,
                WorkAssignmentID,
                AssignmentName,
                WorkRole

            ORDER BY
                EmployeeName,
                AssignmentName;
        `);

    return {
        summary: result.recordsets[0][0],
        assignments: result.recordsets[1]
    };
}

// EXPORT FUNCTIONS


module.exports = {
    listWorkAssignments,
    createWorkAssignment,
    updateWorkAssignment,
    listAssignedPersonnel,
    assignPersonnelToWorkAssignment,
    listWorkSessions,
    createWorkSession,
    updateWorkSession,
    deleteWorkSession,
    generateLaborCostReport
};
