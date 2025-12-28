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
        console.log('%c 🌊 Generating Long Thin River... ', 'color: #00aaff; font-weight: bold;');
        this.reset();

        const gridSize = this.grid.size;
        // Начинаем чуть выше середины, чтобы было место для дельты
        const startY = Math.floor(gridSize * 0.45);

        // Старт: x=0, y=startY, angle=0, width=3 (тонкая), depth=0
        this.drawBranch(0, startY, 0.1, 3, 0);

        this.updateWaterFlow();
        console.log(`%c ✅ River Generation Complete. Sources: ${this.riverCells.length} `, 'color: #00aaff;');
    }

    drawBranch(x, y, angle, width, depth) {
        const gridSize = this.grid.size;

        // Лимит глубины рекурсии, чтобы не зависло
        if (depth > 40) return;
        if (x >= gridSize || y < 0 || y >= gridSize) return;

        // ДЛИНА ВЕТКИ: от 30 до 100 клеток (как просил)
        // Чем дальше вглубь, тем короче могут быть ветки, но все равно длинные
        const segmentLength = Math.floor(30 + Math.random() * 70);

        let currentX = x;
        let currentY = y;
        let currentAngle = angle;

        for (let i = 0; i < segmentLength; i++) {
            // Рисуем
            // Если толщина < 1.5, рисуем просто точку (радиус 0.5 округлится до 1 клетки)
            // Если 3 - будет чуть жирнее
            this.paintBrush(currentX, currentY, width);

            // Движение:
            // Добавляем плавный шум Перлина-подобный (синусоида) для извилистости
            currentAngle += Math.sin(i * 0.1) * 0.05 + (Math.random() - 0.5) * 0.05;

            // Корректировка, чтобы не загибалась назад (держим направление вправо)
            if (currentAngle > 1.2) currentAngle -= 0.1;
            if (currentAngle < -1.2) currentAngle += 0.1;

            currentX += Math.cos(currentAngle);
            currentY += Math.sin(currentAngle);

            // Проверка границ
            if (currentX >= gridSize || currentY < 0 || currentY >= gridSize) break;

            // Проверка коллизий с ДРУГИМИ ветками (не с собой)
            // Пропуск 10 клеток, чтобы не детектить свой хвост
            if (i > 10 && this.checkCollision(currentX + Math.cos(currentAngle) * 3, currentY + Math.sin(currentAngle) * 3)) {
                // Если врезались - останавливаем ветку
                return;
            }
        }

        // ВЕТВЛЕНИЕ (только если не вышли за край)
        if (currentX < gridSize - 10) {
            // Вероятность ветвления зависит от толщины
            // Если толсто - почти всегда ветвимся
            // Если тонко - редко
            const branchChance = width > 1.5 ? 0.9 : 0.4;

            if (Math.random() < branchChance) {
                // Уменьшаем толщину очень медленно
                // 3 -> 2.5 -> 2 -> 1.5 -> 1
                const newWidth = Math.max(0.5, width - 0.6);

                // Угол разлета веток небольшой (веер вперед)
                const spread = 0.3 + Math.random() * 0.3; // 15-30 градусов

                // Основная ветка (продолжение)
                this.drawBranch(currentX, currentY, currentAngle - spread / 2, newWidth, depth + 1);

                // Вторая ветка
                this.drawBranch(currentX, currentY, currentAngle + spread / 2, newWidth, depth + 1);
            } else {
                // Если не ветвимся, просто продолжаем тонкой линией
                if (width > 0.8) {
                    this.drawBranch(currentX, currentY, currentAngle, Math.max(0.5, width - 0.3), depth + 1);
                }
            }
        }
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
