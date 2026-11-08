const period = document.getElementById("membership-revenue-period");
const year = document.getElementById("membership-revenue-year");
const yearLabel = document.getElementById("membership-revenue-year-label");
const message = document.getElementById("membership-revenue-message");
const tbody = document.querySelector("#membership-revenue-table tbody");

year.max = new Date().getFullYear();
year.value = new Date().getFullYear();

period.addEventListener("change", () => {
    const showYear = period.value === "year";
    year.hidden = !showYear;
    yearLabel.hidden = !showYear;
});

async function loadMembershipRevenue() {
    let url = `/api/membership-reports/revenue?period=${period.value}`;

    if (period.value === "year") {
        url += `&year=${year.value}`;
    }

    message.textContent = "Loading...";
    tbody.innerHTML = "";

    try {
        const response = await fetch(url);
        const data = await response.json();

        let totalCount = 0;
        let totalRevenue = 0;

        for (const item of data) {
            const row = tbody.insertRow();

            row.insertCell().textContent = item.TierName;
            row.insertCell().textContent = item.MembershipsSold;
            row.insertCell().textContent =
                `$${Number(item.EstimatedRevenue).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            totalCount += Number(item.MembershipsSold);
            totalRevenue += Number(item.EstimatedRevenue);
        }

        document.getElementById("membership-revenue-total-count").textContent =
            totalCount;

        document.getElementById("membership-revenue-total-amount").textContent =
            `$${totalRevenue.toFixed(2)}`;

        message.textContent = "";
    } catch {
        message.textContent = "Could not load membership revenue.";
    }
}

document
    .getElementById("load-membership-revenue")
    .addEventListener("click", loadMembershipRevenue);

loadMembershipRevenue();