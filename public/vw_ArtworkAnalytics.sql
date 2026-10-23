SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[vw_ArtworkAnalytics]
AS
SELECT
    av.ViewID,
    av.ViewDate,

    a.accessionId      AS ArtworkID,
    a.title            AS ArtworkTitle,
    a.creationDate     AS ArtworkCreationDate,

    ar.artistId        AS ArtistID,
    ar.fullName        AS ArtistName,

    s.styleId          AS StyleID,
    s.styleName        AS StyleName,

    p.PeriodID         AS PeriodID,
    p.PeriodName       AS PeriodName,

    c.collectionId     AS CollectionID,
    c.collectionName   AS CollectionName,

    av.VisitorID
FROM dbo.ARTWORK_VIEW av
    INNER JOIN dbo.ARTWORKS a
        ON av.ArtworkID = a.accessionId

    INNER JOIN dbo.ARTISTS ar
        ON a.artistId = ar.artistId

    LEFT JOIN dbo.STYLES s
        ON a.styleId = s.styleId

    LEFT JOIN dbo.PERIODS p
        ON a.periodId = p.PeriodID

    INNER JOIN dbo.COLLECTIONS c
        ON a.collectionId = c.collectionId;
GO
