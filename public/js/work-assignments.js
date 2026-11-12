
const workAssignmentsTableBody = document.getElementById("work-assignments-table-body");
const workAssignmentsMessage = document.getElementById("work-assignments-message");
const refreshWorkAssignmentsButton = document.getElementById("refresh-work-assignments");

// ASSIGNMENT ADD / EDIT ELEMENTS

const showAddAssignmentButton = document.getElementById("show-add-assignment");
const addAssignmentPanel = document.getElementById("add-assignment-panel");
const assignmentForm = document.getElementById("assignment-form");
const cancelAddAssignmentButton = document.getElementById("cancel-add-assignment");

const assignmentNameInput = document.getElementById("assignment-name");
const assignmentDescriptionInput = document.getElementById("assignment-description");
const assignmentStartDateInput = document.getElementById("assignment-start-date");
const assignmentEndDateInput = document.getElementById("assignment-end-date");
const saveAssignmentButton = document.getElementById("save-assignment");

let editingAssignmentID = null;

// ASSIGNED PERSONNEL ELEMENTS

const assignPersonnelPanel = document.getElementById("assign-personnel-panel");
const assignPersonnelTitle = document.getElementById("assign-personnel-title");
const assignPersonnelMessage = document.getElementById("assign-personnel-message");
const assignPersonnelForm = document.getElementById("assign-personnel-form");
const assignPersonnelSelect = document.getElementById("assign-personnel-select");
const assignWorkRoleInput = document.getElementById("assign-work-role");
const assignedPersonnelTableBody = document.getElementById("assigned-personnel-table-body");
const closeAssignPersonnelButton = document.getElementById("close-assign-personnel");
const saveAssignedPersonnelButton = document.getElementById("save-assigned-personnel");

let selectedAssignmentID = null;
let assignedPersonnelIDs = new Set();

// NEW: Store the selected assignment's date boundaries.
let selectedAssignmentStartDate = null;
let selectedAssignmentEndDate = null;

// WORK SESSION ELEMENTS

const workSessionsPanel = document.getElementById("work-sessions-panel");
const workSessionsTitle = document.getElementById("work-sessions-title");
const workSessionsMessage = document.getElementById("work-sessions-message");
const workSessionsTableBody = document.getElementById("work-sessions-table-body");

const showAddWorkSessionButton = document.getElementById("show-add-work-session");
const refreshWorkSessionsButton = document.getElementById("refresh-work-sessions");
const closeWorkSessionsButton = document.getElementById("close-work-sessions");

const workSessionFormPanel = document.getElementById("work-session-form-panel");
const workSessionForm = document.getElementById("work-session-form");
const workSessionFormTitle = document.getElementById("work-session-form-title");

const workSessionDateInput = document.getElementById("work-session-date");
const workSessionHoursInput = document.getElementById("work-session-hours");
const workSessionRateInput = document.getElementById("work-session-rate");

const saveWorkSessionButton = document.getElementById("save-work-session");
const cancelWorkSessionButton = document.getElementById("cancel-work-session");

const workSessionTotalCount = document.getElementById("work-session-total-count");
const workSessionTotalHours = document.getElementById("work-session-total-hours");
const workSessionTotalCost = document.getElementById("work-session-total-cost");

let selectedAssignmentPersonnelID = null;
let editingSessionID = null;
let selectedEmployeeHourlyRate = null;
let currentWorkSessions = [];
let workSessionRequestVersion = 0;

// LABOR COST REPORT ELEMENTS

const reportStartDate = document.getElementById("report-start-date");
const reportEndDate = document.getElementById("report-end-date");
const reportPersonnelSelect = document.getElementById("report-personnel");
const reportPositionSelect = document.getElementById("report-position");

const REPORT_POSITIONS_URL = "/api/director/positions";

const generateLaborReportButton = document.getElementById("generate-labor-report");
const laborReportMessage = document.getElementById("labor-report-message");
const laborReportResults = document.getElementById("labor-report-results");
const laborReportTableBody = document.getElementById("labor-report-table-body");

const reportTotalAssignments = document.getElementById("report-total-assignments");
const reportTotalEmployees = document.getElementById("report-total-employees");
const reportTotalSessions = document.getElementById("report-total-sessions");
const reportTotalHours = document.getElementById("report-total-hours");
const reportTotalCost = document.getElementById("report-total-cost");

// GENERAL HELPERS

function formatDate(dateValue) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString();
}

function formatCurrency(value) {
    if (value === null || value === undefined) return "N/A";

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

function getDateOnly(value) {
    return value ? String(value).slice(0, 10) : "";
}

async function fetchJsonOrThrow(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.error ||
            `Request failed (${response.status}). Check the backend route.`
        );
    }

    return data;
}

// NEW: Apply the selected assignment's date range to the session input.

function applyWorkSessionDateRestrictions() {
    workSessionDateInput.min = selectedAssignmentStartDate || "";
    workSessionDateInput.max = selectedAssignmentEndDate || "";
}

// LOAD WORK ASSIGNMENTS

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
            addCell(row, assignment.AssignmentName);
            addCell(row, assignment.Description);
            addCell(row, formatDate(assignment.StartDate));
            addCell(row, formatDate(assignment.EndDate));
            addCell(row, assignment.EmployeeCount);

            const editCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";

            editButton.addEventListener("click", () => {
                editWorkAssignment(assignment);
            });

            const assignButton = document.createElement("button");
            assignButton.type = "button";
            assignButton.textContent = "Assign Personnel";
            assignButton.style.marginLeft = "8px";

            assignButton.addEventListener("click", () => {
                openAssignPersonnelPanel(assignment);
            });

            editCell.appendChild(editButton);
            editCell.appendChild(assignButton);
            row.appendChild(editCell);

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

// EDIT WORK ASSIGNMENT

function editWorkAssignment(assignment) {
    editingAssignmentID = assignment.WorkAssignmentID;

    assignmentNameInput.value = assignment.AssignmentName || "";
    assignmentDescriptionInput.value = assignment.Description || "";
    assignmentStartDateInput.value = getDateOnly(assignment.StartDate);
    assignmentEndDateInput.value = getDateOnly(assignment.EndDate);

    addAssignmentPanel.hidden = false;
    saveAssignmentButton.textContent = "Save Changes";

    workAssignmentsMessage.textContent =
        `Editing assignment #${editingAssignmentID}.`;

    assignmentNameInput.focus();
}

// CREATE OR UPDATE WORK ASSIGNMENT

async function createWorkAssignment(event) {
    event.preventDefault();

    const assignmentName = assignmentNameInput.value.trim();
    const description = assignmentDescriptionInput.value.trim();
    const startDate = assignmentStartDateInput.value;
    const endDate = assignmentEndDateInput.value;

    if (!assignmentName) {
        workAssignmentsMessage.textContent =
            "Please enter an assignment name.";
        return;
    }

    if (startDate && endDate && startDate > endDate) {
        workAssignmentsMessage.textContent =
            "The start date cannot be later than the end date.";
        return;
    }

    const assignment = {
        assignmentName,
        description,
        startDate: startDate || null,
        endDate: endDate || null
    };

    const isEditing = editingAssignmentID !== null;

    const url = isEditing
        ? `/api/director/work-assignments/${editingAssignmentID}`
        : "/api/director/work-assignments";

    const method = isEditing ? "PUT" : "POST";

    saveAssignmentButton.disabled = true;

    workAssignmentsMessage.textContent = isEditing
        ? "Updating assignment..."
        : "Creating assignment...";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(assignment)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Failed to save assignment."
            );
        }

        assignmentForm.reset();
        addAssignmentPanel.hidden = true;

        editingAssignmentID = null;
        saveAssignmentButton.textContent = "Save Assignment";

        await loadWorkAssignments();

        workAssignmentsMessage.textContent = isEditing
            ? "Work assignment updated successfully."
            : "Work assignment created successfully.";

    } catch (error) {
        console.error("Error saving work assignment:", error);
        workAssignmentsMessage.textContent =
            error.message || "Unable to save assignment.";

    } finally {
        saveAssignmentButton.disabled = false;
    }
}

// ASSIGN PERSONNEL TO A WORK ASSIGNMENT

async function openAssignPersonnelPanel(assignment) {
    const assignmentID = Number(assignment.WorkAssignmentID);

    if (selectedAssignmentID !== assignmentID) {
        closeWorkSessionsPanel();
    }

    selectedAssignmentID = assignmentID;

    selectedAssignmentStartDate =
        getDateOnly(assignment.StartDate) || null;

    selectedAssignmentEndDate =
        getDateOnly(assignment.EndDate) || null;

    assignPersonnelTitle.textContent =
        `Assigned Personnel — ${
            assignment.AssignmentName ||
            "Assignment #" + selectedAssignmentID
        }`;

    assignPersonnelPanel.hidden = false;
    assignPersonnelForm.reset();

    assignPersonnelMessage.textContent = "Loading personnel...";
    assignPersonnelSelect.innerHTML =
        '<option value="">Select an employee</option>';

    assignedPersonnelTableBody.innerHTML = "";
    assignedPersonnelIDs = new Set();

    addAssignmentPanel.hidden = true;

    try {
        const [personnel, assigned, positions] = await Promise.all([
            fetchJsonOrThrow("/api/director/personnel"),
            fetchJsonOrThrow(
                `/api/director/work-assignments/${assignmentID}/personnel`
            ),
            fetchJsonOrThrow("/api/director/positions")
        ]);

        if (selectedAssignmentID !== assignmentID) return;

        if (!Array.isArray(personnel) || !Array.isArray(assigned)) {
            throw new Error(
                "Expected lists of personnel and assigned employees."
            );
        }

        assignedPersonnelIDs = new Set(
            assigned.map(person => Number(person.PersonnelID))
        );

        assigned.forEach(person => {
            const row = document.createElement("tr");

            const name = person.EmployeeName ||
                [person.Fname, person.Mname, person.Lname]
                    .filter(Boolean)
                    .join(" ") ||
                `Personnel #${person.PersonnelID}`;

            addCell(row, name);
            addCell(row, person.WorkRole);

            const actionsCell = document.createElement("td");

            const viewSessionsButton = document.createElement("button");
            viewSessionsButton.type = "button";
            viewSessionsButton.textContent = "View Sessions";


            viewSessionsButton.addEventListener("click", () => {
                const employee = personnel.find(
                    p => Number(p.PersonnelID) === Number(person.PersonnelID)
                );

                const position = positions.find(
                    p => Number(p.PositionID) === Number(employee?.PositionID)
                );

                selectedEmployeeHourlyRate =
                    position?.HourlyRate != null
                        ? Number(position.HourlyRate)
                        : null;

                openWorkSessionsPanel(
                    assignmentID,
                    person.AssignmentPersonnelID,
                    name
                );
            });


            actionsCell.appendChild(viewSessionsButton);
            row.appendChild(actionsCell);

            assignedPersonnelTableBody.appendChild(row);
        });

        if (assigned.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 3;
            cell.textContent = "No employees assigned yet.";

            row.appendChild(cell);
            assignedPersonnelTableBody.appendChild(row);
        }

        personnel.forEach(person => {
            const id = Number(person.PersonnelID);

            if (
                !Number.isSafeInteger(id) ||
                assignedPersonnelIDs.has(id)
            ) {
                return;
            }

            const option = document.createElement("option");
            option.value = String(id);

            option.textContent =
                [person.Fname, person.Mname, person.Lname]
                    .filter(Boolean)
                    .join(" ") ||
                `Personnel #${id}`;

            assignPersonnelSelect.appendChild(option);
        });

        assignPersonnelMessage.textContent =
            `${assigned.length} employee(s) currently assigned.`;

    } catch (error) {
        console.error("Error loading assignment personnel:", error);
        assignPersonnelMessage.textContent = error.message;
    }
}

function closeAssignPersonnelPanel() {
    closeWorkSessionsPanel();

    selectedAssignmentID = null;
    assignedPersonnelIDs = new Set();

    selectedEmployeeHourlyRate = null;

    selectedAssignmentStartDate = null;
    selectedAssignmentEndDate = null;

    workSessionDateInput.min = "";
    workSessionDateInput.max = "";

    assignPersonnelForm.reset();
    assignPersonnelPanel.hidden = true;
}

// SAVE PERSONNEL ASSIGNMENT

async function savePersonnelAssignment(event) {
    event.preventDefault();

    const personnelID = Number(assignPersonnelSelect.value);
    const workRole = assignWorkRoleInput.value.trim();

    if (
        !selectedAssignmentID ||
        !Number.isSafeInteger(personnelID) ||
        personnelID <= 0
    ) {
        assignPersonnelMessage.textContent = "Select an employee.";
        return;
    }

    if (!workRole) {
        assignPersonnelMessage.textContent = "Enter a work role.";
        return;
    }

    if (assignedPersonnelIDs.has(personnelID)) {
        assignPersonnelMessage.textContent =
            "This employee is already assigned.";
        return;
    }

    saveAssignedPersonnelButton.disabled = true;
    assignPersonnelMessage.textContent = "Assigning employee...";

    try {
        const assignmentID = selectedAssignmentID;

        await fetchJsonOrThrow(
            `/api/director/work-assignments/${assignmentID}/personnel`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    personnelID,
                    workRole
                })
            }
        );

        if (selectedAssignmentID !== assignmentID) return;

        // NEW: Keep the assignment's dates when refreshing
        // the Assigned Personnel panel after adding an employee.

        const assignment = {
            WorkAssignmentID: assignmentID,
            AssignmentName: assignPersonnelTitle.textContent.replace(
                /^Assigned Personnel — /,
                ""
            ),
            StartDate: selectedAssignmentStartDate,
            EndDate: selectedAssignmentEndDate
        };

        await openAssignPersonnelPanel(assignment);
        await loadWorkAssignments();

        assignPersonnelMessage.textContent =
            "Employee assigned successfully.";

    } catch (error) {
        console.error("Error assigning personnel:", error);
        assignPersonnelMessage.textContent = error.message;

    } finally {
        saveAssignedPersonnelButton.disabled = false;
    }
}

// WORK SESSION HISTORY FUNCTIONALITY

function getWorkSessionsURL() {
    return `/api/director/work-assignments/${selectedAssignmentID}/personnel/${selectedAssignmentPersonnelID}/sessions`;
}

function resetWorkSessionForm() {
    editingSessionID = null;

    workSessionForm.reset();
    workSessionFormPanel.hidden = true;

    workSessionFormTitle.textContent = "Record Work Session";
    saveWorkSessionButton.textContent = "Save Work Session";
}

function closeWorkSessionsPanel() {
    workSessionRequestVersion++;

    selectedAssignmentPersonnelID = null;
    currentWorkSessions = [];

    resetWorkSessionForm();

    workSessionsPanel.hidden = true;
    workSessionsTableBody.innerHTML = "";
    workSessionsMessage.textContent = "";
}

async function openWorkSessionsPanel(
    workAssignmentID,
    assignmentPersonnelID,
    employeeName
) {
    closeWorkSessionsPanel();

    selectedAssignmentID = workAssignmentID;
    selectedAssignmentPersonnelID = assignmentPersonnelID;

    workSessionsTitle.textContent =
        `Work Session History — ${employeeName}`;

    workSessionsPanel.hidden = false;

    await loadWorkSessions();
}

async function loadWorkSessions() {
    if (
        !selectedAssignmentID ||
        !selectedAssignmentPersonnelID
    ) {
        return;
    }

    const requestVersion = ++workSessionRequestVersion;

    workSessionsMessage.textContent = "Loading Work Sessions...";
    refreshWorkSessionsButton.disabled = true;

    try {
        const sessions = await fetchJsonOrThrow(
            getWorkSessionsURL()
        );

        if (requestVersion !== workSessionRequestVersion) return;

        if (!Array.isArray(sessions)) {
            throw new Error("Invalid Work Session data received.");
        }

        currentWorkSessions = sessions;

        renderWorkSessions(sessions);

        workSessionsMessage.textContent =
            `Loaded ${sessions.length} Work Session(s).`;

    } catch (error) {
        if (requestVersion !== workSessionRequestVersion) return;

        console.error("Error loading Work Sessions:", error);

        workSessionsMessage.textContent =
            error.message || "Failed to load Work Sessions.";

    } finally {
        if (requestVersion === workSessionRequestVersion) {
            refreshWorkSessionsButton.disabled = false;
        }
    }
}

// DISPLAY WORK SESSIONS

function renderWorkSessions(sessions) {
    workSessionsTableBody.innerHTML = "";

    let totalHours = 0;
    let totalKnownCost = 0;
    let missingRateCount = 0;

    if (sessions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent =
            "No Work Sessions recorded for this employee.";

        row.appendChild(cell);
        workSessionsTableBody.appendChild(row);
    }

    sessions.forEach(session => {
        const row = document.createElement("tr");

        const hours = Number(session.HoursWorked);

        const hasRate =
            session.HourlyRateAtTime !== null &&
            session.HourlyRateAtTime !== undefined;

        const rate = hasRate
            ? Number(session.HourlyRateAtTime)
            : null;

        const laborCost = hasRate
            ? hours * rate
            : null;

        totalHours += hours;

        if (hasRate) {
            totalKnownCost += laborCost;
        } else {
            missingRateCount++;
        }

        addCell(row, session.SessionID);
        addCell(row, formatDate(session.WorkDate));
        addCell(row, hours.toFixed(2));
        addCell(row, formatCurrency(rate));
        addCell(row, formatCurrency(laborCost));

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editWorkSession(session);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.style.marginLeft = "8px";

        deleteButton.addEventListener("click", () => {
            deleteSelectedWorkSession(session);
        });

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);
        workSessionsTableBody.appendChild(row);
    });

    workSessionTotalCount.textContent = sessions.length;
    workSessionTotalHours.textContent = totalHours.toFixed(2);
    workSessionTotalCost.textContent = formatCurrency(totalKnownCost);

    if (missingRateCount > 0) {
        workSessionsMessage.textContent =
            `${missingRateCount} session(s) have no hourly rate. The displayed labor cost is only the known subtotal.`;
    }
}

// OPEN ADD WORK SESSION FORM


function showAddWorkSessionForm() {
    resetWorkSessionForm();

    applyWorkSessionDateRestrictions();

    // Automatically fill the employee's position hourly rate.
    if (
        selectedEmployeeHourlyRate !== null &&
        Number.isFinite(selectedEmployeeHourlyRate)
    ) {
        workSessionRateInput.value =
            selectedEmployeeHourlyRate.toFixed(2);
    } else {
        workSessionRateInput.value = "";
    }

    workSessionFormPanel.hidden = false;
    workSessionDateInput.focus();
}


// EDIT WORK SESSION

function editWorkSession(session) {
    editingSessionID = session.SessionID;

    // NEW: Apply the same date restrictions while editing.
    applyWorkSessionDateRestrictions();

    workSessionDateInput.value = getDateOnly(session.WorkDate);
    workSessionHoursInput.value = session.HoursWorked;
    workSessionRateInput.value =
        session.HourlyRateAtTime ?? "";

    workSessionFormTitle.textContent =
        `Edit Work Session #${editingSessionID}`;

    saveWorkSessionButton.textContent = "Save Changes";

    workSessionFormPanel.hidden = false;
    workSessionDateInput.focus();
}

// CREATE OR UPDATE WORK SESSION

async function saveWorkSession(event) {
    event.preventDefault();

    if (
        !selectedAssignmentID ||
        !selectedAssignmentPersonnelID
    ) {
        workSessionsMessage.textContent =
            "Please select an assigned employee first.";
        return;
    }

    const workDate = workSessionDateInput.value;
    const hoursWorked = Number(workSessionHoursInput.value);

    const hourlyRateAtTime =
        workSessionRateInput.value.trim() === ""
            ? null
            : Number(workSessionRateInput.value);

    if (!workDate) {
        workSessionsMessage.textContent =
            "Please select a Work Date.";
        return;
    }

    // NEW: Prevent saving sessions outside the assignment dates.

    if (
        (selectedAssignmentStartDate &&
            workDate < selectedAssignmentStartDate) ||
        (selectedAssignmentEndDate &&
            workDate > selectedAssignmentEndDate)
    ) {
        workSessionsMessage.textContent =
            "Work Date must fall within the Work Assignment's date range.";
        return;
    }

    if (
        !Number.isFinite(hoursWorked) ||
        hoursWorked <= 0 ||
        hoursWorked > 999.99
    ) {
        workSessionsMessage.textContent =
            "Hours Worked must be greater than zero and no more than 999.99.";
        return;
    }

    if (
        hourlyRateAtTime !== null &&
        (
            !Number.isFinite(hourlyRateAtTime) ||
            hourlyRateAtTime < 0 ||
            hourlyRateAtTime > 99999999.99
        )
    ) {
        workSessionsMessage.textContent =
            "Please enter a valid hourly rate.";
        return;
    }

    const isEditing = editingSessionID !== null;

    const assignmentID = selectedAssignmentID;
    const assignmentPersonnelID = selectedAssignmentPersonnelID;

    const url = isEditing
        ? `${getWorkSessionsURL()}/${editingSessionID}`
        : getWorkSessionsURL();

    const method = isEditing ? "PUT" : "POST";

    const session = {
        workDate,
        hoursWorked,
        hourlyRateAtTime
    };

    saveWorkSessionButton.disabled = true;

    workSessionsMessage.textContent = isEditing
        ? "Updating Work Session..."
        : "Recording Work Session...";

    try {
        await fetchJsonOrThrow(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(session)
        });

        if (
            selectedAssignmentID !== assignmentID ||
            selectedAssignmentPersonnelID !== assignmentPersonnelID
        ) {
            return;
        }

        resetWorkSessionForm();

        await loadWorkSessions();

        workSessionsMessage.textContent = isEditing
            ? "Work Session updated successfully."
            : "Work Session recorded successfully.";

    } catch (error) {
        console.error("Error saving Work Session:", error);

        workSessionsMessage.textContent =
            error.message || "Failed to save Work Session.";

    } finally {
        saveWorkSessionButton.disabled = false;
    }
}

// DELETE WORK SESSION

async function deleteSelectedWorkSession(session) {
    if (
        !selectedAssignmentID ||
        !selectedAssignmentPersonnelID
    ) {
        return;
    }

    const confirmed = window.confirm(
        `Delete Work Session #${session.SessionID}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    const assignmentID = selectedAssignmentID;
    const assignmentPersonnelID = selectedAssignmentPersonnelID;

    const url =
        `${getWorkSessionsURL()}/${session.SessionID}`;

    workSessionsMessage.textContent =
        "Deleting Work Session...";

    try {
        await fetchJsonOrThrow(url, {
            method: "DELETE"
        });

        if (
            selectedAssignmentID !== assignmentID ||
            selectedAssignmentPersonnelID !== assignmentPersonnelID
        ) {
            return;
        }

        if (editingSessionID === session.SessionID) {
            resetWorkSessionForm();
        }

        await loadWorkSessions();

        workSessionsMessage.textContent =
            "Work Session deleted successfully.";

    } catch (error) {
        console.error("Error deleting Work Session:", error);

        workSessionsMessage.textContent =
            error.message || "Failed to delete Work Session.";
    }
}

// LABOR COST REPORT FUNCTIONALITY

function fillReportSelect(
    select,
    records,
    idField,
    labelFunction,
    allLabel
) {
    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = allLabel;
    select.appendChild(allOption);

    records.forEach(record => {
        const id = Number(record[idField]);

        if (!Number.isSafeInteger(id) || id <= 0) return;

        const option = document.createElement("option");
        option.value = String(id);
        option.textContent = labelFunction(record);

        select.appendChild(option);
    });
}

async function loadLaborReportFilters() {
    try {
        const personnel = await fetchJsonOrThrow(
            "/api/director/personnel"
        );

        if (!Array.isArray(personnel)) {
            throw new Error("Invalid employee list received.");
        }

        fillReportSelect(
            reportPersonnelSelect,
            personnel,
            "PersonnelID",
            person =>
                [person.Fname, person.Mname, person.Lname]
                    .filter(Boolean)
                    .join(" ") ||
                `Personnel #${person.PersonnelID}`,
            "All Employees"
        );

    } catch (error) {
        console.error("Error loading report employees:", error);

        laborReportMessage.textContent =
            `Could not load employee filter: ${error.message}`;
    }

    try {
        const positions = await fetchJsonOrThrow(
            REPORT_POSITIONS_URL
        );

        if (!Array.isArray(positions)) {
            throw new Error("Invalid position list received.");
        }

        fillReportSelect(
            reportPositionSelect,
            positions,
            "PositionID",
            position =>
                position.PositionName ||
                `Position #${position.PositionID}`,
            "All Positions"
        );

    } catch (error) {
        console.error("Error loading report positions:", error);

        reportPositionSelect.disabled = true;

        laborReportMessage.textContent =
            `Position filter unavailable: ${error.message}. Check REPORT_POSITIONS_URL in work-assignments.js.`;
    }
}

async function generateLaborCostReport() {
    const startDate = reportStartDate.value;
    const endDate = reportEndDate.value;

    if (!startDate || !endDate) {
        laborReportMessage.textContent =
            "Please select both a start date and an end date.";
        return;
    }

    if (startDate > endDate) {
        laborReportMessage.textContent =
            "The start date cannot be later than the end date.";
        return;
    }

    laborReportMessage.textContent =
        "Generating labor cost report...";

    laborReportResults.hidden = true;
    laborReportTableBody.innerHTML = "";

    generateLaborReportButton.disabled = true;

    try {
        const params = new URLSearchParams({
            startDate,
            endDate
        });

        if (reportPersonnelSelect.value) {
            params.set(
                "personnelID",
                reportPersonnelSelect.value
            );
        }

        if (reportPositionSelect.value) {
            params.set(
                "positionID",
                reportPositionSelect.value
            );
        }

        const report = await fetchJsonOrThrow(
            `/api/director/work-assignments/labor-cost-report?${params}`
        );

        if (!report?.summary || !Array.isArray(report.assignments)) {
            throw new Error("Invalid labor report data received.");
        }

        const summary = report.summary;
        const assignments = report.assignments;

        reportTotalAssignments.textContent =
            summary.TotalAssignments ?? 0;

        reportTotalEmployees.textContent =
            summary.TotalEmployees ?? 0;

        reportTotalSessions.textContent =
            summary.TotalSessions ?? 0;

        reportTotalHours.textContent =
            Number(summary.TotalHoursWorked ?? 0).toFixed(2);

        const missingRates =
            Number(summary.AssignmentsMissingHourlyRate ?? 0);

        const knownSubtotal = formatCurrency(
            summary.KnownRateLaborCostSubtotal ?? 0
        );

        reportTotalCost.textContent =
            summary.TotalLaborCost == null
                ? `${knownSubtotal} (known subtotal; incomplete)`
                : formatCurrency(summary.TotalLaborCost);

        if (assignments.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 10;
            cell.textContent =
                "No work sessions found for these filters.";

            row.appendChild(cell);
            laborReportTableBody.appendChild(row);

        } else {
            assignments.forEach(assignment => {
                const row = document.createElement("tr");

                addCell(row, assignment.EmployeeName);
                addCell(row, assignment.PositionName);
                addCell(row, assignment.AssignmentName);
                addCell(row, assignment.WorkRole);

                addCell(
                    row,
                    formatDate(assignment.StartDate)
                );

                addCell(
                    row,
                    formatDate(assignment.EndDate)
                );

                addCell(row, assignment.SessionCount);

                addCell(
                    row,
                    Number(assignment.HoursWorked ?? 0).toFixed(2)
                );

                addCell(
                    row,
                    assignment.HourlyRate == null
                        ? (
                            Number(assignment.SessionsMissingCost ?? 0) > 0
                                ? "Unknown / multiple rates"
                                : "Multiple rates"
                        )
                        : formatCurrency(assignment.HourlyRate)
                );

                addCell(
                    row,
                    assignment.LaborCost == null
                        ? `${formatCurrency(assignment.KnownLaborCostSubtotal ?? 0)} (incomplete)`
                        : formatCurrency(assignment.LaborCost)
                );

                laborReportTableBody.appendChild(row);
            });
        }

        laborReportResults.hidden = false;

        laborReportMessage.textContent =
            missingRates > 0
                ? `Report generated. ${missingRates} session(s) have no applicable hourly rate; costs are incomplete.`
                : "Labor cost report generated successfully.";

    } catch (error) {
        console.error("Error generating labor cost report:", error);

        laborReportMessage.textContent =
            error.message || "Unable to generate labor cost report.";

    } finally {
        generateLaborReportButton.disabled = false;
    }
}

// EVENT LISTENERS

showAddAssignmentButton.addEventListener("click", () => {
    editingAssignmentID = null;

    assignmentForm.reset();
    saveAssignmentButton.textContent = "Save Assignment";

    addAssignmentPanel.hidden = false;
    assignmentNameInput.focus();
});

cancelAddAssignmentButton.addEventListener("click", () => {
    assignmentForm.reset();
    addAssignmentPanel.hidden = true;

    editingAssignmentID = null;
    saveAssignmentButton.textContent = "Save Assignment";

    workAssignmentsMessage.textContent = "";
});

assignmentForm.addEventListener(
    "submit",
    createWorkAssignment
);

assignPersonnelForm.addEventListener(
    "submit",
    savePersonnelAssignment
);

closeAssignPersonnelButton.addEventListener(
    "click",
    closeAssignPersonnelPanel
);

refreshWorkAssignmentsButton.addEventListener(
    "click",
    loadWorkAssignments
);

generateLaborReportButton.addEventListener(
    "click",
    generateLaborCostReport
);

// WORK SESSION EVENT LISTENERS

showAddWorkSessionButton.addEventListener(
    "click",
    showAddWorkSessionForm
);

refreshWorkSessionsButton.addEventListener(
    "click",
    loadWorkSessions
);

closeWorkSessionsButton.addEventListener(
    "click",
    closeWorkSessionsPanel
);

workSessionForm.addEventListener(
    "submit",
    saveWorkSession
);

cancelWorkSessionButton.addEventListener(
    "click",
    resetWorkSessionForm
);

// INITIAL PAGE LOAD

loadWorkAssignments();
loadLaborReportFilters();
