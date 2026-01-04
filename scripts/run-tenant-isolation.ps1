param(
  [Parameter(Mandatory = $true)]
  [string]$AppsyncUrl,
  [Parameter(Mandatory = $true)]
  [string]$JwtSchoolA,
  [Parameter(Mandatory = $true)]
  [string]$JwtSchoolB,
  [string]$SchoolAId,
  [string]$SchoolBId,
  [string]$InvoiceNoA,
  [string]$InvoiceIdA,
  [string]$CampaignIdA,
  [switch]$AllowWriteTests
)

$env:APPSYNC_URL = $AppsyncUrl
$env:JWT_SCHOOL_A = $JwtSchoolA
$env:JWT_SCHOOL_B = $JwtSchoolB

if ($SchoolAId) { $env:SCHOOL_A_ID = $SchoolAId }
if ($SchoolBId) { $env:SCHOOL_B_ID = $SchoolBId }
if ($InvoiceNoA) { $env:INVOICE_NO_A = $InvoiceNoA }
if ($InvoiceIdA) { $env:INVOICE_ID_A = $InvoiceIdA }
if ($CampaignIdA) { $env:CAMPAIGN_ID_A = $CampaignIdA }
if ($AllowWriteTests.IsPresent) { $env:ALLOW_WRITE_TESTS = "1" }

node tenant-isolation-smoke.js
