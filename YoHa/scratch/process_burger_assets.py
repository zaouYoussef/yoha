import os
import shutil

src_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\burger-src\images"
dest_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

files = os.listdir(src_dir)
print(f"Copying {len(files)} files to {dest_dir}:")
for f in files:
    src_path = os.path.join(src_dir, f)
    # add .png extension
    dest_name = f + ".png"
    dest_path = os.path.join(dest_dir, dest_name)
    shutil.copy2(src_path, dest_path)
    print(f"Copied: {f} -> {dest_name}")
