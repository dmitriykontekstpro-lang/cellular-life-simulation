export class WaterSystem {
    constructor(grid) {
        this.grid = grid;
        this.riverCells = [];
        this.waterFlowCache = new Map();
        this.riverTips = [];
    }

    reset() {
        this.riverCells = [];
        this.riverTips = [];
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
        console.log('%c 🌊 Generating Controlled Water System... ', 'color: #00aaff; font-weight: bold;');
        this.reset();

        const gridSize = this.grid.size;
        const startY = Math.floor(gridSize * 0.5);

        this.riverTips = [];
        this.splitsCount = 0; // Считаем количество разветвлений

        // 1. Сначала генерируем реку
        // Start width 6 to allow enough splitting potential for 7-11 tips
        this.drawBranch(0, startY, 0, 6, 0);

        // 2. Генерируем озера (с учетом оставшегося лимита воды)
        this.generateLakes();

        this.updateWaterFlow();
        console.log(`%c ✅ Water System Complete. River Ends: ${this.riverTips.length}. Splits: ${this.splitsCount}. Water Cells: ${this.riverCells.length} `, 'color: #00aaff;');
    }

    // ... generateLakes остается без изменений, логика addWaterCell ограничит их размер ...

    generateLakes() {
        const gridSize = this.grid.size;
        const numLakes = Math.floor(2 + Math.random() * 4); // 2 .. 5

        console.log(`%c 💧 Generating ${numLakes} Small Irregular Lakes...`, 'color: #0088cc;');

        // Кэшируем координаты реки для быстрой проверки
        // (Для оптимизации можно было бы использовать сетку, но простой перебор с шагом тоже сойдет или просто проверим 100 точек реки случайных)
        // Но лучше и надежнее: просто проверять каждую точку кандидата

        let lakesCreated = 0;
        let attempts = 0;

        while (lakesCreated < numLakes && attempts < 200) {
            attempts++;

            const startX = Math.floor(10 + Math.random() * (gridSize - 20));
            const startY = Math.floor(10 + Math.random() * (gridSize - 20));

            // Проверка дистанции до реки (минимум 50 клеток)
            if (!this.isFarFromRiver(startX, startY, 50)) {
                continue;
            }

            // Рисуем озеро неправильной формы (Random Walker с жирной кистью)
            const lakeSize = 10 + Math.random() * 20; // Примерная "длина" прохода кистью
            const brushSize = 3 + Math.random() * 3; // Толщина кисти (радиус около 3-6px, диаметр 6-12)

            let lx = startX;
            let ly = startY;

            // Рисуем кляксу
            for (let i = 0; i < lakeSize; i++) {
                this.paintBrush(lx, ly, brushSize * 2);

                // Сдвигаемся случайно
                lx += (Math.random() - 0.5) * 4;
                ly += (Math.random() - 0.5) * 4;

                // Проверка границ
                if (lx < 0 || lx >= gridSize || ly < 0 || ly >= gridSize) break;
            }

            lakesCreated++;
        }

        console.log(`%c 🌊 Created ${lakesCreated} lakes.`, 'color: #0088cc;');
    }

    isFarFromRiver(x, y, minDistance) {
        // Оптимизация: проверяем не каждый пиксель реки, а с шагом
        // А еще лучше: если река далеко, то grid.findNearestWater врнет null или что-то далекое
        // Но у нас есть список riverCells

        const minDistSq = minDistance * minDistance;

        // Проверяем каждую 10-ю клетку реки для скорости (так как река непрерывна)
        for (let i = 0; i < this.riverCells.length; i += 10) {
            const riverCell = this.riverCells[i];
            const dx = x - riverCell.x;
            const dy = y - riverCell.y;
            if (dx * dx + dy * dy < minDistSq) {
                return false;
            }
        }
        return true;
    }

    drawBranch(x, y, angle, width, depth) {
        const gridSize = this.grid.size;

        if (depth > 120) return; // Защита от бесконечности

        // Проверка границ
        if (x < -10 || x >= gridSize + 10 || y < -10 || y >= gridSize + 10) {
            this.registerTip(x, y);
            return;
        }

        // Если уперлись в лимит воды (проверяем косвенно: если новые клетки не добавляются, значит лимит)
        if (this.riverCells.length >= (gridSize * gridSize * 0.2)) {
            this.registerTip(x, y);
            return;
        }

        // Если слишком тонкая
        if (width < 0.6) {
            this.registerTip(x, y);
            return;
        }

        const segmentLength = Math.floor(15 + Math.random() * 30);
        let currentX = x;
        let currentY = y;
        let currentAngle = angle;

        for (let i = 0; i < segmentLength; i++) {
            this.paintBrush(currentX, currentY, width);

            currentAngle += Math.sin(i * 0.15 + depth) * 0.08 + (Math.random() - 0.5) * 0.05;
            // Мягкое ограничение угла
            if (currentAngle > 1.8) currentAngle -= 0.1;
            if (currentAngle < -1.8) currentAngle += 0.1;

            currentX += Math.cos(currentAngle);
            currentY += Math.sin(currentAngle);

            if (currentX >= gridSize || currentY < 0 || currentY >= gridSize) break;

            // Коллизии
            if (i > 8 && this.checkCollision(currentX + Math.cos(currentAngle) * 5, currentY + Math.sin(currentAngle) * 5)) {
                this.registerTip(currentX, currentY);
                return;
            }
        }

        // --- ВЕТВЛЕНИЕ (Controlled Splits for 7-11 tips) ---
        // 1 ветка изначально + X сплитов = 1 + X концов.
        // Цель: 7-11 концов, значит нужно 6-10 сплитов global.

        if (currentX < gridSize - 10 && width > 1.0) {
            let wantSplit = false;

            // Если сплитов еще мало (меньше 6) - очень хотим ветвиться
            if (this.splitsCount < 6) {
                // Если ширина позволяет, почти форсируем, иначе надеемся на удачу
                wantSplit = (width > 1.5) ? (Math.random() < 0.85) : (Math.random() < 0.5);
            }
            // Если уже в диапазоне (6-10), то умеренно
            else if (this.splitsCount < 10) {
                wantSplit = (Math.random() < 0.3); // 30% шанс
            }
            // Если перебор - не ветвимся
            else {
                wantSplit = false;
            }

            if (wantSplit) {
                this.splitsCount++;
                const newWidth = Math.max(0.5, width * 0.8);
                const spread = 0.4 + Math.random() * 0.4; // 25-45 градусов

                this.drawBranch(currentX, currentY, currentAngle - spread, newWidth, depth + 1);
                this.drawBranch(currentX, currentY, currentAngle + spread, newWidth, depth + 1);
            } else {
                // Просто продолжаем одну ветку, немного сужая
                this.drawBranch(currentX, currentY, currentAngle, Math.max(0.5, width - 0.2), depth + 1);
            }
        } else {
            this.registerTip(currentX, currentY);
        }
    }

    // ...

    registerTip(x, y) {
        // Округляем координаты
        this.riverTips.push({ x: Math.floor(x), y: Math.floor(y) });
    }

    // Проверка, есть ли вода (будущая коллизия)
    checkCollision(tx, ty) {
        if (tx < 0 || tx >= this.grid.size || ty < 0 || ty >= this.grid.size) return true;

        const cell = this.grid.getCell(Math.floor(tx), Math.floor(ty));
        // Если есть вода и это не "свежая" (только что нарисованная) - значит это другая ветка
        if (cell && cell.hasWater && !cell.isFreshlyPainted) {
            return true;
        }
        return false;
    }

    paintBrush(x, y, diameter) {
        const r = Math.ceil(diameter / 2);
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = intX + dx;
                    const ny = intY + dy;
                    this.addWaterCell(nx, ny, true);

                    const cell = this.grid.getCell(nx, ny);
                    if (cell) cell.isFreshlyPainted = true;
                }
            }
        }
    }

    addWaterCell(x, y, isSource) {
        if (x < 0 || x >= this.grid.size || y < 0 || y >= this.grid.size) return;

        // --- LIMIT CHECK ---
        const totalGridCells = this.grid.size * this.grid.size;
        // Лимит 20%
        if (this.riverCells.length >= totalGridCells * 0.20) {
            return; // Больше воды не даем
        }

        const cell = this.grid.getCell(x, y);
        if (!cell) return;
        if (cell.type === 'plant' || cell.type === 'seed') return; // Не заливаем растения

        // Если там уже вода - ничего не меняется для счетчика (мы считаем уникальные клетки в массиве? 
        // Нет, addWaterCell может вызываться для уже водной, но мы не должны дублировать в riverCells)

        if (!cell.hasWater) {
            // Новая клетка воды
            this.grid.setCell(x, y, {
                type: 'water',
                hasWater: true,
                isWaterSource: isSource
            });
            if (isSource) {
                this.riverCells.push({ x, y });
            }
        }
    }

    updateWaterFlow() {
        for (const source of this.riverCells) {
            this.propagateWaterOptimized(source.x, source.y, 6);
        }

        // Снимаем флаг свежести
        for (const pos of this.riverCells) {
            const cell = this.grid.getCell(pos.x, pos.y);
            if (cell) delete cell.isFreshlyPainted;
        }
    }

    propagateWaterOptimized(x, y, radius) {
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
        // Static river, no active update needed yet
    }

    getWaterCellCount() {
        return this.riverCells.length;
    }

    consumeWater(x, y) {
        return true;
    }
}
