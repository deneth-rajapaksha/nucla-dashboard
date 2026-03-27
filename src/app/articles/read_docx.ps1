param (
    [string]$DirectoryPath
)

$ErrorActionPreference = 'Stop'
$files = Get-ChildItem -Path $DirectoryPath -Filter "*.docx"

foreach ($file in $files) {
    Write-Host "--- $($file.Name) ---"
    $temp = Join-Path $env:TEMP ([guid]::NewGuid().ToString())
    $zipPath = "$temp.zip"
    Copy-Item -Path $file.FullName -Destination $zipPath
    
    Expand-Archive -Path $zipPath -DestinationPath $temp -Force
    $docXml = Join-Path $temp "word\document.xml"
    if (Test-Path $docXml) {
        $xmlContent = Get-Content $docXml -Raw
        # Replace <w:p> tags with new lines
        $text = $xmlContent -replace '<w:p(?: [^>]*)?>', "`n"
        # Remove all other tags
        $text = $text -replace '<[^>]+>', ''
        Write-Host $text.Trim()
    } else {
        Write-Host "No document.xml found in $($file.Name)"
    }
    
    Remove-Item -Path $temp -Recurse -Force
    Remove-Item -Path $zipPath -Force
    Write-Host "`n"
}
