# Decrypt classpoint-secrets.zip.enc (AES-256-CBC, PBKDF2-SHA256)
param(
  [Parameter(Mandatory = $true)]
  [string]$Passphrase,
  [string]$InputPath = "classpoint-secrets.zip.enc",
  [string]$OutputZip = "classpoint-secrets.zip"
)

$ErrorActionPreference = 'Stop'

if (!(Test-Path $InputPath)) { throw "Missing input file: $InputPath" }

$bytes = [System.IO.File]::ReadAllBytes($InputPath)
if ($bytes.Length -lt 33) { throw "Input file is too small to be valid." }

$salt = New-Object byte[] 16
$iv = New-Object byte[] 16
[System.Buffer]::BlockCopy($bytes, 0, $salt, 0, 16)
[System.Buffer]::BlockCopy($bytes, 16, $iv, 0, 16)
$cipherLen = $bytes.Length - 32
$cipher = New-Object byte[] $cipherLen
[System.Buffer]::BlockCopy($bytes, 32, $cipher, 0, $cipherLen)

$kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Passphrase, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$key = $kdf.GetBytes(32)
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
$aes.Key = $key
$aes.IV = $iv
$decryptor = $aes.CreateDecryptor()
$plain = $decryptor.TransformFinalBlock($cipher, 0, $cipher.Length)

[System.IO.File]::WriteAllBytes($OutputZip, $plain)
Write-Host "Decrypted to $OutputZip"
