
const personnelTableBody = document.getElementById("personnel-table-body");
const personnelMessage = document.getElementById("personnel-message");
const personnelForm = document.getElementById("personnel-form");
const refreshPersonnelButton = document.getElementById("refresh-personnel");
const addPersonnelButton = document.getElementById("show-add-personnel");
const addPersonnelPanel = document.getElementById("add-personnel-panel");
const cancelAddPersonnelButton = document.getElementById("cancel-add-personnel");
const deactivatePersonnelButton = document.getElementById("deactivate-personnel");
const reactivatePersonnelButton = document.getElementById("reactivate-personnel");
const selectAllPersonnelCheckbox = document.getElementById("select-all-personnel");

if (
    !personnelTableBody ||
    !personnelMessage ||
    !personnelForm ||
    !refreshPersonnelButton ||
    !addPersonnelButton ||
    !addPersonnelPanel ||
    !cancelAddPersonnelButton
) {
    console.error(
        "Director personnel script: One or more required HTML elements are missing."
    );
} else {
    function getPersonnelCheckboxes() {
        return Array.from(
            personnelTableBody.querySelectorAll(".personnel-checkbox")
        );
    }

    // Get the IDs of all individually selected employees.
    function getSelectedPersonnelIDs() {
        return getPersonnelCheckboxes()
            .filter(checkbox => checkbox.checked)
            .map(checkbox => Number(checkbox.value))
            .filter(id => Number.isInteger(id) && id > 0);
    }

    // Get selected active employees for deactivation.
    function getSelectedActivePersonnelIDs() {
        return getPersonnelCheckboxes()
            .filter(
                checkbox =>
                    checkbox.checked &&
                    checkbox.dataset.active === "true"
            )
            .map(checkbox => Number(checkbox.value))
            .filter(id => Number.isInteger(id) && id > 0);
    }

    // Get selected inactive employees for reactivation.
    function getSelectedInactivePersonnelIDs() {
        return getPersonnelCheckboxes()
            .filter(
                checkbox =>
                    checkbox.checked &&
                    checkbox.dataset.active === "false"
            )
            .map(checkbox => Number(checkbox.value))
            .filter(id => Number.isInteger(id) && id > 0);
    }

    // Keep the selection controls synchronized with the table.
    function updateSelectionControls() {
        const activeCheckboxes = getPersonnelCheckboxes().filter(
            checkbox => checkbox.dataset.active === "true"
        );

        const selectedActiveCount = activeCheckboxes.filter(
            checkbox => checkbox.checked
        ).length;

        if (selectAllPersonnelCheckbox) {
            selectAllPersonnelCheckbox.checked =
                activeCheckboxes.length > 0 &&
                selectedActiveCount === activeCheckboxes.length;

            selectAllPersonnelCheckbox.indeterminate =
                selectedActiveCount > 0 &&
                selectedActiveCount < activeCheckboxes.length;
        }

        if (deactivatePersonnelButton) {
            deactivatePersonnelButton.disabled =
                selectedActiveCount === 0;
        }

        if (reactivatePersonnelButton) {
            reactivatePersonnelButton.disabled =
                getSelectedInactivePersonnelIDs().length === 0;
        }
    }

    // Load personnel records from the backend.
    async function loadPersonnel() {
        personnelMessage.textContent = "Loading personnel records...";
        refreshPersonnelButton.disabled = true;

        if (deactivatePersonnelButton) {
            deactivatePersonnelButton.disabled = true;
        }

        if (reactivatePersonnelButton) {
            reactivatePersonnelButton.disabled = true;
        }

        try {
            const response = await fetch("/api/director/personnel");

            if (!response.ok) {
                throw new Error(
                    `Unable to retrieve personnel records (HTTP ${response.status}).`
                );
            }

            const personnel = await response.json();

            if (!Array.isArray(personnel)) {
                throw new Error(
                    "The server returned an unexpected response."
                );
            }

            personnelTableBody.replaceChildren();

            if (selectAllPersonnelCheckbox) {
                selectAllPersonnelCheckbox.checked = false;
                selectAllPersonnelCheckbox.indeterminate = false;
            }

            if (personnel.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 12;
                cell.textContent = "No personnel records found.";

                row.appendChild(cell);
                personnelTableBody.appendChild(row);
            } else {
                personnel.forEach(person => {
                    const row = document.createElement("tr");

                    const isActive =
                        person.EmploymentStatus === true ||
                        person.EmploymentStatus === 1 ||
                        person.EmploymentStatus === "1";

                    // Add a checkbox for every employee.
                    const checkboxCell = document.createElement("td");
                    const checkbox = document.createElement("input");

                    checkbox.type = "checkbox";
                    checkbox.className = "personnel-checkbox";
                    checkbox.value = person.PersonnelID;
                    checkbox.dataset.active = String(isActive);

                    checkbox.setAttribute(
                        "aria-label",
                        `Select ${isActive ? "active" : "inactive"} personnel ${person.PersonnelID}`
                    );

                    checkboxCell.appendChild(checkbox);
                    row.appendChild(checkboxCell);

                    // Add personnel information in the table's column order.
                    const values = [
                        person.Fname ?? "",
                        person.Mname ?? "",
                        person.Lname ?? "",
                        person.PositionID ?? "",
                        person.PhoneNumber ?? "",
                        person.Email ?? "",
                        isActive ? "Active" : "Inactive",
                        person.DateOfBirth
                            ? String(person.DateOfBirth).slice(0, 10)
                            : "",
                        person.StartDate
                            ? String(person.StartDate).slice(0, 10)
                            : "",
                        person.EndDate
                            ? String(person.EndDate).slice(0, 10)
                            : "",
                        person.SSN ?? ""
                    ];

                    values.forEach(value => {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        row.appendChild(cell);
                    });

                    personnelTableBody.appendChild(row);
                });
            }

            updateSelectionControls();

            personnelMessage.textContent =
                `Loaded ${personnel.length} personnel record(s).`;
        } catch (error) {
            console.error("Failed to load personnel:", error);

            personnelMessage.textContent = error.message;
            personnelTableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 12;
            cell.textContent = "Failed to load personnel records.";

            row.appendChild(cell);
            personnelTableBody.appendChild(row);

            if (selectAllPersonnelCheckbox) {
                selectAllPersonnelCheckbox.checked = false;
                selectAllPersonnelCheckbox.indeterminate = false;
            }
        } finally {
            refreshPersonnelButton.disabled = false;
            updateSelectionControls();
        }
    }

    // Refresh personnel records.
    refreshPersonnelButton.addEventListener("click", loadPersonnel);

    // Show the Add Personnel form.
    addPersonnelButton.addEventListener("click", () => {
        addPersonnelPanel.hidden = false;
        addPersonnelButton.hidden = true;
    });

    // Cancel adding personnel.
    cancelAddPersonnelButton.addEventListener("click", () => {
        addPersonnelPanel.hidden = true;
        addPersonnelButton.hidden = false;
        personnelForm.reset();
        personnelMessage.textContent = "";
    });

    // Select or deselect active employees only.
    if (selectAllPersonnelCheckbox) {
        selectAllPersonnelCheckbox.addEventListener("change", () => {
            const activeCheckboxes = getPersonnelCheckboxes().filter(
                checkbox => checkbox.dataset.active === "true"
            );

            activeCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllPersonnelCheckbox.checked;
            });

            updateSelectionControls();
        });
    }

    // Update the controls when an individual employee is selected.
    personnelTableBody.addEventListener("change", event => {
        if (
            event.target instanceof HTMLInputElement &&
            event.target.classList.contains("personnel-checkbox")
        ) {
            updateSelectionControls();
        }
    });

    // Deactivate selected active employees without deleting their records.
    if (deactivatePersonnelButton) {
        deactivatePersonnelButton.addEventListener("click", async () => {
            const personnelIDs = getSelectedActivePersonnelIDs();

            if (personnelIDs.length === 0) {
                personnelMessage.textContent =
                    "Please select at least one active employee.";
                return;
            }

            const confirmed = window.confirm(
                `Deactivate ${personnelIDs.length} selected active employee(s)?`
            );

            if (!confirmed) {
                return;
            }

            deactivatePersonnelButton.disabled = true;
            refreshPersonnelButton.disabled = true;

            if (reactivatePersonnelButton) {
                reactivatePersonnelButton.disabled = true;
            }

            try {
                personnelMessage.textContent =
                    "Deactivating selected personnel...";

                const response = await fetch(
                    "/api/director/personnel/deactivate",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ personnelIDs })
                    }
                );

                const responseText = await response.text();
                let result;

                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        `Server returned an unexpected response (HTTP ${response.status}).`
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        `Unable to deactivate personnel (HTTP ${response.status}).`
                    );
                }

                await loadPersonnel();

                personnelMessage.textContent =
                    result.message ||
                    "Selected personnel deactivated successfully.";
            } catch (error) {
                console.error("Failed to deactivate personnel:", error);
                personnelMessage.textContent = error.message;
            } finally {
                refreshPersonnelButton.disabled = false;
                updateSelectionControls();
            }
        });
    }

    // Reactivate selected inactive employees.
    if (reactivatePersonnelButton) {
        reactivatePersonnelButton.addEventListener("click", async () => {
            const personnelIDs = getSelectedInactivePersonnelIDs();

            if (personnelIDs.length === 0) {
                personnelMessage.textContent =
                    "Please select at least one inactive employee.";
                return;
            }

            const confirmed = window.confirm(
                `Reactivate ${personnelIDs.length} selected inactive employee(s)?`
            );

            if (!confirmed) {
                return;
            }

            reactivatePersonnelButton.disabled = true;
            refreshPersonnelButton.disabled = true;

            if (deactivatePersonnelButton) {
                deactivatePersonnelButton.disabled = true;
            }

            try {
                personnelMessage.textContent =
                    "Reactivating selected personnel...";

                const response = await fetch(
                    "/api/director/personnel/reactivate",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ personnelIDs })
                    }
                );

                const responseText = await response.text();
                let result;

                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        `Server returned an unexpected response (HTTP ${response.status}).`
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        `Unable to reactivate personnel (HTTP ${response.status}).`
                    );
                }

                await loadPersonnel();

                personnelMessage.textContent =
                    result.message ||
                    "Selected personnel reactivated successfully.";
            } catch (error) {
                console.error("Failed to reactivate personnel:", error);
                personnelMessage.textContent = error.message;
            } finally {
                refreshPersonnelButton.disabled = false;
                updateSelectionControls();
            }
        });
    }

    // Submit the Add Personnel form.
    personnelForm.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(personnelForm);

        const getText = name => {
            const value = formData.get(name);
            return value == null ? "" : String(value).trim();
        };

        const fname = getText("fname");
        const lname = getText("lname");
        const dateOfBirth = getText("dateOfBirth");
        const ssn = getText("ssn").replace(/-/g, "");
        const employmentStatus = getText("employmentStatus");

        if (employmentStatus !== "0" && employmentStatus !== "1") {
            personnelMessage.textContent =
                "Please select a valid employment status.";
            return;
        }

        if (!fname || !lname || !dateOfBirth || !ssn) {
            personnelMessage.textContent =
                "First name, last name, date of birth, and SSN are required.";
            return;
        }

        if (!/^\d{9}$/.test(ssn)) {
            personnelMessage.textContent =
                "SSN must contain exactly 9 digits, optionally formatted as 123-45-6789.";
            return;
        }

        const positionText = getText("positionID");
        const positionID = positionText ? Number(positionText) : null;

        if (
            positionID !== null &&
            (!Number.isInteger(positionID) || positionID <= 0)
        ) {
            personnelMessage.textContent =
                "Please enter a valid Position ID.";
            return;
        }

        const personnel = {
            fname,
            mname: getText("mname") || null,
            lname,
            email: getText("email") || null,
            phoneNumber: getText("phoneNumber") || null,
            dateOfBirth,
            startDate: getText("startDate") || null,
            endDate: getText("endDate") || null,
            positionID,
            employmentStatus: Number(employmentStatus),
            ssn
        };

        try {
            personnelMessage.textContent = "Adding personnel...";
            addPersonnelButton.disabled = true;

            const response = await fetch("/api/director/personnel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(personnel)
            });

            const responseText = await response.text();
            let result;

            try {
                result = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `Server returned an unexpected response (HTTP ${response.status}).`
                );
            }

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    `Unable to add personnel (HTTP ${response.status}).`
                );
            }

            personnelForm.reset();
            addPersonnelPanel.hidden = true;
            addPersonnelButton.hidden = false;

            await loadPersonnel();

            personnelMessage.textContent =
                "Personnel added successfully.";
        } catch (error) {
            console.error("Failed to add personnel:", error);
            personnelMessage.textContent = error.message;
        } finally {
            addPersonnelButton.disabled = false;
        }
    });

    // Load personnel as soon as the script runs.
    loadPersonnel();
}
