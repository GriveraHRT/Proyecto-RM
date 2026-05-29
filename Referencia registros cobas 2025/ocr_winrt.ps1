$ErrorActionPreference = "Stop"

$dir = "c:\Users\Admin\Documents\Proyecto RM\Referencia registros cobas 2025"
$files = Get-ChildItem -Path $dir -Filter "*.png"

# Load WinRT types
[Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null

function Await-Async($asyncOp) {
    while ($asyncOp.Status -eq 'Started') {
        Start-Sleep -Milliseconds 10
    }
    return $asyncOp.GetResults()
}

foreach ($f in $files) {
    Write-Output "OCR on file: $($f.Name)"
    try {
        $op1 = [Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName)
        $file = Await-Async $op1

        $op2 = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
        $stream = Await-Async $op2

        $op3 = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
        $decoder = Await-Async $op3

        $op4 = $decoder.GetSoftwareBitmapAsync()
        $bitmap = Await-Async $op4

        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
        if ($engine -eq $null) {
            $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("es-ES"))
        }

        if ($engine -ne $null) {
            $op5 = $engine.RecognizeAsync($bitmap)
            $result = Await-Async $op5
            
            $txtPath = Join-Path $dir "$($f.BaseName)_ocr.txt"
            $result.Text | Out-File -FilePath $txtPath -Encoding utf8
            Write-Output "Successfully OCR'd: $($f.BaseName)_ocr.txt"
        } else {
            Write-Output "OcrEngine could not be created."
        }
    } catch {
        Write-Output "Error: $($_.Exception.Message) | $($_.ScriptStackTrace)"
    }
}
