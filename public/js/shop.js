let shopProducts = [];

const shopCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("shop-search")
        .addEventListener("input", filterShopProducts);

    document.getElementById("shop-category")
        .addEventListener("change", filterShopProducts);

    loadShopProducts();
});

async function loadShopProducts() {
    const message = document.getElementById("shop-message");

    try {
        const response = await fetch("/api/shop/products");

        if (!response.ok) {
            throw new Error("Unable to load shop products.");
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Invalid product response.");
        }

        shopProducts = products;

        populateCategories();
        filterShopProducts();
    } catch (error) {
        console.error(error);
        message.textContent =
            "Unable to load products. Please refresh and try again.";
    }
}

function populateCategories() {
    const select = document.getElementById("shop-category");

    const categories = [
        ...new Set(shopProducts.map(product => product.Category))
    ].sort((a, b) => a.localeCompare(b));

    select.replaceChildren(new Option("All categories", ""));

    for (const category of categories) {
        select.appendChild(new Option(category, category));
    }
}

function filterShopProducts() {
    const search = document.getElementById("shop-search")
        .value.trim().toLowerCase();

    const category = document.getElementById("shop-category").value;

    const matches = shopProducts.filter(product => {
        const matchesSearch =
            product.ProductName.toLowerCase().includes(search) ||
            product.Category.toLowerCase().includes(search);

        const matchesCategory =
            !category || product.Category === category;

        return matchesSearch && matchesCategory;
    });

    displayShopProducts(matches);
}

function createImagePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "shop-image-placeholder";
    placeholder.textContent = "Image unavailable";
    return placeholder;
}

function displayShopProducts(products) {
    const container = document.getElementById("shop-products");
    const message = document.getElementById("shop-message");

    container.replaceChildren();

    if (products.length === 0) {
        message.textContent = shopProducts.length === 0
            ? "No products available yet."
            : "No products match your search.";
        return;
    }

    message.textContent =
        `${products.length} product${products.length === 1 ? "" : "s"} found.`;

    for (const product of products) {
        const card = document.createElement("article");
        card.className = "shop-card";

        if (
            typeof product.ImageURL === "string" &&
            product.ImageURL.startsWith("/images/")
        ) {
            const image = document.createElement("img");
            image.className = "shop-card-image";
            image.src = product.ImageURL;
            image.alt = product.ProductName;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                image.replaceWith(createImagePlaceholder());
            }, { once: true });

            card.appendChild(image);
        } else {
            card.appendChild(createImagePlaceholder());
        }

        const content = document.createElement("div");
        content.className = "shop-card-content";

        const category = document.createElement("p");
        category.className = "shop-card-category";
        category.textContent = product.Category;

        const name = document.createElement("h3");
        name.textContent = product.ProductName;

        const price = document.createElement("p");
        price.className = "shop-card-price";
        price.textContent = shopCurrency.format(Number(product.Price));

        const stock = document.createElement("p");
        stock.className = "shop-card-stock";

        if (Number(product.QuantityInStock) > 0) {
            stock.textContent = "In stock";

            const buyLink = document.createElement("a");
            buyLink.href =
                `/shop/checkout?productId=${encodeURIComponent(product.ProductID)}`;
            buyLink.textContent = "View and buy";
            buyLink.className = "btn";

            content.append(category, name, price, stock, buyLink);
        } else {
            stock.textContent = "Out of stock";
            stock.classList.add("unavailable");

            content.append(category, name, price, stock);
        }

        card.appendChild(content);
        container.appendChild(card);
    }
}