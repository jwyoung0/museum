const tableBody = document.getElementById("analytics-table-body");
const emptyState = document.getElementById("search-empty-state");

if (tableBody && emptyState) {
    loadAnalytics();
}

async function loadAnalytics() {
    try {
        const response = await fetch("/api/curator/analytics", {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Analytics request failed (${response.status})`);
        }

        const result = await response.json();
        const artists = Array.isArray(result) ? result : result.artists;

        if (!Array.isArray(artists)) {
            throw new Error("Unexpected analytics response.");
        }

        const topArtists = artists
            .map((artist) => ({
                name: artist.ArtistName ?? "Unknown artist",
                count: Number(
                    artist.InterestedVisitors ?? 0
                ),
            }))
            .filter((artist) => Number.isFinite(artist.count))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        tableBody.replaceChildren();

        if (topArtists.length === 0) {
            emptyState.hidden = false;
            tableBody.append(emptyState);
            return;
        }

        emptyState.hidden = true;

        for (const artist of topArtists) {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            const countCell = document.createElement("td");

            nameCell.textContent = artist.name;
            countCell.textContent = String(artist.count);

            row.append(nameCell, countCell);
            tableBody.append(row);
        }
    } catch (error) {
        console.error("Unable to load analytics:", error);

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.textContent = "Unable to load analytics. Please try again later.";

        row.append(cell);
        tableBody.replaceChildren(row);
    }
}