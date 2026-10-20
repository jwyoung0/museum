-- Visitor and Ticketing
-- COSC 3380 Checkpoint 3

-- Query 1: Show all purchased tickets with visitor information
SELECT
    V.Name,
    V.Email,
    T.TicketID,
    TT.TicketTypeName,
    T.Price,
    T.PurchaseDate
FROM dbo.TICKET T
JOIN dbo.VISITOR V ON T.VisitorID = V.VisitorID
JOIN dbo.TICKET_TYPE TT ON T.TicketTypeID = TT.TicketTypeID
ORDER BY T.PurchaseDate DESC, T.TicketID DESC;


-- Query 2: Find tickets purchased by a visitor
SELECT
    V.Name,
    T.TicketID,
    TT.TicketTypeName,
    T.Price,
    T.PurchaseDate
FROM dbo.TICKET T
JOIN dbo.VISITOR V ON T.VisitorID = V.VisitorID
JOIN dbo.TICKET_TYPE TT ON T.TicketTypeID = TT.TicketTypeID
WHERE V.Email = 'testingvisitor@gmail.com'
ORDER BY T.TicketID DESC;


-- Query 3: Find tickets by ticket type
SELECT
    T.TicketID,
    V.Name,
    TT.TicketTypeName,
    T.Price,
    T.PurchaseDate
FROM dbo.TICKET T
JOIN dbo.VISITOR V ON T.VisitorID = V.VisitorID
JOIN dbo.TICKET_TYPE TT ON T.TicketTypeID = TT.TicketTypeID
WHERE TT.TicketTypeName = 'Student'
ORDER BY T.PurchaseDate DESC;


-- Report 1: Total tickets sold and revenue by ticket type
SELECT
    TT.TicketTypeName,
    COUNT(*) AS TicketsSold,
    SUM(T.Price) AS TotalRevenue
FROM dbo.TICKET T
JOIN dbo.TICKET_TYPE TT ON T.TicketTypeID = TT.TicketTypeID
GROUP BY TT.TicketTypeName
ORDER BY TicketsSold DESC;


-- Report 2: Daily ticket sales
SELECT
    PurchaseDate,
    COUNT(*) AS TicketsSold,
    SUM(Price) AS TotalRevenue
FROM dbo.TICKET
GROUP BY PurchaseDate
ORDER BY PurchaseDate DESC;


-- Report 3: Total tickets and amount spent by each visitor
SELECT
    V.VisitorID,
    V.Name,
    COUNT(T.TicketID) AS TicketsPurchased,
    SUM(T.Price) AS TotalSpent
FROM dbo.VISITOR V
JOIN dbo.TICKET T ON V.VisitorID = T.VisitorID
GROUP BY V.VisitorID, V.Name
ORDER BY TotalSpent DESC;
