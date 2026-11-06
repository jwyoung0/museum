document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

function initializePage() {

    document
        .getElementById("run-report-btn")
        .addEventListener("click", loadReport);

    document
        .getElementById("analyze-by")
        .addEventListener(
            "change",
            loadEntityValues
        );

    loadTiers();
    loadEntityValues();
}

async function loadReport() {
    const visualization = 
        document.getElementById("visualization").value;

    const analyzeBy =
        document.getElementById("analyze-by").value;

    const entityValue = 
        document.getElementById("entity-value").value;

    const startDate =
        document.getElementById("start-date").value;

    const endDate =
        document.getElementById("end-date").value;

    const tier =
        document.getElementById("tier").value;

    const params = new URLSearchParams();

    if (analyzeBy) {
        params.append("analyzeBy", analyzeBy);
    }

    if (entityValue) {
        params.append("entityValue", entityValue);
    }

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
        `/api/curator/analytics/${analyzeBy}?${params}`
    );

    const data = await response.json();

    renderChart(data);
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
    
    const displayNames = {
        ArtworkID: "Accession ID",
        ArtworkTitle: "Artwork Title",
        ArtistID: "Artist ID",
        ArtistName: "Artist Name",
        StyleID: "Style ID",
        StyleName: "Style Name",
        CollectionID: "Collection ID",
        CollectionName: "Collection Name",
        PeriodID: "Period ID",
        PeriodName: "Period Name",
        YearViewed: "Year Viewed",
        MonthViewed: "Month Viewed",
        TotalViews: "Total Views"
    };

    columns.forEach(column => {
        const cell = document.createElement("th");
        cell.textContent = displayNames[column] || column;
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

function renderChart(data) {
    const container =
        document.getElementById(
            "analytics-chart"
        );

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>No trend data available.</p>";
        return;
    }

    const width = 900;
    const height = 350;

    const margin = {
        top: 20,
        right: 20,
        bottom: 60,
        left: 70
    };

    const chartWidth =
        width -
        margin.left -
        margin.right;

    const chartHeight =
        height -
        margin.top -
        margin.bottom;

    const maxViews =
        Math.max(
            ...data.map(
                row => row.Views
            )
        );

    const points = data.map(
        (row, index) => {

            const x =
                margin.left +
                (
                    index *
                    (
                        chartWidth /
                        Math.max(
                            1,
                            data.length - 1
                        )
                    )
                );

            const y =
                margin.top +
                chartHeight -
                (
                    (row.Views / maxViews) *
                    chartHeight
                );

            return { x, y, row };
        }
    );

    const polylinePoints =
        points
            .map(p =>
                `${p.x},${p.y}`
            )
            .join(" ");

    const monthLabels =
        [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

    const yAxisLabels =
        [0, 0.25, 0.5, 0.75, 1]
            .map(scale => {

                const value =
                    Math.round(
                        maxViews * scale
                    );

                const y =
                    margin.top +
                    chartHeight -
                    (
                        chartHeight * scale
                    );

                return `
                    <line
                        x1="${margin.left}"
                        y1="${y}"
                        x2="${width - margin.right}"
                        y2="${y}"
                        stroke="#e0e0e0"
                    />

                    <text
                        x="${margin.left - 10}"
                        y="${y + 5}"
                        text-anchor="end"
                        font-size="12"
                        fill="#666">
                        ${value}
                    </text>
                `;
            })
            .join("");

    const xLabels =
        points
            .map(p => {
                const label =
                    `${monthLabels[p.row.MonthViewed]}
                     ${p.row.YearViewed}`;

                return `
                    <text
                        x="${p.x}"
                        y="${height - 20}"
                        text-anchor="middle"
                        font-size="12"
                        fill="#666">
                        ${label}
                    </text>
                `;
            })
            .join("");

    const circles =
        points
            .map(p => `
                <circle
                    cx="${p.x}"
                    cy="${p.y}"
                    r="5"
                    fill="#0078d4">

                    <title>
                        ${p.row.Views} Views
                    </title>

                </circle>
            `)
            .join("");

    container.innerHTML = `
        <svg
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}">

            ${yAxisLabels}

            <line
                x1="${margin.left}"
                y1="${margin.top}"
                x2="${margin.left}"
                y2="${margin.top + chartHeight}"
                stroke="#333"
            />

            <line
                x1="${margin.left}"
                y1="${margin.top + chartHeight}"
                x2="${width - margin.right}"
                y2="${margin.top + chartHeight}"
                stroke="#333"
            />

            <polyline
                points="${polylinePoints}"
                fill="none"
                stroke="#0078d4"
                stroke-width="3"
            />

            ${circles}

            ${xLabels}

        </svg>
    `;
}

async function loadEntityValues() {
    const analyzeBy =
        document.getElementById("analyze-by").value;

    const valueSelect = document.getElementById("entity-value");

    valueSelect.innerHTML = `<option value="">All</option>`;

    try {
        const response =
            await fetch(
                `/api/curator/analytics/lookup/${analyzeBy}`
            );

        const values = await response.json();

        values.forEach(item => {
            const option = document.createElement("option");

            option.value = item.value;

            option.textContent = item.label;

            valueSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Failed loading values", error);
    }
}