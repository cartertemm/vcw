Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $projectRoot 'assets'
New-Item -ItemType Directory -Force $assets | Out-Null
foreach ($size in @(180, 192, 512)) {
	$bmp = New-Object System.Drawing.Bitmap($size, $size)
	$g = [System.Drawing.Graphics]::FromImage($bmp)
	$g.SmoothingMode = 'AntiAlias'
	$g.TextRenderingHint = 'AntiAlias'
	$g.Clear([System.Drawing.Color]::FromArgb(255, 30, 64, 175))
	$font = New-Object System.Drawing.Font('Segoe UI', [int]($size * 0.34), [System.Drawing.FontStyle]::Bold)
	$format = New-Object System.Drawing.StringFormat
	$format.Alignment = 'Center'
	$format.LineAlignment = 'Center'
	$rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
	$g.DrawString('CP', $font, [System.Drawing.Brushes]::White, $rect, $format)
	$g.Dispose()
	$bmp.Save((Join-Path $assets "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
	$bmp.Dispose()
}
Write-Output 'Icons written to assets/'
