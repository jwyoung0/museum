document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

function initializePage() {

    document
        .getElementById("run-report-btn")
        .addEventListener("click", loadReport);

    loadTiers();
}

async function loadReport() {

    const report =
        document.getElementById("report-type").value;

    const startDate =
        document.getElementById("start-date").value;

    const endDate =
        document.getElementById("end-date").value;

    const tier =
        document.getElementById("tier").value;

    const params = new URLSearchParams();

    if (startDate) {
        params.append("startDate", startDate);
    }

    if (endDate) {
        params.append("endDate", endDate);
    }

    if (tier) {
        params.append("tier", tier);
    }

    const response = await fetch(
        `/api/curator/analytics/${report}?${params}`
    );

    const data = await response.json();

    renderTable(data);
}

async function loadTiers() {

    const tierSelect =
        document.getElementById("tier");

    tierSelect.innerHTML = `
        <option value="">
            All Membership Tiers
        </option>
    `;

    try {

        const response = await fetch(
            "/api/curator/analytics/tiers"
        );

        const tiers =
            await response.json();

        tiers.forEach(tier => {

            const option =
                document.createElement("option");

            option.value = tier.TierName;
            option.textContent = tier.TierName;

            tierSelect.appendChild(option);
        });

    } catch (error) {

        console.error(
            "Failed to load tiers",
            error
        );
    }
}

function renderTable(data) {
    const table = document.querySelector("#report-results table");
    const head = table.querySelector("thead");
    const body = table.querySelector("tbody");

    const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object"
            ? [data]
            : [];

    head.replaceChildren();
    body.replaceChildren();

    if (rows.length === 0) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.textContent = "No results found.";
        return;
    }

    const columns = Object.keys(rows[0]);
    const headerRow = head.insertRow();

    columns.forEach(column => {
        const cell = document.createElement("th");
        cell.textContent = column;
        headerRow.appendChild(cell);
    });

    rows.forEach(record => {
        const row = body.insertRow();

        columns.forEach(column => {
            const cell = row.insertCell();
            cell.textContent = record[column] ?? "";
        });
    });
}