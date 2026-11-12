const {
    listProducts,
    createProduct,
    updateProduct,
    archiveProduct
} = require("../../database/gift-shop/products");

const { readJsonBody } = require("../../utils/http");

async function listProductsHandler(req, res) {
    const products = await listProducts();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(products));
}

async function createProductHandler(req, res) {
    const body = await readJsonBody(req);

    const product = await createProduct({
        ProductName: body.ProductName,
        Category: body.Category,
        Price: body.Price,
        QuantityInStock: body.QuantityInStock,
        ImageURL: body.ImageURL
    });

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(product));
}

async function updateProductHandler(req, res) {
    const body = await readJsonBody(req);

    const product = await updateProduct({
        ProductID: Number(req.params.id),
        ProductName: body.ProductName,
        Category: body.Category,
        Price: body.Price,
        QuantityInStock: body.QuantityInStock,
        ImageURL: body.ImageURL
    });

    if (!product) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Product not found."
        }));
        return;
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(product));
}

async function archiveProductHandler(req, res) {
    const archived = await archiveProduct(Number(req.params.id));
    if (!archived) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Active product not found." }));
        return;
    }

    res.writeHead(204);
    res.end();
}

module.exports = {
    listProductsHandler,
    createProductHandler,
    updateProductHandler,
    archiveProductHandler
};
