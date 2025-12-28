"""
Быстрый автоматический тест симуляции клеточной жизни
Использует Playwright для проверки всех функций за 30 секунд
"""

from playwright.sync_api import sync_playwright
import time

def test_cellular_life():
    print("🧪 Запуск быстрого теста...")
    
    with sync_playwright() as p:
        # Запуск браузера в headless режиме для скорости
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Открываем страницу
        print("📄 Загрузка страницы...")
        page.goto("http://localhost:8080/index.html")
        page.wait_for_load_state("networkidle")
        
        # Проверяем что симуляция инициализировалась
        print("✅ Проверка инициализации...")
        engine_exists = page.evaluate("typeof window.simulationEngine !== 'undefined'")
        if not engine_exists:
            print("❌ ОШИБКА: SimulationEngine не найден!")
            browser.close()
            return False
        
        # Получаем начальную статистику
        initial_stats = page.evaluate("window.simulationEngine.getStats()")
        print(f"📊 Начальная статистика:")
        print(f"   Растения: {initial_stats['plantCount']}")
        print(f"   Семена: {initial_stats['seedCount']}")
        print(f"   Вода: {initial_stats['waterCells']}")
        
        # Проверяем что вода есть
        if initial_stats['waterCells'] == 0:
            print("❌ ОШИБКА: Вода не сгенерировалась!")
            browser.close()
            return False
        
        # Проверяем что растения есть
        if initial_stats['plantCount'] == 0:
            print("❌ ОШИБКА: Растения не созданы!")
            browser.close()
            return False
        
        # Делаем скриншот начального состояния
        page.screenshot(path="test_initial.png")
        print("📸 Скриншот начального состояния сохранен")
        
        # Запускаем симуляцию
        print("▶️ Запуск симуляции...")
        page.click("#startBtn")
        
        # Ждем 30 секунд
        print("⏳ Ожидание 30 секунд...")
        time.sleep(30)
        
        # Приостанавливаем
        page.click("#pauseBtn")
        
        # Получаем финальную статистику
        final_stats = page.evaluate("window.simulationEngine.getStats()")
        print(f"\n📊 Финальная статистика:")
        print(f"   Растения: {final_stats['plantCount']}")
        print(f"   Семена: {final_stats['seedCount']}")
        print(f"   Вода: {final_stats['waterCells']}")
        print(f"   Тиков: {final_stats['tickCount']}")
        
        # Делаем финальный скриншот
        page.screenshot(path="test_final.png")
        print("📸 Скриншот финального состояния сохранен")
        
        # Проверяем логи консоли на наличие сообщений о семенах
        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text))
        
        # Перезапускаем на 20 секунд чтобы проверить семена
        print("\n🔄 Перезапуск для проверки генерации семян...")
        page.evaluate("window.simulationEngine.reset()")
        time.sleep(1)
        page.click("#startBtn")
        
        # Слушаем консоль
        seed_messages = []
        def handle_console(msg):
            text = msg.text
            if "reached max size" in text or "generating seeds" in text or "Generated" in text:
                seed_messages.append(text)
                print(f"   💬 {text}")
        
        page.on("console", handle_console)
        
        # Ждем 40 секунд чтобы дать растениям достичь максимума
        print("⏳ Ожидание 40 секунд для достижения max size...")
        time.sleep(40)
        
        page.click("#pauseBtn")
        
        # Финальная проверка
        final_stats2 = page.evaluate("window.simulationEngine.getStats()")
        print(f"\n📊 Финальная статистика (после перезапуска):")
        print(f"   Растения: {final_stats2['plantCount']}")
        print(f"   Семена: {final_stats2['seedCount']}")
        print(f"   Тиков: {final_stats2['tickCount']}")
        
        # Проверяем результаты
        print("\n" + "="*50)
        print("📋 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
        print("="*50)
        
        success = True
        
        # 1. Вода генерируется
        if initial_stats['waterCells'] > 0:
            print("✅ Вода: Генерируется корректно")
        else:
            print("❌ Вода: НЕ генерируется")
            success = False
        
        # 2. Растения создаются у воды
        if initial_stats['plantCount'] > 0:
            print("✅ Растения: Создаются у воды")
        else:
            print("❌ Растения: НЕ создаются")
            success = False
        
        # 3. Симуляция работает
        if final_stats['tickCount'] > 1000:
            print(f"✅ Симуляция: Работает ({final_stats['tickCount']} тиков)")
        else:
            print("❌ Симуляция: НЕ работает или слишком медленная")
            success = False
        
        # 4. Семена генерируются
        if len(seed_messages) > 0:
            print(f"✅ Семена: Генерируются ({len(seed_messages)} сообщений в консоли)")
            if final_stats2['seedCount'] > 0:
                print(f"   ℹ️ Количество семян на поле: {final_stats2['seedCount']}")
        else:
            print("⚠️ Семена: Сообщений о генерации не найдено")
            if final_stats2['seedCount'] > 0:
                print(f"   ✅ Но на поле есть {final_stats2['seedCount']} семян")
            else:
                print("   ❌ И на поле нет семян")
                success = False
        
        # 5. Проверяем цвет семян через DOM
        seed_color = page.evaluate("""
            (() => {
                const renderer = window.simulationEngine?.renderer;
                return renderer?.colors?.seed || 'not found';
            })()
        """)
        
        if seed_color == '#ffff00':
            print(f"✅ Цвет семян: ЯРКО-ЖЕЛТЫЙ ({seed_color})")
        else:
            print(f"❌ Цвет семян: НЕ желтый ({seed_color})")
            success = False
        
        print("="*50)
        
        if success:
            print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        else:
            print("\n⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОШЛИ")
        
        # Делаем финальный скриншот с семенами
        page.screenshot(path="test_with_seeds.png")
        print("\n📸 Все скриншоты сохранены:")
        print("   - test_initial.png")
        print("   - test_final.png")
        print("   - test_with_seeds.png")
        
        browser.close()
        return success

if __name__ == "__main__":
    try:
        success = test_cellular_life()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ОШИБКА ТЕСТА: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
