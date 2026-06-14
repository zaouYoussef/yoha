import os
from PIL import Image

burger_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
files = [f for f in os.listdir(burger_dir) if f.endswith(".png")]

print("Analyzing burger components:")
for f in files:
    path = os.path.join(burger_dir, f)
    with Image.open(path) as img:
        # Get transparency mask bounding box
        bbox = img.getbbox()
        if bbox:
            cropped = img.crop(bbox)
            # Calculate average color of non-transparent pixels
            pixels = list(cropped.getdata())
            r_sum, g_sum, b_sum, count = 0, 0, 0, 0
            for px in pixels:
                if len(px) == 4 and px[3] > 10:  # non-transparent alpha
                    r_sum += px[0]
                    g_sum += px[1]
                    b_sum += px[2]
                    count += 1
            if count > 0:
                avg_r = int(r_sum / count)
                avg_g = int(g_sum / count)
                avg_b = int(b_sum / count)
                print(f"Hash: {f} -> Bounding Box: {bbox} -> Avg Color: ({avg_r}, {avg_g}, {avg_b}) -> Size: {img.size}")
            else:
                print(f"Hash: {f} -> Empty transparent image -> Size: {img.size}")
        else:
            print(f"Hash: {f} -> No bounding box found -> Size: {img.size}")
