// Sample flashcards data
const flashcardsData = [
    { front: "What is HTML?", back: "HyperText Markup Language" },
    { front: "What is CSS?", back: "Cascading Style Sheets" },
    { front: "What is JavaScript?", back: "A programming language for the web" },
    { front: "What is DOM?", back: "Document Object Model" },
    { front: "What is HTTP?", back: "HyperText Transfer Protocol" }
];

// DOM elements
const flashcardEl = document.getElementById('flashcard');
const flashcardFrontEl = document.querySelector('.flashcard-front');
const flashcardBackEl = document.querySelector('.flashcard-back');
const btnKnow = document.getElementById('btnKnow');
const btnDontKnow = document.getElementById('btnDontKnow');
const btnOkay = document.getElementById('btnOkay');
const currentCardEl = document.getElementById('currentCard');
const totalCardsEl = document.getElementById('totalCards');
const progressBarEl = document.querySelector('.progress-bar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const themeToggle = document.getElementById('themeToggle');
const resetBtn = document.getElementById('resetBtn');
const completionCardEl = document.getElementById('completionCard');
const btnRestart = document.getElementById('btnRestart');

// State
let currentCardIndex = 0;
let knownCards = {};
let inReviewMode = false;
let inReviewSession = false;

// LocalStorage keys
const THEME_STORAGE_KEY = 'flashcards-theme';
const KNOWN_CARDS_STORAGE_KEY = 'flashcards-known';

// Persistence - Load/Save known cards
function loadKnownCards() {
    try {
        const saved = localStorage.getItem(KNOWN_CARDS_STORAGE_KEY);
        if (saved) {
            knownCards = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading known cards from localStorage', e);
        knownCards = {};
    }
}

function saveKnownCards() {
    try {
        localStorage.setItem(KNOWN_CARDS_STORAGE_KEY, JSON.stringify(knownCards));
    } catch (e) {
        console.error('Error saving known cards to localStorage', e);
    }
}

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
}

// Update progress bar
function updateProgressBar() {
    const knownCardsCount = Object.keys(knownCards).length;
    const totalCards = flashcardsData.length;
    const progress = (knownCardsCount / totalCards) * 100;
    
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
        progressBarEl.style.width = `${progress}%`;
        
        // Add a celebration class if we're at 100%
        if (progress === 100 && knownCardsCount === totalCards) {
            progressBarEl.classList.add('completed');
            // Check if we should show completion view
            toggleCompletionView();
        } else {
            progressBarEl.classList.remove('completed');
            // Make sure we're not showing completion view when not all cards are known
            if (completionCardEl.style.display === 'flex') {
                toggleCompletionView();
            }
        }
    });
}

// Initialize
function init() {
    loadTheme();
    loadKnownCards();
    totalCardsEl.textContent = flashcardsData.length;
    loadCard(currentCardIndex);
    updateProgressBar();
    
    // Initialize view state
    toggleCompletionView();
}

// Load card content
function loadCard(index) {
    if (index < 0 || index >= flashcardsData.length) {
        console.error('Invalid card index:', index);
        return;
    }
    
    const card = flashcardsData[index];
    flashcardFrontEl.textContent = card.front;
    flashcardBackEl.textContent = card.back;
    currentCardEl.textContent = index + 1;
    
    // Reset flip state and review mode
    flashcardEl.classList.remove('flipped');
    inReviewMode = false;
    
    updateNavButtons();
    updateControlButtons();
    updateProgressInfo();
}

// Update navigation buttons state
function updateNavButtons() {
    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === flashcardsData.length - 1;
}

// Update control buttons visibility
function updateControlButtons() {
    if (inReviewMode) {
        btnKnow.style.display = 'none';
        btnDontKnow.style.display = 'none';
        btnOkay.style.display = 'block';
    } else {
        btnKnow.style.display = 'block';
        btnDontKnow.style.display = 'block';
        btnOkay.style.display = 'none';
    }
}

// Advance to the next card
function goToNextCard() {
    if (currentCardIndex < flashcardsData.length - 1) {
        // Show loading animation
        const card = document.querySelector('.flashcard-front');
        const originalContent = card.innerHTML;
        card.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        
        // Delay the actual transition slightly for visual effect
        setTimeout(() => {
            currentCardIndex++;
            loadCard(currentCardIndex);
        }, 300);
    }
}

// Set card as known
function markCardAsKnown(index) {
    knownCards[index] = true;
    saveKnownCards();
    updateProgressBar();
    updateProgressInfo();
}

// Set card as unknown
function markCardAsUnknown(index) {
    delete knownCards[index];
    saveKnownCards();
    updateProgressBar();
    updateProgressInfo();
}

// Event listeners
flashcardEl.addEventListener('click', () => {
    // Only allow manual flipping when not in review mode
    if (!inReviewMode) {
        flashcardEl.classList.toggle('flipped');
    }
});

btnKnow.addEventListener('click', () => {
    markCardAsKnown(currentCardIndex);
    
    if (currentCardIndex < flashcardsData.length - 1) {
        goToNextCard();
    } else {
        // If we're on the last card, update the counter directly
        updateCardCounter();
    }
});

btnDontKnow.addEventListener('click', () => {
    // Mark the current card as unknown
    markCardAsUnknown(currentCardIndex);
    
    // Flip the card and enter review mode
    flashcardEl.classList.add('flipped');
    inReviewMode = true;
    
    // Update control buttons visibility
    updateControlButtons();
    
    // Update counter display
    updateCardCounter();
});

btnOkay.addEventListener('click', () => {
    // After seeing the answer, mark the card as known
    markCardAsKnown(currentCardIndex);
    
    // Exit review mode
    inReviewMode = false;
    
    if (currentCardIndex < flashcardsData.length - 1) {
        goToNextCard();
    } else {
        // On the last card, just update buttons and counter
        updateControlButtons();
        updateCardCounter();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        loadCard(currentCardIndex);
        updateCardCounter();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentCardIndex < flashcardsData.length - 1) {
        currentCardIndex++;
        loadCard(currentCardIndex);
        updateCardCounter();
    }
});

themeToggle.addEventListener('click', toggleTheme);

resetBtn.addEventListener('click', () => {
    // Exit review session mode regardless of confirmation
    inReviewSession = false;
    
    // Remove review mode styling
    progressBarEl.classList.remove('review-mode');
    
    // Ask for confirmation before resetting progress
    if (Object.keys(knownCards).length > 0 && 
        confirm('Are you sure you want to reset your progress?')) {
        // Reset known cards
        knownCards = {};
        saveKnownCards();
        
        // Return to first card
        currentCardIndex = 0;
        loadCard(currentCardIndex);
        updateProgressBar();
        
        // Use updateProgressInfo instead of manually setting innerHTML
        updateProgressInfo();
    } else {
        // Just exit review mode without resetting
        updateProgressInfo();
        
        // Update progress bar to normal view
        updateProgressBar();
    }
});

// Add this function to check if all cards are known
function checkAllCardsKnown() {
    const knownCardsCount = Object.keys(knownCards).length;
    return knownCardsCount === flashcardsData.length;
}

// Add this function to toggle between flashcard and completion views
function toggleCompletionView() {
    if (checkAllCardsKnown() && !inReviewSession) {
        // Hide flashcard, show completion card
        document.getElementById('flashcardWrapper').style.display = 'none';
        completionCardEl.style.display = 'flex';
        
        // Hide regular controls
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.navigation').style.display = 'none';
    } else {
        // Show flashcard, hide completion card
        document.getElementById('flashcardWrapper').style.display = 'block';
        completionCardEl.style.display = 'none';
        
        // Show regular controls
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.navigation').style.display = 'flex';
    }
}

// Update the restart button handler to properly reset the progress bar
btnRestart.addEventListener('click', () => {
    // Ask for confirmation before resetting
    if (confirm('Start over? This will reset your progress.')) {
        // Exit review session mode
        inReviewSession = false;
        
        // Reset known cards
        knownCards = {};
        saveKnownCards();
        
        // Explicitly reset progress bar appearance
        progressBarEl.classList.remove('completed', 'review-mode');
        progressBarEl.style.width = '0%';
        
        // Return to first card
        currentCardIndex = 0;
        loadCard(currentCardIndex);
        
        // Use updateProgressInfo instead of manually setting innerHTML
        updateProgressInfo();
        
        // Switch back to flashcard view
        toggleCompletionView();
    }
});

// Modify CSS root to add RGB versions of colors for notifications
document.documentElement.style.setProperty('--border-color-1-rgb', '71, 118, 230'); // RGB for #4776E6

// Add this new function to ensure counter is always updated
function updateCardCounter() {
    // Update counter display
    currentCardEl.textContent = currentCardIndex + 1;
    updateProgressInfo();
}

// Add this function to update progress information in UI
function updateProgressInfo() {
    // Calculate progress stats
    const knownCardsCount = Object.keys(knownCards).length;
    const totalCards = flashcardsData.length;
    
    // Add progress info to counter
    const counterEl = document.querySelector('.counter');
    if (counterEl && !inReviewSession) {
        // Store previous known count to detect changes
        const prevCountEl = document.querySelector('.progress-count');
        const prevCount = prevCountEl ? parseInt(prevCountEl.textContent.match(/\d+/)[0]) : -1;
        
        counterEl.innerHTML = 
            `Card <span id="currentCard">${currentCardIndex + 1}</span> of <span id="totalCards">${totalCards}</span> ` +
            `<span class="progress-count">(${knownCardsCount} known)</span>`;
        
        // Add pulse animation if count changed
        if (prevCount !== -1 && prevCount !== knownCardsCount) {
            const newCountEl = document.querySelector('.progress-count');
            newCountEl.classList.add('updated');
            setTimeout(() => {
                newCountEl.classList.remove('updated');
            }, 500);
        }
    }
}

// Start the app
init();
