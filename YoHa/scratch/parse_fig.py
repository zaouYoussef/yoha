import re

fig_path = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\burger-src\canvas.fig"

try:
    with open(fig_path, "rb") as f:
        data = f.read()
    
    # Extract readable strings
    strings = re.findall(b"[a-zA-Z0-9_\\-\\s\\.]{4,100}", data)
    print(f"Extracted {len(strings)} strings from figma file.")
    
    # Write strings to a file to examine
    with open(r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\fig_strings.txt", "w", encoding="utf-8") as out:
        for s in strings:
            try:
                decoded = s.decode("ascii").strip()
                if decoded:
                    out.write(decoded + "\n")
            except:
                pass
    print("Saved extracted strings to scratch/fig_strings.txt")
except Exception as e:
    print("Error:", e)
