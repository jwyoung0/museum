document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("account-modal");
    const closeButton = document.getElementById("close-modal");
    const form = document.getElementById("create-account-form");
    const searchInput = document.getElementById("employee-search");
    const searchButton = document.getElementById("search-employees-button");
    const employeesTableBody = document.getElementById("employees-table-body");
    const emptyState = document.getElementById("search-empty-state");
    const errorState = document.getElementById("error-state");
    const personnelIdInput = document.getElementById("personnel-id");
    const employeeNameInput = document.getElementById("employee-name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const roleInput = document.getElementById("role");
    const messageElement = document.getElementById("account-message");
    let selectedEmployeeRow = null;

    function validateStaffEmail() {
        const email = emailInput.value.trim();
        const hasMuseumDomain = email.toLowerCase().endsWith("@museum.com");

        emailInput.setCustomValidity(
            email && !hasMuseumDomain
                ? "Staff email must end with @museum.com."
                : ""
        );

        return hasMuseumDomain;
    }

    emailInput.addEventListener("input", validateStaffEmail);

    function clearSearchResults() {
        employeesTableBody.querySelectorAll(".employee-result").forEach(row => row.remove());
        emptyState.hidden = true;
        errorState.hidden = true;
    }

    function renderEmployee(employee) {
        const row = document.createElement("tr");
        row.className = "employee-result";

        const values = [
            employee.PersonnelID,
            employee.Lname,
            employee.Fname,
            employee.Mname || "",
            employee.PositionName || "",
            employee.StartDate
                ? String(employee.StartDate).split("T")[0]
                : ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const createButton = document.createElement("button");
        createButton.type = "button";
        createButton.className = "create-account-button";
        createButton.dataset.personnelId = employee.PersonnelID;
        createButton.dataset.employeeName =
            [employee.Fname, employee.Mname, employee.Lname].filter(Boolean).join(" ");
        createButton.textContent = "Create Account";
        actionCell.appendChild(createButton);
        row.appendChild(actionCell);
        employeesTableBody.insertBefore(row, emptyState);
    }

    async function searchEmployees() {
        clearSearchResults();
        searchButton.disabled = true;

        try {
            const response = await fetch(
                `/api/director/accounts/search?term=${encodeURIComponent(searchInput.value.trim())}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Unable to search employees.");
            }

            result.forEach(renderEmployee);
            emptyState.hidden = result.length > 0;
        } catch (error) {
            console.error("Employee search error:", error);
            errorState.hidden = false;
        } finally {
            searchButton.disabled = false;
        }
    }

    searchButton.addEventListener("click", searchEmployees);
    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            searchEmployees();
        }
    });

    function openModal(personnelId, employeeName, employeeRow) {

        personnelIdInput.value = personnelId;

        employeeNameInput.value = employeeName;
        selectedEmployeeRow = employeeRow;

        emailInput.value = "";
        validateStaffEmail();
        passwordInput.value = "";
        roleInput.value = "";

        messageElement.textContent = "";
        messageElement.className = "";

        modal.classList.remove("hidden");
    }

    function closeModal() {

        modal.classList.add("hidden");

        form.reset();
        validateStaffEmail();

        personnelIdInput.value = "";
        selectedEmployeeRow = null;

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
                button.dataset.employeeName,
                button.closest(".employee-result")
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

            if (!validateStaffEmail()) {
                emailInput.reportValidity();
                return;
            }

            try {
                const response = await fetch("/api/director/accounts",
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            personnelId: Number(personnelIdInput.value),
                            email: emailInput.value.trim(),
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
                    `Account created successfully.`;

                messageElement.classList.add(
                    "success-message"
                );

                selectedEmployeeRow?.remove();

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