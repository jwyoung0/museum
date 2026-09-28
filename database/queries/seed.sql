-- USE [free-sql-db-2072714];
-- GO

-- BEGIN TRANSACTION;

--     INSERT INTO dbo.authentication (username, password, role)
--     VALUES 
--     ('curator', 'password123', 'curator');

-- COMMIT TRANSACTION;
-- GO

SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_NAME;