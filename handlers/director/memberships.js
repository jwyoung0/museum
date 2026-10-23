const {
    createTier,
    listTiers,
    readTier,
    updateTier,
    deleteTier
} = require("../../database/director/memberships");

const { readJsonBody } = require("../../utils/http");

async function createTierHandler(req, res) {
    const body = await readJsonBody(req);  

    const tier = {
        TierName: body.TierName,
        Price: body.Price,
        DiscountRate: body.DiscountRate,
        Description: body.Description
    }; 

    const createdTier = await createTier(tier);

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(createdTier));
}

async function listTiersHandler(req, res) {
    const tiers = await listTiers();
    
    res.writeHead(200, {
        "Content-Type": "application/json"
    });     

    res.end(JSON.stringify(tiers));
}

async function readTierHandler(req, res) {
    const tierId = req.params.id;
    const tier = await readTier(tierId);

    if (!tier) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Tier not found" })    
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(tier));
}       

async function updateTierHandler(req, res) {
    const tierId = req.params.id;
    const body = await readJsonBody(req);

    const tier = {
        TierName: body.TierName,
        Price: body.Price,
        DiscountRate: body.DiscountRate,
        Description: body.Description
    };  

    const updatedTier = await updateTier(tierId, tier);

    if (!updatedTier) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        }); 


        return res.end(
            JSON.stringify({ error: "Tier not found" })    
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(updatedTier));
}

async function deleteTierHandler(req, res) {
    const tierId = req.params.id;
    const deletedTier = await deleteTier(tierId);   
    
    if (!deletedTier) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        }); 

        return res.end(
            JSON.stringify({ error: "Tier not found" })    
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(deletedTier));
}       

module.exports = {
    createTierHandler,
    listTiersHandler,  
    readTierHandler,
    updateTierHandler,
    deleteTierHandler
};
