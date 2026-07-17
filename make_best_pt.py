
import zipfile
import os

source_dir = "model/best"
output_file = "model/best.pt"

with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            # The arcname should be the path relative to source_dir
            arcname = os.path.relpath(file_path, source_dir)
            zf.write(file_path, arcname)

print(f"Created {output_file} successfully!")
print(f"Files in zip: {zf.namelist()}")
