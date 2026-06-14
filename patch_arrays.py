import os
import re

directory = 'src/pages'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Negative lookbehind to prevent matching `obj.students.map`
    pattern_students = r'(?<!\.)\bstudents\.(map|find|filter|forEach|reduce|some|every|sort|slice|length|findIndex)\b'
    repl_students = r'(Array.isArray(students) ? students : []).\1'
    
    pattern_classes = r'(?<!\.)\bclasses\.(map|find|filter|forEach|reduce|some|every|sort|slice|length|findIndex)\b'
    repl_classes = r'(Array.isArray(classes) ? classes : []).\1'

    content = re.sub(pattern_students, repl_students, content)
    content = re.sub(pattern_classes, repl_classes, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

modified_files = 0
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                modified_files += 1

print(f"Modified {modified_files} files.")
