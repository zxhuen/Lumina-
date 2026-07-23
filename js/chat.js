document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const subjectSelect = document.getElementById('chat-subject-select');

    if (!chatInput) return;

    function appendMessage(text, sender, contextLabel = null) {
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

        const content = document.createElement('div');
        content.innerText = text;
        bubble.appendChild(content);

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
        if (!query) return;

        // Get selected subject UUID and label
        const selectedSubjectId = subjectSelect.value || null;
        const selectedSubjectLabel = subjectSelect.options[subjectSelect.selectedIndex].text;

        appendMessage(query, 'user', selectedSubjectLabel);
        chatInput.value = '';

        appendTypingIndicator();

        try {
            // Pass the selected subject UUID to FastAPI backend
            const res = await api.chatWithBot(query, selectedSubjectId);
            removeTypingIndicator();
            appendMessage(res.answer || "No response received.", 'bot');
        } catch (err) {
            removeTypingIndicator();
            appendMessage("Sorry, I'm having trouble connecting to the server. Please check your FastAPI backend status.", 'bot');
        }
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});