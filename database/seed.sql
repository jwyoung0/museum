USE [free-sql-db-2072714];
GO

BEGIN TRANSACTION;

    INSERT INTO dbo.authentication (username, password, role)
    VALUES 
    ('admin', 'password123', 'admin');

COMMIT TRANSACTION;
GO


SELECT * FROM dbo.authentication;
GO
