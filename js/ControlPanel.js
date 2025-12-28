// ControlPanel.js - Handles simulation controls
export class ControlPanel {
    constructor(engine) {
        this.engine = engine;
        this.setupEventListeners();
        this.updateStatsDisplay();
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        // Start button
        startBtn.addEventListener('click', () => {
            this.engine.start();
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        });

        // Pause button
        pauseBtn.addEventListener('click', () => {
            this.engine.pause();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            this.engine.reset();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        });

        // Speed slider
        speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.engine.setSpeed(speed);
            speedValue.textContent = `${speed}x`;
        });

        // Listen for stats updates
        document.addEventListener('statsUpdate', (e) => {
            this.updateStatsDisplay(e.detail);
        });

        // Клавиатурные сокращения
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (this.engine.isRunning) {
                        pauseBtn.click();
                    } else {
                        startBtn.click();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        resetBtn.click();
                    }
                    break;
            }
        });
    }

    updateStatsDisplay(stats) {
        if (!stats) {
            stats = this.engine.getStats();
        }

        document.getElementById('plantCount').textContent = stats.plantCount;
        document.getElementById('seedCount').textContent = stats.seedCount;
        document.getElementById('waterCells').textContent = stats.waterCells;
        document.getElementById('tickCount').textContent = stats.tickCount.toLocaleString();
    }
}
