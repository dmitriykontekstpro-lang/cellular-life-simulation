// EnergySystem.js - Manages energy (sunlight) distribution
export class EnergySystem {
    constructor(grid) {
        this.grid = grid;
    }

    update() {
        const gridSize = this.grid.size;

        // Сбрасываем энергию
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell) {
                    cell.energy = 0;
                }
            }
        }

        // Распределяем энергию сверху вниз
        for (let x = 0; x < gridSize; x++) {
            let blocked = false;

            for (let y = 0; y < gridSize; y++) {
                const cell = this.grid.getCell(x, y);
                if (!cell) continue;

                if (!blocked) {
                    // Свет доходит до этой клетки
                    cell.energy = 1;

                    // ТОЛЬКО растения блокируют свет для клеток ниже (вода НЕ блокирует!)
                    if (cell.type === 'plant') {
                        blocked = true;
                    }
                } else {
                    // Свет заблокирован растением выше
                    cell.energy = 0;
                }
            }
        }
    }

    // Проверка, получает ли клетка энергию
    hasEnergy(x, y) {
        const cell = this.grid.getCell(x, y);
        return cell && cell.energy > 0;
    }

    // Получение общей энергии в системе (для статистики)
    getTotalEnergy() {
        let total = 0;
        const gridSize = this.grid.size;

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell) {
                    total += cell.energy;
                }
            }
        }

        return total;
    }
}
