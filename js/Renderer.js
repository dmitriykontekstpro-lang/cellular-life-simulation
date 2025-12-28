// Renderer.js - Handles canvas rendering
export class Renderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.grid = grid;
        this.ctx = canvas.getContext('2d');

        this.cellSize = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;

        // Цвета
        this.colors = {
            empty: '#000000',
            plant: '#00ff88',
            seed: '#ffff00',      // Ярко-желтый для семян
            water: '#00aaff',
            waterSource: '#0088dd'
        };

        this.resizeCanvas();
        this.setupInteraction();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.updateCellSize();
    }

    updateCellSize() {
        const gridSize = this.grid.size;
        const canvasSize = Math.min(this.canvas.width, this.canvas.height);
        this.cellSize = Math.max(1, Math.floor(canvasSize / gridSize));

        // Центрируем сетку
        this.offsetX = (this.canvas.width - gridSize * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - gridSize * this.cellSize) / 2;
    }

    setupInteraction() {
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                this.offsetX += dx;
                this.offsetY += dy;
                lastX = e.clientX;
                lastY = e.clientY;
                this.render();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Масштабирование колесом мыши
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            this.zoom *= zoomFactor;
            this.zoom = Math.max(0.5, Math.min(5, this.zoom));
            this.updateCellSize();
            this.render();
        });

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });
    }

    render() {
        const ctx = this.ctx;
        const grid = this.grid;

        // Очистка канваса
        ctx.fillStyle = this.colors.empty;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Отрисовка сетки
        const startX = Math.max(0, Math.floor(-this.offsetX / this.cellSize));
        const startY = Math.max(0, Math.floor(-this.offsetY / this.cellSize));
        const endX = Math.min(grid.size, Math.ceil((this.canvas.width - this.offsetX) / this.cellSize));
        const endY = Math.min(grid.size, Math.ceil((this.canvas.height - this.offsetY) / this.cellSize));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const cell = grid.getCell(x, y);
                if (!cell || cell.type === 'empty') continue;

                const screenX = this.offsetX + x * this.cellSize;
                const screenY = this.offsetY + y * this.cellSize;

                // Выбор цвета
                let color = this.colors.empty;
                if (cell.type === 'plant') {
                    color = this.colors.plant;
                } else if (cell.type === 'seed') {
                    color = this.colors.seed;
                } else if (cell.type === 'water') {
                    color = cell.isWaterSource ? this.colors.waterSource : this.colors.water;
                }

                ctx.fillStyle = color;
                ctx.fillRect(
                    Math.floor(screenX),
                    Math.floor(screenY),
                    Math.ceil(this.cellSize),
                    Math.ceil(this.cellSize)
                );
            }
        }

        // Отрисовка энергии (опционально, для отладки)
        if (this.showEnergy && this.cellSize > 3) {
            ctx.globalAlpha = 0.3;
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const cell = grid.getCell(x, y);
                    if (cell && cell.energy > 0) {
                        const screenX = this.offsetX + x * this.cellSize;
                        const screenY = this.offsetY + y * this.cellSize;
                        ctx.fillStyle = `rgba(255, 255, 0, ${cell.energy})`;
                        ctx.fillRect(
                            Math.floor(screenX),
                            Math.floor(screenY),
                            Math.ceil(this.cellSize),
                            Math.ceil(this.cellSize)
                        );
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }
    }

    // Переключение отображения энергии
    toggleEnergyDisplay() {
        this.showEnergy = !this.showEnergy;
        this.render();
    }
}
