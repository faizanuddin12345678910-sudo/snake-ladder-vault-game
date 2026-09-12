// Correct pattern sequence
const CORRECT_PATTERN = ['1', '2', '3'];

let selectedPattern = [];
let patternButtons = {};
let hasSubmitted = false;

function initializeVault() {
    const grid = document.getElementById('patternGrid');
    grid.innerHTML = '';

    // Create shuffled pattern buttons
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const shuffled = numbers.sort(() => Math.random() - 0.5);

    shuffled.forEach(num => {
        const button = document.createElement('button');
        button.className = 'pattern-button';
        button.textContent = num;
        button.onclick = () => selectPattern(num, button);
        patternButtons[num] = button;
        grid.appendChild(button);
    });
}

function selectPattern(num, button) {
    if (hasSubmitted) return;

    // Check if already selected
    if (selectedPattern.includes(num)) {
        // Remove from selection
        selectedPattern = selectedPattern.filter(n => n !== num);
        button.classList.remove('selected');
    } else {
        // Add to selection
        selectedPattern.push(num);
        button.classList.add('selected');
    }

    updatePatternDisplay();
}

function updatePatternDisplay() {
    const display = document.getElementById('selectedPattern');
    if (selectedPattern.length === 0) {
        display.textContent = 'No pattern selected';
    } else {
        display.textContent = `Selected: ${selectedPattern.join(' → ')}`;
    }
}

function submitPattern() {
    if (selectedPattern.length !== CORRECT_PATTERN.length) {
        document.getElementById('info').textContent = 'Please select all 3 numbers!';
        return;
    }

    hasSubmitted = true;
    const isCorrect = JSON.stringify(selectedPattern) === JSON.stringify(CORRECT_PATTERN);

    // Show results
    selectedPattern.forEach(num => {
        const button = patternButtons[num];
        if (isCorrect) {
            button.classList.add('correct');
            button.disabled = true;
        } else {
            button.classList.add('wrong');
            button.disabled = true;
        }
    });

    const infoEl = document.getElementById('info');
    if (isCorrect) {
        infoEl.textContent = '✅ Correct! Vault unlocked!';
        infoEl.style.color = '#27ae60';
        document.getElementById('submitBtn').textContent = 'Continue';
        document.getElementById('submitBtn').onclick = () => {
            window.location.href = 'fool.html';
        };
    } else {
        infoEl.textContent = '❌ Wrong pattern! Try again!';
        infoEl.style.color = '#e74c3c';
        hasSubmitted = false;
    }
}

function resetPattern() {
    selectedPattern = [];
    hasSubmitted = false;
    document.getElementById('info').textContent = 'Select the correct sequence';
    document.getElementById('info').style.color = '#ecf0f1';
    document.getElementById('submitBtn').textContent = 'Submit Pattern';
    document.getElementById('submitBtn').onclick = () => submitPattern();

    Object.values(patternButtons).forEach(button => {
        button.classList.remove('selected', 'correct', 'wrong');
        button.disabled = false;
    });

    updatePatternDisplay();
}

// Initialize on load
window.addEventListener('load', () => {
    initializeVault();
});