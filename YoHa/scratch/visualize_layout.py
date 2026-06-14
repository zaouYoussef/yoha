import os
import numpy as np
from PIL import Image

burger_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
files = [f for f in os.listdir(burger_dir) if f.endswith(".png") and not f.startswith("cropped_")]

print("Analyzing pixel centroids:")
for f in files:
    path = os.path.join(burger_dir, f)
    with Image.open(path) as img:
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        # Load alpha channel as numpy array
        alpha = np.array(img.split()[-1])
        non_zero = np.where(alpha > 10)
        
        if len(non_zero[0]) > 0:
            min_y, max_y = np.min(non_zero[0]), np.max(non_zero[0])
            min_x, max_x = np.min(non_zero[1]), np.max(non_zero[1])
            centroid_y = int(np.mean(non_zero[0]))
            centroid_x = int(np.mean(non_zero[1]))
            density = len(non_zero[0]) / (img.size[0] * img.size[1])
            print(f"File: {f} -> Size: {img.size} -> Content Box: X({min_x}-{max_x}), Y({min_y}-{max_y}) -> Centroid: ({centroid_x}, {centroid_y}) -> Density: {density:.2%}")
        else:
            print(f"File: {f} -> Fully transparent -> Size: {img.size}")
