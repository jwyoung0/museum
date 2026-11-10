CREATE OR ALTER TRIGGER dbo.TR_EXHIBITION_ARTWORK_NoActiveOverlap
ON dbo.EXHIBITION_ARTWORK
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        JOIN dbo.EXHIBITIONS AS e
            ON e.exhibitionId = i.exhibitionId
        JOIN dbo.EXHIBITION_ARTWORK AS ea
            ON ea.accessionId = i.accessionId
           AND ea.exhibitionId <> i.exhibitionId
        JOIN dbo.EXHIBITIONS AS otherE
            ON otherE.exhibitionId = ea.exhibitionId
        WHERE e.status COLLATE SQL_Latin1_General_CP1_CI_AS = N'Active'
          AND otherE.status COLLATE SQL_Latin1_General_CP1_CI_AS = N'Active'
          AND e.startDate <= otherE.endDate
          AND otherE.startDate <= e.endDate
    )
    BEGIN
        THROW 51001,
            'An artwork cannot be assigned to overlapping active exhibitions.',
            1;
    END;
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_EXHIBITIONS_NoActiveArtworkOverlap
ON dbo.EXHIBITIONS
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM
        (
            SELECT i.exhibitionId,
                   i.startDate,
                   i.endDate,
                   i.status
            FROM inserted AS i
            INNER JOIN deleted AS d
                ON d.exhibitionId = i.exhibitionId
            WHERE i.startDate <> d.startDate
               OR i.endDate <> d.endDate
               OR ISNULL(i.status, '') <> ISNULL(d.status, '')
        ) AS e
        JOIN dbo.EXHIBITION_ARTWORK AS ea
            ON ea.exhibitionId = e.exhibitionId
        JOIN dbo.EXHIBITION_ARTWORK AS otherEa
            ON otherEa.accessionId = ea.accessionId
           AND otherEa.exhibitionId <> e.exhibitionId
        JOIN dbo.EXHIBITIONS AS otherE
            ON otherE.exhibitionId = otherEa.exhibitionId
        WHERE e.status COLLATE SQL_Latin1_General_CP1_CI_AS = N'Active'
          AND otherE.status COLLATE SQL_Latin1_General_CP1_CI_AS = N'Active'
          AND e.startDate <= otherE.endDate
          AND otherE.startDate <= e.endDate
    )
    BEGIN
        THROW 51002,
            'The date or status change would place an artwork in overlapping active exhibitions.',
            1;
    END;
END;
GO