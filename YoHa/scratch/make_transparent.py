import os
from PIL import Image

def remove_background(image_path, target_color=(212, 239, 255), tolerance=22):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return
        
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # BFS flood fill from all 4 corners
    visited = set()
    queue = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    
    for x, y in list(queue):
        r, g, b, a = pixels[x, y]
        dist = ((r - target_color[0])**2 + (g - target_color[1])**2 + (b - target_color[2])**2)**0.5
        if dist > tolerance:
            queue.remove((x, y))
        else:
            visited.add((x, y))
            
    while queue:
        cx, cy = queue.pop(0)
        pixels[cx, cy] = (0, 0, 0, 0)
        
        for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny]
                dist = ((r - target_color[0])**2 + (g - target_color[1])**2 + (b - target_color[2])**2)**0.5
                if dist <= tolerance:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    img.save(image_path, "WEBP")
    print(f"Processed: {os.path.basename(image_path)}")

# Process the four webp images
base_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\pizza-img"
for i in range(1, 5):
    file_name = f"section_4_0{i}.webp"
    remove_background(os.path.join(base_dir, file_name))
