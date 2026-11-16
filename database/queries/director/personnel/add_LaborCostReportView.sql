
CREATE OR ALTER VIEW dbo.LaborCostReport
AS
SELECT
    -- Work Assignment Information
    WA.WorkAssignmentID,
    WA.AssignmentName,
    WA.StartDate,
    WA.EndDate,

    -- Employee Information
    P.PersonnelID,
    P.Fname,
    P.Mname,
    P.Lname,

    -- Position Information
    POS.PositionID,
    POS.PositionName,
    POS.EmploymentType,

    -- Assignment Participation
    AP.AssignmentPersonnelID,
    AP.WorkRole,

    -- Individual Work Session
    WS.SessionID,
    WS.WorkDate,
    WS.HoursWorked,
    WS.HourlyRateAtTime,

    -- Applicable Hourly Rate
    COALESCE(
        WS.HourlyRateAtTime,
        POS.HourlyRate
    ) AS HourlyRate,

    -- Labor Cost for this Session
    CAST(
        WS.HoursWorked *
        COALESCE(
            WS.HourlyRateAtTime,
            POS.HourlyRate
        )
        AS DECIMAL(18, 2)
    ) AS LaborCost

FROM dbo.Personnel_Work_Session WS

INNER JOIN dbo.Assignment_Personnel AP
    ON WS.AssignmentPersonnelID = AP.AssignmentPersonnelID

INNER JOIN dbo.Work_Assignment WA
    ON AP.WorkAssignmentID = WA.WorkAssignmentID

INNER JOIN dbo.Personnel P
    ON AP.PersonnelID = P.PersonnelID

LEFT JOIN dbo.POSITION POS
    ON P.PositionID = POS.PositionID;
