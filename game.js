const BOARD_SIZE = 100;
const ROWS = 10;
const COLS = 10;

// Snake and Ladder positions
const snakes = {
    17: 4,
    54: 31,
    62: 42,
    87: 36,
    93: 73,
    99: 79
};

const ladders = {
    3: 22,
    5: 14,
    9: 31,
    20: 38,
    32: 61,
    51: 72,
    57: 96,
    71: 91
};

let gameState = {
    player1Pos: 1,
    player2Pos: 1,
    currentPlayer: 1,
    diceValue: 0,
    gameActive: true
};

function initializeBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // Create cells in reverse order for snake and ladder appearance
    for (let i = BOARD_SIZE; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = i;
        cell.id = `cell-${i}`;

        // Add snake class
        if (snakes[i]) {
            cell.classList.add('snake');
        }
        // Add ladder class
        if (ladders[i]) {
            cell.classList.add('ladder');
        }

        board.appendChild(cell);
    }

    updatePlayerPositions();
}

function updatePlayerPositions() {
    // Clear all players
    document.querySelectorAll('.player').forEach(p => p.remove());

    // Add player 1
    const cell1 = document.getElementById(`cell-${gameState.player1Pos}`);
    if (cell1) {
        const player1 = document.createElement('div');
        player1.className = 'player p1';
        player1.textContent = '1';
        cell1.appendChild(player1);
    }

    // Add player 2
    const cell2 = document.getElementById(`cell-${gameState.player2Pos}`);
    if (cell2) {
        const player2 = document.createElement('div');
        player2.className = 'player p2';
        player2.textContent = '2';
        cell2.appendChild(player2);
    }
}

function rollDice() {
    if (!gameState.gameActive) return;

    const diceElement = document.getElementById('dice');
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;
    diceElement.classList.add('disabled');

    // Animate dice roll
    let rolls = 0;
    const rollInterval = setInterval(() => {
        gameState.diceValue = Math.floor(Math.random() * 6) + 1;
        diceElement.textContent = gameState.diceValue;
        rolls++;

        if (rolls > 10) {
            clearInterval(rollInterval);
            movePlayer();
            rollBtn.disabled = false;
            diceElement.classList.remove('disabled');
        }
    }, 100);
}

function movePlayer() {
    const currentPos = gameState.currentPlayer === 1 ? gameState.player1Pos : gameState.player2Pos;
    let newPos = currentPos + gameState.diceValue;

    // Check bounds
    if (newPos > BOARD_SIZE) {
        updateMessage(`Player ${gameState.currentPlayer} rolled too high! Stay at ${currentPos}`);
        switchPlayer();
        return;
    }

    // Check for snake
    if (snakes[newPos]) {
        updateMessage(`Player ${gameState.currentPlayer} hit a snake! 🐍 ${newPos} → ${snakes[newPos]}`);
        newPos = snakes[newPos];
    }
    // Check for ladder
    else if (ladders[newPos]) {
        updateMessage(`Player ${gameState.currentPlayer} found a ladder! 🪜 ${newPos} → ${ladders[newPos]}`);
        newPos = ladders[newPos];
    } else {
        updateMessage(`Player ${gameState.currentPlayer} moved to ${newPos}`);
    }

    // Update position
    if (gameState.currentPlayer === 1) {
        gameState.player1Pos = newPos;
        document.getElementById('p1-pos').textContent = newPos;
        document.getElementById('p1-info').classList.add('active');
        document.getElementById('p2-info').classList.remove('active');
    } else {
        gameState.player2Pos = newPos;
        document.getElementById('p2-pos').textContent = newPos;
        document.getElementById('p2-info').classList.add('active');
        document.getElementById('p1-info').classList.remove('active');
    }

    updatePlayerPositions();

    // Check for winner
    if (newPos === BOARD_SIZE) {
        gameState.gameActive = false;
        const messageEl = document.getElementById('message');
        messageEl.classList.add('winner');
        messageEl.textContent = `🎉 Player ${gameState.currentPlayer} WINS! 🎉`;
        document.getElementById('rollBtn').disabled = true;

        // Redirect to vault after 2 seconds
        setTimeout(() => {
            window.location.href = 'vault.html';
        }, 2000);
        return;
    }

    switchPlayer();
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
}

function updateMessage(msg) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = msg;
}

// Initialize game on load
window.addEventListener('load', () => {
    initializeBoard();
    updateMessage('Game Started! Player 1\'s turn - Roll the dice!');
});