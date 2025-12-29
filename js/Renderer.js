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
            if (isDragging) {
                console.log('%c 🖱️ Pan End ', 'color: #aaa; font-size:10px;');
            }
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

            console.log(`%c 🔍 Zoom: ${this.zoom.toFixed(2)}x`, 'color: #00d9ff; font-size:10px;');

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
        // Оптимизация: используем ImageData для прямой записи пикселей
        const grid = this.grid;
        const size = grid.size;
        
        // Инициализируем буфер если нужно
        if (!this.imageData || this.imageData.width !== size) {
            this.imageData = this.ctx.createImageData(size, size);
            this.buf32 = new Uint32Array(this.imageData.data.buffer);
        }
        
        const buf = this.buf32;
        
        // Цвета в формате ABGR (little-endian)
        const COLOR_EMPTY = 0xFF000000;
        const COLOR_PLANT_LIGHT = 0xFF90EE90;
        const COLOR_PLANT_DARK = 0xFF006400;
        const COLOR_SEED = 0xFF00FFFF;
        const COLOR_WATER = 0xFFFFAA00;
        const COLOR_WATER_SOURCE = 0xFFDD8800;
        
        // Заполняем буфер
        for (let i = 0; i < size * size; i++) {
            const x = i % size;
            const y = Math.floor(i / size);
            const cell = grid.getCell(x, y);
            
            if (!cell || cell.type === 'empty') {
                buf[i] = COLOR_EMPTY;
            } else if (cell.type === 'plant') {
                // Проверяем энергию (оптимизировано - кэшируем plantManager)
                if (this.plantManager) {
                    const plant = this.plantManager.plants.find(p => p.id === cell.plantId);
                    buf[i] = (plant && plant.hasEnergySupply) ? COLOR_PLANT_DARK : COLOR_PLANT_LIGHT;
                } else {
                    buf[i] = COLOR_PLANT_LIGHT;
                }
            } else if (cell.type === 'seed') {
                buf[i] = COLOR_SEED;
            } else if (cell.type === 'water') {
                buf[i] = cell.isWaterSource ? COLOR_WATER_SOURCE : COLOR_WATER;
            } else {
                buf[i] = COLOR_EMPTY;
            }
        }
        
        // Рисуем буфер на временный канвас (размер = grid.size)
        if (!this.bufferCanvas) {
            this.bufferCanvas = document.createElement('canvas');
            this.bufferCtx = this.bufferCanvas.getContext('2d', { alpha: false });
        }
        
        this.bufferCanvas.width = size;
        this.bufferCanvas.height = size;
        this.bufferCtx.putImageData(this.imageData, 0, 0);
        
        // Очищаем основной канвас
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Масштабируем и рисуем (GPU делает всю работу!)
        const scaledWidth = size * this.cellSize;
        const scaledHeight = size * this.cellSize;
        
        this.ctx.drawImage(
            this.bufferCanvas,
            0, 0, size, size,
            this.offsetX, this.offsetY,
            scaledWidth, scaledHeight
        );
        
        // Рендерим лупу если нужно
        if (this.showMagnifier) {
            this.renderMagnifier();
        }
    }

    // Переключение отображения энергии
    toggleEnergyDisplay() {
        this.showEnergy = !this.showEnergy;
        this.render();
    }

    // --- Full Screen Logic ---
    toggleFullScreen() {
        this.isFullScreen = !this.isFullScreen;
        const container = document.getElementById('simulationContainer');
        const magnifier = document.getElementById('magnifier-container');
        const exitBtn = document.getElementById('exitFullscreenBtn');
        const statsOverlay = document.getElementById('statsOverlay');

        if (this.isFullScreen) {
            container.classList.add('fullscreen-mode');
            magnifier.style.display = 'flex'; // Показываем лупу
            exitBtn.style.display = 'block'; // Показываем кнопку выхода
            statsOverlay.style.display = 'block'; // Показываем статистику
            this.showMagnifier = true;

            // Инициализация канваса лупы, если еще нет
            if (!this.magnifierCtx) {
                const cvs = document.getElementById('magnifierCanvas');
                if (cvs) {
                    cvs.width = 250;
                    cvs.height = 250;
                    this.magnifierCtx = cvs.getContext('2d');
                    this.magnifierCtx.imageSmoothingEnabled = false; // Пиксельность
                }
            }
        } else {
            container.classList.remove('fullscreen-mode');
            magnifier.style.display = 'none'; // Скрываем
            exitBtn.style.display = 'none'; // Скрываем кнопку
            statsOverlay.style.display = 'none'; // Скрываем статистику
            this.showMagnifier = false;
        }

        this.resizeCanvas(); // Пересчитать размер под новое состояние
        this.render();
    }

    renderMagnifier() {
        if (!this.magnifierCtx || !this.showMagnifier) return;

        const ctx = this.magnifierCtx;
        const size = 50; // Размер окна (клеток)
        const halfSize = Math.floor(size / 2);

        // Центр - курсор мыши, или центр экрана если мышь не там
        let cx = this.hoverX !== undefined ? this.hoverX : -1;
        let cy = this.hoverY !== undefined ? this.hoverY : -1;

        if (cx < 0 || cy < 0) {
            // Если мышь не на канвасе, берем центр экрана
            const centerGridX = Math.floor((-this.offsetX + this.canvas.width / 2) / this.cellSize);
            const centerGridY = Math.floor((-this.offsetY + this.canvas.height / 2) / this.cellSize);
            cx = centerGridX;
            cy = centerGridY;
        }

        const startX = cx - halfSize;
        const startY = cy - halfSize;

        // Рисуем на канвасе 250x250
        // size=50 => cellSize = 5px   (250/50 = 5)
        const magCellSize = 250 / size; // 5px

        // Очистка
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 250, 250);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const gx = startX + dx;
                const gy = startY + dy;

                if (gx < 0 || gx >= this.grid.size || gy < 0 || gy >= this.grid.size) continue;

                const cell = this.grid.getCell(gx, gy);
                if (cell && cell.type !== 'empty') {
                    // Используем тот же метод цвета, что и в основном рендере
                    if (cell.type === 'plant') {
                        if (this.plantManager) {
                            const plant = this.plantManager.plants.find(p => p.id === cell.plantId);
                            ctx.fillStyle = (plant && plant.hasEnergySupply) ? '#006400' : '#90EE90';
                        } else {
                            ctx.fillStyle = this.colors.plant;
                        }
                    } else if (cell.type === 'seed') {
                        ctx.fillStyle = this.colors.seed;
                    } else if (cell.type === 'water') {
                        ctx.fillStyle = cell.isWaterSource ? this.colors.waterSource : this.colors.water;
                    }

                    ctx.fillRect(dx * magCellSize, dy * magCellSize, magCellSize, magCellSize);
                }

                // Рисуем рамку вокруг центральной клетки (курсор)
                if (gx === cx && gy === cy) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(dx * magCellSize, dy * magCellSize, magCellSize, magCellSize);
                }
            }
        }
    }
}
