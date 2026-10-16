$assetsDir = "android\app\src\main\assets\public"
$files = Get-ChildItem -Recurse $assetsDir -File
$sum = 0
foreach ($f in $files) {
    $sum += $f.Length
}
$mb = [math]::Round($sum / 1MB, 2)
Write-Host "Total Android assets/public size: $mb MB"
if ($mb -gt 8.0) {
    Write-Host "WARNING: Asset size exceeds 8MB cap!"
} else {
    Write-Host "SUCCESS: Asset size is within the allowed safe limit (under 8MB)."
}
