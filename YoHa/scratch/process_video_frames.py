import cv2
import numpy as np
import os
from PIL import Image

video_path = r"c:\Users\zaoujal\Documents\yoha\burgervideo.mp4"
output_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-frames"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video file")
    sys.exit(1)

frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print("Total video frames:", frame_count)

# We want 60 frames from the 240 frames
sample_rate = 4
sampled_frames = []

# First pass: read frames, convert to RGBA, remove background, find individual bounding boxes
global_min_y = 9999
global_max_y = 0
global_min_x = 9999
global_max_x = 0

print("First pass: Removing background and finding bounding boxes...")
for i in range(0, frame_count, sample_rate):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ret, frame = cap.read()
    if not ret:
        break
    
    # BGR to BGRA
    bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
    
    # White background removal
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Create soft alpha transparency for white pixels
    # Threshold for background
    bg_mask = gray > 252
    bgra[bg_mask, 3] = 0
    
    # Feathering/anti-aliasing near edges
    ramp_mask = (gray <= 252) & (gray > 230)
    bgra[ramp_mask, 3] = ((252 - gray[ramp_mask]) / (252 - 230) * 255).astype(np.uint8)
    
    # Bounding box of non-transparent content
    alpha = bgra[:, :, 3]
    non_zero = np.where(alpha > 5)
    
    if len(non_zero[0]) > 0:
        min_y, max_y = np.min(non_zero[0]), np.max(non_zero[0])
        min_x, max_x = np.min(non_zero[1]), np.max(non_zero[1])
        
        global_min_y = min(global_min_y, min_y)
        global_max_y = max(global_max_y, max_y)
        global_min_x = min(global_min_x, min_x)
        global_max_x = max(global_max_x, max_x)
    
    # Keep the uncropped BGRA image in memory
    sampled_frames.append((i, bgra))

cap.release()

print(f"Global Bounding Box: X({global_min_x}-{global_max_x}), Y({global_min_y}-{global_max_y})")
width = global_max_x - global_min_x + 1
height = global_max_y - global_min_y + 1
print(f"Cropped dimensions will be: {width}x{height}")

# Second pass: Crop using the global bounding box and save as compressed WebP
print("Second pass: Cropping and saving WebP images...")
total_size = 0
for idx, (original_frame_idx, bgra_img) in enumerate(sampled_frames):
    # Crop
    cropped = bgra_img[global_min_y:global_max_y+1, global_min_x:global_max_x+1]
    
    # Convert BGRA (OpenCV) to RGBA (PIL)
    rgba_pil = cv2.cvtColor(cropped, cv2.COLOR_BGRA2RGBA)
    pil_img = Image.fromarray(rgba_pil)
    
    # Save as WebP
    out_name = f"burger_{idx:02d}.webp"
    out_path = os.path.join(output_dir, out_name)
    pil_img.save(out_path, "WEBP", quality=85)
    
    f_size = os.path.getsize(out_path)
    total_size += f_size
    # Print status every 10 frames
    if idx % 10 == 0 or idx == len(sampled_frames) - 1:
        print(f" Saved {out_name} (frame {original_frame_idx}) - {f_size} bytes")

print(f"All frames processed. Total size of WebP sequence: {total_size / 1024 / 1024:.2f} MB")
