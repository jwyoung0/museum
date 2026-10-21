import { createDrawer } from "/js/drawer.js";
import { createFormState } from "/js/form-state.js";

let allCollections = [];
let collectionFormLoaded = false;
let formState = null;

const collectionDrawer = createDrawer({
    element: document.getElementById("collection-form-container"),
    closeButton: document.getElementById("close-collection-drawer"),
    initialFocus: () => document.getElementById("collectionName"),
    canClose: () => formState === null || formState.confirmDiscard()
});

document.addEventListener("DOMContentLoaded", () => {
    loadCollections();

    document
        .getElementById("collection-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-collection-button")
        .addEventListener("click", openCollectionDrawer);
});

window.addEventListener("beforeunload", (event) => {
    if (collectionDrawer.isOpen() && formState?.isDirty()) {
        event.preventDefault();
        event.returnValue = "";
    }
});

async function loadCollections() {
    try {
        const response = await fetch("/api/curator/collections");
        if (!response.ok) {
            throw new Error(`Failed to load collections: ${response.status}`);
        }

        allCollections = await response.json();
        document.getElementById("error-state").hidden = true;
        renderCollections(getFilteredCollections());
    } catch (error) {
        console.error("Unable to load collections:", error);
        document.getElementById("error-state").hidden = false;
    }
}

function getFilteredCollections() {
    const query = document
        .getElementById("collection-search")
        .value
        .trim()
        .toLowerCase();

    return allCollections.filter((collection) =>
        collection.collectionName?.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
}

function renderCollections(collections) {
    const tableBody = document.getElementById("collections-table-body");
    const emptyState = document.getElementById("search-empty-state");

    tableBody
        .querySelectorAll("tr:not(#search-empty-state):not(#error-state)")
        .forEach((row) => row.remove());

    emptyState.hidden = collections.length > 0;
    if (collections.length === 0) {
        return;
    }

    for (const collection of collections) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const nameLink = document.createElement("a");
        nameLink.href = `/curator/collections/${collection.collectionId}`;
        nameLink.textContent = collection.collectionName;
        nameCell.append(nameLink);

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = collection.description ?? "";

        const actionsCell = document.createElement("td");
        // const viewLink = document.createElement("a");
        // viewLink.href = nameLink.href;
        // viewLink.textContent = "View";
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className ="view-collection-button";
        viewButton.dataset.collectionId = collection.collectionId;
        viewButton.textContent = "View";


        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-collection-button";
        editButton.dataset.collectionId = collection.collectionId;
        editButton.textContent = "Edit";

        actionsCell.append(viewButton, " ", editButton);
        row.append(nameCell, descriptionCell, actionsCell);
        tableBody.insertBefore(row, emptyState);

        viewButton.addEventListener("click", () => {
            window.location.assign(
                `/curator/collections/${viewButton.dataset.collectionId}`
            );
        });

        editButton.addEventListener("click", () =>
            openCollectionDrawerForEdit(collection.collectionId)
        );
    }
}

function handleSearch() {
    renderCollections(getFilteredCollections());
}

async function loadCollectionFormContainer() {
    if (collectionFormLoaded) {
        return;
    }

    const response = await fetch("/components/collection-form.html");
    if (!response.ok) {
        throw new Error(`Failed to load collection form: ${response.status}`);
    }

    document.getElementById("collection-form-content").innerHTML =
        await response.text();

    const form = document.getElementById("collection-form");
    formState = createFormState(form);
    form.addEventListener("submit", submitCollectionForm);
    document
        .getElementById("collection-cancel-button")
        .addEventListener("click", collectionDrawer.close);

    collectionFormLoaded = true;
}

async function openCollectionDrawer() {
    try {
        await loadCollectionFormContainer();
        setFormMode("create");
        formState.capture();
        collectionDrawer.open();
    } catch (error) {
        console.error("Unable to open collection form:", error);
        window.alert("Unable to load the collection form. Please try again.");
    }
}

async function openCollectionDrawerForEdit(collectionId) {
    try {
        await loadCollectionFormContainer();
        setFormMode("edit", collectionId);

        const submitButton = document.getElementById("collection-submit-button");
        submitButton.disabled = true;

        const response = await fetch(
            `/api/curator/collections/${collectionId}`
        );
        if (!response.ok) {
            throw new Error(`Failed to load collection: ${response.status}`);
        }

        const collection = await response.json();
        document.getElementById("collectionName").value =
            collection.collectionName ?? "";
        document.getElementById("description").value =
            collection.description ?? "";

        formState.capture();
        submitButton.disabled = false;
        collectionDrawer.open();
    } catch (error) {
        console.error("Unable to open collection for editing:", error);
        window.alert("Unable to load this collection. Please try again.");
    }
}

function setFormMode(mode, collectionId = "") {
    const form = document.getElementById("collection-form");
    form.dataset.mode = mode;
    form.dataset.collectionId = collectionId;

    const title = document.getElementById("collection-form-title");
    const submitButton = document.getElementById("collection-submit-button");
    submitButton.disabled = false;

    if (mode === "edit") {
        title.textContent = "Edit Collection";
        submitButton.textContent = "Save Changes";
    } else {
        form.reset();
        title.textContent = "Create Collection";
        submitButton.textContent = "Create Collection";
    }
}

async function submitCollectionForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const collection = {
        collectionName: formData.get("collectionName").trim(),
        description: formData.get("description").trim() || null
    };
    const isEditing = form.dataset.mode === "edit";
    const collectionId = form.dataset.collectionId;

    try {
        const response = await fetch(
            isEditing
                ? `/api/curator/collections/${collectionId}`
                : "/api/curator/collections",
            {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(collection)
            }
        );

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.error || `Unable to save collection (${response.status}).`
            );
        }

        form.reset();
        formState.capture();
        collectionDrawer.close();
        await loadCollections();
    } catch (error) {
        console.error("Unable to save collection:", error);
        window.alert(
            error.message || "Unable to save collection. Please try again."
        );
    }
}