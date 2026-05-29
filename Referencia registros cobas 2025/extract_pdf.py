import pypdf
import os

def extract_pdf(pdf_path, txt_path):
    print(f"Extracting {pdf_path} to {txt_path}...")
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} does not exist.")
        return
    
    reader = pypdf.PdfReader(pdf_path)
    num_pages = len(reader.pages)
    print(f"Total pages: {num_pages}")
    
    with open(txt_path, "w", encoding="utf-8") as f:
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            f.write(f"--- PAGE {idx + 1} ---\n")
            f.write(text)
            f.write("\n\n")
    print("Done!")

if __name__ == "__main__":
    base_dir = r"c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"
    extract_pdf(
        os.path.join(base_dir, "REGISTRO MANTENCIÓN EQUIPO COBAS C1 - 2025.pdf"),
        os.path.join(base_dir, "c1_extracted.txt")
    )
    extract_pdf(
        os.path.join(base_dir, "REGISTRO MANTENCIÓN EQUIPO COBAS C2 - 2025.pdf"),
        os.path.join(base_dir, "c2_extracted.txt")
    )
