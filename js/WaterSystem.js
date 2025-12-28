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
        const startY = Math.floor(gridSize / 2);

        // Начало реки с толщиной 8
        this.drawBranch(0, startY, 0, 8);

        this.updateWaterFlow();
    }

    drawBranch(x, y, angle, width) {
        const gridSize = this.grid.size;

        // Прекращаем, если стали слишком тонкими (< 1 уже не рисуем)
        if (width < 1) return;

        // Длина сегмента зависит от толщины (чем тоньше, тем короче, чтобы быстрее ветвиться в конце)
        // Но делаем минимальную длину, чтобы ветки были видимыми
        const segmentLength = Math.max(15, Math.floor(width * 5 + Math.random() * 10));

        let currentX = x;
        let currentY = y;

        // Проверка перед началом отрисовки: не уперлись ли мы сразу в воду?
        // (Для корня x=0 это не проверяем)
        if (x > 5 && this.checkCollision(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5, width)) {
            return;
        }

        for (let i = 0; i < segmentLength; i++) {
            // Проверка коллизии вперед на несколько шагов
            // Если впереди вода (чужая), останавливаемся
            if (i % 5 === 0 && this.checkCollision(currentX + Math.cos(angle) * width, currentY + Math.sin(angle) * width, width)) {
                return;
            }

            this.paintBrush(currentX, currentY, width);

            currentX += Math.cos(angle);
            currentY += Math.sin(angle);

            // Очень слабое виляние, чтобы река шла более прямо и не врезалась сама в себя
            angle += (Math.random() - 0.5) * 0.05;

            if (currentX >= gridSize || currentY < 0 || currentY >= gridSize) return;
        }

        // ВЕТВЛЕНИЕ
        // Строго уменьшаем толщину
        // Если толщина была 8, станет 6 -> 4 -> 3 -> 2 -> 1
        let newWidth = width - 1;
        if (width > 6) newWidth = width - 2;
        if (width <= 2) newWidth = 1;

        // Если мы уже 1, то просто заканчиваемся или делаем еще один короткий штрих
        if (width === 1) {
            // Шанс продолжить тонкий ручеек, но не ветвиться
            if (Math.random() < 0.5) {
                this.drawBranch(currentX, currentY, angle, 0.5); // 0.5 округлится до 0 и выйдет
            }
            return;
        }

        // Создаем "Веер" веток
        // Гарантируем, что ветки расходятся в стороны
        const spreadAngle = 0.4 + Math.random() * 0.2; // ~20-35 градусов

        // Ветка 1 (Вверх)
        this.drawBranch(currentX, currentY, angle - spreadAngle, newWidth);

        // Ветка 2 (Вниз)
        this.drawBranch(currentX, currentY, angle + spreadAngle, newWidth);

        // Ветка 3 (Центр) - только для толстых рек
        if (width > 4) {
            this.drawBranch(currentX, currentY, angle, newWidth);
        }
    }

    // Проверка, есть ли вода в радиусе (исключая текущую позицию, это сложно без ID ветки)
    // Упрощенно: проверяем, свободно ли место
    checkCollision(tx, ty, radius) {
        if (tx < 0 || tx >= this.grid.size || ty < 0 || ty >= this.grid.size) return true;

        // Проверяем точку назначения. Если там уже есть вода (и это не мы только что нарисовали)
        // Поскольку мы рисуем последовательно, "старая" вода - это чужая вода или наш хвост (если петля)
        const cell = this.grid.getCell(Math.floor(tx), Math.floor(ty));
        if (cell && cell.hasWater && !cell.isFreshlyPainted) {
            return true;
        }
        return false;
    }

    paintBrush(x, y, radius) {
        const r = Math.ceil(radius / 2);
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = intX + dx;
                    const ny = intY + dy;
                    this.addWaterCell(nx, ny, true);

                    // Помечаем клетку как "свеженарисованную" для этого цикла генерации,
                    // чтобы детектор коллизий не срабатывал на только что нарисованный сегмент
                    const cell = this.grid.getCell(nx, ny);
                    if (cell) cell.isFreshlyPainted = true;
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
