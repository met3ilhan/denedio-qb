# Generates e2e/fixtures/live-smoke-tarih-question.png (synthetic Turkish history MCQ).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\e2e\fixtures"
$outPath = Join-Path $outDir "live-smoke-tarih-question.png"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$bmp = New-Object System.Drawing.Bitmap 860, 520
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font("Arial", 22)
$brush = [System.Drawing.Brushes]::Black
$lines = @(
  "LIVE-SMOKE-8842",
  "Kurtulus Savasi hangi yilda baslamistir?",
  "A) 1918",
  "B) 1919",
  "C) 1920",
  "D) 1921"
)
$y = 40
foreach ($line in $lines) {
  $g.DrawString($line, $font, $brush, 40, $y)
  $y += 56
}
$g.Dispose()
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Wrote $outPath"
