// PlantManager.js - Manages all plants in the simulation
import { Plant } from './Plant.js';

export class PlantManager {
    constructor(grid, config) {
        this.grid = grid;
        this.config = config;
        this.plants = [];
        this.seeds = [];
        this.ticksSinceLastReproduction = 0;
    }

    initialize(startCount) {
        this.plants = [];
        this.seeds = [];

        // Создаем начальные растения
        for (let i = 0; i < startCount; i++) {
            this.createRandomPlant();
        }
    }

    createRandomPlant() {
        const gridSize = this.grid.size;
        let attempts = 0;
        const maxAttempts = 200;

        // Сначала собираем все клетки с водой
        const waterCells = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && cell.hasWater) {
                    waterCells.push({ x, y });
                }
            }
        }

        // Если воды нет, создаем растение в случайном месте
        if (waterCells.length === 0) {
            const x = Math.floor(Math.random() * gridSize);
            const y = Math.floor(gridSize * 0.3 + Math.random() * gridSize * 0.5);

            if (this.grid.isCellEmpty(x, y) && this.grid.isAreaClear(x, y, 5)) {
                const plant = new Plant(x, y, this.config.plantMaxSize);
                this.plants.push(plant);

                this.grid.setCell(x, y, {
                    type: 'plant',
                    plantId: plant.id
                });

                return plant;
            }
            return null;
        }

        // Создаем растение рядом с водой
        while (attempts < maxAttempts) {
            // Выбираем случайную клетку воды
            const waterCell = waterCells[Math.floor(Math.random() * waterCells.length)];

            // Ищем свободное место рядом с водой (в радиусе 3 клеток)
            const searchRadius = 3;
            const dx = Math.floor(Math.random() * (searchRadius * 2 + 1)) - searchRadius;
            const dy = Math.floor(Math.random() * (searchRadius * 2 + 1)) - searchRadius;

            const x = waterCell.x + dx;
            const y = waterCell.y + dy;

            if (this.grid.isCellEmpty(x, y) && this.grid.isAreaClear(x, y, 5)) {
                const plant = new Plant(x, y, this.config.plantMaxSize);
                this.plants.push(plant);

                this.grid.setCell(x, y, {
                    type: 'plant',
                    plantId: plant.id
                });

                return plant;
            }
            attempts++;
        }

        return null;
    }

    update(energySystem, waterSystem) {
        // Обновляем все растения
        for (let i = this.plants.length - 1; i >= 0; i--) {
            const plant = this.plants[i];

            if (!plant.isAlive) {
                this.plants.splice(i, 1);
                continue;
            }

            // Проверка на достижение максимального размера ПЕРЕД ростом
            if (plant.size >= plant.maxSize) {
                console.log(`Plant ${plant.id} reached max size ${plant.maxSize}, generating seeds...`);
                const seeds = plant.generateSeeds(this.grid);
                this.seeds.push(...seeds);
                console.log(`Generated ${seeds.length} seeds from plant ${plant.id}`);
                plant.die(this.grid);
                this.plants.splice(i, 1);
                continue;
            }

            // Попытка роста (только если не достиг максимума)
            plant.tryGrow(this.grid, energySystem, waterSystem);
        }

        // Обработка семян (прорастание)
        this.ticksSinceLastReproduction++;
        const reproductionInterval = this.config.plantReproductionSpeed * 60; // Секунды в тики (60 тиков/сек)

        if (this.ticksSinceLastReproduction >= reproductionInterval) {
            this.ticksSinceLastReproduction = 0;
            this.germinateSeeds();
        }
    }

    germinateSeeds() {
        const offspringCount = this.config.plantOffspringCount;

        for (let i = this.seeds.length - 1; i >= 0; i--) {
            const seed = this.seeds[i];

            // Создаем потомство из семени
            for (let j = 0; j < offspringCount; j++) {
                this.createPlantNearSeed(seed);
            }

            // Удаляем семя
            this.grid.setCell(seed.x, seed.y, {
                type: 'empty',
                plantId: null
            });
            this.seeds.splice(i, 1);
        }
    }

    createPlantNearSeed(seed) {
        const searchRadius = 10;
        const candidates = [];

        // Ищем свободные места вокруг семени
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = seed.x + dx;
                const y = seed.y + dy;

                if (this.grid.isCellEmpty(x, y) && this.grid.isAreaClear(x, y, 5)) {
                    candidates.push({ x, y });
                }
            }
        }

        if (candidates.length > 0) {
            const pos = candidates[Math.floor(Math.random() * candidates.length)];
            const plant = new Plant(pos.x, pos.y, this.config.plantMaxSize);
            this.plants.push(plant);

            this.grid.setCell(pos.x, pos.y, {
                type: 'plant',
                plantId: plant.id
            });

            return plant;
        }

        return null;
    }

    getPlantCount() {
        return this.plants.length;
    }

    getSeedCount() {
        return this.seeds.length;
    }

    updateConfig(config) {
        this.config = config;
    }
}
