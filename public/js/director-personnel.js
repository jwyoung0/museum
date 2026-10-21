
const personnelTableBody = document.getElementById("personnel-table-body");
const personnelMessage = document.getElementById("personnel-message");
const personnelForm = document.getElementById("personnel-form");
const refreshPersonnelButton = document.getElementById("refresh-personnel");
const addPersonnelButton = document.getElementById("show-add-personnel");
const addPersonnelPanel = document.getElementById("add-personnel-panel");
const cancelAddPersonnelButton = document.getElementById("cancel-add-personnel");

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
    async function loadPersonnel() {
        personnelMessage.textContent = "Loading personnel records...";
        refreshPersonnelButton.disabled = true;

        try {
            const response = await fetch("/api/director/personnel");

            if (!response.ok) {
                throw new Error(
                    `Unable to retrieve personnel records (HTTP ${response.status}).`
                );
            }

            const personnel = await response.json();

            if (!Array.isArray(personnel)) {
                throw new Error("The server returned an unexpected response.");
            }

            personnelTableBody.replaceChildren();

            if (personnel.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 11;
                cell.textContent = "No personnel records found.";

                row.appendChild(cell);
                personnelTableBody.appendChild(row);
            }
            personnel.forEach(person => {
                const row = document.createElement("tr");

/*                const fullName = [
                    person.Fname,
                    person.Mname,
                    person.Lname
                ].filter(Boolean).join(" ");
*/
                const values = [
                    person.Fname ?? "",
                    person.Mname ?? "",
                    person.Lname ?? "",
                    person.PositionID ?? "",
                    person.PhoneNumber ?? "",
                    person.Email ?? "",
                    person.EmploymentStatus ? "Active" : "Inactive",
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
                    cell.textContent = value ?? "";
                    row.appendChild(cell);
                });

                personnelTableBody.appendChild(row);
            });
/*
            personnel.forEach(person => {
                const row = document.createElement("tr");

                const values = [
                    person.PersonnelID,
                    person.LegalName,
                    person.Email,
                    person.PhoneNumber,
                    person.EmplymentStatus ? "Active" : "Inactive",
                    person.StartDate
                        ? String(person.StartDate).slice(0, 10)
                        : "",
                    person.PositionID ?? ""
                ];

                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "";
                    row.appendChild(cell);
                });

                const actionCell = document.createElement("td");
                actionCell.textContent = "Coming soon";
                row.appendChild(actionCell);

                personnelTableBody.appendChild(row);
            });
*/
            personnelMessage.textContent =
                `Loaded ${personnel.length} personnel record(s).`;
        } catch (error) {
            console.error("Failed to load personnel:", error);
            personnelMessage.textContent = error.message;

            personnelTableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 11;
            cell.textContent = "Failed to load personnel records.";

            row.appendChild(cell);
            personnelTableBody.appendChild(row);
        } finally {
            refreshPersonnelButton.disabled = false;
        }
    }

    refreshPersonnelButton.addEventListener("click", loadPersonnel);

    addPersonnelButton.addEventListener("click", () => {
        addPersonnelPanel.hidden = false;
        addPersonnelButton.hidden = true;
    });

    cancelAddPersonnelButton.addEventListener("click", () => {
        addPersonnelPanel.hidden = true;
        addPersonnelButton.hidden = false;
        personnelForm.reset();
    });

    personnelForm.addEventListener("submit", async event => {
        event.preventDefault();
        console.log("Save Personnel submit Handler triggered.");

        const formData = new FormData(personnelForm);

        const getText = name => {
            const value = formData.get(name);
            return value == null ? "" : value.trim();
        };
        
        const fname = getText("fname");
        const lname = getText("lname");
        const dateOfBirth = getText("dateOfBirth");
 /*       const ssn = getText("ssn");*/
        const ssnInput = getText("ssn");
        const ssn = ssnInput.replace(/-/g, "");
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

/*        if (!/^\d{9}$/.test(ssn)) {
            personnelMessage.textContent =
                "SSN must contain exactly 9 digits.";
            return;
        }
*/
        if (!/^\d{9}$/.test(ssn)) {
            personnelMessage.textContent =
                "SSN must contain exactly 9 digits, optionally formatted as 123-45-6789.";
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
            positionID: getText("positionID")
                ? Number(getText("positionID"))
                : null,
            employmentStatus: Number(employmentStatus),
            ssn
        };

        try {
            personnelMessage.textContent = "Adding personnel.";

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
                    result.error || `Unable to add personnel (HTTP ${response.status}).`
                );
            }

            personnelForm.reset();
            addPersonnelPanel.hidden = true;
            addPersonnelButton.hidden = false;

            await loadPersonnel();

            personnelMessage.textContent = "Personnel added successfully.";
        } catch (error) {
            console.error("Failed to add personnel:", error);
            personnelMessage.textContent = error.message;
        }
    });

    loadPersonnel();
}
