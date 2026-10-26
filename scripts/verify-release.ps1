param(
  [Parameter(Mandatory = $true)][string]$Apk,
  [string]$Sdk = "$env:LOCALAPPDATA/Android/Sdk",
  [string]$BuildTools = '37.0.0',
  [int]$VersionCode = 2,
  [string]$VersionName = '1.0.1'
)
$ErrorActionPreference = 'Stop'
$apkPath = (Resolve-Path -LiteralPath $Apk).Path
$toolsPath = Join-Path $Sdk "build-tools/$BuildTools"
$signature = & (Join-Path $toolsPath 'apksigner.bat') verify --verbose --print-certs $apkPath
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }
$expectedCertificate = '09047d9da4fff6afe58c90fb4a39f0183b0432d31d237b04ea9d0216e0dd4b24'
if (($signature -join "`n") -notmatch 'Number of signers: 1(?:\r?\n|$)') {
  throw 'Expected exactly one APK signer'
}
if (($signature -join "`n") -notmatch "(?:Signer #1|V2 Signer):? certificate SHA-256 digest: $expectedCertificate") {
  throw 'APK is not signed with the existing Mimik EAS production certificate'
}
$badging = & (Join-Path $toolsPath 'aapt2.exe') dump badging $apkPath
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect APK manifest' }
$manifest = $badging -join "`n"
if ($manifest -notmatch "package: name='com.robertbetancourt.mimik' versionCode='$VersionCode' versionName='$VersionName'") {
  throw 'Unexpected package or release version'
}
if ($manifest -match 'application-debuggable') { throw 'Refusing a debuggable APK' }
foreach ($permission in @('RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'ACTIVITY_RECOGNITION', 'SYSTEM_ALERT_WINDOW', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK')) {
  if ($manifest -match "uses-permission[^\r\n]*android\.permission\.$permission'") {
    throw "Unexpected permission: $permission"
  }
}
$signature | Select-String 'Verified using|certificate SHA-256'
$badging | Select-String '^package:|^uses-permission:|^native-code:'
Get-FileHash -LiteralPath $apkPath -Algorithm SHA256
Write-Output 'Release verification passed: production signer, package/version, non-debuggable, restricted permissions.'
