async function readJsonBody(req) {
    let body = "";
    let bytesRead = 0;
    const maxBodySize = 100_000;

    for await (const chunk of req) {
        bytesRead += chunk.length;

        if (bytesRead > maxBodySize) {
            const error = new Error("Request body is too large.");
            error.statusCode = 413;
            throw error;
        }

        body += chunk;
    }

    if (!body) {
        const error = new Error("Request body is required.");
        error.statusCode = 400;
        throw error;
    }

    try {
        return JSON.parse(body);
    } catch {
        const error = new Error("Request body must contain valid JSON.");
        error.statusCode = 400;
        throw error;
    }
}

module.exports = { readJsonBody };
