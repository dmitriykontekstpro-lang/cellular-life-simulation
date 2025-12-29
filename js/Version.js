export const APP_VERSION = "1.2.0";
export const BUILD_DATE = '2025-12-29 12:03:02';

export function logVersion() {
    console.log(`%c 🌱 Cellular Life Simulation v${APP_VERSION} (${BUILD_DATE}) `,
        'background: #00ff88; color: #000000; font-size: 12px; font-weight: bold; padding: 4px; border-radius: 4px;');
    console.log(`%c 🔧 Latest update: Visual Overhaul & Logging `, 'color: #888888; font-style: italic;');
}
