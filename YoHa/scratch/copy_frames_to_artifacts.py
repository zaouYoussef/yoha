import os
import shutil

src_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\video_frames"
dest_dir = r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\video_frames"
os.makedirs(dest_dir, exist_ok=True)

for name in os.listdir(src_dir):
    if name.endswith(".png"):
        shutil.copy2(os.path.join(src_dir, name), os.path.join(dest_dir, name))
        print("Copied", name)

# Now create the markdown file
md_content = """# Burgervideo.mp4 Frames

Here are the frames extracted from the `burgervideo.mp4` file.

````carousel
### Frame 0
![Frame 0](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames/frame_0.png)

<!-- slide -->
### Frame 60
![Frame 60](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames/frame_60.png)

<!-- slide -->
### Frame 120
![Frame 120](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames/frame_120.png)

<!-- slide -->
### Frame 180
![Frame 180](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames/frame_180.png)

<!-- slide -->
### Frame 239
![Frame 239](/C:/Users/zaoujal/.gemini/antigravity/brain/034e6c1b-4424-4a8c-b010-9dc66e5ad070/video_frames/frame_239.png)
````
"""

with open(r"C:\Users\zaoujal\.gemini\antigravity\brain\034e6c1b-4424-4a8c-b010-9dc66e5ad070\burger_video_frames.md", "w") as f:
    f.write(md_content)
print("Created burger_video_frames.md")
