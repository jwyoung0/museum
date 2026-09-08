IF OBJECT_ID(N'dbo.test_employees', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.test_employees (
        id INT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        position NVARCHAR(255) NOT NULL,
        salary INT NOT NULL CONSTRAINT DF_test_employees_salary DEFAULT (0),
        start_date DATETIME2 NOT NULL CONSTRAINT DF_test_employees_start_date DEFAULT (SYSUTCDATETIME()),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_test_employees_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
