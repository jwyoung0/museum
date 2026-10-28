const registerForm = document.querySelector("#register-form");
const registerMessage = document.querySelector("#login-message");

if (!registerForm || !registerMessage) {
    throw new Error("Registration form or message element was not found");
}

const submitButton = registerForm.querySelector(
    'button[type="submit"]'
);

if (!submitButton) {
    throw new Error("Registration submit button was not found");
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(
        formData.get("passwordConfirm") ?? ""
    );

    registerMessage.textContent = "";
    registerMessage.style.color = "var(--ink)";

    if (password !== passwordConfirm) {
        registerMessage.style.color = "#dc2626";
        registerMessage.textContent = "Passwords do not match.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
        const response = await fetch("/api/register-visitor", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error || "Unable to create account."
            );
        }

        window.location.assign(getPostLoginRedirect(result));

    } catch (error) {
        registerMessage.style.color = "#dc2626";
        registerMessage.textContent =
            error instanceof Error
                ? error.message
                : "Unable to create account.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
    }
});


// helper for redirect upon successfull registration 
function getPostLoginRedirect(result) {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");

    if (
        returnTo &&
        returnTo.startsWith("/") &&
        !returnTo.startsWith("//")
    ) {
        return returnTo;
    }

    return result.redirectTo || "/";
}