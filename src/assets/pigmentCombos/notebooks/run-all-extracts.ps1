# Pigment Extract Pipeline - Sequential Script
# Runs extraction notebooks for all CSV partitions

$ErrorActionPreference = "Stop"

# Dependency validation
Write-Host "Validating dependencies..." -ForegroundColor Cyan

# Check for dotnet
$dotnetPath = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetPath) {
    Write-Host "ERROR: dotnet is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install .NET SDK from: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] dotnet found: $($dotnetPath.Source)" -ForegroundColor Green

# Check for dotnet-repl
try {
    $replPath = Get-Command dotnet-repl -ErrorAction Stop
    Write-Host "  [OK] dotnet-repl found: $($replPath.Source)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: dotnet-repl is not installed" -ForegroundColor Red
    Write-Host "Please install with: dotnet tool install --global dotnet-repl" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BASE_DIR = Join-Path $SCRIPT_DIR ".."
$RAW_DIR = Join-Path $BASE_DIR "data\raw"
$EXTRACTED_DIR = Join-Path $BASE_DIR "data\extracted"
$RUNS_DIR = Join-Path $BASE_DIR ".runs"

# Create runs directory
if (-not (Test-Path $RUNS_DIR)) {
    New-Item -ItemType Directory -Path $RUNS_DIR | Out-Null
}

# Get all CSV files
$csvFiles = Get-ChildItem -Path $RAW_DIR -Filter "Pigments-*.csv" | Sort-Object Name

Write-Host "Found $($csvFiles.Count) CSV files to process" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $csvFiles) {
    $filename = $file.Name
    # Extract date: Pigments-2025-12-13.csv -> 2025-12-13
    $date = $filename -replace '^Pigments-(.*)\.csv$', '$1'
    $notebookPath = Join-Path $SCRIPT_DIR "01-ExtractData.ipynb"
    $inputCsv = Join-Path $RAW_DIR $filename
    $outputFilename = "ExtractedPigments-$date.json"
    $runTimestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $outputPath = Join-Path $RUNS_DIR "01-ExtractData-RUN-${runTimestamp}-${date}.ipynb"
    
    Write-Host "Processing $filename..." -ForegroundColor Yellow
    
    # Check if CSV file exists
    if (-not (Test-Path $inputCsv)) {
        Write-Host "  [SKIP] CSV file not found: $inputCsv" -ForegroundColor Yellow
        $failCount++
        Write-Host ""
        continue
    }
    
    dotnet repl --run $notebookPath --exit-after-run `
      --input inputCsv=$inputCsv `
      --input outputDir=$EXTRACTED_DIR `
      --input outputFilename=$outputFilename `
      --output-path $outputPath `
      --output-format ipynb
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Successfully extracted data" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  [FAIL] Extraction failed" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Extraction Complete!" -ForegroundColor Green
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor Red
Write-Host "  Total:   $($csvFiles.Count)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "JSON files saved to: $EXTRACTED_DIR" -ForegroundColor Cyan
Write-Host "Run notebooks saved to: $RUNS_DIR" -ForegroundColor Cyan
