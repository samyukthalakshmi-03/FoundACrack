
import zipfile

with zipfile.ZipFile('best.pt.zip', 'r') as zf:
    print("Files in zip:")
    for info in zf.infolist():
        print(f"  {info.filename} ({info.file_size} bytes)")
