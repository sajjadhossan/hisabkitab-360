Add-Type -AssemblyName System.Drawing

$srcLogo = "C:\Users\sajjad\.gemini\antigravity-ide\brain\ac93a55f-d0da-4c61-9f2c-39aedd136926\hisabkitab_360_logo_1792163699462.jpg"
$srcWall = "C:\Users\sajjad\.gemini\antigravity-ide\brain\ac93a55f-d0da-4c61-9f2c-39aedd136926\hisabkitab_360_wallpaper_1792163741866.jpg"

$brandDir = "c:\Users\sajjad\.gemini\antigravity-ide\scratch\hisabkitab-360\branding"
if (-not (Test-Path $brandDir)) {
    New-Item -ItemType Directory -Path $brandDir -Force | Out-Null
}

function Resize-ImageFile {
    param(
        [string]$source,
        [string]$destination,
        [int]$targetWidth,
        [int]$targetHeight
    )
    $sourceImage = [System.Drawing.Image]::FromFile($source)
    $bitmap = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, $targetWidth, $targetHeight)
    $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $sourceImage.Dispose()
}

Write-Host "Creating HQ Deliverables for User..."
Resize-ImageFile $srcLogo (Join-Path $brandDir "HisabKitab360_Logo_1024x1024.png") 1024 1024
Resize-ImageFile $srcLogo (Join-Path $brandDir "HisabKitab360_Logo_512x512.png") 512 512
Resize-ImageFile $srcWall (Join-Path $brandDir "HisabKitab360_Wallpaper_1920x1080.png") 1920 1080
Write-Host "Branding deliverables ready at: $brandDir"

Write-Host "Creating Web & PC assets..."
$publicDir = "c:\Users\sajjad\.gemini\antigravity-ide\scratch\hisabkitab-360\public"
Resize-ImageFile $srcLogo (Join-Path $publicDir "logo.png") 192 192
Resize-ImageFile $srcLogo (Join-Path $publicDir "logo-512.png") 512 512
Resize-ImageFile $srcLogo (Join-Path $publicDir "favicon.png") 64 64
Write-Host "Public assets ready."

Write-Host "Updating Android icons..."
$androidRes = "c:\Users\sajjad\.gemini\antigravity-ide\scratch\hisabkitab-360\android\app\src\main\res"
$densities = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

foreach ($d in $densities) {
    $targetDir = Join-Path $androidRes $d.Folder
    if (Test-Path $targetDir) {
        $s = $d.Size
        Resize-ImageFile $srcLogo (Join-Path $targetDir "ic_launcher.png") $s $s
        Resize-ImageFile $srcLogo (Join-Path $targetDir "ic_launcher_round.png") $s $s
        Resize-ImageFile $srcLogo (Join-Path $targetDir "ic_launcher_foreground.png") $s $s
    }
}

$splashFiles = Get-ChildItem -Recurse -Path $androidRes -Filter "splash.png"
foreach ($f in $splashFiles) {
    Resize-ImageFile $srcLogo $f.FullName 480 480
}

Write-Host "All assets generated successfully!"
