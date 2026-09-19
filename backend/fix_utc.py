import os
import glob

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'datetime.now(timezone.utc)' in content:
            content = content.replace('datetime.now(timezone.utc)', 'datetime.now(timezone.utc)')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed parenthesis in {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for root, _, files in os.walk('c:/projects/SafeRoute/backend'):
    for file in files:
        if file.endswith('.py') and 'venv' not in root and '.pytest_cache' not in root:
            fix_file(os.path.join(root, file))
