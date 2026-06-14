import zipfile
import os

fig_path = r"c:\Users\zaoujal\Documents\yoha\YoHa\scratch\burger-src\canvas.fig"
if not os.path.exists(fig_path):
    print("canvas.fig not found")
else:
    print("canvas.fig size:", os.path.getsize(fig_path), "bytes")
    if zipfile.is_zipfile(fig_path):
        print("canvas.fig IS a zip file!")
        with zipfile.ZipFile(fig_path, 'r') as z:
            for name in z.namelist():
                print("  ", name)
    else:
        print("canvas.fig is NOT a zip file")
