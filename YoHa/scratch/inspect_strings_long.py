import re

fig_path = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\burger-src\canvas.fig"

try:
    with open(fig_path, "rb") as f:
        data = f.read()
    
    # regex for printable characters of length 5 to 150
    matches = re.findall(b"[\\x20-\\x7E]{5,150}", data)
    print(f"Found {len(matches)} printable ASCII strings:")
    
    # print the first 100 strings that look like names or text
    count = 0
    for m in matches:
        text = m.decode("ascii", errors="ignore").strip()
        if len(text) > 4 and any(c.isalpha() for c in text):
            # filter out pure random hex/base64 strings if possible
            if not re.match(r"^[a-zA-Z0-9+/=]{10,}$", text):
                print(f"{count}: {text}")
                count += 1
                if count >= 100:
                    break
except Exception as e:
    print("Error:", e)
