import { createDrawer } from "/js/drawer.js";
import { createFormState } from "/js/form-state.js";

let allExhibitions = [];
let exhibitionFormLoaded = false;
let formState = null;

const exhibitionDrawer = createDrawer({
    element: document.getElementById("exhibition-form-container"),
    closeButton: document.getElementById("close-exhibition-drawer"),
    initialFocus: () => document.getElementById("exhibitionName"),
    canClose: () => formState === null || formState.confirmDiscard()
});

document.addEventListener("DOMContentLoaded", () => {
    loadExhibitions();

    document
        .getElementById("exhibition-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-exhibition-button")
        .addEventListener("click", openExhibitionDrawer);
});

window.addEventListener("beforeunload", (event) => {
    if (exhibitionDrawer.isOpen() && formState?.isDirty()) {
        event.preventDefault();
        event.returnValue = "";
    }
});

async function loadExhibitions() {
    try {
        const response = await fetch("/api/curator/exhibitions");
        if (!response.ok) {
            throw new Error(`Failed to load exhibitions: ${response.status}`);
        }

        allExhibitions = await response.json();
        document.getElementById("error-state").hidden = true;
        renderExhibitions(getFilteredExhibitions());
    } catch (error) {
        console.error("Unable to load exhibitions:", error);
        document.getElementById("error-state").hidden = false;
    }
}

function getFilteredExhibitions() {
    const query = document
        .getElementById("exhibition-search")
        .value
        .trim()
        .toLowerCase();

    return allExhibitions.filter((exhibition) =>
        exhibition.exhibitionName?.toLowerCase().includes(query) ||
        exhibition.description?.toLowerCase().includes(query)
    );
}

function renderExhibitions(exhibitions) {
    const tableBody = document.getElementById("exhibitions-table-body");
    const emptyState = document.getElementById("search-empty-state");

    tableBody
        .querySelectorAll("tr:not(#search-empty-state):not(#error-state)")
        .forEach((row) => row.remove());

    emptyState.hidden = exhibitions.length > 0;
    if (exhibitions.length === 0) {
        return;
    }

    for (const exhibition of exhibitions) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const nameLink = document.createElement("a");
        nameLink.href = `/curator/exhibitions/${exhibition.exhibitionId}`;
        nameLink.textContent = exhibition.exhibitionName;
        nameCell.appendChild(nameLink);
        
        const statusCell = document.createElement("td");
        statusCell.textContent = exhibition.status || "Unknown";

        const datesCell = document.createElement("td");
        if (exhibition.startDate && exhibition.endDate) {
            const startDate = exhibition.startDate.slice(0, 10);
            const endDate = exhibition.endDate.slice(0, 10);
            datesCell.textContent = `${startDate} - ${endDate}`;
        } else {
            datesCell.textContent = "—";
        }
        
        const actionsCell = document.createElement("td");
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "view-exhibition-button";
        viewButton.dataset.exhibitionId = exhibition.exhibitionId;
        viewButton.textContent = "View";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-exhibition-button";
        editButton.dataset.exhibitionId = exhibition.exhibitionId;
        editButton.textContent = "Edit";

        actionsCell.append(viewButton, editButton);
        row.append(nameCell, statusCell, datesCell, actionsCell);
        tableBody.insertBefore(row, emptyState);

        viewButton.addEventListener("click", () => {
            window.location.assign(
                `/curator/exhibitions/${viewButton.dataset.exhibitionId}`
            );
        });

        editButton.addEventListener("click", () => {
            openExhibitionDrawerForEdit(exhibition.exhibitionId);
        });
    }
}

function handleSearch() {
    renderExhibitions(getFilteredExhibitions());
}

async function loadExhibitionFormContainer() {
    if (exhibitionFormLoaded) {
        return;
    }

    const response = await fetch ("/components/exhibition-form.html");
    if (!response.ok) {
        throw new Error(`Failed to load exhibition form: ${response.status}`);
    }

    document.getElementById("exhibition-form-content").innerHTML = 
        await response.text();

    const form = document.getElementById("exhibition-form");
    formState = createFormState(form);
    form.addEventListener("submit", submitExhibitionForm);
    document
        .getElementById("exhibition-cancel-button")
        .addEventListener("click", exhibitionDrawer.close);
        
    exhibitionFormLoaded = true;
}

async function openExhibitionDrawer() {
    try {
        await loadExhibitionFormContainer();
        setFormMode("create");
        formState.capture();
        exhibitionDrawer.open();
    } catch (error) {
        console.error("Unable to open exhibition form:", error);
        window.alert("Unable to load the exhibition form. Please try again.");
    }
}

async function openExhibitionDrawerForEdit(exhibitionId) {
    try {
        await loadExhibitionFormContainer();
        setFormMode("edit", exhibitionId);

        const submitButton = document.getElementById("exhibition-submit-button");
        submitButton.disabled = true;

        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}`
        );
        if (!response.ok) {
            throw new Error(`Failed to load exhibition: ${response.status}`);
        }

        const exhibition = await response.json();
        document.getElementById("exhibitionName").value =
            exhibition.exhibitionName ?? "";
        document.getElementById("startDate").value =
            exhibition.startDate?.slice(0, 10) ?? "";
        document.getElementById("endDate").value =
            exhibition.endDate?.slice(0, 10) ?? "";
        document.getElementById("description").value =
            exhibition.description ?? "";

        formState.capture();
        submitButton.disabled = false;
        exhibitionDrawer.open();
    } catch (error) {
        console.error("Unable to open exhibition for editing:", error);
        window.alert("Unable to load this exhibition. Please try again.");
    }
}

function setFormMode(mode, exhibitionId = "") {
    const form = document.getElementById("exhibition-form");
    form.dataset.mode = mode;
    form.dataset.exhibitionId = exhibitionId;

    const title = document.getElementById("exhibition-form-title");
    const submitButton = document.getElementById("exhibition-submit-button");
    submitButton.disabled = false;

    if (mode === "edit") {
        title.textContent = "Edit Exhibition";
        submitButton.textContent = "Save Changes";
    } else {
        form.reset();
        title.textContent = "Create Exhibition";
        submitButton.textContent = "Create Exhibition";
    }
}

async function submitExhibitionForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const exhibition = {
        exhibitionName: formData.get("exhibitionName").trim(),
        startDate: formData.get("startDate").trim() || null,
        endDate: formData.get("endDate").trim() || null,
        description: formData.get("description").trim() || null
    };
    const isEditing = form.dataset.mode === "edit";
    const exhibitionId = form.dataset.exhibitionId;

    try {
        const response = await fetch(
            isEditing
                ? `/api/curator/exhibitions/${exhibitionId}`
                : "/api/curator/exhibitions",
            {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exhibition)
            }
        );

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.error || `Unable to save exhibition (${response.status}).`
            );
        }

        form.reset();
        formState.capture();
        exhibitionDrawer.close();
        await loadExhibitions();
    } catch (error) {
        console.error("Unable to save exhibition:", error);
        window.alert(
            error.message || "Unable to save exhibition. Please try again."
        );
    }
}