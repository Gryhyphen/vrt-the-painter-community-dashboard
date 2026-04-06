# Run 01-ExtractData.ipynb for all JSON files in the extracted directory
# This script iterates over JSON files and runs the dotnet repl notebook

$notebooksDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$parentDir = Split-Path -Parent $notebooksDir
$dataRawDir = Join-Path $parentDir "data\raw"
$dataExtractedDir = Join-Path $parentDir "data\extracted"

# Get all JSON files from the extracted directory
$jsonFiles = Get-ChildItem -Path $dataExtractedDir -Filter "*.json"

Write-Host "Found $($jsonFiles.Count) JSON file(s) to process`n"

foreach ($jsonFile in $jsonFiles) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Processing: $($jsonFile.Name)" -ForegroundColor Yellow
    
    # Extract the date from the JSON filename (format: ExtractedPigments-YYYY-MM-DD.json)
    $jsonName = $jsonFile.Name
    $dateMatch = [regex]::Match($jsonName, 'ExtractedPigments-(\d{4}-\d{2}-\d{2})\.json')
    
    if ($dateMatch.Success) {
        $date = $dateMatch.Groups[1].Value
        $csvFilename = "Pigments-$date.csv"
        $csvPath = Join-Path $dataRawDir $csvFilename
        
        if (Test-Path $csvPath) {
            Write-Host "  CSV file found: $csvFilename" -ForegroundColor Green
            
            # Generate output filename with timestamp
            $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
            $outputFilename = "01-ExtractData-RUN-${timestamp}-${csvFilename}.ipynb"
            
            Write-Host "  Running dotnet repl..." -ForegroundColor Green
            
            # Run the dotnet repl command from the notebooks directory
            dotnet repl --run "01-ExtractData.ipynb" --exit-after-run `
              --input inputCsv=$csvPath `
              --input outputDir=$dataExtractedDir `
              --input outputFilename=$jsonName `
              --output-path $outputFilename `
              --output-format ipynb
            
            Write-Host "  Completed: $outputFilename" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: CSV file not found: $csvPath" -ForegroundColor Red
            Write-Host "  Skipping this file.`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARNING: Could not parse date from filename: $jsonName" -ForegroundColor Red
        Write-Host "  Skipping this file.`n" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All files processed.`n" -ForegroundColor Cyan

# List the generated run notebooks
Write-Host "Generated run notebooks:" -ForegroundColor Cyan
Get-ChildItem -Path $notebooksDir -Filter "01-ExtractData-RUN-*.ipynb" | Select-Object Name