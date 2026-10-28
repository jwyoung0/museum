let allProducts = [];
let editingProductId = null;
let isSaving = false;

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    document.getElementById("product-search")
        .addEventListener("input", filterProducts);

    document.getElementById("add-product-button")
        .addEventListener("click", () => {
            if (isSaving) return;

            resetProductForm();
            document.getElementById("product-form-container").hidden = false;
            document.getElementById("product-id").focus();
        });

    document.getElementById("cancel-product-button")
        .addEventListener("click", () => {
            if (isSaving) return;

            resetProductForm();
            document.getElementById("product-form-container").hidden = true;
        });

    document.getElementById("product-form")
        .addEventListener("submit", submitProduct);
});

async function loadProducts() {
    showMessage("Loading products...");

    try {
        const response = await fetch("/api/gift-shop/products");

        if (response.redirected) {
            window.location.href = "/auth-staff";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        allProducts = await response.json();
        filterProducts();
    } catch (error) {
        console.error(error);
        showMessage("Unable to load products. Please refresh and try again.");
    }
}

function filterProducts() {
    const search = document.getElementById("product-search")
        .value.trim().toLowerCase();

    const matches = allProducts.filter(product =>
        String(product.ProductID).includes(search) ||
        product.ProductName.toLowerCase().includes(search) ||
        product.Category.toLowerCase().includes(search)
    );

    displayProducts(matches);
}

function displayProducts(products) {
    const tbody = document.getElementById("products-table-body");
    tbody.replaceChildren();

    if (products.length === 0) {
        showMessage(
            allProducts.length === 0
                ? "No products found."
                : "No products match your search."
        );
        return;
    }

    for (const product of products) {
        const row = document.createElement("tr");

        const values = [
            product.ProductID,
            product.ProductName,
            product.Category,
            `$${Number(product.Price).toFixed(2)}`,
            product.QuantityInStock
        ];

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            openEditProduct(product);
        });

        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    }
}

function showMessage(message) {
    const tbody = document.getElementById("products-table-body");
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.style.textAlign = "center";
    cell.textContent = message;

    row.appendChild(cell);
    tbody.replaceChildren(row);
}

function resetProductForm() {
    editingProductId = null;

    document.getElementById("product-form").reset();
    document.getElementById("product-id").readOnly = false;
    document.getElementById("product-form-title").textContent = "Add Product";
    document.getElementById("save-product-button").textContent = "Save Product";
    document.getElementById("product-form-message").textContent = "";
}

function openEditProduct(product) {
    if (isSaving) return;

    resetProductForm();
    editingProductId = product.ProductID;

    document.getElementById("product-id").value = product.ProductID;
    document.getElementById("product-id").readOnly = true;
    document.getElementById("product-name").value = product.ProductName;
    document.getElementById("product-category").value = product.Category;
    document.getElementById("product-price").value = product.Price;
    document.getElementById("product-stock").value = product.QuantityInStock;
    document.getElementById("product-image").value = product.ImageURL || "";

    document.getElementById("product-form-title").textContent = "Edit Product";
    document.getElementById("save-product-button").textContent = "Save Changes";

    const container = document.getElementById("product-form-container");
    container.hidden = false;
    container.scrollIntoView({ behavior: "smooth" });

    document.getElementById("product-name").focus();
}

async function submitProduct(event) {
    event.preventDefault();
    if (isSaving) return;

    const form = event.target;
    const saveButton = document.getElementById("save-product-button");
    const cancelButton = document.getElementById("cancel-product-button");
    const message = document.getElementById("product-form-message");

    const data = new FormData(form);
    const isEditing = editingProductId !== null;

    const product = {
        ProductID: isEditing
            ? editingProductId
            : Number(data.get("ProductID")),
        ProductName: data.get("ProductName").trim(),
        Category: data.get("Category").trim(),
        Price: Number(data.get("Price")),
        QuantityInStock: Number(data.get("QuantityInStock")),
        ImageURL: data.get("ImageURL").trim()
    };

    const url = isEditing
        ? `/api/gift-shop/products/${editingProductId}`
        : "/api/gift-shop/products";

    isSaving = true;
    saveButton.disabled = true;
    cancelButton.disabled = true;
    message.textContent = "Saving product...";

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });

        if (response.redirected) {
            window.location.href = "/auth-staff";
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to save product.");
        }

        resetProductForm();
        document.getElementById("product-form-container").hidden = true;

        await loadProducts();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        isSaving = false;
        saveButton.disabled = false;
        cancelButton.disabled = false;
    }
}