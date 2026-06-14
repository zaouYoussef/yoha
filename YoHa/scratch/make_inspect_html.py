import os

burger_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
files = [f for f in os.listdir(burger_dir) if f.endswith(".png")]

html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Inspect Burger Assets</title>
    <style>
        body { font-family: sans-serif; background: #222; color: #fff; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #333; padding: 10px; border-radius: 8px; border: 1px solid #444; }
        img { max-width: 100%; height: auto; display: block; margin-top: 10px; background: #111; }
    </style>
</head>
<body>
    <h1>Extracted Figma Project Images</h1>
    <div class="grid">
"""

for f in files:
    html_content += f"""
        <div class="card">
            <h3>{f}</h3>
            <p>Path: /burger-img/{f}</p>
            <img src="/burger-img/{f}" alt="{f}" />
        </div>
    """

html_content += """
    </div>
</body>
</html>
"""

with open(r"c:\Users\zaoujal\Documents\yoha\YoHa\public\inspect_burger.html", "w", encoding="utf-8") as out:
    out.write(html_content)

print("Created public/inspect_burger.html")
