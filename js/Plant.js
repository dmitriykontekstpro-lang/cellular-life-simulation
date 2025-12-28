// Plant.js - Represents a single plant organism
export class Plant {
    static nextId = 0;

    constructor(x, y, maxSize) {
        this.id = Plant.nextId++;
        this.cells = [{ x, y }];  // Массив координат клеток растения
        this.maxSize = maxSize;
        this.isAlive = true;
        this.age = 0;
        this.branches = [{ cells: [{ x, y }], active: true }];  // Структура веток
        this.currentBranch = 0;  // Индекс активной ветки
    }

    get size() {
        return this.cells.length;
    }

    hasCell(x, y) {
        return this.cells.some(cell => cell.x === x && cell.y === y);
    }

    // Попытка вырасти
    tryGrow(grid, energySystem, waterSystem) {
        if (!this.isAlive) {
            return false;
        }

        this.age++;

        // Получаем активную ветку
        const branch = this.branches[this.currentBranch];
        if (!branch || !branch.active) {
            return false;
        }

        // Последняя клетка активной ветки
        const lastCell = branch.cells[branch.cells.length - 1];
        const cell = grid.getCell(lastCell.x, lastCell.y);

        // Проверка условий роста: энергия и вода
        const hasEnergy = cell && cell.energy > 0;
        const waterNearby = grid.findNearestWater(lastCell.x, lastCell.y, 1);

        if (!hasEnergy || !waterNearby) {
            // Условия не выполнены - растение уменьшается
            return this.shrink(grid);
        }

        // Условия выполнены - растем
        const newCell = this.findGrowthPosition(lastCell, grid);
        if (newCell) {
            // Потребляем воду
            waterSystem.consumeWater(waterNearby.x, waterNearby.y, grid);

            this.cells.push(newCell);
            branch.cells.push(newCell);

            grid.setCell(newCell.x, newCell.y, {
                type: 'plant',
                plantId: this.id
            });

            // Случайное ветвление
            if (branch.cells.length > 5 && Math.random() < 0.15) {
                this.tryBranch(grid);
            }

            return true;
        }

        return false;
    }

    // Поиск позиции для роста (преимущественно вверх)
    findGrowthPosition(fromCell, grid) {
        const { x, y } = fromCell;

        // Направления роста с весами (вверх имеет больший приоритет)
        const directions = [
            { dx: 0, dy: -1, weight: 5 },  // вверх (приоритет)
            { dx: -1, dy: -1, weight: 2 }, // вверх-лево
            { dx: 1, dy: -1, weight: 2 },  // вверх-право
            { dx: -1, dy: 0, weight: 1 },  // лево
            { dx: 1, dy: 0, weight: 1 }    // право
        ];

        // Взвешенный случайный выбор
        const candidates = [];
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            // Проверяем, что клетка пуста и соблюдается минимальное расстояние
            if (grid.isCellEmpty(nx, ny) && grid.isAreaClear(nx, ny, 5, this.id)) {
                for (let i = 0; i < dir.weight; i++) {
                    candidates.push({ x: nx, y: ny });
                }
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Попытка создать ветку
    tryBranch(grid) {
        // Максимум веток
        if (this.branches.length >= 10) {
            return false;
        }

        // Находим случайную клетку текущей ветки для ветвления
        const parentBranch = this.branches[this.currentBranch];
        if (parentBranch.cells.length < 3) {
            return false;
        }

        const randomIndex = Math.floor(Math.random() * parentBranch.cells.length);
        const branchPoint = parentBranch.cells[randomIndex];

        // Создаем новую ветку
        const newBranch = {
            cells: [branchPoint],
            active: true,
            maxLength: Math.min(20, this.maxSize - this.size)
        };

        this.branches.push(newBranch);

        // Переключаемся на новую ветку
        this.currentBranch = this.branches.length - 1;

        return true;
    }

    // Уменьшение растения
    shrink(grid) {
        if (this.cells.length <= 1) {
            this.die(grid);
            return false;
        }

        // Удаляем последнюю клетку активной ветки
        const branch = this.branches[this.currentBranch];
        if (branch && branch.cells.length > 1) {
            const removedCell = branch.cells.pop();
            const cellIndex = this.cells.findIndex(c => c.x === removedCell.x && c.y === removedCell.y);
            if (cellIndex !== -1) {
                this.cells.splice(cellIndex, 1);
            }

            grid.setCell(removedCell.x, removedCell.y, {
                type: 'empty',
                plantId: null
            });
        }

        // Если ветка опустела, деактивируем её и переключаемся на предыдущую
        if (branch && branch.cells.length <= 1) {
            branch.active = false;
            this.currentBranch = Math.max(0, this.currentBranch - 1);
        }

        return true;
    }

    // Смерть растения
    die(grid) {
        this.isAlive = false;

        // Удаляем все клетки
        for (const cell of this.cells) {
            grid.setCell(cell.x, cell.y, {
                type: 'empty',
                plantId: null
            });
        }
    }

    // Генерация семян при достижении максимального размера
    generateSeeds(grid) {
        if (this.size < this.maxSize) {
            return [];
        }

        const seeds = [];

        // Создаем семена на концах веток
        for (const branch of this.branches) {
            if (branch.cells.length > 0) {
                const tipCell = branch.cells[branch.cells.length - 1];

                // Семя только если клетка близка к верхней части
                if (tipCell.y < grid.size * 0.3) {
                    seeds.push({ x: tipCell.x, y: tipCell.y });
                    grid.setCell(tipCell.x, tipCell.y, {
                        type: 'seed',
                        plantId: null
                    });
                }
            }
        }

        return seeds;
    }
}
