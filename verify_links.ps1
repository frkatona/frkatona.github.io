$htmlPath = "s:\S Creative\Code\WebDevScratch\GPT_Github\frkatona.github.io\index.html"
$rootDir = "s:\S Creative\Code\WebDevScratch\GPT_Github\frkatona.github.io"

$content = Get-Content -Path $htmlPath -Raw

# Find href and src
$pattern = '(?:href|src)=["'']([^"'']+)["'']'
$matches = [regex]::Matches($content, $pattern)

$broken = @()
$working = @()
$external = @()

foreach ($match in $matches) {
    $link = $match.Groups[1].Value
    
    if ($link -match "^(http|https|mailto|#)") {
        $external += $link
        continue
    }
    
    # Decode URL
    $decodedLink = [System.Web.HttpUtility]::UrlDecode($link)
    
    # Construct path
    $fullPath = Join-Path $rootDir $decodedLink
    
    if (Test-Path $fullPath) {
        $working += $decodedLink
    } else {
        $broken += $decodedLink
    }
}

Write-Host "Found $($working.Count) working local links."
Write-Host "Found $($broken.Count) broken local links."
Write-Host "Found $($external.Count) external/anchor links."

if ($broken.Count -gt 0) {
    Write-Host "`nBroken Links:"
    $broken | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "`nAll local links are valid!"
}
