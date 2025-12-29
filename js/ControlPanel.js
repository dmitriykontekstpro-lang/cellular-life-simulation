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
            console.log('%c ▶️ Запуск симуляции ', 'background: #28a745; color: white; border-radius: 3px;');
            this.engine.start();
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        });

        // Pause button
        pauseBtn.addEventListener('click', () => {
            console.log('%c ⏸️ Пауза ', 'background: #ffc107; color: black; border-radius: 3px;');
            this.engine.pause();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            console.log('%c 🔄 Сброс симуляции ', 'background: #dc3545; color: white; border-radius: 3px;');
            this.engine.reset();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        });

        // Speed slider
        speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.engine.setSpeed(speed);
            speedValue.textContent = `${speed}x`;
            // Логируем не каждый сдвиг, а можно и каждый, если хочется видеть поток
            console.log(`%c ⏩ Скорость изменена: ${speed}x`, 'color: #17a2b8;');
        });

        // Full Screen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.engine.renderer.toggleFullScreen();
            });
        }

        // Exit Full Screen button
        const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
        if (exitFullscreenBtn) {
            exitFullscreenBtn.addEventListener('click', () => {
                this.engine.renderer.toggleFullScreen();
            });
        }

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

        // Вместо кол-ва растений показываем биомассу
        const displayValue = stats.totalBiomass !== undefined ? stats.totalBiomass : stats.plantCount;

        // Обновляем основную панель
        document.getElementById('plantCount').textContent = displayValue.toLocaleString();
        document.getElementById('seedCount').textContent = stats.seedCount;
        document.getElementById('waterCells').textContent = stats.waterCells;
        document.getElementById('tickCount').textContent = stats.tickCount.toLocaleString();

        // Обновляем overlay (fullscreen)
        const overlayPlant = document.getElementById('overlayPlantCount');
        const overlaySeed = document.getElementById('overlaySeedCount');
        const overlayWater = document.getElementById('overlayWaterCells');
        const overlayTick = document.getElementById('overlayTickCount');

        if (overlayPlant) overlayPlant.textContent = displayValue.toLocaleString();
        if (overlaySeed) overlaySeed.textContent = stats.seedCount;
        if (overlayWater) overlayWater.textContent = stats.waterCells;
        if (overlayTick) overlayTick.textContent = stats.tickCount.toLocaleString();
    }
}
