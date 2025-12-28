import os
import subprocess
import sys

def run_git_commands(message="Auto-deploy"):
    base_dir = r"c:\Users\Дмитрий\.gemini\antigravity\playground\cellular-life"
    os.chdir(base_dir)
    
    print(f"🚀 Starting Auto-Deploy: {message}")
    
    commands = [
        ["git", "add", "."],
        ["git", "commit", "-m", message],
        ["git", "push", "origin", "main"]
    ]
    
    for cmd in commands:
        try:
            print(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0 and "nothing to commit" not in result.stdout:
                print(f"Error: {result.stderr}")
            else:
                print(result.stdout)
        except Exception as e:
            print(f"Failed to execute {cmd}: {e}")

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "Auto-update"
    run_git_commands(msg)
