import cv2
import os

video_path = r"c:\Users\zaoujal\Documents\yoha\burgervideo.mp4"
output_dir = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\video_frames"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error opening video file")
    sys.exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"Video stats: {width}x{height}, FPS: {fps}, Total Frames: {frame_count}")

# Extract 5 evenly spaced frames to inspect
frame_indices = [0, frame_count // 4, frame_count // 2, (3 * frame_count) // 4, frame_count - 1]

for idx in frame_indices:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if ret:
        frame_name = f"frame_{idx}.png"
        out_path = os.path.join(output_dir, frame_name)
        cv2.imwrite(out_path, frame)
        print(f"Extracted frame {idx} to {out_path}")
    else:
        print(f"Could not read frame {idx}")

cap.release()
print("Done extracting frames")
