export class WaterSystem {
    constructor(grid) {
        this.grid = grid;
        this.riverCells = [];
        this.waterFlowCache = new Map();
    }

    reset() {
        this.riverCells = [];
        this.waterFlowCache.clear();
        // Очищаем воду с карты
        for (let y = 0; y < this.grid.size; y++) {
            for (let x = 0; x < this.grid.size; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && cell.type === 'water') {
                    this.grid.setCell(x, y, { type: 'empty', hasWater: false, isWaterSource: false });
                } else if (cell) {
                    cell.hasWater = false;
                }
            }
        }
    }

    generateRiver() {
        this.reset();

        const gridSize = this.grid.size;

        // Начало реки: середина левого края
        const startY = Math.floor(gridSize / 2);

        // Запускаем рекурсивную генерацию
        // x, y, angle (в радианах), width, depth
        this.drawBranch(0, startY, 0, 8, 0);

        this.updateWaterFlow();
    }

    drawBranch(x, y, angle, width, depth) {
        const gridSize = this.grid.size;

        // Если вышли за пределы или слишком глубоко - стоп
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize || depth > 20 || width < 1) {
            return;
        }

        // Длина сегмента: чем тоньше, тем короче
        // Толстые ветки длиннее
        const length = Math.floor(10 + width * 2 + Math.random() * 10);

        let currentX = x;
        let currentY = y;

        for (let i = 0; i < length; i++) {
            // Рисуем кистью текущей толщины
            this.paintBrush(currentX, currentY, width);

            // Двигаемся вперед
            currentX += Math.cos(angle);
            currentY += Math.sin(angle);

            // Небольшое виляние (шум)
            angle += (Math.random() - 0.5) * 0.1;

            // Тянем к правому краю, если угол слишком крутой
            if (angle > 1.5) angle -= 0.1;
            if (angle < -1.5) angle += 0.1;
        }

        // Ветвление
        // Если ширина позволяет, разделяемся
        if (width > 1.5) {
            const newWidth = width * 0.7; // Каждая следующая ветка тоньше
            const spread = 0.5 + Math.random() * 0.5; // Угол расхождения 30-60 градусов

            // Ветка вверх
            this.drawBranch(currentX, currentY, angle - spread, newWidth, depth + 1);

            // Ветка вниз
            this.drawBranch(currentX, currentY, angle + spread, newWidth, depth + 1);

            // Иногда продолжаем центр
            if (Math.random() > 0.4 && width > 4) {
                this.drawBranch(currentX, currentY, angle, newWidth, depth + 1);
            }
        }
    }

    paintBrush(x, y, radius) {
        const r = Math.ceil(radius / 2);
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    this.addWaterCell(intX + dx, intY + dy, true);
                }
            }
        }
    }

    addWaterCell(x, y, isSource) {
        if (x < 0 || x >= this.grid.size || y < 0 || y >= this.grid.size) return;

        const cell = this.grid.getCell(x, y);
        if (!cell) return;

        // Не перезаписываем другие типы клеток (хотя река должна быть мощнее растений)
        // Но при генерации растений еще нет
        if (cell.type === 'plant' || cell.type === 'seed') {
            return;
        }

        this.grid.setCell(x, y, {
            type: 'water',
            hasWater: true,
            isWaterSource: isSource
        });

        if (isSource) {
            this.riverCells.push({ x, y });
        }
    }

    updateWaterFlow() {
        // ОПТИМИЗАЦИЯ: Обновляем только кешированные данные или пересчитываем
        // В данном случае просто распространяем воду от русла
        for (const source of this.riverCells) {
            this.propagateWaterOptimized(source.x, source.y, 6);
        }
    }

    propagateWaterOptimized(x, y, radius) {
        // Простой квадратный радиус для производительности
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.abs(dx) + Math.abs(dy) > radius) continue;

                this.addWaterFlow(x + dx, y + dy);
            }
        }
    }

    addWaterFlow(x, y) {
        if (x < 0 || x >= this.grid.size || y < 0 || y >= this.grid.size) return;
        const cell = this.grid.getCell(x, y);
        if (cell && cell.type === 'empty') {
            cell.hasWater = true;
        }
    }

    update() {
        // Можно добавить динамику, но пока статика
        // this.updateWaterFlow(); // Вызываем из Engine редко
    }
}
