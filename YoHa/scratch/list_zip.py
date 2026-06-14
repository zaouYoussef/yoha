import zipfile

zip_path = r"c:\Users\zaoujal\Documents\yoha\Source+file+-+flying+hamburger.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    for name in zip_ref.namelist()[:50]:
        print(name)
    print("Total files:", len(zip_ref.namelist()))
