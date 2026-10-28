const {
    hasActiveMembership,
    purchaseProduct
} = require("../../database/gift-shop/checkout");

const { readJsonBody } = require("../../utils/http");

async function checkoutContextHandler(req, res) {
    const visitorId = req.user?.visitorId;

    const signedIn =
        Number.isInteger(visitorId) && visitorId > 0;

    const isMember = signedIn
        ? await hasActiveMembership(visitorId)
        : false;

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify({
        signedIn,
        isMember
    }));
}

async function purchaseProductHandler(req, res) {
    const body = await readJsonBody(req);

    // Take the visitor ID from the server session, not the request body.
    const sessionVisitorId = req.user?.visitorId;

    const visitorId =
        Number.isInteger(sessionVisitorId) && sessionVisitorId > 0
            ? sessionVisitorId
            : null;

    const purchase = await purchaseProduct({
        productId: body.productId,
        quantity: body.quantity,
        visitorId
    });

    res.writeHead(201, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(purchase));
}

module.exports = {
    checkoutContextHandler,
    purchaseProductHandler
};