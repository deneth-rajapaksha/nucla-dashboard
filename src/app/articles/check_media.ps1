param (
    [string]$DirectoryPath
)

$ErrorActionPreference = 'Stop'
$files = Get-ChildItem -Path $DirectoryPath -Filter "*.docx"
$hasMedia = $false

foreach ($file in $files) {
    $temp = Join-Path $env:TEMP ([guid]::NewGuid().ToString())
    $zipPath = "$temp.zip"
    Copy-Item -Path $file.FullName -Destination $zipPath
    
    Expand-Archive -Path $zipPath -DestinationPath $temp -Force
    $mediaPath = Join-Path $temp "word\media"
    
    if (Test-Path $mediaPath) {
        Write-Host "FOUND MEDIA IN: $($file.Name)"
        Get-ChildItem -Path $mediaPath | Select-Object Name | Out-String | Write-Host
        $hasMedia = $true
    }
    
    Remove-Item -Path $temp -Recurse -Force
    Remove-Item -Path $zipPath -Force
}

if (-not $hasMedia) {
    Write-Host "NO MEDIA FOUND"
}
