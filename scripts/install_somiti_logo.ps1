Add-Type -AssemblyName System.Drawing

$src = "C:\Users\sajjad\.gemini\antigravity-ide\brain\435d88a9-d8b0-40e1-be82-91765bfae88a\somiti_360_logo_1792689951270.jpg"
if (!(Test-Path $src)) {
    Write-Error "Source logo file not found: $src"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($src)
Write-Host "Original Image: $($img.Width)x$($img.Height)"

function Save-ResizedImage {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath
    )
    $destDir = Split-Path -Parent $DestinationPath
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $graphics.Dispose()
    $bmp.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $DestinationPath ($Width x $Height)"
}

# 1. Somiti 360 Web / Public Assets
Save-ResizedImage -Image $img -Width 512 -Height 512 -DestinationPath "somiti-360\public\logo-512.png"
Save-ResizedImage -Image $img -Width 256 -Height 256 -DestinationPath "somiti-360\public\logo.png"
Save-ResizedImage -Image $img -Width 256 -Height 256 -DestinationPath "somiti-360\public\somiti-logo.png"
Save-ResizedImage -Image $img -Width 64 -Height 64 -DestinationPath "somiti-360\public\favicon.png"

# 2. Main HisabKitab 360 Public Assets
Save-ResizedImage -Image $img -Width 256 -Height 256 -DestinationPath "public\somiti-logo.png"

# 3. Direct Root Asset for User Download & Telegram Bot
Save-ResizedImage -Image $img -Width 1024 -Height 1024 -DestinationPath "Somiti_360_Official_Logo.png"
Copy-Item $src "Somiti_360_Official_Logo.jpg" -Force

# 4. Android App Launcher Mipmap Icons
$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$folder]
    $dir = "somiti-360\android\app\src\main\res\$folder"
    Save-ResizedImage -Image $img -Width $size -Height $size -DestinationPath "$dir\ic_launcher.png"
    Save-ResizedImage -Image $img -Width $size -Height $size -DestinationPath "$dir\ic_launcher_round.png"
    Save-ResizedImage -Image $img -Width $size -Height $size -DestinationPath "$dir\ic_launcher_foreground.png"
}

$img.Dispose()
Write-Host "All multi-platform Somiti 360 logos installed successfully!"
