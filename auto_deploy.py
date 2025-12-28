import os
import subprocess
import sys
import datetime
import re

def update_version_file():
    version_file = r"c:\Users\Дмитрий\.gemini\antigravity\playground\cellular-life\js\Version.js"
    
    with open(version_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Получаем текущую дату и время
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Обновляем BUILD_DATE
    # Ищем строчку export const BUILD_DATE = '...';
    new_content = re.sub(
        r"export const BUILD_DATE = '.*';",
        f"export const BUILD_DATE = '{now}';",
        content
    )
    
    if content != new_content:
        with open(version_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Version timestamp updated to: {now}")
        return True
    else:
        print("ℹ️ Version timestamp already up to date")
        return False

def run_git_commands(message="Auto-deploy"):
    base_dir = r"c:\Users\Дмитрий\.gemini\antigravity\playground\cellular-life"
    os.chdir(base_dir)
    
    print(f"🚀 Starting Auto-Deploy: {message}")
    
    # 1. Обновляем версию
    update_version_file()
    
    # 2. Git команды
    commands = [
        ["git", "add", "."],
        ["git", "commit", "-m", message],
        ["git", "push", "origin", "main"]
    ]
    
    for cmd in commands:
        try:
            print(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Игнорируем ошибку "nothing to commit" если она просто информативная
            if result.returncode != 0 and "nothing to commit" not in result.stdout:
                # Если push упал, возможно нужно pull, но пока просто выведем ошибку
                print(f"Error: {result.stderr}")
                print(f"Output: {result.stdout}")
            else:
                # Для git push вывод обычно в stderr
                if cmd[1] == "push":
                    print(result.stderr) 
                else:
                    print(result.stdout)
                    
        except Exception as e:
            print(f"Failed to execute {cmd}: {e}")

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "Auto-update"
    run_git_commands(msg)
