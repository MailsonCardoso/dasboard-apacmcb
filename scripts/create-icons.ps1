Add-Type -AssemblyName System.Drawing

function Create-Icon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 39, 84))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    $padding = [int]($size * 0.15)
    $innerSize = $size - (2 * $padding)
    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 58, 138))
    $g.FillRectangle($innerBrush, $padding, $padding, $innerSize, $innerSize)

    $fontFamily = New-Object System.Drawing.FontFamily('Arial')
    $fontSize = [float]($size * 0.35)
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('FC', $font, $textBrush, $rect, $sf)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-Icon 192 'public/icon-192.png'
Create-Icon 512 'public/icon-512.png'
Create-Icon 64 'public/favicon.png'
Write-Host 'Icons created successfully!'
