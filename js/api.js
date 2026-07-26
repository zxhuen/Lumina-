import { authFetch } from "./helper.js";

class APIClient {
    constructor(baseURL = "http://127.0.0.1:8000") {
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
    async chatWithBot(question, subjectId, imageFile = null) {
        const formData = new FormData();
        formData.append("question", question);
        if (subjectId) {
            formData.append("subject_id", subjectId);
        }
        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            const response = await authFetch(
                `${this.baseURL}/Chat/chat-with-bot`, {
                    method: "POST",
                    body: formData // Let browser manage boundary headers
                }
            );

            if (!response || !response.ok) throw new Error("Lumina did not respond");
            return await response.json();
        } catch (err) {
            console.error(err);
            if (typeof toast !== 'undefined') toast.show(err.message, "error");
            throw err;
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
}

export const api = new APIClient();