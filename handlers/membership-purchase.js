const { readJsonBody } = require("../utils/http");
const { createMembershipPurchase } = require("../database/membership-purchase");

async function purchaseMembershipHandler(req, res) {
    if (!req.user || !["visitor", "member"].includes(req.user.userType)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Please sign in to purchase a membership." }));
        return;
    }

    const body = await readJsonBody(req);
    const tierId = Number(body.tierId);
    const visitorId = Number(req.user.visitorId);

    if (!Number.isInteger(tierId) || tierId <= 0) {
        const error = new Error("Choose a valid membership tier.");
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(visitorId) || visitorId <= 0) {
        const error = new Error("Your visitor account could not be found. Please sign in again.");
        error.statusCode = 401;
        throw error;
    }

    const membership = await createMembershipPurchase({ tierId, visitorId });

    if (!membership) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "That membership tier is no longer available." }));
        return;
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        message: "Membership purchase complete.",
        membership
    }));
}

module.exports = { purchaseMembershipHandler };
