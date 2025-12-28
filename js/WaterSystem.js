// WaterSystem.js - Manages water river and flow mechanics
export class WaterSystem {
    constructor(grid) {
        this.grid = grid;
        this.riverCells = [];
    }

    generateRiver() {
        this.riverCells = [];
        const gridSize = this.grid.size;

        // НОВАЯ ГЕНЕРАЦИЯ: Древовидная река с толстым стволом
        // Начинаем с толстого ствола слева
        const trunkStartY = Math.floor(gridSize * 0.4);
        const trunkThickness = 8; // Толщина ствола

        // Создаем толстый ствол слева
        for (let dy = -trunkThickness / 2; dy < trunkThickness / 2; dy++) {
            const y = trunkStartY + dy;
            if (y >= 0 && y < gridSize) {
                this.addWaterCell(0, y, true);
            }
        }

        // Рекурсивное ветвление от ствола
        this.createTreeBranch(0, trunkStartY, trunkThickness, 1, 0); // начинаем с направления вправо

        // Инициализация потока воды
        this.updateWaterFlow();
    }

    createTreeBranch(x, y, thickness, direction, depth) {
        const gridSize = this.grid.size;
        const maxDepth = 25; // Максимальная длина ветки

        // Прекращаем если достигли края или максимальной глубины
        if (x >= gridSize - 1 || depth >= maxDepth || thickness < 1) {
            return;
        }

        // Уменьшаем толщину с каждым уровнем ветвления
        const newThickness = Math.max(1, thickness - 0.5);

        // Движемся вправо
        const nextX = x + 1;
        const nextY = y + Math.floor((Math.random() - 0.5) * 2); // Небольшое отклонение по вертикали

        // Рисуем текущую секцию с учетом толщины
        const currentThickness = Math.ceil(thickness);
        for (let dy = -currentThickness / 2; dy < currentThickness / 2; dy++) {
            const cellY = nextY + dy;
            if (cellY >= 0 && cellY < gridSize && nextX >= 0 && nextX < gridSize) {
                this.addWaterCell(nextX, cellY, true);
            }
        }

        // Вероятность ветвления зависит от толщины
        const branchProbability = thickness > 2 ? 0.15 : 0.3;

        if (Math.random() < branchProbability && thickness > 1.5) {
            // Создаем две ветки
            const branch1Angle = Math.random() * 2 - 1; // от -1 до 1
            const branch2Angle = Math.random() * 2 - 1;

            this.createTreeBranch(
                nextX,
                nextY + Math.floor(branch1Angle * 3),
                newThickness,
                branch1Angle,
                0
            );

            this.createTreeBranch(
                nextX,
                nextY + Math.floor(branch2Angle * 3),
                newThickness,
                branch2Angle,
                0
            );
        } else {
            // Продолжаем текущую ветку
            this.createTreeBranch(nextX, nextY, newThickness, direction, depth + 1);
        }
    }

    createBranch(startX, startY, length) {
        // DEPRECATED: Используется createTreeBranch
        // Оставлено для обратной совместимости
        let x = startX;
        let y = startY;

        for (let i = 0; i < length; i++) {
            const directions = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
                { dx: 1, dy: 1 },
                { dx: 1, dy: -1 }
            ];

            const validDirs = directions.filter(dir => {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                return nx >= 0 && nx < this.grid.size &&
                    ny >= 0 && ny < this.grid.size &&
                    this.grid.isCellEmpty(nx, ny);
            });

            if (validDirs.length === 0) break;

            const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            x += dir.dx;
            y += dir.dy;

            this.addWaterCell(x, y, true);
        }
    }

    addWaterCell(x, y, isSource) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return;

        // Если клетка уже занята растением, не добавляем воду
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
        // Распространяем воду от источников (реки) к соседним клеткам
        // ОПТИМИЗАЦИЯ: Уменьшен радиус до 6 для производительности
        for (const source of this.riverCells) {
            this.propagateWaterOptimized(source.x, source.y, 6);
        }
    }

    propagateWater(x, y, radius) {
        // ОПТИМИЗАЦИЯ: Упрощенный алгоритм для производительности
        // Используем квадратный радиус вместо BFS
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                // Manhattan distance для более реалистичного распространения
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance > radius) continue;

                const nx = x + dx;
                const ny = y + dy;

                this.addWaterFlow(nx, ny);
            }
        }
    }

    propagateWaterOptimized(x, y, radius) {
        // Еще более оптимизированная версия
        this.propagateWater(x, y, radius);
    }

    addWaterFlow(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return false;

        // Не перезаписываем другие типы клеток
        if (cell.type !== 'empty' && cell.type !== 'water') {
            return false;
        }

        cell.hasWater = true;
        return true;
    }

    consumeWater(x, y, grid) {
        const cell = grid.getCell(x, y);
        if (!cell || !cell.hasWater) return;

        // Если это источник воды, он не истощается
        if (cell.isWaterSource) return;

        // Временно убираем воду
        cell.hasWater = false;

        // Вода восполняется из реки на следующем обновлении
    }

    update() {
        // Обновляем поток воды каждый тик
        this.updateWaterFlow();
    }

    getWaterCellCount() {
        return this.grid.getCellTypeCount('water') +
            this.grid.cells.filter(c => c.hasWater && c.type !== 'water').length;
    }

    reset() {
        // Удаляем всю воду
        for (let y = 0; y < this.grid.size; y++) {
            for (let x = 0; x < this.grid.size; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && (cell.type === 'water' || cell.hasWater)) {
                    this.grid.setCell(x, y, {
                        type: 'empty',
                        hasWater: false,
                        isWaterSource: false
                    });
                }
            }
        }

        this.riverCells = [];
    }
}
