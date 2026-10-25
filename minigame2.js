(() => {
    const cells = [...document.querySelectorAll('[data-cell]')];
    const status = document.getElementById('gameStatus');
    const statusText = document.getElementById('statusText');
    const cardX = document.getElementById('cardX');
    const cardO = document.getElementById('cardO');
    const scoreTieElement = document.getElementById('scoreTie');
    const newRoundButton = document.getElementById('newRound');
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');

    const winningLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    let board = Array(9).fill('');
    let currentPlayer = 'X';
    let roundOver = false;
    const scores = { X: 0, O: 0, draws: 0 };
    let soundEnabled = true;
    let audioContext;

    function playTone(frequency, duration = 0.14) {
        if (!soundEnabled) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        audioContext ??= new AudioContextClass();
        if (audioContext.state === 'suspended') audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + duration);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    function updateTurn() {
        const isXTurn = currentPlayer === 'X';
        cardX.classList.toggle('active', isXTurn && !roundOver);
        cardO.classList.toggle('active', !isXTurn && !roundOver);
        status.classList.toggle('player-o-turn', !isXTurn && !roundOver);
        status.classList.toggle('finished', roundOver);
        if (!roundOver) statusText.textContent = `Player ${currentPlayer}'s turn`;
    }

    function finishRound(winner, line) {
        roundOver = true;
        cells.forEach((cell) => { cell.disabled = true; });

        if (winner) {
            scores[winner] += 1;
            document.getElementById(`score${winner}`).textContent = scores[winner];
            line.forEach((index) => cells[index].classList.add('winner'));
            statusText.textContent = `Player ${winner} wins!`;
            playTone(winner === 'X' ? 780 : 920, 0.28);
        } else {
            scores.draws += 1;
            scoreTieElement.textContent = scores.draws;
            statusText.textContent = "It's a draw!";
            playTone(340, 0.22);
        }
        updateTurn();
    }

    function handleMove(event) {
        const cell = event.currentTarget;
        const index = Number(cell.dataset.cell);
        if (roundOver || board[index]) return;

        board[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer === 'X' ? 'mark-x' : 'mark-o');
        cell.disabled = true;
        cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${currentPlayer}`);
        playTone(currentPlayer === 'X' ? 520 : 660);

        const winningLine = winningLines.find((line) => line.every((position) => board[position] === currentPlayer));
        if (winningLine) {
            finishRound(currentPlayer, winningLine);
        } else if (board.every(Boolean)) {
            finishRound(null, []);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateTurn();
        }
    }

    function startNewRound() {
        board = Array(9).fill('');
        currentPlayer = 'X';
        roundOver = false;
        cells.forEach((cell) => {
            cell.textContent = '';
            cell.disabled = false;
            cell.classList.remove('mark-x', 'mark-o', 'winner');
            const position = Number(cell.dataset.cell);
            cell.setAttribute('aria-label', `Row ${Math.floor(position / 3) + 1}, column ${(position % 3) + 1}`);
        });
        updateTurn();
        cells[0].focus();
    }

    cells.forEach((cell) => cell.addEventListener('click', handleMove));
    newRoundButton.addEventListener('click', startNewRound);
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.setAttribute('aria-pressed', String(soundEnabled));
        soundIcon.textContent = soundEnabled ? '♫' : '♪';
        soundToggle.lastChild.textContent = soundEnabled ? ' Sound on' : ' Sound off';
        if (soundEnabled) playTone(520);
    });

    updateTurn();
})();