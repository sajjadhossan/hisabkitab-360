Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sajjad\.gemini\antigravity-ide\brain\1dc0a3d1-afbb-442a-97b3-bb69e7806d38\.user_uploaded\media_1792730703572.jpg"
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$origW = $srcBmp.Width
$origH = $srcBmp.Height
Write-Output "Source Dimensions: $origW x $origH"

# 1. Master 1024x1024 Icon for macOS & Desktop
$master1024 = New-Object System.Drawing.Bitmap(1024, 1024)
$g1024 = [System.Drawing.Graphics]::FromImage($master1024)
$g1024.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1024.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g1024.Clear([System.Drawing.Color]::White)

$scale = [Math]::Min(960 / $origW, 960 / $origH)
$destW = [int]($origW * $scale)
$destH = [int]($origH * $scale)
$destX = [int]((1024 - $destW) / 2)
$destY = [int]((1024 - $destH) / 2)
$g1024.DrawImage($srcBmp, $destX, $destY, $destW, $destH)
$g1024.Dispose()

$outMasterPaths = @(
    "somiti-360\public\Somiti_360_Official_Logo.png",
    "public\Somiti_360_Official_Logo.png",
    "somiti-360\public\logo-512.png",
    "public\logo-512.png",
    "somiti-360\public\logo.png",
    "public\logo.png"
)

foreach ($p in $outMasterPaths) {
    $dir = Split-Path $p -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $master1024.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Successfully saved: $p (Size: 1024x1024)"
}

# 2. Crop Circular Emblem (The 3 people + arrow chart + 360 orbit)
# The image is 1024 x 576.
# Circle center: x = 517, y = 176, radius = 158
$centerX = 517
$centerY = 176
$radius = 160

$cropX = [int]($centerX - $radius)
$cropY = [int]($centerY - $radius)
$cropD = [int]($radius * 2)

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropD, $cropD)
$emblemCrop = $srcBmp.Clone($cropRect, $srcBmp.PixelFormat)

$emblem512 = New-Object System.Drawing.Bitmap(512, 512)
$gEmb = [System.Drawing.Graphics]::FromImage($emblem512)
$gEmb.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gEmb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gEmb.Clear([System.Drawing.Color]::Transparent)
$gEmb.DrawImage($emblemCrop, 0, 0, 512, 512)
$gEmb.Dispose()
$emblemCrop.Dispose()

# Make white/off-white background transparent
for ($y = 0; $y -lt 512; $y++) {
    for ($x = 0; $x -lt 512; $x++) {
        $c = $emblem512.GetPixel($x, $y)
        if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
            $emblem512.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        }
    }
}

$emblemPaths = @(
    "somiti-360\public\somiti-emblem.png",
    "public\somiti-emblem.png",
    "somiti-360\public\favicon.png",
    "public\favicon.png"
)

foreach ($ep in $emblemPaths) {
    $emblem512.Save($ep, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Successfully saved: $ep (Size: 512x512 transparent)"
}

# 3. Android Mipmap Icons
$androidMipmaps = @{
    "somiti-360\android\app\src\main\res\mipmap-mdpi\ic_launcher.png" = 48
    "somiti-360\android\app\src\main\res\mipmap-hdpi\ic_launcher.png" = 72
    "somiti-360\android\app\src\main\res\mipmap-xhdpi\ic_launcher.png" = 96
    "somiti-360\android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" = 144
    "somiti-360\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" = 192
    "android\app\src\main\res\mipmap-mdpi\ic_launcher.png" = 48
    "android\app\src\main\res\mipmap-hdpi\ic_launcher.png" = 72
    "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png" = 96
    "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" = 144
    "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" = 192
}

foreach ($mPath in $androidMipmaps.Keys) {
    $size = $androidMipmaps[$mPath]
    $mDir = Split-Path $mPath -Parent
    if (Test-Path $mDir) {
        $mBmp = New-Object System.Drawing.Bitmap($size, $size)
        $gM = [System.Drawing.Graphics]::FromImage($mBmp)
        $gM.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gM.DrawImage($master1024, 0, 0, $size, $size)
        $gM.Dispose()
        $mBmp.Save($mPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $mBmp.Dispose()
        Write-Output "Saved Android Icon ($size x $size): $mPath"
    }
}

$master1024.Dispose()
$emblem512.Dispose()
$srcBmp.Dispose()
Write-Output "All platform icons generated successfully!"
