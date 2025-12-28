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

        // Шанс на новую ветку если растение уже подросло
        if (this.size > 5 && Math.random() < 0.15) {
            this.startNewBranch(grid);
        }

        // Выбираем случайную активную ветку
        const activeBranches = this.branches.filter(b => b.active);
        if (activeBranches.length === 0) return false; // Нет активных веток -> не растем

        const branch = activeBranches[Math.floor(Math.random() * activeBranches.length)];
        const lastCell = branch.cells[branch.cells.length - 1];

        const cell = grid.getCell(lastCell.x, lastCell.y);

        // Проверка условий роста: энергия и вода
        const hasEnergy = cell && cell.energy > 0;

        // УВЕЛИЧЕН РАДИУС поиска воды до 12 клеток (корни длинные)
        const waterNearby = grid.findNearestWater(lastCell.x, lastCell.y, 12);

        // Если совсем нет ресурсов - просто ждем, НЕ УМИРАЕМ
        if (!hasEnergy && !waterNearby) {
            return false;
        }

        // Если не хватает только одного ресурса - тоже ждем
        if (!hasEnergy || !waterNearby) {
            return false;
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

            // Если ветка стала слишком длинной - она перестает расти, давая шанс другим
            if (branch.cells.length > 25) {
                branch.active = false;
            }

            return true;
        } else {
            // Если расти некуда - ветка "засыхает" и больше не активна
            branch.active = false;
        }

        return false;
    }

    startNewBranch(grid) {
        if (this.branches.length > 15) return; // Ограничение кол-ва веток

        // Ищем клетку для ветвления (желательно посередине)
        const startIdx = Math.floor(Math.random() * this.cells.length);
        const startCell = this.cells[startIdx];

        // Создаем новую ветку
        this.branches.push({
            cells: [startCell], // Начинаем от существующей клетки
            active: true
        });
    }

    findGrowthPosition(fromCell, grid) {
        // Направления роста (более хаотично для кустистости)
        const directions = [
            { dx: 0, dy: -1 }, // вверх
            { dx: -1, dy: -1 }, // влево-вверх
            { dx: 1, dy: -1 },  // вправо-вверх
            { dx: -1, dy: 0 },  // влево
            { dx: 1, dy: 0 },   // вправо
            { dx: -1, dy: 1 },  // влево-вниз (немного)
            { dx: 1, dy: 1 }    // вправо-вниз (немного)
        ];

        // Перемешиваем направления
        directions.sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nx = fromCell.x + dir.dx;
            const ny = fromCell.y + dir.dy;

            // Проверяем границы и пустоту
            if (nx >= 0 && nx < grid.size && ny >= 0 && ny < grid.size) {
                if (grid.isCellEmpty(nx, ny)) {
                    // Проверяем соседей чтобы не было слишком плотно (опционально)
                    // Но для кустистости можно разрешить плотность
                    return { x: nx, y: ny };
                }
            }
        }

        return null; // Некуда расти
    }

    // Старый метод tryBranch больше не нужен, но оставим заглушку если он где-то вызывается
    tryBranch(grid) { return false; }

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
