let checkoutProduct = null;
let checkoutContext = null;
let isPurchasing = false;
let purchaseComplete = false;

const checkoutCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkout-quantity")
        .addEventListener("input", updateCheckoutTotal);

    document.querySelector(
        'input[name="checkout-choice"][value="member"]'
    ).addEventListener("change", () => {
        window.location.href = "/auth-visitor";
    });

    document.getElementById("checkout-button")
        .addEventListener("click", completePurchase);

    loadCheckout();
});

async function loadCheckout() {
    const message = document.getElementById("checkout-message");

    try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("productId");

        if (!productId || !/^\d+$/.test(productId)) {
            throw new Error("No valid product was selected.");
        }

        const [productsResponse, contextResponse] = await Promise.all([
            fetch("/api/shop/products"),
            fetch("/api/shop/checkout-context")
        ]);

        if (!productsResponse.ok || !contextResponse.ok) {
            throw new Error("Unable to load checkout.");
        }

        const products = await productsResponse.json();
        checkoutContext = await contextResponse.json();

        checkoutProduct = products.find(
            product => String(product.ProductID) === productId
        );

        if (!checkoutProduct) {
            throw new Error("Product not found.");
        }

        displayCheckoutProduct();
        displayCheckoutStatus();
        updateCheckoutTotal();

        message.textContent = "";
        document.getElementById("checkout-details").hidden = false;
    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
}

function displayCheckoutProduct() {
    const product = checkoutProduct;

    document.getElementById("checkout-product-name").textContent =
        product.ProductName;

    document.getElementById("checkout-category").textContent =
        `Category: ${product.Category}`;

    document.getElementById("checkout-price").textContent =
        `Regular price: ${checkoutCurrency.format(Number(product.Price))}`;

    const stock = Number(product.QuantityInStock);
    const quantityInput = document.getElementById("checkout-quantity");

    document.getElementById("checkout-availability").textContent =
        stock > 0 ? "In stock" : "Out of stock";

    quantityInput.max = stock > 0 ? stock : 1;
    quantityInput.disabled = stock <= 0;

    const image = document.getElementById("checkout-image");

    if (
        typeof product.ImageURL === "string" &&
        product.ImageURL.startsWith("/images/")
    ) {
        image.src = product.ImageURL;
        image.alt = product.ProductName;
        image.hidden = false;

        image.addEventListener("error", () => {
            image.hidden = true;
        }, { once: true });
    }
}

function displayCheckoutStatus() {
    const guestOptions = document.getElementById("checkout-guest-options");
    const membership = document.getElementById("checkout-membership");

    if (!checkoutContext.signedIn) {
        guestOptions.hidden = false;
        membership.textContent = "Guest price: no membership discount.";
    } else if (checkoutContext.isMember) {
        guestOptions.hidden = true;
        membership.textContent = "Active member: 10% discount applied.";
    } else {
        guestOptions.hidden = true;
        membership.textContent =
            "Signed in without an active membership: regular price applies.";
    }
}

function updateCheckoutTotal() {
    if (!checkoutProduct || !checkoutContext || purchaseComplete) return;

    const quantityInput = document.getElementById("checkout-quantity");
    const quantity = Number(quantityInput.value);
    const stock = Number(checkoutProduct.QuantityInStock);
    const totalDisplay = document.getElementById("checkout-total");
    const purchaseButton = document.getElementById("checkout-button");

    const validQuantity =
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= stock;

    purchaseButton.disabled = !validQuantity || isPurchasing;

    if (!validQuantity) {
        totalDisplay.textContent = stock > 0
            ? `Enter a quantity between 1 and ${stock}.`
            : "This product is out of stock.";
        return;
    }

    // Preview only: the server calculates the final price.
    const regularCents = Math.round(Number(checkoutProduct.Price) * 100);
    const unitCents = checkoutContext.isMember
        ? Math.round(regularCents * 0.9)
        : regularCents;

    totalDisplay.textContent =
        `Estimated total: ${checkoutCurrency.format(unitCents * quantity / 100)}`;
}

async function completePurchase() {
    if (isPurchasing || purchaseComplete || !checkoutProduct) return;

    const quantityInput = document.getElementById("checkout-quantity");
    const quantity = Number(quantityInput.value);
    const stock = Number(checkoutProduct.QuantityInStock);
    const message = document.getElementById("checkout-message");
    const purchaseButton = document.getElementById("checkout-button");

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
        updateCheckoutTotal();
        return;
    }

    isPurchasing = true;
    purchaseButton.disabled = true;
    quantityInput.disabled = true;
    message.textContent = "Recording purchase...";

    let response;

    try {
        response = await fetch("/api/shop/purchases", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                productId: Number(checkoutProduct.ProductID),
                quantity: quantity
            })
        });
    } catch (error) {
        console.error(error);

        // The request may have succeeded even if its response was lost.
        message.textContent =
            "Could not confirm the purchase. Check with the shop manager " +
            "before trying again.";
        return;
    }

    let result;

    try {
        result = await response.json();
    } catch (error) {
        console.error(error);
        message.textContent =
            "Could not confirm the purchase. Check with the shop manager " +
            "before trying again.";
        return;
    }

    if (!response.ok) {
        message.textContent = result.error || "Unable to record purchase.";

        if (response.status === 409) {
            message.textContent += " Return to the shop and refresh stock.";
        } else {
            isPurchasing = false;
            quantityInput.disabled = false;
            updateCheckoutTotal();
        }

        return;
    }

    purchaseComplete = true;

    message.textContent =
        `Purchase recorded! Confirmation number: ${result.PurchaseID}.`;

    document.getElementById("checkout-total").textContent =
        `Final total: ${checkoutCurrency.format(Number(result.Total))}`;

    purchaseButton.textContent = "Purchase recorded";
}