// SettingsPanel.js - Handles settings UI
export class SettingsPanel {
    constructor(engine) {
        this.engine = engine;
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        const applyBtn = document.getElementById('applySettings');

        applyBtn.addEventListener('click', () => {
            this.applySettings();
        });

        // Enter key на полях ввода
        const inputs = document.querySelectorAll('.settings-panel input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applySettings();
                }
            });
        });
    }

    loadSettings() {
        const settings = this.engine.config;

        document.getElementById('gridSize').value = settings.gridSize;
        document.getElementById('plantStartCount').value = settings.plantStartCount;
        document.getElementById('plantReproductionSpeed').value = settings.plantReproductionSpeed;
        document.getElementById('plantOffspringCount').value = settings.plantOffspringCount;
        document.getElementById('plantMaxSize').value = settings.plantMaxSize;
    }

    applySettings() {
        const settings = {
            gridSize: parseInt(document.getElementById('gridSize').value),
            plantStartCount: parseInt(document.getElementById('plantStartCount').value),
            plantReproductionSpeed: parseInt(document.getElementById('plantReproductionSpeed').value),
            plantOffspringCount: parseInt(document.getElementById('plantOffspringCount').value),
            plantMaxSize: parseInt(document.getElementById('plantMaxSize').value)
        };

        // Валидация
        if (!this.validateSettings(settings)) {
            console.warn('⚠️ Попытка применить некорректные настройки');
            alert('Проверьте правильность введенных значений!');
            return;
        }

        console.log('%c ⚙️ Применены новые настройки: ', 'color: #ff00ff; font-weight: bold;', settings);

        this.engine.applySettings(settings);

        // Показываем уведомление
        this.showNotification('Настройки применены! Нажмите "Сброс" для полного обновления.');
    }

    validateSettings(settings) {
        if (settings.gridSize < 50 || settings.gridSize > 2000) {
            console.warn('Invalid gridSize', settings.gridSize);
            return false;
        }
        if (settings.plantStartCount < 1 || settings.plantStartCount > 500) {
            console.warn('Invalid plantStartCount', settings.plantStartCount);
            return false;
        }
        if (settings.plantReproductionSpeed < 1 || settings.plantReproductionSpeed > 500) {
            console.warn('Invalid plantReproductionSpeed', settings.plantReproductionSpeed);
            return false;
        }
        if (settings.plantOffspringCount < 1 || settings.plantOffspringCount > 50) {
            console.warn('Invalid plantOffspringCount', settings.plantOffspringCount);
            return false;
        }
        if (settings.plantMaxSize < 5 || settings.plantMaxSize > 1000) {
            console.warn('Invalid plantMaxSize', settings.plantMaxSize);
            return false;
        }

        return true;
    }

    showNotification(message) {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d9ff, #7b2ff7);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Добавляем анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
