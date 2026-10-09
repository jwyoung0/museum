const { createArtist, readArtist, updateArtist } = require("../database/artists");
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

module.exports = {
    createArtistHandler
};