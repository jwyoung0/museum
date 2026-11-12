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
    const modalTitle = document.getElementById("account-modal-title");
    const submitButton = document.getElementById("account-submit-button");
    let selectedEmployeeRow = null;
    let accountAction = "add";

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

    async function readApiResponse(response) {
        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(
                `Server returned HTTP ${response.status} instead of a JSON response. ` +
                "Check the account API route and restart the Node server."
            );
        }

        if (!response.ok) {
            throw new Error(result.error || `Request failed with HTTP ${response.status}.`);
        }

        return result;
    }

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
        row.appendChild(actionCell);
        row.dataset.personnelId = employee.PersonnelID;
        row.dataset.employeeName =
            [employee.Fname, employee.Mname, employee.Lname].filter(Boolean).join(" ");
        renderAccountActions(row, employee);
        employeesTableBody.insertBefore(row, emptyState);
    }

    function renderAccountActions(row, account) {
        const actionCell = row.lastElementChild;
        actionCell.replaceChildren();

        const accountExists = Boolean(account.AccountExists);
        const accountButton = document.createElement("button");
        accountButton.type = "button";
        accountButton.className = "account-action-button";
        accountButton.dataset.action = accountExists ? "update" : "add";
        accountButton.textContent = accountExists ? "Update" : "Add";
        accountButton.dataset.accountEmail = account.AccountEmail || "";
        accountButton.dataset.accountRole = account.AccountRole || "";
        actionCell.appendChild(accountButton);

        if (accountExists) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "account-action-button";
            deleteButton.dataset.action = "delete";
            deleteButton.textContent = "Delete";
            actionCell.appendChild(deleteButton);
        }
    }

    async function searchEmployees() {
        clearSearchResults();
        searchButton.disabled = true;

        try {
            const response = await fetch(
                `/api/director/accounts/search?term=${encodeURIComponent(searchInput.value.trim())}`
            );
            const result = await readApiResponse(response);

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

    function openModal(personnelId, employeeName, employeeRow, actionButton) {
        personnelIdInput.value = personnelId;
        employeeNameInput.value = employeeName;
        selectedEmployeeRow = employeeRow;
        accountAction = actionButton.dataset.action;
        const isUpdate = accountAction === "update";
        modalTitle.textContent = isUpdate ? "Update Account" : "Add Account";
        submitButton.textContent = isUpdate ? "Update Account" : "Add Account";
        emailInput.value = actionButton.dataset.accountEmail || "";
        validateStaffEmail();
        passwordInput.value = "";
        passwordInput.required = !isUpdate;
        roleInput.value = actionButton.dataset.accountRole || "";

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
        accountAction = "add";

        messageElement.textContent = "";
        messageElement.className = "";
    }

    document.addEventListener(
        "click",
        event => {

            const button = event.target.closest(".account-action-button");
            if (!button) {
                return;
            }

            const row = button.closest(".employee-result");
            if (button.dataset.action === "delete") {
                deleteAccount(row, button);
                return;
            }

            openModal(
                row.dataset.personnelId,
                row.dataset.employeeName,
                row,
                button
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
                const isUpdate = accountAction === "update";
                const response = await fetch(
                    isUpdate
                        ? `/api/director/accounts/${encodeURIComponent(personnelIdInput.value)}`
                        : "/api/director/accounts",
                    {
                        method: isUpdate ? "PUT" : "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            personnelId: Number(personnelIdInput.value),
                            email: emailInput.value.trim(),
                            password: passwordInput.value,
                            role: roleInput.value
                        })
                    }
                );

                await readApiResponse(response);

                messageElement.textContent = isUpdate
                    ? "Account updated successfully."
                    : "Account added successfully.";

                messageElement.classList.add(
                    "success-message"
                );

                if (selectedEmployeeRow) {
                    renderAccountActions(selectedEmployeeRow, {
                        AccountExists: true,
                        AccountEmail: emailInput.value.trim(),
                        AccountRole: roleInput.value
                    });
                }

                setTimeout(closeModal, 1500);

            } catch (error) {

                console.error("Account save error:", error);

                messageElement.textContent =
                    error.message;

                messageElement.classList.add(
                    "error-message"
                );
            }

        }
    );

    async function deleteAccount(row, button) {
        if (!window.confirm(`Delete the account for ${row.dataset.employeeName}?`)) {
            return;
        }

        button.disabled = true;
        try {
            const response = await fetch(
                `/api/director/accounts/${encodeURIComponent(row.dataset.personnelId)}`,
                { method: "DELETE" }
            );
            await readApiResponse(response);

            renderAccountActions(row, { AccountExists: false });
        } catch (error) {
            console.error("Account deletion error:", error);
            window.alert(error.message);
            button.disabled = false;
        }
    }

    searchEmployees();

});