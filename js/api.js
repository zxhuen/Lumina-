class APIClient {
    constructor(baseURL = 'https://fastapi-rag-engine-gsxz.onrender.com') {
        this.baseURL = baseURL;
    }

    async addSubject(name, term) {
        try {
            const response = await fetch(`${this.baseURL}/Subjects/add-subject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, term })
            });
            if (!response.ok) throw new Error('Failed to add subject');
            return await response.json();
        } catch (err) {
            toast.show(err.message, 'error');
            throw err;
        }
    }

    async uploadDocument(title, description, subjectName, file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('subject_name', subjectName);
        formData.append('file', file);

        try {
            const response = await fetch(`${this.baseURL}/Documents/add-documents`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Document upload failed');
            return await response.json();
        } catch (err) {
            toast.show(err.message, 'error');
            throw err;
        }
    }

    async chatWithBot(question, subjectId = null) {
        const params = new URLSearchParams({ question });

        if (subjectId) {
            // Matches your endpoint URL parameter: ?question=...&suject_id=...
            params.append('subject_id', subjectId);
        }

        try {
            const response = await fetch(`${this.baseURL}/Chat/chat-with-bot?${params.toString()}`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('AI Assistant did not respond');
            return await response.json();
        } catch (err) {
            toast.show(err.message, 'error');
            throw err;
        }
    }

    // Fetch all subjects directly from your FastAPI database
    async listSubjects() {
        try {
            const response = await fetch(`${this.baseURL}/Subjects/list-suject`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch subjects');
            return await response.json();
        } catch (err) {
            toast.show('Could not connect to database', 'error');
            throw err;
        }
    }
}

const api = new APIClient();