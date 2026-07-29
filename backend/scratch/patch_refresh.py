with open('backend/yoha/settings/base.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = '"REFRESH_TOKEN_LIFETIME": timedelta(days=7)'
new = '"REFRESH_TOKEN_LIFETIME": timedelta(days=365)'

if old in content:
    content = content.replace(old, new, 1)
    with open('backend/yoha/settings/base.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - changed to 365 days')
else:
    print('NOT FOUND')
    import re
    for m in re.finditer(r'REFRESH_TOKEN_LIFETIME', content):
        print(repr(content[m.start()-20:m.end()+30]))
