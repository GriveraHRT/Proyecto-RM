$ErrorActionPreference = "Continue"

$dir = "c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"
$files = Get-ChildItem -Path $dir -Filter "*.png"

foreach ($f in $files) {
    Write-Output "OCR on file: $($f.Name)"
    try {
        [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime] | Out-Null
        [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
        [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null

        $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName).GetAwaiter().GetResult()
        $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
        $bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()

        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
        if ($engine -eq $null) {
            $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("es-ES"))
        }

        if ($engine -ne $null) {
            $result = $engine.RecognizeAsync($bitmap).GetAwaiter().GetResult()
            $txtPath = Join-Path $dir "$($f.BaseName)_ocr.txt"
            $result.Text | Out-File -FilePath $txtPath -Encoding utf8
            Write-Output "Successfully OCR'd: $($f.BaseName)_ocr.txt"
        } else {
            Write-Output "OcrEngine could not be created."
        }
    } catch {
        Write-Output "Error: $($_.Exception.Message)"
    }
}
