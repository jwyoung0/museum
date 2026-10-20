const {
    createCollection,
    listCollections,
    readCollection,
    updateCollection,
    deleteCollection
} = require("../../database/curator/collections");

const { readJsonBody } = require("../../utils/http");

async function createCollectionHandler(req, res) {
    const body = await readJsonBody(req);

    const collection = {
        collectionName: body.collectionName,
        description: body.description
    };

    const createdCollection = await createCollection(collection);

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(createdCollection));
}

async function listCollectionsHandler(req, res) {
    const collections = await listCollections();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(collections));
}

async function readCollectionHandler(req, res) {
    const collectionId = req.params.id;
    const collection = await readCollection(collectionId);

    if (!collection) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Collection not found" })    
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    const artworkCount = await countCollectionArtworks(collectionId);

    res.end(JSON.stringify({
        ...collection,
        artworkCount
    }));
}

async function updateCollectionHandler(req, res) {
    const collectionId = req.params.id;
    const body = await readJsonBody(req);

    const collection = {
        collectionName: body.collectionName,
        description: body.description
    };

    const updatedCollection = await updateCollection(collectionId, collection);

    if (!updatedCollection) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Collection not found" })
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(updatedCollection));
}

async function deleteCollectionHandler(req, res) {
    const collectionId = req.params.id;

    const artworkCount = await countCollectionArtworks(collectionId);

    if (artworkCount > 0) {
        res.writeHead(409, {"Content-Type": "application/json"});

        return res.end(JSON.stringify({
            error: 
                `This collection is associated with ` +
                `${artworkCount} artworks. ` +
                `Reassign or remove those artworks ` +
                `before deleting the collection.`,
            artworkCount
        }));
    }

    const deletedCollection = await deleteCollection(collectionId);

    if (!deletedCollection) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({ error: "Collection not found" }));
    }

    res.writeHead(204);
    res.end();
}

module.exports = {
    createCollectionHandler,
    listCollectionsHandler,
    readCollectionHandler,
    updateCollectionHandler,
    deleteCollectionHandler
};