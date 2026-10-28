
const positionsTableBody = document.getElementById("positions-table-body");
const positionsMessage = document.getElementById("positions-message");
const positionForm = document.getElementById("position-form");
const refreshPositionsButton = document.getElementById("refresh-positions");

if (
    !positionsTableBody ||
    !positionsMessage ||
    !positionForm ||
    !refreshPositionsButton
) {
    console.error(
        "Director positions script: One or more required HTML elements are missing."
    );
} else {
    // Load positions from the backend.
    async function loadPositions() {
        positionsMessage.textContent = "Loading positions...";
        refreshPositionsButton.disabled = true;

        try {
            const response = await fetch("/api/director/positions");

            const responseText = await response.text();
            let positions;

            try {
                positions = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `Server returned an unexpected response (HTTP ${response.status}).`
                );
            }

            if (!response.ok) {
                throw new Error(
                    positions.error ||
                    `Unable to retrieve positions (HTTP ${response.status}).`
                );
            }

            if (!Array.isArray(positions)) {
                throw new Error(
                    "The server returned an unexpected response."
                );
            }

            positionsTableBody.replaceChildren();

            if (positions.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 5;
                cell.textContent = "No positions found.";

                row.appendChild(cell);
                positionsTableBody.appendChild(row);
            } else {
                positions.forEach(position => {
                    const row = document.createElement("tr");

                    const values = [
                        position.PositionID ?? "",
                        position.PositionName ?? "",
                        position.Description ?? "",
                        position.EmploymentType ?? "",
                        position.Salary == null
                            ? ""
                            : Number(position.Salary).toFixed(2)
                    ];

                    values.forEach(value => {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        row.appendChild(cell);
                    });

                    positionsTableBody.appendChild(row);
                });
            }

            positionsMessage.textContent =
                `Loaded ${positions.length} position(s).`;
        } catch (error) {
            console.error("Failed to load positions:", error);

            positionsMessage.textContent = error.message;
            positionsTableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "Failed to load positions.";

            row.appendChild(cell);
            positionsTableBody.appendChild(row);
        } finally {
            refreshPositionsButton.disabled = false;
        }
    }

    // Refresh the positions table.
    refreshPositionsButton.addEventListener("click", loadPositions);

    // Submit the Add Position form.
    positionForm.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(positionForm);

        const getText = name => {
            const value = formData.get(name);
            return value == null ? "" : String(value).trim();
        };

        const positionName = getText("positionName");
        const description = getText("description");
        const employmentType = getText("employmentType");
        const salaryText = getText("salary");

        if (!positionName) {
            positionsMessage.textContent =
                "Position name is required.";
            return;
        }

        const salary = salaryText === "" ? null : Number(salaryText);

        if (
            salary !== null &&
            (
                !Number.isFinite(salary) ||
                salary < 0 ||
                salary > 99999999.99 ||
                Math.round(salary * 100) !== salary * 100
            )
        ) {
            positionsMessage.textContent =
                "Enter a valid non-negative salary with up to two decimal places.";
            return;
        }

        const position = {
            positionName,
            description: description || null,
            employmentType: employmentType || null,
            salary
        };

        const submitButton = positionForm.querySelector(
            'button[type="submit"]'
        );

        try {
            positionsMessage.textContent = "Adding position...";

            if (submitButton) {
                submitButton.disabled = true;
            }

            const response = await fetch("/api/director/positions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(position)
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
                    `Unable to add position (HTTP ${response.status}).`
                );
            }

            positionForm.reset();
            await loadPositions();

            positionsMessage.textContent =
                result.message || "Position added successfully.";
        } catch (error) {
            console.error("Failed to add position:", error);
            positionsMessage.textContent = error.message;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });

    // Load positions when the page opens.
    loadPositions();
}
