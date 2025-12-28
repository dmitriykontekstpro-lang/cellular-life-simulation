// main.js - Application entry point
import { SimulationEngine } from './SimulationEngine.js';
import { SettingsPanel } from './SettingsPanel.js';
import { ControlPanel } from './ControlPanel.js';
import { logVersion, APP_VERSION, BUILD_DATE } from './Version.js';

function getHashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Генерируем красивый цвет (исключаем слишком темные)
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = '#' + '00000'.substring(0, 6 - c.length) + c;
    return color;
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Выводим версию в консоль
    logVersion();

    // Обновляем UI версии
    const versionText = document.getElementById('version-text');
    const versionLed = document.getElementById('version-led');

    if (versionText && versionLed) {
        versionText.textContent = `v${APP_VERSION} (${BUILD_DATE})`;

        // Генерируем уникальный цвет для этой сборки
        const versionString = APP_VERSION + BUILD_DATE;
        const ledColor = getHashColor(versionString);

        versionLed.style.backgroundColor = ledColor;
        versionLed.style.boxShadow = `0 0 8px ${ledColor}, 0 0 16px ${ledColor}`;
        versionLed.title = `Signature: ${ledColor}`;
    }

    console.log('🌱 Инициализация симуляции клеточной жизни...');

    const canvas = document.getElementById('simulationCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Создаем движок симуляции
    const engine = new SimulationEngine(canvas);

    // Инициализируем панели управления
    const settingsPanel = new SettingsPanel(engine);
    const controlPanel = new ControlPanel(engine);

    // Делаем движок глобально доступным для отладки
    window.simulationEngine = engine;

    console.log('✅ Симуляция готова к запуску!');
    console.log('💡 Используйте пробел для старт/пауза, Ctrl+R для сброса');
    console.log('🖱️ Перетаскивайте мышью для панорамирования, колесико для масштабирования');
});
