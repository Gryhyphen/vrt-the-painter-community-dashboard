import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the enriched pigments JSON file
const filePath = path.join(__dirname, '..', '..', '..', '..', 'src', 'assets', 'pigmentCombos', 'data', 'enriched', 'enrichedPigments.json');

// Read and parse the JSON file
const data = fs.readFileSync(filePath, 'utf8');
const HistoryData = JSON.parse(data);

// Sort the data using the specified rules
const sorted = [...HistoryData].sort((a, b) => {
  // 1. primary: sort by date (newest first)
  const dateDiff =
    new Date(b.datePainted).getTime() -
    new Date(a.datePainted).getTime();
  if (dateDiff !== 0) return dateDiff;

  // 2. secondary: sort by firstResultDiscovery (true first)
  if (a.firstResultDiscovery !== b.firstResultDiscovery) {
    return a.firstResultDiscovery ? -1 : 1;
  }

  // 3. tertiary: sort by painter presence (known painters first)
  const aHasPainter = !!a.painter && a.painter.trim() !== "";
  const bHasPainter = !!b.painter && b.painter.trim() !== "";
  if (aHasPainter !== bHasPainter) {
    return aHasPainter ? -1 : 1;
  }

  // 4. final: sort by result, but push "abstract mess" to the end
  const aIsAbstract = a.result.toLowerCase() === "abstract mess";
  const bIsAbstract = b.result.toLowerCase() === "abstract mess";

  if (aIsAbstract && !bIsAbstract) return 1;   // a goes after b
  if (!aIsAbstract && bIsAbstract) return -1;  // b goes after a

  // normal alphabetical compare if neither/both are "abstract mess"
  return a.result.localeCompare(b.result, undefined, { sensitivity: "base" });
});

// Write sorted data back to the file (overwrite)
fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf8');

console.log(`Sorted ${sorted.length} entries and overwrote ${filePath}`);