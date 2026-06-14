import cv2
import numpy as np
import os

frames_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\video_frames"
output_dir = r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\video_frames_cropped"
os.makedirs(output_dir, exist_ok=True)

md_slides = []

for name in sorted(os.listdir(frames_dir)):
    if not name.endswith(".png"):
        continue
    path = os.path.join(frames_dir, name)
    img = cv2.imread(path)
    h, w, c = img.shape
    
    # BGR to Gray
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Bounding box of non-white pixels (value < 250)
    non_white = np.where(gray < 250)
    if len(non_white[0]) > 0:
        min_y, max_y = np.min(non_white[0]), np.max(non_white[0])
        min_x, max_x = np.min(non_white[1]), np.max(non_white[1])
        cropped = img[min_y:max_y+1, min_x:max_x+1]
        
        cropped_name = f"cropped_{name}"
        cv2.imwrite(os.path.join(output_dir, cropped_name), cropped)
        print(f"Cropped {name} from {w}x{h} to {cropped.shape[1]}x{cropped.shape[0]} at Y({min_y}-{max_y}), X({min_x}-{max_x})")
        
        md_slides.append(f"""### {name} (Cropped)
Dimensions: {cropped.shape[1]}x{cropped.shape[0]} (Original: {w}x{h})
Bounding Box: X({min_x}-{max_x}), Y({min_y}-{max_y})
![{name}](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames_cropped/{cropped_name})""")
    else:
        print(f"Frame {name} is empty/fully white")

md_content = "# Cropped Burgervideo.mp4 Frames\n\n" + "\n\n<!-- slide -->\n\n".join(md_slides)
# Wrap in carousel
md_content = md_content.replace("# Cropped Burgervideo.mp4 Frames\n\n", "# Cropped Burgervideo.mp4 Frames\n\n````carousel\n") + "\n````\n"

with open(r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\burger_video_frames_cropped.md", "w") as f:
    f.write(md_content)
print("Created burger_video_frames_cropped.md")
