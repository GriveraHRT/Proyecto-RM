import fitz # PyMuPDF
import os

base_dir = r"c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"
pdf_path = os.path.join(base_dir, "REGISTRO MANTENCIÓN EQUIPO COBAS C1 - 2025.pdf")

doc = fitz.open(pdf_path)
print(f"Number of pages: {len(doc)}")

for page_idx in range(min(5, len(doc))):
    page = doc[page_idx]
    text = page.get_text()
    images = page.get_images()
    print(f"Page {page_idx + 1}:")
    print(f"  Text length: {len(text)}")
    print(f"  Number of images: {len(images)}")
    if text.strip():
        print(f"  Preview text:\n{text[:200]}")
    else:
        print("  (No text found)")
