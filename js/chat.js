import { api } from "./api.js";

document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const nativeSelect = document.getElementById('chat-subject-select');

    // Custom Animated Dropdown Elements
    const customDropdown = document.getElementById('custom-rag-dropdown');
    const triggerBtn = document.getElementById('dropdown-trigger-btn');
    const selectedLabel = document.getElementById('selected-subject-label');
    const menuList = document.getElementById('dropdown-menu-list');

    // Image attachment elements
    const attachBtn = document.getElementById('attach-btn');
    const imageInput = document.getElementById('chat-image-input');
    const previewContainer = document.getElementById('image-preview-container');

    // Array to manage multiple uploaded files
    let selectedFiles = [];

    if (!chatInput) return;

    // Create RAG Context Modal dynamically
    const ragModal = createRagModal();

    // Initialize custom dropdown events
    initCustomDropdown();

    // Load subject options from API
    loadSubjects();

    // Trigger file picker
    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }

    // Handle multi-image selection
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                selectedFiles = [...selectedFiles, ...files];
                renderPreviews();
            }
        });
    }

    /* ==========================================================================
       RAG Modal Creation & Controls
       ========================================================================== */

    function createRagModal() {
        const overlay = document.createElement('div');
        overlay.className = 'rag-modal-overlay';
        overlay.id = 'rag-context-modal';

        const card = document.createElement('div');
        card.className = 'rag-modal-card';

        const header = document.createElement('div');
        header.className = 'rag-modal-header';

        const title = document.createElement('div');
        title.className = 'rag-modal-title';
        title.innerHTML = '🔍 Retrieved RAG Context';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'rag-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'rag-modal-body';
        body.id = 'rag-modal-content';

        card.appendChild(header);
        card.appendChild(body);
        overlay.appendChild(card);

        // Close when clicking overlay backdrop
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function openRagModal(contextText) {
        const modalContent = document.getElementById('rag-modal-content');
        if (modalContent) {
            modalContent.innerText = contextText;
        }
        if (ragModal) {
            ragModal.classList.add('active');
        }
    }

    /* ==========================================================================
       Custom Animated Dropdown Logic
       ========================================================================== */

    function initCustomDropdown() {
        if (!triggerBtn || !customDropdown) return;

        triggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            customDropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!customDropdown.contains(e.target)) {
                customDropdown.classList.remove('open');
            }
        });
    }

    function renderCustomDropdownOptions() {
        if (!menuList || !nativeSelect) return;
        menuList.innerHTML = '';

        Array.from(nativeSelect.options).forEach((opt) => {
            const item = document.createElement('div');

            if (opt.selected) {
                item.className = 'dropdown-item selected';
            } else {
                item.className = 'dropdown-item';
            }

            item.textContent = opt.textContent;

            item.addEventListener('click', () => {
                nativeSelect.value = opt.value;
                if (selectedLabel) {
                    selectedLabel.textContent = opt.textContent;
                }

                menuList.querySelectorAll('.dropdown-item').forEach((i) => {
                    i.classList.remove('selected');
                });
                item.classList.add('selected');

                customDropdown.classList.remove('open');
            });

            menuList.appendChild(item);
        });
    }

    /* ==========================================================================
       File & Preview Handlers
       ========================================================================== */

    function renderPreviews() {
        previewContainer.innerHTML = '';
        if (selectedFiles.length === 0) {
            previewContainer.style.display = 'none';
            if (imageInput) {
                imageInput.value = '';
            }
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

    /* ==========================================================================
       Subject Loader
       ========================================================================== */

    async function loadSubjects() {
        if (!nativeSelect) return;

        try {
            const subjects = await api.listSubjects();
            nativeSelect.innerHTML = '<option value="">pick a subject here</option>';

            subjects.forEach((subject) => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                nativeSelect.appendChild(option);
            });

            const urlParams = new URLSearchParams(window.location.search);
            const targetSubjectId = urlParams.get('subject_id');
            if (targetSubjectId) {
                nativeSelect.value = targetSubjectId;
            }

            const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
            if (selectedOpt && selectedLabel) {
                selectedLabel.textContent = selectedOpt.textContent;
            }

            renderCustomDropdownOptions();
        } catch (err) {
            console.error('Error loading subjects:', err);
        }
    }

    /* ==========================================================================
       Formatting & Rendering Helpers
       ========================================================================== */

    function formatAiResponse(rawText) {
        if (!rawText) return "";

        let formatted = rawText
            .replace(/^Answer:\s*/i, '')
            .replace(/(^|\s)(\*\*[^*]+\*\*)/g, '\n\n### $2\n')
            .replace(/(:\s*)?\*\s+/g, '\n\n* ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return formatted;
    }

    function renderMarkdown(text) {
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        }
        return text;
    }

    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
        marked.use({
            breaks: true,
            gfm: true,
            renderer: {
                code(code, infostring) {
                    let lang = '';
                    if (infostring) {
                        const match = infostring.match(/\S*/);
                        if (match) {
                            lang = match[0];
                        }
                    }

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

    /* ==========================================================================
       Message Builder & Chat Handlers
       ========================================================================== */

    function appendMessage(text, sender, contextLabel = null, chunkContext = null, imageFiles = []) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;

        if (sender === 'bot') {
            const avatar = document.createElement('img');
            avatar.src = 'images/nari.png';
            avatar.alt = 'Lumina AI';
            avatar.className = 'bot-avatar';
            bubble.appendChild(avatar);
        }

        if (contextLabel && sender === 'user') {
            const badge = document.createElement('div');
            badge.style.fontSize = '0.75rem';
            badge.style.opacity = '0.8';
            badge.style.marginBottom = '4px';
            badge.style.textTransform = 'uppercase';
            badge.innerText = `[Context: ${contextLabel}]`;
            bubble.appendChild(badge);
        }

        if (imageFiles && imageFiles.length > 0) {
            const gallery = document.createElement('div');
            gallery.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;';

            imageFiles.forEach((file) => {
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
            const formattedText = formatAiResponse(text);
            content.innerHTML = renderMarkdown(formattedText);

            content.querySelectorAll('.copy-code-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const code = btn.nextElementSibling.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        btn.innerText = 'Copied!';
                        setTimeout(() => {
                            btn.innerText = 'Copy';
                        }, 2000);
                    });
                });
            });
        } else {
            content.innerText = text;
        }

        bubble.appendChild(content);

        // ATTACH RAG CONTEXT BUTTON AT THE VERY BOTTOM OF THE CHAT BUBBLE
        if (sender === 'bot' && chunkContext) {
            let formattedContext = '';
            if (Array.isArray(chunkContext)) {
                formattedContext = chunkContext.map((c, i) => `[Chunk ${i + 1}]:\n${c}`).join('\n\n');
            } else if (typeof chunkContext === 'object') {
                formattedContext = JSON.stringify(chunkContext, null, 2);
            } else {
                formattedContext = String(chunkContext);
            }

            // Outer wrapper forcing full-width placement below avatar & content flex alignment
            const contextFooter = document.createElement('div');
            contextFooter.style.cssText = `
                width: 100%;
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                justify-content: flex-start;
            `;

            const modalTriggerBtn = document.createElement('button');
            modalTriggerBtn.type = 'button';
            modalTriggerBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                font-size: 0.78rem;
                font-weight: 500;
                color: var(--accent-primary, #646cff);
                background: rgba(100, 108, 255, 0.12);
                border: 1px solid rgba(100, 108, 255, 0.25);
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            modalTriggerBtn.innerText = '🔍 View Retrieved RAG Context';

            modalTriggerBtn.addEventListener('click', () => {
                openRagModal(formattedContext);
            });

            contextFooter.appendChild(modalTriggerBtn);
            bubble.appendChild(contextFooter);
        }

        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return bubble;
    }

    function appendTypingIndicator() {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot';
        bubble.id = 'typing-indicator';
        bubble.innerHTML = `
        <img src="images/nari.jpg" alt="Lumina AI" class="bot-avatar">
        <div class="typing-dots">
            <span>•</span><span>•</span><span>•</span>
        </div>
        `;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function handleSend() {
        const query = chatInput.value.trim();
        if (!query && selectedFiles.length === 0) return;

        let selectedSubjectId = null;
        if (nativeSelect && nativeSelect.value) {
            selectedSubjectId = nativeSelect.value;
        }

        let selectedSubjectLabel = "Global Search";
        if (nativeSelect && nativeSelect.selectedIndex >= 0 && nativeSelect.options[nativeSelect.selectedIndex]) {
            selectedSubjectLabel = nativeSelect.options[nativeSelect.selectedIndex].text;
        }

        const filesToSend = [...selectedFiles];

        appendMessage(query, 'user', selectedSubjectLabel, null, filesToSend);

        chatInput.value = '';
        clearImageSelection();

        appendTypingIndicator();

        try {
            const res = await api.chatWithBot(query, selectedSubjectId, filesToSend);
            removeTypingIndicator();

            let botAnswer = "No response received.";
            if (res && res.answer) {
                botAnswer = res.answer;
            }

            let chunkContext = null;
            if (res && res.chunk_context) {
                chunkContext = res.chunk_context;
            }

            appendMessage(
                botAnswer,
                'bot',
                null,
                chunkContext
            );
        } catch (err) {
            removeTypingIndicator();

            appendMessage(
                `⚠️ ${err.message}`,
                'bot'
            );

            if (typeof toast !== 'undefined') {
                toast.show(err.message, "error");
            }
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });
    }
});