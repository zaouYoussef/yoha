import re

with open('backend/yoha/settings/base.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = "# E-mails livreurs alert\u00e9s \u00e0 chaque nouvelle commande (premier confirm\u00e9 = course prise)\nYOHA_COURIER_NOTIFY_EMAILS = env.list(\"YOHA_COURIER_NOTIFY_EMAILS\", default=[])"

new = old + "\n\n# --- Web Push (VAPID) pour notifications navigateur ---\nVAPID_PUBLIC_KEY = env(\"VAPID_PUBLIC_KEY\", default=\"\")\nVAPID_PRIVATE_KEY = env(\"VAPID_PRIVATE_KEY\", default=\"\")\nVAPID_CLAIMS_EMAIL = env(\"VAPID_CLAIMS_EMAIL\", default=\"no-reply@yoha.ma\")"

if old in content:
    content = content.replace(old, new, 1)
    with open('backend/yoha/settings/base.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - patched')
else:
    print('NOT FOUND')
    for m in re.finditer(r'YOHA_COURIER_NOTIFY', content):
        start = max(0, m.start() - 80)
        end = min(len(content), m.end() + 80)
        print(repr(content[start:end]))
