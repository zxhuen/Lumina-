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

    // Array to manage multiple uploaded files
    let selectedFiles = [];

    if (!chatInput) return;

    loadSubjects();

    // Trigger file picker
    attachBtn.addEventListener('click', () => imageInput.click());

    // Handle multi-image selection
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            selectedFiles = [...selectedFiles, ...files];
            renderPreviews();
        }
    });

    function renderPreviews() {
        previewContainer.innerHTML = '';
        if (selectedFiles.length === 0) {
            previewContainer.style.display = 'none';
            imageInput.value = '';
            return;
        }

        previewContainer.style.display = 'flex';

        selectedFiles.forEach((file, index) => {
            const badge = document.createElement('div');
            badge.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 255, 255, 0.08);
                padding: 4px 8px;
                border-radius: var(--radius-sm, 6px);
                font-size: 0.8rem;
            `;

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.cssText = 'width: 32px; height: 32px; object-fit: cover; border-radius: 4px;';

            const nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'color: var(--text-secondary); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            nameSpan.textContent = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '✕';
            removeBtn.style.cssText = 'background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0 2px;';
            removeBtn.addEventListener('click', () => removeFile(index));

            badge.appendChild(img);
            badge.appendChild(nameSpan);
            badge.appendChild(removeBtn);
            previewContainer.appendChild(badge);
        });
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderPreviews();
    }

    function clearImageSelection() {
        selectedFiles = [];
        renderPreviews();
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

    // Pre-processing helper to fix clumped AI response strings into proper Markdown
    // Pre-processing helper to fix clumped AI response strings into proper Markdown
    function formatAiResponse(rawText) {
        if (!rawText) return "";

        let formatted = rawText
            // Clean up lead-in "Answer:" prefix if present
            .replace(/^Answer:\s*/i, '')
            // Force headers like **Name** onto new lines
            .replace(/(^|\s)(\*\*[^*]+\*\*)/g, '\n\n### $2\n')
            // Force ANY inline asterisk followed by text/space to be on a fresh double-newline list item
            .replace(/(:\s*)?\*\s+/g, '\n\n* ')
            // Clean up excessive newlines
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return formatted;
    }

    // Configure marked to use highlight.js
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

    function appendMessage(text, sender, contextLabel = null, chunkContext = null, imageFiles = []) {
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

        // Render attached images gallery inside user message bubble
        if (imageFiles && imageFiles.length > 0) {
            const gallery = document.createElement('div');
            gallery.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;';

            imageFiles.forEach(file => {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.cssText = 'max-width: 140px; max-height: 140px; border-radius: var(--radius-sm, 6px); object-fit: cover;';
                gallery.appendChild(img);
            });

            bubble.appendChild(gallery);
        }

        const content = document.createElement('div');
        content.className = 'chat-content';

        if (sender === 'bot') {
            // Pre-format the raw text to ensure proper Markdown line breaks
            const formattedText = formatAiResponse(text);

            content.innerHTML = typeof marked !== 'undefined' ? marked.parse(formattedText) : formattedText;

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
        if (!query && selectedFiles.length === 0) return;

        const selectedSubjectId = subjectSelect.value || null;
        const selectedSubjectLabel = subjectSelect.options[subjectSelect.selectedIndex].text;
        const filesToSend = [...selectedFiles];

        appendMessage(query, 'user', selectedSubjectLabel, null, filesToSend);

        chatInput.value = '';
        clearImageSelection();

        appendTypingIndicator();

        try {
            const res = await api.chatWithBot(query, selectedSubjectId, filesToSend);
            removeTypingIndicator();

            appendMessage(
                res.answer || "No response received.",
                'bot',
                null,
                res.chunk_context || null
            );
        } catch (err) {
            removeTypingIndicator();

            // Render the exact HTTPException detail message in the chat stream
            appendMessage(
                `⚠️ ${err.message}`,
                'bot'
            );

            // Optional: Also display a toast popup if toast.js is loaded
            if (typeof toast !== 'undefined') {
                toast.show(err.message, "error");
            }
        }
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});