
const personnelTableBody = document.getElementById("personnel-table-body");
const personnelMessage = document.getElementById("personnel-message");
const personnelForm = document.getElementById("personnel-form");
const refreshPersonnelButton = document.getElementById("refresh-personnel");

async function loadPersonnel() {
    personnelMessage.textContent = "Loading personnel records...";
    refreshPersonnelButton.disabled = true;

    try {
        const response = await fetch("/api/director/personnel");

        if (!response.ok) {
            throw new Error("Unable to retrieve personnel records.");
        }

        const personnel = await response.json();

        personnelTableBody.replaceChildren();

        if (personnel.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 8;
            cell.textContent = "No personnel records found.";

            row.appendChild(cell);
            personnelTableBody.appendChild(row);
        }

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

        personnelMessage.textContent =
            `Loaded ${personnel.length} personnel record(s).`;
    } catch (error) {
        personnelMessage.textContent = error.message;

        personnelTableBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = "Failed to load personnel records.";

        row.appendChild(cell);
        personnelTableBody.appendChild(row);
    } finally {
        refreshPersonnelButton.disabled = false;
    }
}

refreshPersonnelButton.addEventListener("click", loadPersonnel);

personnelForm.addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(personnelForm);

    const personnel = {
        legalName: formData.get("legalName").trim(),
        email: formData.get("email").trim(),
        phoneNumber: formData.get("phoneNumber").trim() || null,
        dateOfBirth: formData.get("dateOfBirth") || null,
        startDate: formData.get("startDate") || null,
        endDate: formData.get("endDate") || null,
        positionID: formData.get("positionID")
            ? Number(formData.get("positionID"))
            : null,
        employmentStatus: Number(formData.get("employmentStatus"))
    };

    try {
        personnelMessage.textContent = "Adding personnel...";

        const response = await fetch("/api/director/personnel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(personnel)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to add personnel.");
        }

        personnelMessage.textContent = result.message;
        personnelForm.reset();

        await loadPersonnel();
    } catch (error) {
        personnelMessage.textContent = error.message;
    }
});

loadPersonnel();
