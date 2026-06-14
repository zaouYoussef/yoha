import os
from PIL import Image

burger_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\public\burger-img"
files = [f for f in os.listdir(burger_dir) if f.endswith(".png") and not f.startswith("cropped_")]

print("Classifying assets:")
for f in files:
    path = os.path.join(burger_dir, f)
    with Image.open(path) as img:
        w, h = img.size
        aspect = w / h
        
        # Determine format/aspect ratio category
        if aspect > 4.0:
            category = "Wide Banner / Text Graphic"
        elif aspect > 2.0:
            category = "Desktop Screen Design / Section Layout"
        elif aspect < 0.7:
            category = "Vertical Layout (Mobile / Bottle / Cup)"
        else:
            category = "General Image (Square / Icon / Burger)"
            
        # Get dominant color of non-transparent pixels
        colors = img.getcolors(w * h)
        dominant_color = (0, 0, 0)
        if colors:
            # Sort by frequency, ignoring fully transparent pixels
            sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
            for count, col in sorted_colors:
                if len(col) == 4 and col[3] > 30:  # alpha threshold
                    dominant_color = col[:3]
                    break
                    
        print(f"File: {f} -> Size: ({w}x{h}) -> Aspect: {aspect:.2f} -> Category: {category} -> Dominant RGB: {dominant_color}")
