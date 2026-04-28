import os, shutil

src = r'I:\Portraitpay ai\Doc\商业企划书\商业企划书'
dst = r'C:\Users\Administrator\.openclaw\workspace\PortraitPay'

files = os.listdir(src)
for f in files:
    full = os.path.join(src, f)
    if os.path.isfile(full):
        if f.endswith('.docx') or f.endswith('.pptx'):
            shutil.copy(full, os.path.join(dst, f))
            print(f"Copied: {f}")
    elif os.path.isdir(full):
        print(f"Dir: {f}")
        subfiles = os.listdir(full)
        for sf in subfiles:
            sfull = os.path.join(full, sf)
            if os.path.isfile(sfull) and (sf.endswith('.docx') or sf.endswith('.pptx') or sf.endswith('.pdf')):
                shutil.copy(sfull, os.path.join(dst, sf))
                print(f"  Copied: {sf}")
            else:
                print(f"  {sf}")
