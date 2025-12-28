// Grid.js - Manages the simulation grid state
export class Grid {
    constructor(size) {
        this.size = size;
        this.cells = new Array(size * size);
        this.clear();
    }

    clear() {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = {
                type: 'empty',        // 'empty', 'plant', 'seed', 'water'
                plantId: null,        // ID растения, которому принадлежит клетка
                energy: 0,            // Энергия в клетке
                hasWater: false,      // Есть ли вода
                isWaterSource: false  // Является ли источником воды (река)
            };
        }
    }

    resize(newSize) {
        const oldSize = this.size;
        const oldCells = this.cells;
        
        this.size = newSize;
        this.cells = new Array(newSize * newSize);
        this.clear();
        
        // Копируем старые данные если возможно
        const copySize = Math.min(oldSize, newSize);
        for (let y = 0; y < copySize; y++) {
            for (let x = 0; x < copySize; x++) {
                const oldIndex = y * oldSize + x;
                const newIndex = y * newSize + x;
                this.cells[newIndex] = oldCells[oldIndex];
            }
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return null;
        }
        return this.cells[y * this.size + x];
    }

    setCell(x, y, data) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return false;
        }
        this.cells[y * this.size + x] = { ...this.cells[y * this.size + x], ...data };
        return true;
    }

    isCellEmpty(x, y) {
        const cell = this.getCell(x, y);
        return cell && cell.type === 'empty';
    }

    // Проверяет, свободна ли область вокруг точки (для проверки минимального расстояния)
    isAreaClear(x, y, radius, excludePlantId = null) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const cell = this.getCell(x + dx, y + dy);
                if (cell && (cell.type === 'plant' || cell.type === 'seed')) {
                    // Если это часть того же растения, игнорируем
                    if (excludePlantId !== null && cell.plantId === excludePlantId) {
                        continue;
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Находит ближайшую воду
    findNearestWater(x, y, maxRadius = 2) {
        for (let r = 1; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const cell = this.getCell(x + dx, y + dy);
                    if (cell && cell.hasWater) {
                        return { x: x + dx, y: y + dy };
                    }
                }
            }
        }
        return null;
    }

    // Получает соседей клетки
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // вверх
            { dx: 1, dy: 0 },  // право
            { dx: 0, dy: 1 },  // вниз
            { dx: -1, dy: 0 }  // лево
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const cell = this.getCell(nx, ny);
            if (cell) {
                neighbors.push({ x: nx, y: ny, cell });
            }
        }

        return neighbors;
    }

    // Подсчет статистики
    getCellTypeCount(type) {
        return this.cells.filter(cell => cell.type === type).length;
    }
}
