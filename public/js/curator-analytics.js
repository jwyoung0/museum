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

    const reportType = visualization === "ranking"
        ? "ranking"
        : "trend";

    try {
        const response = await fetch(
            `/api/curator/analytics/${reportType}?${params}`
        );

        if (!response.ok) {
            throw new Error(`Analytics request failed (${response.status})`);
        }

        const data = await response.json();

        renderChart(data, reportType);
        renderTable(data);
    } catch (error) {
        console.error("Failed to load analytics report", error);
        showReportError("Unable to load analytics report.");
    }
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
        ArtistSex: "Artist's Sex",
        StyleID: "Style ID",
        StyleName: "Style Name",
        CollectionID: "Collection ID",
        CollectionName: "Collection Name",
        PeriodID: "Period ID",
        PeriodName: "Period Name",
        EntityID: "Entity ID",
        EntityName: "Entity",
        YearViewed: "Year Viewed",
        MonthViewed: "Month Viewed",
        Views: "Views",
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

function renderChart(data, visualization) {
    if (visualization === "ranking") {
        renderRankingChart(data);
        return;
    }

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

function renderRankingChart(data) {
    const container = document.getElementById("analytics-chart");

    if (!Array.isArray(data) || data.length === 0) {
        container.textContent = "No ranking data available.";
        return;
    }

    const width = 900;
    const rowHeight = 32;
    const top = 36;
    const height = top + data.length * rowHeight + 20;
    const labelWidth = 250;
    const chartWidth = width - labelWidth - 80;
    const maxViews = Math.max(
        1,
        ...data.map(row => Number(row.Views) || 0)
    );
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Engagement ranking");

    data.forEach((row, index) => {
        const y = top + index * rowHeight;
        const views = Number(row.Views) || 0;
        const label = document.createElementNS(svgNamespace, "text");
        label.setAttribute("x", String(labelWidth - 12));
        label.setAttribute("y", String(y + 16));
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "12");
        label.textContent = row.EntityName ?? "";

        const bar = document.createElementNS(svgNamespace, "rect");
        bar.setAttribute("x", String(labelWidth));
        bar.setAttribute("y", String(y));
        bar.setAttribute("width", String((views / maxViews) * chartWidth));
        bar.setAttribute("height", "20");
        bar.setAttribute("fill", "#0078d4");

        const value = document.createElementNS(svgNamespace, "text");
        value.setAttribute(
            "x",
            String(labelWidth + (views / maxViews) * chartWidth + 8)
        );
        value.setAttribute("y", String(y + 15));
        value.setAttribute("font-size", "12");
        value.setAttribute("fill", "#333");
        value.textContent = String(views);

        svg.append(label, bar, value);
    });

    container.replaceChildren(svg);
}

function showReportError(message) {
    const chart = document.getElementById("analytics-chart");
    const head = document.querySelector("#report-results thead");
    const body = document.querySelector("#report-results tbody");

    chart.textContent = message;
    head.replaceChildren();
    body.replaceChildren();
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