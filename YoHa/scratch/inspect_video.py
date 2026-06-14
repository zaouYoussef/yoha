import sys

try:
    import cv2
    print("cv2 is available")
except ImportError:
    print("cv2 is NOT available")

try:
    from PIL import Image
    print("PIL is available")
except ImportError:
    print("PIL is NOT available")

import os
video_path = r"c:\Users\zaoujal\Documents\yoha\burgervideo.mp4"
if os.path.exists(video_path):
    print("Video size:", os.path.getsize(video_path), "bytes")
else:
    print("Video file does not exist")
