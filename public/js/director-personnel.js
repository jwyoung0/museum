
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
const positionSelect = document.getElementById("position-id");

//Personnel Filtering Elements Start Here

const personnelNameSearch = document.getElementById("personnel-name-search");
const startDateFromInput = document.getElementById("personnel-start-date-from");
const startDateToInput = document.getElementById("personnel-start-date-to");
const employmentStatusFilter = document.getElementById("personnel-employment-filter");
const personnelSortOrder = document.getElementById("personnel-sort-order");
const clearPersonnelFiltersButton = document.getElementById("clear-personnel-filters");

let allPersonnel = [];
if (
    !personnelTableBody ||
    !personnelMessage ||
    !personnelForm ||
    !refreshPersonnelButton ||
    !addPersonnelButton ||
    !addPersonnelPanel ||
    !cancelAddPersonnelButton ||
    !positionSelect ||
    !personnelNameSearch ||
    !startDateFromInput ||
    !startDateToInput ||
    !employmentStatusFilter ||
    !personnelSortOrder ||
    !clearPersonnelFiltersButton
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
// load avaiable positions from backend
    async function loadPositionOptions() {
        positionSelect.disabled = true;

        try {
            const response = await fetch("/api/director/positions");

            if (!response.ok) {
                throw new Error(
                    `Unable to load positions (HTTP ${response.status}).`
                );
            }

            const positions = await response.json();

            if (!Array.isArray(positions)) {
                throw new Error(
                    "The server returned an invalid positions response."
                );
            }

            positionSelect.replaceChildren();

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = positions.length > 0
                ? "Select a position"
                : "No positions available";
            placeholder.disabled = true;
            placeholder.selected = true;

            positionSelect.appendChild(placeholder);

            positions.forEach(position => {
                const option = document.createElement("option");

                option.value = position.PositionID;
                option.textContent = position.PositionName;

                positionSelect.appendChild(option);
            });

            positionSelect.disabled = positions.length === 0;

            if (positions.length === 0) {
                personnelMessage.textContent =
                    "No positions exist. Add a position before adding personnel.";
            }
        } catch (error) {
            console.error("Failed to load positions:", error);

            positionSelect.replaceChildren();

            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Failed to load positions";
            option.disabled = true;
            option.selected = true;

            positionSelect.appendChild(option);
            positionSelect.disabled = true;

            personnelMessage.textContent = error.message;
        }
    }


    // Load personnel records from the backend.

// Check whether a personnel record is active.
    function isPersonnelActive(person) {
        return (
            person.EmploymentStatus === true ||
            person.EmploymentStatus === 1 ||
            person.EmploymentStatus === "1"
        );
    }

    // Convert a date to YYYY-MM-DD for consistent comparisons.
    function getDateOnly(value) {
        return value ? String(value).slice(0, 10) : "";
    }

    // Filter and sort the full personnel list.
    function applyPersonnelFilters() {
        const nameQuery = personnelNameSearch.value
            .trim()
            .toLocaleLowerCase();

        const startDateFrom = startDateFromInput.value;
        const startDateTo = startDateToInput.value;
        const selectedStatus = employmentStatusFilter.value;
        const sortOrder = personnelSortOrder.value;

        // Check the date range is valid.
        if (
            startDateFrom &&
            startDateTo &&
            startDateFrom > startDateTo
        ) {
            renderPersonnel([]);

            personnelMessage.textContent =
                "Start Date From cannot be later than Start Date To.";

            return;
        }

        // Apply all active filters.
        const filteredPersonnel = allPersonnel.filter(person => {
            const nameMatches =
                !nameQuery ||
                [person.Fname, person.Mname, person.Lname].some(name =>
                    String(name ?? "")
                        .toLocaleLowerCase()
                        .includes(nameQuery)
                );

            const startDate = getDateOnly(person.StartDate);

            const startDateMatches =
                (!startDateFrom ||
                    (startDate && startDate >= startDateFrom)) &&
                (!startDateTo ||
                    (startDate && startDate <= startDateTo));

            const isActive = isPersonnelActive(person);

            const statusMatches =
                selectedStatus === "all" ||
                (selectedStatus === "active" && isActive) ||
                (selectedStatus === "inactive" && !isActive);

            return (
                nameMatches &&
                startDateMatches &&
                statusMatches
            );
        });

        // Sort by last name, then first name A-Z.
        filteredPersonnel.sort((a, b) => {
            const lastNameComparison = String(a.Lname ?? "").localeCompare(
                String(b.Lname ?? ""),
                undefined,
                { sensitivity: "base" }
            );

            if (lastNameComparison !== 0) {
                return sortOrder === "desc"
                    ? -lastNameComparison
                    : lastNameComparison;
            }

            const firstNameComparison = String(a.Fname ?? "").localeCompare(
                String(b.Fname ?? ""),
                undefined,
                { sensitivity: "base" }
            );

            if (firstNameComparison !== 0) {
                return firstNameComparison;
            }

            const middleNameComparison = String(a.Mname ?? "").localeCompare(
                String(b.Mname ?? ""),
                undefined,
                { sensitivity: "base" }
            );

            if (middleNameComparison !== 0) {
                return middleNameComparison;
            }

            return Number(a.PersonnelID) - Number(b.PersonnelID);
        });

        renderPersonnel(filteredPersonnel);
    }

    // Draw the supplied personnel records in the existing table.
    function renderPersonnel(personnel) {
        personnelTableBody.replaceChildren();

        // Clear selections when the displayed rows change.
        if (selectAllPersonnelCheckbox) {
            selectAllPersonnelCheckbox.checked = false;
            selectAllPersonnelCheckbox.indeterminate = false;
        }

        if (personnel.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 12;
            cell.textContent = allPersonnel.length === 0
                ? "No personnel records found."
                : "No personnel match your search criteria.";

            row.appendChild(cell);
            personnelTableBody.appendChild(row);
        } else {
            personnel.forEach(person => {
                const row = document.createElement("tr");
                const isActive = isPersonnelActive(person);

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

                // Keep the existing Personnel table column order.
                const values = [
                    person.Fname ?? "",
                    person.Mname ?? "",
                    person.Lname ?? "",
                    person.PositionName ?? "",
                    person.PhoneNumber ?? "",
                    person.Email ?? "",
                    isActive ? "Active" : "Inactive",
                    getDateOnly(person.DateOfBirth),
                    getDateOnly(person.StartDate),
                    getDateOnly(person.EndDate),
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

        if (personnel.length === 0 && allPersonnel.length > 0) {
            personnelMessage.textContent =
                "No personnel match your search criteria.";
        } else if (allPersonnel.length === 0) {
            personnelMessage.textContent = "No personnel records found.";
        } else {
            personnelMessage.textContent =
                `Showing ${personnel.length} of ${allPersonnel.length} personnel record(s).`;
        }
    }

    // Load the complete personnel list from the backend.
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

            allPersonnel = personnel;

            // Apply the current filters to the newly loaded records.
            applyPersonnelFilters();
        } catch (error) {
            console.error("Failed to load personnel:", error);

            allPersonnel = [];
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


    //Begining of event listeners for personnel management


    // Update the table when the name search changes.
    personnelNameSearch.addEventListener("input", applyPersonnelFilters);

    // Update the table when the start-date range changes.
    startDateFromInput.addEventListener("change", applyPersonnelFilters);
    startDateToInput.addEventListener("change", applyPersonnelFilters);

    // Update the table when employment status changes.
    employmentStatusFilter.addEventListener(
        "change",
        applyPersonnelFilters
    );

    // Reorder the table when the sort order changes.
    personnelSortOrder.addEventListener(
        "change",
        applyPersonnelFilters
    );

    // Clear the search and filters while preserving the selected sort order.
    clearPersonnelFiltersButton.addEventListener("click", () => {
        personnelNameSearch.value = "";
        startDateFromInput.value = "";
        startDateToInput.value = "";
        employmentStatusFilter.value = "all";

        applyPersonnelFilters();
    });


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
        const positionID = Number(positionText);

        if (
            !positionText ||
            !Number.isInteger(positionID) ||
            positionID <= 0 ||
            !Array.from(positionSelect.options).some(
                option => option.value === positionText && !option.disabled
            )
        ) {
            personnelMessage.textContent =
                "Please select a valid position from the dropdown.";
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
    loadPositionOptions(); // Load available positions for the personnel form
}
