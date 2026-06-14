import cv2
import numpy as np
import os

frames_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\video_frames"
for name in sorted(os.listdir(frames_dir)):
    if not name.endswith(".png"):
        continue
    path = os.path.join(frames_dir, name)
    img = cv2.imread(path)
    h, w, c = img.shape
    
    # Sample the corners to detect background color
    corners = [img[0, 0], img[0, w-1], img[h-1, 0], img[h-1, w-1]]
    avg_corner = np.mean(corners, axis=0).astype(int)
    
    # Calculate variation of colors
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    non_bg_mask = np.abs(gray - np.mean(gray)) > 10
    percent_content = np.mean(non_bg_mask) * 100
    
    print(f"Frame {name} - Size: {w}x{h} - Corner BGR: {avg_corner} - Approx Content %: {percent_content:.1f}%")
