import { api } from "./api.js";

document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const subjectSelect = document.getElementById('chat-subject-select');

    // Image attachment elements
    const attachBtn = document.getElementById('attach-btn');
    const imageInput = document.getElementById('chat-image-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const filenameSpan = document.getElementById('image-filename');
    const removeImageBtn = document.getElementById('remove-image-btn');

    let selectedFile = null;

    if (!chatInput) return;

    loadSubjects();

    // Trigger file picker
    attachBtn.addEventListener('click', () => imageInput.click());

    // Handle image file selection
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            imagePreview.src = URL.createObjectURL(file);
            filenameSpan.textContent = file.name;
            previewContainer.style.display = 'flex';
        }
    });

    // Handle removing attached image
    removeImageBtn.addEventListener('click', clearImageSelection);

    function clearImageSelection() {
        selectedFile = null;
        imageInput.value = '';
        imagePreview.src = '';
        filenameSpan.textContent = '';
        previewContainer.style.display = 'none';
    }

    async function loadSubjects() {
        if (!subjectSelect) return;

        try {
            const subjects = await api.listSubjects();
            subjectSelect.innerHTML = '<option value="">🌐 All Subjects (Global RAG Search)</option>';

            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                subjectSelect.appendChild(option);
            });

            const urlParams = new URLSearchParams(window.location.search);
            const targetSubjectId = urlParams.get('subject_id');
            if (targetSubjectId) {
                subjectSelect.value = targetSubjectId;
            }
        } catch (err) {
            console.error('Error loading subjects:', err);
        }
    }

    // Configure marked to use highlight.js
    // Marked.js (v5+) syntax extension setup for Highlight.js
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
        marked.use({
            breaks: true,
            gfm: true,
            renderer: {
                code(code, infostring) {
                    const lang = (infostring || '').match(/\S*/)[0];
                    let highlighted = code;

                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            highlighted = hljs.highlight(code, { language: lang }).value;
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        highlighted = hljs.highlightAuto(code).value;
                    }

                    return `
                    <div class="code-block-wrapper" style="position: relative; margin: 10px 0;">
                        <button class="copy-code-btn" type="button" style="position: absolute; top: 8px; right: 8px; padding: 4px 8px; font-size: 0.75rem; background: rgba(255,255,255,0.15); border: none; border-radius: 4px; color: #fff; cursor: pointer;">Copy</button>
                        <pre><code class="hljs ${lang}">${highlighted}</code></pre>
                    </div>
                `;
                }
            }
        });
    }

    function appendMessage(text, sender, contextLabel = null, chunkContext = null, imageFile = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;

        if (contextLabel && sender === 'user') {
            const badge = document.createElement('div');
            badge.style.fontSize = '0.75rem';
            badge.style.opacity = '0.8';
            badge.style.marginBottom = '4px';
            badge.style.textTransform = 'uppercase';
            badge.innerText = `[Context: ${contextLabel}]`;
            bubble.appendChild(badge);
        }

        // Render attached image in user chat bubble if attached
        if (imageFile) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(imageFile);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = 'var(--radius-sm, 6px)';
            img.style.marginBottom = '8px';
            img.style.display = 'block';
            bubble.appendChild(img);
        }

        const content = document.createElement('div');
        content.className = 'chat-content';

        // Parse markdown for bot, plain text for user
        if (sender === 'bot') {
            content.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;

            // Add interactive Copy listeners to generated code buttons
            content.querySelectorAll('.copy-code-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.nextElementSibling.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        btn.innerText = 'Copied!';
                        setTimeout(() => btn.innerText = 'Copy', 2000);
                    });
                });
            });
        } else {
            content.innerText = text;
        }

        bubble.appendChild(content);

        // Render RAG chunk context standard collapse if available
        if (sender === 'bot' && chunkContext) {
            const contextContainer = document.createElement('details');
            contextContainer.style.marginTop = '10px';
            contextContainer.style.paddingTop = '8px';
            contextContainer.style.borderTop = '1px solid rgba(255, 255, 255, 0.15)';
            contextContainer.style.fontSize = '0.82rem';

            const summary = document.createElement('summary');
            summary.style.cursor = 'pointer';
            summary.style.opacity = '0.85';
            summary.style.fontWeight = '500';
            summary.innerText = '🔍 View Retrieved RAG Context';

            const contextBody = document.createElement('div');
            contextBody.style.marginTop = '8px';
            contextBody.style.padding = '8px 12px';
            contextBody.style.borderRadius = 'var(--radius-sm, 6px)';
            contextBody.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            contextBody.style.whiteSpace = 'pre-wrap';
            contextBody.style.fontFamily = 'monospace';
            contextBody.style.maxHeight = '200px';
            contextBody.style.overflowY = 'auto';

            if (Array.isArray(chunkContext)) {
                contextBody.innerText = chunkContext.map((c, i) => `[Chunk ${i + 1}]:\n${c}`).join('\n\n');
            } else if (typeof chunkContext === 'object') {
                contextBody.innerText = JSON.stringify(chunkContext, null, 2);
            } else {
                contextBody.innerText = chunkContext;
            }

            contextContainer.appendChild(summary);
            contextContainer.appendChild(contextBody);
            bubble.appendChild(contextContainer);
        }

        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function appendTypingIndicator() {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot';
        bubble.id = 'typing-indicator';
        bubble.innerHTML = `<span class="dot-1">•</span><span class="dot-2">•</span><span class="dot-3">•</span>`;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async function handleSend() {
        const query = chatInput.value.trim();
        if (!query && !selectedFile) return;

        const selectedSubjectId = subjectSelect.value || null;
        const selectedSubjectLabel = subjectSelect.options[subjectSelect.selectedIndex].text;
        const fileToSend = selectedFile;

        // Append user prompt and preview attached file
        appendMessage(query, 'user', selectedSubjectLabel, null, fileToSend);

        // Reset inputs immediately
        chatInput.value = '';
        clearImageSelection();

        appendTypingIndicator();

        try {
            const res = await api.chatWithBot(query, selectedSubjectId, fileToSend);
            removeTypingIndicator();

            appendMessage(
                res.answer || "No response received.",
                'bot',
                null,
                res.chunk_context || null
            );
        } catch (err) {
            removeTypingIndicator();
            appendMessage(
                "Sorry, I'm having trouble connecting to the server. Please check your backend connection.",
                'bot'
            );
        }
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});