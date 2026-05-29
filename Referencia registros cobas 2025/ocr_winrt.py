import asyncio
import os
from winrt.windows.storage import StorageFile
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine

async def ocr_file(img_path):
    print(f"OCRing: {img_path}")
    try:
        file = await StorageFile.get_file_from_path_async(os.path.abspath(img_path))
        # 0 is Read mode in Windows.Storage.FileAccessMode
        stream = await file.open_async(0) 
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        
        engine = OcrEngine.try_create_from_user_profile_languages()
        if not engine:
            print("OcrEngine failed to create.")
            return None
        
        result = await engine.recognize_async(bitmap)
        return result.text
    except Exception as e:
        print(f"Error OCRing {img_path}: {e}")
        return None

async def main():
    base_dir = r"c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"
    files = [f for f in os.listdir(base_dir) if f.endswith(".png")]
    for f in files:
        img_path = os.path.join(base_dir, f)
        text = await ocr_file(img_path)
        if text:
            txt_name = f.replace(".png", "_ocr.txt")
            txt_path = os.path.join(base_dir, txt_name)
            with open(txt_path, "w", encoding="utf-8") as out_f:
                out_f.write(text)
            print(f"Saved: {txt_name}")

if __name__ == "__main__":
    asyncio.run(main())
