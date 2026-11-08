INSERT INTO dbo.Work_Assignment (
    PersonnelID,
    EventID,
    VolunteerID,
    WorkRole,
    HoursWorked,
    StartDate,
    EndDate
)
VALUES (
    1,                  -- PersonnelID
    1,                  -- EventID
    NULL,               -- VolunteerID
    'Event Coordinator',-- WorkRole
    4.50,               -- HoursWorked
    '2026-11-08 09:00', -- StartDate
    '2026-11-08 13:30'  -- EndDate
);
SELECT
    WorkAssignmentID,
    EventID,
    CASE
        WHEN PersonnelID IS NOT NULL THEN 1 ELSE 0
    END
    +
    CASE
        WHEN VolunteerID IS NOT NULL THEN 1 ELSE 0
    END AS AssignedWorkers,
    WorkRole,
    HoursWorked,
    StartDate,
    EndDate
FROM dbo.Work_Assignment
ORDER BY WorkAssignmentID DESC;