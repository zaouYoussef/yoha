import os
import shutil

src_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
dest_dir = r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\burger_images"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

files = [f for f in os.listdir(src_dir) if f.endswith(".png")]

# Copy each image to the artifact subfolder
copied_files = []
for f in files:
    src_path = os.path.join(src_dir, f)
    dest_path = os.path.join(dest_dir, f)
    shutil.copy2(src_path, dest_path)
    copied_files.append(f)

# Generate markdown contact sheet content
md_content = "# Figma Burger Project Assets Contact Sheet\n\n"
md_content += "Here are the extracted images from the Figma document. We can use this to identify each layer of the burger:\n\n"

md_content += "````carousel\n"
for i, f in enumerate(copied_files):
    if i > 0:
        md_content += "<!-- slide -->\n"
    # Show image and details
    md_content += f"### Image {i+1}: `{f}`\n"
    md_content += f"![Image {i+1}](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/burger_images/{f})\n\n"
md_content += "````\n"

with open(r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\burger_contact_sheet.md", "w", encoding="utf-8") as out:
    out.write(md_content)

print(f"Copied {len(copied_files)} images and created burger_contact_sheet.md")
