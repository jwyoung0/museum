const {
    listProducts,
    createProduct,
    updateProduct
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
        ProductID: body.ProductID,
        ProductName: body.ProductName,
        Category: body.Category,
        Price: body.Price,
        QuantityInStock: body.QuantityInStock
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
        QuantityInStock: body.QuantityInStock
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

module.exports = {
    listProductsHandler,
    createProductHandler,
    updateProductHandler
};