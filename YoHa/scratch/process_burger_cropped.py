import os
from PIL import Image

src_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
dest_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img\cropped"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

files = [f for f in os.listdir(src_dir) if f.endswith(".png") and not f.startswith("cropped_")]

print("Cropping images to transparent bounds:")
for f in files:
    src_path = os.path.join(src_dir, f)
    with Image.open(src_path) as img:
        bbox = img.getbbox()
        if bbox:
            cropped = img.crop(bbox)
            dest_path = os.path.join(dest_dir, f)
            cropped.save(dest_path)
            print(f"Cropped {f} from {img.size} to {cropped.size} and saved.")
        else:
            print(f"Image {f} is empty, skipped.")
