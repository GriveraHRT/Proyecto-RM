Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asm = [System.Reflection.Assembly]::LoadWithPartialName("System.Runtime.WindowsRuntime")

$imagePath = "c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025\REGISTRO MANTENCIÓN EQUIPO COBAS C1 - 2025_page_1.png"

# We can also do it via PowerShell's WinRT integration in Win 10/11
try {
    [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
    
    $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($imagePath).GetAwaiter().GetResult()
    $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
    $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
    $bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
    
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($engine -eq $null) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("es-ES"))
    }
    
    if ($engine -ne $null) {
        $result = $engine.RecognizeAsync($bitmap).GetAwaiter().GetResult()
        Write-Output "OCR SUCCESS:"
        Write-Output $result.Text
    } else {
        Write-Output "OcrEngine could not be created."
    }
} catch {
    Write-Output "Error: $_"
}
