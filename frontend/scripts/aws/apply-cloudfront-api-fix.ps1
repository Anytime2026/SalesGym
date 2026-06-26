# CloudFront: API 404 が SPA HTML に置き換わる問題を修正
# Usage: powershell -ExecutionPolicy Bypass -File frontend/scripts/aws/apply-cloudfront-api-fix.ps1

$ErrorActionPreference = "Stop"

$DIST_ID = "E2TK0UGVYW3AWD"
$FUNCTION_NAME = "syodan-spa-router"
$ROUTER_FILE = (Resolve-Path (Join-Path $PSScriptRoot "cloudfront-spa-router.js")).Path

function Get-DistConfig {
    $raw = aws cloudfront get-distribution-config --id $DIST_ID --output json | ConvertFrom-Json
    return @{
        ETag = $raw.ETag
        Config = $raw.DistributionConfig
    }
}

Write-Host "Creating/updating CloudFront Function $FUNCTION_NAME ..."
$exists = $false
try {
    aws cloudfront describe-function --name $FUNCTION_NAME --stage DEVELOPMENT --output json | Out-Null
    $exists = $true
} catch {
    $exists = $false
}

if ($exists) {
    $desc = aws cloudfront describe-function --name $FUNCTION_NAME --stage DEVELOPMENT --output json | ConvertFrom-Json
    aws cloudfront update-function `
        --name $FUNCTION_NAME `
        --if-match $desc.ETag `
        --function-config "Comment=SPA router for Syodan frontend,Runtime=cloudfront-js-2.0" `
        --function-code "fileb://$ROUTER_FILE" `
        --output json | Out-Null
} else {
    aws cloudfront create-function `
        --name $FUNCTION_NAME `
        --function-config "Comment=SPA router for Syodan frontend,Runtime=cloudfront-js-2.0" `
        --function-code "fileb://$ROUTER_FILE" `
        --output json | Out-Null
}

$desc = aws cloudfront describe-function --name $FUNCTION_NAME --stage DEVELOPMENT --output json | ConvertFrom-Json
$publish = aws cloudfront publish-function --name $FUNCTION_NAME --if-match $desc.ETag --output json | ConvertFrom-Json
$functionArn = $publish.FunctionSummary.FunctionMetadata.FunctionARN
Write-Host "Published function: $functionArn"

$dist = Get-DistConfig
$config = $dist.Config

$config.CustomErrorResponses = @{ Quantity = 0 }
$config.DefaultCacheBehavior.FunctionAssociations = @{
    Quantity = 1
    Items = @(
        @{
            EventType = "viewer-request"
            FunctionARN = $functionArn
        }
    )
}

$configPath = Join-Path $env:TEMP "cf-dist-config.json"
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 30))

Write-Host "Updating CloudFront distribution $DIST_ID ..."
aws cloudfront update-distribution `
    --id $DIST_ID `
    --if-match $dist.ETag `
    --distribution-config "file://$($configPath.Replace('\','/'))" `
    --output json | Out-Null

Write-Host "Done. CloudFront deployment may take several minutes."
