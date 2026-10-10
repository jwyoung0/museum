const { 
    createArtist,
    listArtists, 
    readArtist, 
    updateArtist,
    deleteArtist 
} = require("../database/artists");

const { readJsonBody } = require("../utils/http");

async function createArtistHandler(req, res) {
    const body = await readJsonBody(req);

    const artist = {
        fullName: body.fullName,
        birthYear: body.birthYear,
        placeOfBirth: body.placeOfBirth,
        period: body.period,
        deathYear: body.deathYear,
        sex: body.sex,
        nationality: body.nationality
    };

    const createdArtist = await createArtist(artist);

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(createdArtist));
}

async function listArtistsHandler(req, res) {
    const artists = await listArtists();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artists));
}

async function readArtistHandler(req, res) {
    const artistId = req.params.id;

    const artist = await readArtist(artistId);

    if (!artist) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Artist not found" })
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artist));
}

async function updateArtistHandler(req, res) {
    const artistId = req.params.id;
    const body = await readJsonBody(req);

    const artist = {
        fullName: body.fullName,
        birthYear: body.birthYear,
        placeOfBirth: body.placeOfBirth,
        period: body.period,
        deathYear: body.deathYear,
        sex: body.sex,
        nationality: body.nationality
    };

    const updatedArtist = await updateArtist(artistId, artist);

    if (!updatedArtist) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Artist not found" })
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(updatedArtist));
}

async function deleteArtistHandler(req, res) {
    const artistId = req.params.id;

    const deletedArtist = await deleteArtist(artistId);

    if (!deletedArtist) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Artist not found" })
        );
    }

    res.writeHead(204);
    res.end();
}

module.exports = {
    createArtistHandler,
    listArtistsHandler,
    readArtistHandler,
    updateArtistHandler,
    deleteArtistHandler
};