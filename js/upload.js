document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const form = document.getElementById('upload-form');
    let selectedFile = null;

    if (!dropZone) return;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (file.type !== 'application/pdf') {
            toast.show('Only PDF files are supported.', 'error');
            return;
        }
        selectedFile = file;
        fileLabel.innerHTML = `Selected: <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }

    form.addEventListener('submit', async(e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.show('Please attach a PDF document.', 'error');
            return;
        }

        const title = document.getElementById('doc-title').value;
        const subject = document.getElementById('doc-subject').value;
        const desc = document.getElementById('doc-desc').value;
        const btn = document.getElementById('upload-btn');

        try {
            btn.disabled = true;
            btn.innerText = 'Uploading...';

            await api.uploadDocument(title, desc, subject, selectedFile);

            toast.show('Document uploaded successfully!', 'success');
            form.reset();
            selectedFile = null;
            fileLabel.innerHTML = `Drag and drop your PDF here, or <span style="color: var(--accent-primary);">browse</span>`;
        } catch (err) {
            // Clean fallback indicator
        } finally {
            btn.disabled = false;
            btn.innerText = 'Upload Document';
        }
    });
});