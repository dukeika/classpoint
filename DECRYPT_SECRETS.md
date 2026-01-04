# Decrypt secrets archive

1) Copy `classpoint-secrets.zip.enc` and `decrypt-secrets.ps1` to the same folder.
2) Run in PowerShell:

   .\decrypt-secrets.ps1 -Passphrase "<your passphrase>"

3) This creates `classpoint-secrets.zip`.
4) Extract the zip, then delete the zip if desired.
