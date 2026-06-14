import cv2
import numpy as np
import os

frame_path = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\video_frames\frame_120.png"
if not os.path.exists(frame_path):
    print("Frame not found")
    sys.exit(1)

img = cv2.imread(frame_path)
# Convert to BGRA
bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Create a mask where pixels are very close to white
# White is [255, 255, 255] in BGR
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Pixels with gray value > 250 are considered background
bg_mask = gray > 250

# Set alpha to 0 for background pixels
bgra[bg_mask, 3] = 0

# Also perform soft feathering/anti-aliasing at the edges
# Any pixel with gray between 240 and 250 can have a linear alpha ramp
ramp_mask = (gray <= 250) & (gray > 235)
bgra[ramp_mask, 3] = ((250 - gray[ramp_mask]) / (250 - 235) * 255).astype(np.uint8)

# Get bounding box of non-transparent pixels
alpha = bgra[:, :, 3]
non_zero = np.where(alpha > 10)
if len(non_zero[0]) > 0:
    min_y, max_y = np.min(non_zero[0]), np.max(non_zero[0])
    min_x, max_x = np.min(non_zero[1]), np.max(non_zero[1])
    cropped = bgra[min_y:max_y+1, min_x:max_x+1]
    
    out_dir = r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070"
    out_path = os.path.join(out_dir, "test_transparent_frame.png")
    cv2.imwrite(out_path, cropped)
    print(f"Saved transparent cropped frame to {out_path}, size: {cropped.shape[1]}x{cropped.shape[0]}")
else:
    print("Image is empty after background removal")
