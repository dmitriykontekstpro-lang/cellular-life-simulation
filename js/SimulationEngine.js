// SimulationEngine.js - Main simulation engine
import { Grid } from './Grid.js';
import { Renderer } from './Renderer.js';
import { PlantManager } from './PlantManager.js';
import { EnergySystem } from './EnergySystem.js';
import { WaterSystem } from './WaterSystem.js';

export class SimulationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRunning = false;
        this.tickCount = 0;
        this.ticksPerSecond = 60;
        this.speed = 5;
        this.lastFrameTime = 0;

        // Конфигурация по умолчанию
        this.config = {
            gridSize: 200,
            plantStartCount: 5,
            plantReproductionSpeed: 10,
            plantOffspringCount: 2,
            plantMaxSize: 50
        };

        this.initialize();
    }

    initialize() {
        // Создаем основные системы
        this.grid = new Grid(this.config.gridSize);
        this.renderer = new Renderer(this.canvas, this.grid);
        this.energySystem = new EnergySystem(this.grid);
        this.waterSystem = new WaterSystem(this.grid);
        this.plantManager = new PlantManager(this.grid, this.config);

        // ВАЖНО: Сначала генерируем реку, потом растения!
        this.waterSystem.generateRiver();

        // Создаем начальные растения (теперь они появятся рядом с водой)
        this.plantManager.initialize(this.config.plantStartCount);

        // Первичная отрисовка
        this.renderer.render();
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    pause() {
        this.isRunning = false;
    }

    reset() {
        this.pause();
        this.tickCount = 0;

        // Очищаем сетку
        this.grid.clear();

        // Сбрасываем воду
        this.waterSystem.reset();

        // Генерируем новую реку
        this.waterSystem.generateRiver();

        // Создаем новые растения
        this.plantManager.initialize(this.config.plantStartCount);

        this.renderer.render();
        this.updateStats();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        // Обновляем симуляцию с учетом скорости
        const tickInterval = 1000 / this.ticksPerSecond;
        const ticksToProcess = Math.floor((deltaTime * this.speed) / tickInterval);

        for (let i = 0; i < ticksToProcess; i++) {
            this.tick();
        }

        if (ticksToProcess > 0) {
            this.lastFrameTime = currentTime;
            this.renderer.render();
            this.updateStats();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    tick() {
        this.tickCount++;

        // Обновляем энергию
        this.energySystem.update();

        // ОПТИМИЗАЦИЯ: Обновляем воду только каждые 10 тиков
        if (this.tickCount % 10 === 0) {
            this.waterSystem.update();
        }

        // Обновляем растения
        this.plantManager.update(this.energySystem, this.waterSystem);
    }

    setSpeed(speed) {
        this.speed = Math.max(1, Math.min(10, speed));
    }

    applySettings(settings) {
        this.config = { ...this.config, ...settings };

        // Если изменился размер сетки, пересоздаем
        if (settings.gridSize && settings.gridSize !== this.grid.size) {
            this.grid.resize(settings.gridSize);
            this.renderer.updateCellSize();
        }

        // Обновляем конфигурацию менеджера растений
        this.plantManager.updateConfig(this.config);
    }

    updateStats() {
        // Считаем общую биомассу
        let totalBiomass = 0;
        for (const plant of this.plantManager.plants) {
            totalBiomass += plant.cells.length;
        }

        const stats = {
            plantCount: this.plantManager.getPlantCount(),
            totalBiomass: totalBiomass,
            seedCount: this.plantManager.getSeedCount(),
            waterCells: this.waterSystem.riverCells.length,
            tickCount: this.tickCount
        };

        // Отправляем событие для обновления UI
        const event = new CustomEvent('statsUpdate', { detail: stats });
        document.dispatchEvent(event);
    }

    getStats() {
        return {
            plantCount: this.plantManager.getPlantCount(),
            seedCount: this.plantManager.getSeedCount(),
            waterCells: this.waterSystem.getWaterCellCount(),
            tickCount: this.tickCount,
            isRunning: this.isRunning
        };
    }
}
