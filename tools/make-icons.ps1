Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\icons'
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

function New-ClubIcon {
  param(
    [string]$Path,
    [int]$Size,
    [double]$CircleRatio,
    [double]$FontRatio
  )

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)

  # background: deep navy gradient
  $bg1 = [System.Drawing.Color]::FromArgb(255, 17, 24, 40)
  $bg2 = [System.Drawing.Color]::FromArgb(255, 8, 11, 18)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg1, $bg2, 60.0)
  $g.FillRectangle($bgBrush, $rect)

  # crest circle
  $r = [int]($Size * $CircleRatio)
  $cx = [int]($Size / 2)
  $cy = [int]($Size / 2)
  $c1 = [System.Drawing.Color]::FromArgb(255, 74, 138, 255)
  $c2 = [System.Drawing.Color]::FromArgb(255, 24, 58, 150)
  $circleRect = New-Object System.Drawing.Rectangle(($cx - $r), ($cy - $r), (2 * $r), (2 * $r))
  $circleBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($circleRect, $c1, $c2, 55.0)
  $g.FillEllipse($circleBrush, $circleRect)

  # thin light edge
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), [float]([Math]::Max(1, $Size / 256)))
  $g.DrawEllipse($pen, $circleRect)

  # letters "AT" (cyrillic A + T) built from code points so the file stays ASCII
  $text = [string]([char]0x0410) + [string]([char]0x0422)
  $fontSize = [float]($Size * $FontRatio)
  $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString($text, $font, $white, (New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)), $fmt)

  # subtle top highlight
  $hl = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 255, 255, 255))
  $g.FillEllipse($hl, ($cx - $r), ($cy - $r), (2 * $r), [int]($r * 0.7))

  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("OK " + $Path)
}

New-ClubIcon -Path (Join-Path $out 'icon-192.png') -Size 192 -CircleRatio 0.40 -FontRatio 0.27
New-ClubIcon -Path (Join-Path $out 'icon-512.png') -Size 512 -CircleRatio 0.40 -FontRatio 0.27
New-ClubIcon -Path (Join-Path $out 'icon-maskable-512.png') -Size 512 -CircleRatio 0.31 -FontRatio 0.21
Write-Output 'DONE'
