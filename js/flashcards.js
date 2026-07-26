import { api } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("flashcard-form");
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file");
    const fileLabel = document.getElementById("file-label");
    const submitBtn = document.getElementById("submit-btn");

    // Set Containers
    const resultsContainer = document.getElementById("results-container");
    const setsGrid = document.getElementById("sets-grid");
    const setCount = document.getElementById("set-count");

    // Modal elements
    const studyModal = document.getElementById("study-modal");
    const modalClose = document.getElementById("modal-close");
    const modalSetTitle = document.getElementById("modal-set-title");
    const modalProgress = document.getElementById("modal-progress");
    const modalCardWrapper = document.getElementById("modal-card-wrapper");
    const modalCardFrontText = document.getElementById("modal-card-front-text");
    const modalCardBackText = document.getElementById("modal-card-back-text");
    const prevCardBtn = document.getElementById("prev-card-btn");
    const nextCardBtn = document.getElementById("next-card-btn");

    // State
    let userSets = []; // Array of { title: string, flashcards: [{front, back}] }
    let currentCards = [];
    let currentCardIndex = 0;
    let activeSetTitle = "";

    // Load initial sets on page load
    loadUserFlashcards();

    async function loadUserFlashcards() {
        try {
            const data = await api.listFlashcards();
            userSets = data || [];
            renderSetsGrid();
        } catch (err) {
            console.error("Could not fetch user flashcards:", err);
        }
    }

    function renderSetsGrid() {
        setsGrid.innerHTML = "";

        if (userSets.length === 0) {
            resultsContainer.style.display = "none";
            return;
        }

        resultsContainer.style.display = "block";
        setCount.textContent = `${userSets.length} ${userSets.length === 1 ? 'Set' : 'Sets'} Total`;

        userSets.forEach((set, index) => {
            const setCardEl = document.createElement("div");
            setCardEl.className = "set-card";

            setCardEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: var(--space-md);">
                    <div class="set-card-icon">🎴</div>
                    <div>
                        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 2px;">${escapeHtml(set.title)}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-tertiary);">${set.flashcards ? set.flashcards.length : 0} Cards • Click to study</p>
                    </div>
                </div>
                <span class="btn btn-secondary" style="font-size: 0.85rem;">Study Now →</span>
            `;

            // Open study modal for this set
            setCardEl.addEventListener("click", () => {
                if (!set.flashcards || set.flashcards.length === 0) return;
                currentCards = set.flashcards;
                activeSetTitle = set.title;
                currentCardIndex = 0;
                openModal();
            });

            setsGrid.appendChild(setCardEl);
        });
    }

    // File selection UI feedback
    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileLabel.textContent = `📁 Selected: ${fileName}`;
            fileLabel.style.color = "var(--accent-primary, #646cff)";
            fileLabel.style.fontWeight = "600";

            if (typeof toast !== "undefined") {
                toast.show(`File attached: ${fileName}`, "info");
            }
        }
    });

    // Drag & Drop
    ["dragover", "dragenter"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event("change", { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });

    // Form submission
    form.addEventListener("submit", async(e) => {
        e.preventDefault();

        const title = document.getElementById("title").value.trim();
        const file = fileInput.files[0];

        if (!title || !file) {
            if (typeof toast !== "undefined") {
                toast.show("Please provide both a title and a document.", "error");
            }
            return;
        }

        if (typeof toast !== "undefined") {
            toast.show("Analyzing document & generating flashcards...", "info", 4000);
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Generating Flashcards...";

        try {
            const data = await api.generateFlashcards(title, file);

            const newCards = data.flashcards || [];
            const newTitle = (data.flashcard_set && data.flashcard_set.title) || title;

            // Prepend new set to local list and re-render grid
            userSets.unshift({ title: newTitle, flashcards: newCards });
            renderSetsGrid();

            // Reset form
            form.reset();
            fileLabel.textContent = "Drag & drop your PDF/text file here or click to browse";
            fileLabel.style.color = "var(--text-secondary)";
            fileLabel.style.fontWeight = "normal";

            if (typeof toast !== "undefined") {
                toast.show(`Created set "${newTitle}" with ${newCards.length} cards!`, "success");
            }
        } catch (err) {
            console.error(err);
            if (typeof toast !== "undefined") {
                toast.show(err.message || "Failed to generate flashcards.", "error");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Generate Flashcards ⚡";
        }
    });

    // Modal controls
    modalClose.addEventListener("click", closeModal);

    studyModal.addEventListener("click", (e) => {
        if (e.target === studyModal) closeModal();
    });

    modalCardWrapper.addEventListener("click", () => {
        modalCardWrapper.classList.toggle("flipped");
    });

    prevCardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateModalCard();
        }
    });

    nextCardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCardIndex < currentCards.length - 1) {
            currentCardIndex++;
            updateModalCard();
        }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (!studyModal.classList.contains("active")) return;

        if (e.key === "ArrowLeft" && currentCardIndex > 0) {
            currentCardIndex--;
            updateModalCard();
        } else if (e.key === "ArrowRight" && currentCardIndex < currentCards.length - 1) {
            currentCardIndex++;
            updateModalCard();
        } else if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            modalCardWrapper.classList.toggle("flipped");
        } else if (e.key === "Escape") {
            closeModal();
        }
    });

    function openModal() {
        modalSetTitle.textContent = activeSetTitle;
        updateModalCard();
        studyModal.classList.add("active");
    }

    function closeModal() {
        studyModal.classList.remove("active");
    }

    function updateModalCard() {
        modalCardWrapper.classList.remove("flipped");

        const card = currentCards[currentCardIndex];
        modalCardFrontText.textContent = card.front;
        modalCardBackText.textContent = card.back;

        modalProgress.textContent = `Card ${currentCardIndex + 1} of ${currentCards.length}`;

        prevCardBtn.disabled = currentCardIndex === 0;
        nextCardBtn.disabled = currentCardIndex === currentCards.length - 1;

        prevCardBtn.style.opacity = currentCardIndex === 0 ? "0.5" : "1";
        nextCardBtn.style.opacity = currentCardIndex === currentCards.length - 1 ? "0.5" : "1";
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});