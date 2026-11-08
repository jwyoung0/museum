
const workAssignmentsTableBody = document.getElementById("work-assignments-table-body");
const workAssignmentsMessage = document.getElementById("work-assignments-message");
const refreshWorkAssignmentsButton = document.getElementById("refresh-work-assignments");

// Labor Cost Report elements
const reportStartDate = document.getElementById("report-start-date");
const reportEndDate = document.getElementById("report-end-date");
const generateLaborReportButton = document.getElementById("generate-labor-report");
const laborReportMessage = document.getElementById("labor-report-message");
const laborReportResults = document.getElementById("labor-report-results");
const laborReportTableBody = document.getElementById("labor-report-table-body");

const reportTotalAssignments = document.getElementById("report-total-assignments");
const reportTotalEmployees = document.getElementById("report-total-employees");
const reportTotalHours = document.getElementById("report-total-hours");
const reportTotalCost = document.getElementById("report-total-cost");


function formatDate(dateValue) {
    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString();
}


function formatCurrency(value) {
    if (value === null || value === undefined) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(value);
}


function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "N/A";
    row.appendChild(cell);
}


// EXISTING WORK ASSIGNMENT FUNCTIONALITY

async function loadWorkAssignments() {
    workAssignmentsMessage.textContent = "Loading work assignments...";
    workAssignmentsTableBody.innerHTML = "";
    refreshWorkAssignmentsButton.disabled = true;

    try {
        const response = await fetch("/api/director/work-assignments");

        if (!response.ok) {
            throw new Error("Failed to retrieve work assignments.");
        }

        const assignments = await response.json();

        if (!Array.isArray(assignments)) {
            throw new Error("Invalid work assignment data received.");
        }

        if (assignments.length === 0) {
            workAssignmentsMessage.textContent = "No work assignments found.";
            return;
        }

        assignments.forEach(assignment => {
            const row = document.createElement("tr");

            addCell(row, assignment.WorkAssignmentID);
            addCell(row, assignment.EventID);
            addCell(row, assignment.AssignedWorkers);
            addCell(row, assignment.WorkRole);
            addCell(row, assignment.HoursWorked);
            addCell(row, formatDate(assignment.StartDate));
            addCell(row, formatDate(assignment.EndDate));

            workAssignmentsTableBody.appendChild(row);
        });

        workAssignmentsMessage.textContent =
            `Loaded ${assignments.length} work assignment(s).`;

    } catch (error) {
        console.error("Error loading work assignments:", error);
        workAssignmentsMessage.textContent =
            "Unable to load work assignments. Please try again.";
    } finally {
        refreshWorkAssignmentsButton.disabled = false;
    }
}


// LABOR COST REPORT FUNCTIONALITY

async function generateLaborCostReport() {
    const startDate = reportStartDate.value;
    const endDate = reportEndDate.value;

    // Validate that both dates were selected.
    if (!startDate || !endDate) {
        laborReportMessage.textContent =
            "Please select both a start date and an end date.";
        return;
    }

    // Validate the reporting period.
    if (startDate > endDate) {
        laborReportMessage.textContent =
            "The start date cannot be later than the end date.";
        return;
    }

    laborReportMessage.textContent = "Generating labor cost report...";
    laborReportResults.hidden = true;
    laborReportTableBody.innerHTML = "";

    generateLaborReportButton.disabled = true;

    try {
        // Send the selected dates to the backend.
        const params = new URLSearchParams({
            startDate: startDate,
            endDate: endDate
        });

        const response = await fetch(
            `/api/director/work-assignments/labor-cost-report?${params}`
        );

        if (!response.ok) {
            throw new Error("Failed to generate labor cost report.");
        }

        const report = await response.json();

        // Validate the response.
        if (!report.summary || !Array.isArray(report.assignments)) {
            throw new Error("Invalid labor report data received.");
        }

        const summary = report.summary;
        const assignments = report.assignments;

        // Populate the summary.
        reportTotalAssignments.textContent =
            summary.TotalAssignments ?? 0;

        reportTotalEmployees.textContent =
            summary.TotalEmployees ?? 0;

        reportTotalHours.textContent =
            summary.TotalHoursWorked ?? 0;

        reportTotalCost.textContent =
            summary.TotalLaborCost === null
                ? "Incomplete - Missing hourly rate"
                : formatCurrency(summary.TotalLaborCost);

        // Populate the assignment breakdown.
        if (assignments.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 9;
            cell.textContent = "No assignments found for this reporting period.";

            row.appendChild(cell);
            laborReportTableBody.appendChild(row);

        } else {
            assignments.forEach(assignment => {
                const row = document.createElement("tr");

                addCell(row, assignment.EmployeeName);
                addCell(row, assignment.PositionName);
                addCell(row, assignment.WorkRole);
                addCell(row, assignment.EventName);
                addCell(row, formatDate(assignment.StartDate));
                addCell(row, formatDate(assignment.EndDate));
                addCell(row, assignment.HoursWorked);
                addCell(row, formatCurrency(assignment.HourlyRate));
                addCell(row, formatCurrency(assignment.LaborCost));

                laborReportTableBody.appendChild(row);
            });
        }

        // Display the completed report.
        laborReportResults.hidden = false;

        if (summary.AssignmentsMissingHourlyRate > 0) {
            laborReportMessage.textContent =
                `Report generated, but ${summary.AssignmentsMissingHourlyRate} assignment(s) are missing an hourly rate. The total labor cost is incomplete.`;
        } else {
            laborReportMessage.textContent =
                "Labor cost report generated successfully.";
        }

    } catch (error) {
        console.error("Error generating labor cost report:", error);

        laborReportMessage.textContent =
            "Unable to generate labor cost report. Please try again.";

    } finally {
        generateLaborReportButton.disabled = false;
    }
}


// EVENT LISTENERS

refreshWorkAssignmentsButton.addEventListener("click", loadWorkAssignments);

generateLaborReportButton.addEventListener("click", generateLaborCostReport);


// LOAD WORK ASSIGNMENTS WHEN THE PAGE OPENS

loadWorkAssignments();
