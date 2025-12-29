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
        this.hasEnergySupply = false;
    }

    get size() {
        return this.cells.length;
    }

    hasCell(x, y) {
        return this.cells.some(cell => cell.x === x && cell.y === y);
    }

    // Попытка вырасти
    tryGrow(grid, energySystem, waterSystem) {
        if (!this.isAlive) return false;

        this.age++;

        // Шанс на новую ветку
        if (this.size > 5 && Math.random() < 0.15) {
            this.startNewBranch(grid);
        }

        const activeBranches = this.branches.filter(b => b.active);
        if (activeBranches.length === 0) return false;

        const branch = activeBranches[Math.floor(Math.random() * activeBranches.length)];
        const lastCell = branch.cells[branch.cells.length - 1];
        const cell = grid.getCell(lastCell.x, lastCell.y);

        // -- ЛОГИКА ЭНЕРГИИ --
        // Проверяем энергию в ТОЧКЕ РОСТА
        const hasEnergy = cell && cell.energy > 0;
        this.hasEnergySupply = hasEnergy; // Обновляем статус для цвета и размножения

        // -- ПОИСК ВОДЫ --
        // Радиус 12
        const waterNearby = grid.findNearestWater(lastCell.x, lastCell.y, 12);

        // -- ОСЛАБЛЕННОЕ УСЛОВИЕ --
        // Главное - вода. Энергия желательна, но не критична для самого роста.
        // Если нет воды - не растем.
        if (!waterNearby) {
            return false;
        }

        // Раньше тут был return false если нет энергии. Теперь разрешаем.

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

            // Ограничение длины ветки снято
            // if (branch.cells.length > 25) {
            //    branch.active = false;
            // }

            return true;
        } else {
            // Если расти некуда - ветка "засыхает" и больше не активна
            branch.active = false;
        }

        return false;
    }

    // Попытка размножения ПРИ ЖИЗНИ (после 20 сек = 1200 тиков)
    tryReproduce(grid) {
        // Условия: возраст > 1200 (20 сек при 60 fps) И есть энергия
        if (this.age > 1200 && this.hasEnergySupply) {
            // Шанс размножения не каждый тик, а редко (напр. раз в 500 тиков ~ 8 сек)
            if (Math.random() < 0.002) {
                return this.generateSeeds(grid, 1); // Одно семечко
            }
        }
        return [];
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

            // 1. Проверка границ и пустоты
            if (nx >= 0 && nx < grid.size && ny >= 0 && ny < grid.size) {
                if (grid.isCellEmpty(nx, ny)) {

                    // 2. ДИСТАНЦИЯ ДО ЧУЖИХ (7 клеток)
                    if (this.hasNeighborPlant(grid, nx, ny, 7, true)) {
                        continue;
                    }

                    // 3. ДИСТАНЦИЯ ДО СВОИХ (2 клетки, чтобы не слипались ветки)
                    if (this.countOwnCellsAround(grid, nx, ny, 2) > 2) {
                        continue;
                    }

                    return { x: nx, y: ny };
                }
            }
        }

        return null; // Некуда расти
    }

    // Хелпер: есть ли рядом растения (excludeSelfId = true -> только чужие)
    hasNeighborPlant(grid, cx, cy, radius, excludeSelf = false) {
        const r = radius;
        const startX = Math.max(0, cx - r);
        const endX = Math.min(grid.size - 1, cx + r);
        const startY = Math.max(0, cy - r);
        const endY = Math.min(grid.size - 1, cy + r);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // Оптимизация круга (L2 distance), или просто квадрат? Квадрат проще и строже.
                // Пусть будет квадрат для надежности "не менее 7 клеток".

                const cell = grid.getCell(x, y);
                if (cell && cell.type === 'plant') {
                    if (excludeSelf && cell.plantId === this.id) continue;
                    return true;
                }
            }
        }
        return false;
    }

    countOwnCellsAround(grid, cx, cy, radius) {
        let count = 0;
        const r = radius;
        const startX = Math.max(0, cx - r);
        const endX = Math.min(grid.size - 1, cx + r);
        const startY = Math.max(0, cy - r);
        const endY = Math.min(grid.size - 1, cy + r);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x === cx && y === cy) continue;
                const cell = grid.getCell(x, y);
                if (cell && cell.type === 'plant' && cell.plantId === this.id) {
                    count++;
                }
            }
        }
        return count;
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
    generateSeeds(grid, count = 2) {
        if (this.size < this.maxSize) {
            return [];
        }

        const seeds = [];
        let attempts = 0;
        const maxAttempts = count * 5; // Лимит попыток

        // Собираем все кончики веток как кандидатов
        const candidates = [];
        for (const branch of this.branches) {
            if (branch.cells.length > 0) {
                candidates.push(branch.cells[branch.cells.length - 1]);
            }
        }

        // Если кандидатов мало, добавим просто случайные клетки растения
        if (candidates.length < count) {
            candidates.push(...this.cells);
        }

        while (seeds.length < count && attempts < maxAttempts) {
            attempts++;
            // Берем случайного кандидата
            const sourceCell = candidates[Math.floor(Math.random() * candidates.length)];

            // Пытаемся уронить семя рядом
            const dx = Math.floor(Math.random() * 5) - 2; // -2..2
            const dy = Math.floor(Math.random() * 5) - 2;

            const sx = sourceCell.x + dx;
            const sy = sourceCell.y + dy;

            if (sx >= 0 && sx < grid.size && sy >= 0 && sy < grid.size) {
                // Если место свободно (или даже занято нами же, но для семени можно перезаписать, если умираем)
                // Но лучше искать пустое
                if (grid.isCellEmpty(sx, sy)) {
                    seeds.push({ x: sx, y: sy });
                    grid.setCell(sx, sy, {
                        type: 'seed',
                        plantId: null
                    });
                }
            }
        }

        return seeds;
    }
}
