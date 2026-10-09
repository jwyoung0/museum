document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("artist-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const artist = {
            fullName: document.getElementById("fullName").value.trim(),
            birthYear: parseInt(document.getElementById("birthYear").value, 10),
            placeOfBirth: document.getElementById("placeOfBirth").value.trim() || null,
            period: document.getElementById("period").value.trim() || null,
            deathYear: document.getElementById("deathYear").value
                ? parseInt(document.getElementById("deathYear").value, 10)
                : null,
            sex: document.getElementById("sex").value || null,
            nationality: document.getElementById("nationality").value.trim() || null
        };

        try {
            const response = await fetch("/api/curator/artists", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(artist)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to create artist");
            }

            alert(`Artist "${result.fullName}" created successfully.`);
            form.reset();
        } catch (error) {
            console.error("Create artist error:", error);
            alert(error.message || "Unable to create artist.");
        }
    });
});