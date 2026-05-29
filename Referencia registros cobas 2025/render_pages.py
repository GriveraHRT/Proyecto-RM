import fitz
import os

base_dir = r"c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"

def render_pages(pdf_name, pages_to_render):
    pdf_path = os.path.join(base_dir, pdf_name)
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_name} not found")
        return
    
    doc = fitz.open(pdf_path)
    print(f"Rendering pages for {pdf_name}...")
    for p_num in pages_to_render:
        if p_num <= len(doc):
            page = doc[p_num - 1]
            pix = page.get_pixmap(dpi=150)
            out_name = f"{pdf_name[:-4]}_page_{p_num}.png"
            out_path = os.path.join(base_dir, out_name)
            pix.save(out_path)
            print(f"Saved {out_name}")

if __name__ == "__main__":
    render_pages("REGISTRO MANTENCIÓN EQUIPO COBAS C1 - 2025.pdf", [1, 2, 3])
    render_pages("REGISTRO MANTENCIÓN EQUIPO COBAS C2 - 2025.pdf", [1, 2, 3])
