import os
from PIL import Image

images_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\burger-src\images"
files = os.listdir(images_dir)

print(f"Inspecting {len(files)} files in {images_dir}:")
for f in files:
    path = os.path.join(images_dir, f)
    size_bytes = os.path.getsize(path)
    try:
        with Image.open(path) as img:
            print(f"File: {f} - Size: {size_bytes} bytes - Format: {img.format} - Mode: {img.mode} - Dimensions: {img.size}")
    except Exception as e:
        print(f"File: {f} - Size: {size_bytes} bytes - Error opening as image: {e}")
