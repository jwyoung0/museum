const membershipRevenuePeriod =
    document.getElementById("membership-revenue-period");
const membershipRevenueYear =
    document.getElementById("membership-revenue-year");
const membershipRevenueYearLabel =
    document.getElementById("membership-revenue-year-label");
const membershipRevenueMessage =
    document.getElementById("membership-revenue-message");
const membershipRevenueTableBody =
    document.querySelector("#membership-revenue-table tbody");
const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

membershipRevenueYear.max = String(new Date().getFullYear());
membershipRevenueYear.value = String(new Date().getFullYear());

membershipRevenuePeriod.addEventListener("change", () => {
    const selectYear = membershipRevenuePeriod.value === "year";
    membershipRevenueYear.hidden = !selectYear;
    membershipRevenueYearLabel.hidden = !selectYear;
});

async function loadMembershipRevenue() {
    const period = membershipRevenuePeriod.value;
    const params = new URLSearchParams({ period });

    if (period === "year") {
        const year = Number(membershipRevenueYear.value);
        if (
            !Number.isInteger(year) ||
            year < 1900 ||
            year > new Date().getFullYear()
        ) {
            membershipRevenueMessage.textContent =
                "Enter a year between 1900 and the current year.";
            return;
        }
        params.set("year", String(year));
    }

    membershipRevenueMessage.textContent = "Loading membership revenue...";
    membershipRevenueTableBody.replaceChildren();
    document.getElementById("membership-revenue-total-count")
        .textContent = "0";
    document.getElementById("membership-revenue-total-amount")
        .textContent = "$0.00";

    try {
        const response = await fetch(
            `/api/membership-reports/revenue?${params.toString()}`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not load membership revenue.");
        }

        let totalCount = 0;
        let totalCents = 0;

        if (!data.length) {
            const row = membershipRevenueTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.textContent = "No memberships found for this period.";
        } else {
            data.forEach(item => {
                const count = Number(item.MembershipsSold);
                const revenue = Number(item.EstimatedRevenue);
                const row = membershipRevenueTableBody.insertRow();

                row.insertCell().textContent = item.TierName;
                row.insertCell().textContent = String(count);
                row.insertCell().textContent = currencyFormatter.format(revenue);

                totalCount += count;
                totalCents += Math.round(revenue * 100);
            });
        }

        document.getElementById("membership-revenue-total-count")
            .textContent = String(totalCount);
        document.getElementById("membership-revenue-total-amount")
            .textContent = currencyFormatter.format(totalCents / 100);

        membershipRevenueMessage.textContent =
            period === "this-month"
                ? "Showing memberships started this month."
                : period === "this-year"
                    ? "Showing memberships started this year."
                    : `Showing memberships started in ${params.get("year")}.`;
    } catch (error) {
        membershipRevenueMessage.textContent =
            error.message || "Could not load membership revenue.";
    }
}

document.getElementById("load-membership-revenue")
    .addEventListener("click", loadMembershipRevenue);

loadMembershipRevenue();
