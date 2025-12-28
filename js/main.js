// main.js - Application entry point
import { SimulationEngine } from './SimulationEngine.js';
import { SettingsPanel } from './SettingsPanel.js';
import { ControlPanel } from './ControlPanel.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
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
