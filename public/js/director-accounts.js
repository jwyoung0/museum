document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("account-modal");
    const closeButton = document.getElementById("close-modal");
    const form = document.getElementById("create-account-form");
    const personnelIdInput = document.getElementById("personnel-id");
    const employeeNameInput = document.getElementById("employee-name");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const roleInput = document.getElementById("role");
    const messageElement = document.getElementById("account-message");

    function openModal(personnelId, employeeName) {

        personnelIdInput.value = personnelId;

        employeeNameInput.value = employeeName;

        usernameInput.value = "";
        passwordInput.value = "";
        roleInput.value = "";

        messageElement.textContent = "";
        messageElement.className = "";

        modal.classList.remove("hidden");
    }

    function closeModal() {

        modal.classList.add("hidden");

        form.reset();

        personnelIdInput.value = "";

        messageElement.textContent = "";
        messageElement.className = "";
    }

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".create-account-button"
                );

            if (!button) {
                return;
            }

            openModal(
                button.dataset.personnelId,
                button.dataset.employeeName
            );
        }
    );

    closeButton.addEventListener(
        "click",
        closeModal
    );

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeModal();
            }

        }
    );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            messageElement.textContent = "";
            messageElement.className = "";

            try {
                const response = await fetch("/api/director/accounts",
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            personnelId: Number(personnelIdInput.value),
                            username: usernameInput.value.trim(),
                            password: passwordInput.value,
                            role: roleInput.value
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Unable to create account."
                    );

                }

                messageElement.textContent =
                    `Account created successfully. User ID: ${result.userID}`;

                messageElement.classList.add(
                    "success-message"
                );

                setTimeout(closeModal, 1500);

            } catch (error) {

                console.error(
                    "Account creation error:",
                    error
                );

                messageElement.textContent =
                    error.message;

                messageElement.classList.add(
                    "error-message"
                );
            }

        }
    );

});