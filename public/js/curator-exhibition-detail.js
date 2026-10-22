let currentExhibition = null;

document.addEventListener("DOMContentLoaded", async () => {
    const exhibitionId = window.location.pathname.split("/").pop();

    try {
        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}`
        );  
    
        if (!response.ok) {
            throw new Error("Failed to load exhibition");
        }

        const exhibition = await response.json();

        currentExhibition = exhibition;

        document.getElementById("exhibition-name").textContent =
            exhibition.exhibitionName;
        document.getElementById("exhibitionName").textContent =
            exhibition.exhibitionName;
        document.getElementById("status").textContent =
            exhibition.status ?? "Unknown";
        document.getElementById("startDate").textContent = 
            exhibition.startDate ?? "Unknown";
        document.getElementById("endDate").textContent = 
            exhibition.endDate ?? "Unknown";
        document.getElementById("description").textContent =
            exhibition.description ?? "";

        const deleteButton = document.getElementById("delete-exhibition-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", confirmDeleteExhibition);
    } catch (error) {
        console.error("Unable to load exhibition:", error);
        document.getElementById("detail-error").hidden = false;
    } 
});

async function confirmDeleteExhibition() {
    const confirmed = window.confirm(
        `Delete ${currentExhibition.exhibitionName}?`
    );  

    if (!confirmed) {
        return;
    }

    await handleDeleteExhibition();
}  

async function handleDeleteExhibition() {
    try {
        const response = await fetch(
            `/api/curator/exhibitions/${currentExhibition.id}`,
            { method: "DELETE" }
        ); 

        if (!response.ok) {
            throw new Error(`Failed to delete exhibition: ${response.status}`);
        }  

        window.location.href = "/curator/exhibitions";
    } catch (error) {
        console.error("Unable to delete exhibition:", error);
        window.alert("Unable to delete this exhibition. Please try again.");
    }  
}