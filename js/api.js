import { authFetch } from "./helper.js";

class APIClient {
    constructor(baseURL = "https://fastapi-rag-engine-jnup.onrender.com") {
        this.baseURL = baseURL;
    }

    async uploadDocument(title, description, subjectName, file) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("subject_name", subjectName);
        formData.append("file", file);

        try {
            const response = await authFetch(
                `${this.baseURL}/Documents/add-documents`, { method: "POST", body: formData }
            );

            if (!response || !response.ok) throw new Error("Document upload failed");
            return await response.json();
        } catch (err) {
            console.error(err);
            if (typeof toast !== 'undefined') toast.show(err.message, "error");
            throw err;
        }
    }

    /**
     * Sends chat request as multipart/form-data to match FastAPI's Form/File parameters.
     * Note: Do NOT set "Content-Type" header manually when using FormData; fetch handles it.
     */
    async chatWithBot(question, subjectId, images = []) {
        const formData = new FormData();
        formData.append("question", question);
        if (subjectId) {
            formData.append("subject_id", subjectId);
        }

        if (Array.isArray(images)) {
            images.forEach(image => {
                formData.append("images", image);
            });
        }

        try {
            const response = await authFetch(
                `${this.baseURL}/Chat/chat-with-bot`, {
                    method: "POST",
                    body: formData
                }
            );

            // Parse JSON for error details
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Read FastAPI's HTTPException detail string
                const errorMsg = (data && data.detail) || `Error ${response.status}: Lumina did not respond`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (err) {
            console.error("chatWithBot Error:", err);
            throw err; // Pass down to chat.js
        }
    }

    async listSubjects() {
        try {
            const response = await authFetch(
                `${this.baseURL}/Subjects/list-subject`, { method: "GET" }
            );

            if (!response || !response.ok) throw new Error("Failed to fetch subjects");
            return await response.json();
        } catch (err) {
            console.error(err);
            if (typeof toast !== 'undefined') toast.show("Could not connect to database", "error");
            throw err;
        }
    }

    async generateFlashcards(title, file) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);

        try {
            const response = await authFetch(
                `${this.baseURL}/flashcards/generate`, {
                    method: "POST",
                    body: formData // Let fetch manage boundary headers
                }
            );

            if (!response || !response.ok) {
                throw new Error("Failed to generate flashcards");
            }
            return await response.json();
        } catch (err) {
            console.error(err);
            if (typeof toast !== "undefined") {
                toast.show(err.message, "error");
            }
            throw err;
        }
    }

    async listFlashcards() {
        try {
            const response = await authFetch(
                `${this.baseURL}/flashcards/list-flashcards`, { method: "GET" }
            );

            if (!response || !response.ok) {
                throw new Error("Failed to load flashcards");
            }
            return await response.json();
        } catch (err) {
            console.error("Error listing flashcards:", err);
            throw err;
        }
    }

    /**
     * Deletes a flashcard set by ID.
     * Expects endpoint: DELETE /flashcards/delete-flashcardset?set_id=<UUID>
     */
    async deleteFlashcardSet(setId) {
        try {
            const response = await authFetch(
                `${this.baseURL}/flashcards/delete-flashcardset?set_id=${setId}`, { method: "DELETE" }
            );

            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to delete flashcard set");
            }
            return await response.json();
        } catch (err) {
            console.error("Error deleting flashcard set:", err);
            throw err;
        }
    }
}

export const api = new APIClient();