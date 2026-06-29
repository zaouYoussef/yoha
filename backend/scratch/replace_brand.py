import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'YoHa' in content:
            new_content = content.replace('YoHa', 'YoHa')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        # Ignore decoding errors
        pass

def main():
    root_dir = r"c:\Users\zaoujal\Documents\yoha"
    exclude_dirs = {'.git', 'node_modules', '.next', 'venv', 'staticfiles'}
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Filter out excluded directories in-place
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        
        for filename in filenames:
            # Only process text files
            ext = os.path.splitext(filename)[1].lower()
            if ext in {'.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.py', '.md', '.txt', '.xml', '.yml', '.yaml'}:
                filepath = os.path.join(dirpath, filename)
                replace_in_file(filepath)

if __name__ == '__main__':
    main()
