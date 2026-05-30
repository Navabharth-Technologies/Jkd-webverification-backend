# Final Force Injection Script (V2 - Smart Paths)
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($PSScriptRoot)) { $PSScriptRoot = Get-Location }

# Identify dist folder
$distDir = Join-Path $PSScriptRoot "adminfrontend2/dist"
if (!(Test-Path $distDir)) {
    # Fallback if already inside adminfrontend2
    $distDir = Join-Path $PSScriptRoot "dist"
}

Write-Host "TARGET DIST DIRECTORY: $distDir"

# Identify fonts source and target
$fontsSourceDir = Join-Path $PSScriptRoot "adminfrontend2/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts"
if (!(Test-Path $fontsSourceDir)) {
    $fontsSourceDir = Join-Path $PSScriptRoot "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts"
}

$fontsTargetDir = Join-Path $distDir "fonts"
if (!(Test-Path $fontsTargetDir)) {
    New-Item -Path $fontsTargetDir -ItemType Directory -Force | Out-Null
}

if (Test-Path $fontsSourceDir) {
    Copy-Item -Path (Join-Path $fontsSourceDir "*.ttf") -Destination $fontsTargetDir -Force
    Write-Host "SUCCESS: Copied local TTF fonts to $fontsTargetDir"
} else {
    Write-Warning "FONTS SOURCE DIRECTORY NOT FOUND: $fontsSourceDir"
}

$iconCode = @'
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" />
<style>
  /* Global Fixes */
  @font-face {
    font-family: 'MaterialIcons';
    src: url('/web-verification-host/fonts/MaterialIcons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Material Icons';
    src: url('/web-verification-host/fonts/MaterialIcons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Ionicons';
    src: url('/web-verification-host/fonts/Ionicons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'ionicons';
    src: url('/web-verification-host/fonts/Ionicons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Material Community Icons';
    src: url('/web-verification-host/fonts/MaterialCommunityIcons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'MaterialCommunityIcons';
    src: url('/web-verification-host/fonts/MaterialCommunityIcons.ttf') format('truetype');
  }
  @font-face {
    font-family: 'FontAwesome';
    src: url('/web-verification-host/fonts/FontAwesome.ttf') format('truetype');
  }
  @font-face {
    font-family: 'FontAwesome5Free-Solid';
    src: url('/web-verification-host/fonts/FontAwesome5_Solid.ttf') format('truetype');
  }
  @font-face {
    font-family: 'FontAwesome5Free-Regular';
    src: url('/web-verification-host/fonts/FontAwesome5_Regular.ttf') format('truetype');
  }
  @font-face {
    font-family: 'FontAwesome5Brands-Regular';
    src: url('/web-verification-host/fonts/FontAwesome5_Brands.ttf') format('truetype');
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px #1a1f37 inset !important;
    -webkit-text-fill-color: white !important;
  }
</style>
'@

function Inject-At-Head($filePath) {
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        if ($content.Contains("</head>") -and !($content.Contains("fonts.googleapis.com"))) {
            $newContent = $content.Replace("</head>", "$iconCode</head>")
            Set-Content $filePath $newContent -Encoding UTF8
            Write-Host "SUCCESS: Injected icons into $(Split-Path $filePath -Leaf)"
        } elseif ($content.Contains("fonts.googleapis.com")) {
            Write-Host "SKIP: Icons already present in $(Split-Path $filePath -Leaf)"
        } else {
            Write-Warning "HEAD TAG NOT FOUND IN: $(Split-Path $filePath -Leaf)"
        }
    } else {
        Write-Warning "FILE NOT FOUND: $filePath"
    }
}

# 1. Ensure .nojekyll
$noJekyllPath = Join-Path $distDir ".nojekyll"
if (!(Test-Path $noJekyllPath)) {
    New-Item -Path $noJekyllPath -ItemType File -Force
    Write-Host "CREATED: .nojekyll"
}

# 2. Inject into ALL HTML files (Dashboard, Staff, Retailer, Vendor, etc.)
Get-ChildItem $distDir -Filter "*.html" | ForEach-Object {
    Inject-At-Head $_.FullName
}

# 3. Create/Update 404.html from index.html (Safety net for refreshes)
$indexPath = Join-Path $distDir "index.html"
$page404Path = Join-Path $distDir "404.html"
if (Test-Path $indexPath) {
    Copy-Item $indexPath $page404Path -Force
    Write-Host "CREATED/UPDATED: 404.html"
}
