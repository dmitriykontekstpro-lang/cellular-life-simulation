// WaterSystem.js - Manages water river and flow mechanics
export class WaterSystem {
    constructor(grid) {
        this.grid = grid;
        this.riverCells = [];
    }

    generateRiver() {
        this.riverCells = [];
        const gridSize = this.grid.size;

        // Начинаем с левого края на случайной высоте
        let x = 0;
        let y = Math.floor(gridSize * 0.3 + Math.random() * gridSize * 0.4);

        this.addWaterCell(x, y, true);

        // Идем к правому краю с ветвлением
        while (x < gridSize - 1) {
            // Основное направление - вправо
            const directions = [
                { dx: 1, dy: 0, weight: 5 },   // прямо вправо (приоритет)
                { dx: 1, dy: -1, weight: 2 },  // вправо-вверх
                { dx: 1, dy: 1, weight: 2 },   // вправо-вниз
                { dx: 0, dy: -1, weight: 1 },  // вверх
                { dx: 0, dy: 1, weight: 1 }    // вниз
            ];

            // Взвешенный случайный выбор направления
            const candidates = [];
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                    for (let i = 0; i < dir.weight; i++) {
                        candidates.push({ x: nx, y: ny });
                    }
                }
            }

            if (candidates.length === 0) break;

            const next = candidates[Math.floor(Math.random() * candidates.length)];
            x = next.x;
            y = next.y;

            this.addWaterCell(x, y, true);

            // Случайное ветвление (увеличена частота)
            if (Math.random() < 0.4) {
                this.createBranch(x, y, Math.floor(Math.random() * 10) + 5);
            }
        }

        // Инициализация потока воды
        this.updateWaterFlow();
    }

    createBranch(startX, startY, length) {
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
        for (const source of this.riverCells) {
            this.propagateWater(source.x, source.y, 20); // Радиус распространения увеличен в 10 раз
        }
    }

    propagateWater(x, y, radius) {
        const visited = new Set();
        const queue = [{ x, y, depth: 0 }];
        visited.add(`${x},${y}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.depth >= radius) continue;

            const neighbors = this.grid.getNeighbors(current.x, current.y);

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (visited.has(key)) continue;
                visited.add(key);

                const cell = this.grid.getCell(neighbor.x, neighbor.y);
                if (cell && cell.type === 'empty') {
                    cell.hasWater = true;
                    queue.push({ x: neighbor.x, y: neighbor.y, depth: current.depth + 1 });
                }
            }
        }
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
