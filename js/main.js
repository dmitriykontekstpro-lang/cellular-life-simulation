// main.js - Application entry point
import { SimulationEngine } from './SimulationEngine.js';
import { SettingsPanel } from './SettingsPanel.js';
import { ControlPanel } from './ControlPanel.js';
import { logVersion, APP_VERSION } from './Version.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Выводим версию
    logVersion();

    // Добавляем версию в угол экрана
    const vDiv = document.createElement('div');
    vDiv.style.cssText = 'position:fixed; bottom:5px; right:5px; color:rgba(255,255,255,0.2); font-size:10px; font-family:monospace; pointer-events:none; z-index:1000;';
    vDiv.textContent = `v${APP_VERSION}`;
    document.body.appendChild(vDiv);

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
