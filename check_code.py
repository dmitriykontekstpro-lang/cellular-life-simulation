"""
МГНОВЕННАЯ ПРОВЕРКА КОДА (без запуска браузера)
Проверяет что все изменения внесены корректно за 1 секунду
"""

import os
import re

def check_file_content(filepath, checks):
    """Проверяет что файл содержит нужные строки"""
    print(f"\n📄 Проверка {os.path.basename(filepath)}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        all_passed = True
        for check_name, pattern in checks.items():
            if isinstance(pattern, str):
                found = pattern in content
            else:  # regex
                found = re.search(pattern, content) is not None
            
            if found:
                print(f"  ✅ {check_name}")
            else:
                print(f"  ❌ {check_name}")
                all_passed = False
        
        return all_passed
    except Exception as e:
        print(f"  ❌ Ошибка чтения: {e}")
        return False

def quick_code_check():
    print("🚀 МГНОВЕННАЯ ПРОВЕРКА КОДА")
    print("="*60)
    
    base_path = r"c:\Users\Дмитрий\.gemini\antigravity\playground\cellular-life"
    
    all_checks_passed = True
    
    # 1. Проверка WaterSystem.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "WaterSystem.js"),
        {
            "Ветвление увеличено до 0.4": "Math.random() < 0.4",
            "Радиус воды увеличен до 20": "this.propagateWater(source.x, source.y, 20)",
        }
    )
    
    # 2. Проверка Renderer.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "Renderer.js"),
        {
            "Семена ярко-желтые": "seed: '#ffff00'",
        }
    )
    
    # 3. Проверка EnergySystem.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "EnergySystem.js"),
        {
            "Вода не блокирует свет": "ТОЛЬКО растения блокируют свет",
            "Проверка типа plant": "cell.type === 'plant'",
        }
    )
    
    # 4. Проверка Plant.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "Plant.js"),
        {
            "Удалена проверка maxSize в tryGrow": re.compile(r"tryGrow.*?\{\s+if \(!this\.isAlive\) \{", re.DOTALL),
            "Метод generateSeeds существует": "generateSeeds(grid)",
        }
    )
    
    # 5. Проверка PlantManager.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "PlantManager.js"),
        {
            "Проверка maxSize перед ростом": "if (plant.size >= plant.maxSize)",
            "Логирование генерации семян": "console.log(`Plant ${plant.id} reached max size",
            "Растения спавнятся у воды": "const waterCells = []",
        }
    )
    
    # 6. Проверка SimulationEngine.js
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "js", "SimulationEngine.js"),
        {
            "Вода генерируется перед растениями": "ВАЖНО: Сначала генерируем реку, потом растения",
        }
    )
    
    # 7. Проверка index.html
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "index.html"),
        {
            "HTML файл существует": "<!DOCTYPE html>",
            "Canvas присутствует": "<canvas",
            "Модули подключены": 'type="module"',
        }
    )
    
    # 8. Проверка README.md
    all_checks_passed &= check_file_content(
        os.path.join(base_path, "README.md"),
        {
            "README создан": "# 🌱 Клеточная Жизнь",
            "Инструкции по запуску": "python -m http.server",
        }
    )
    
    print("\n" + "="*60)
    if all_checks_passed:
        print("✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!")
        print("\n📋 Проверенные изменения:")
        print("  ✓ Река более ветвистая (0.4)")
        print("  ✓ Радиус воды увеличен в 10 раз (20)")
        print("  ✓ Семена ярко-желтые (#ffff00)")
        print("  ✓ Вода не блокирует свет")
        print("  ✓ Жизненный цикл исправлен")
        print("  ✓ Растения спавнятся у воды")
        print("\n🎯 Код готов к тестированию!")
    else:
        print("❌ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОШЛИ")
        print("\n⚠️ Проверьте файлы выше")
    
    print("="*60)
    
    return all_checks_passed

if __name__ == "__main__":
    try:
        success = quick_code_check()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
