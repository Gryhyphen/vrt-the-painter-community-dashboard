import { spawn, execFile as execFileCallback } from 'node:child_process';
import { join } from 'node:path';
import { exit } from 'node:process';
import { promisify } from 'node:util';

// Manually wrap the callback-based API into a Promise
const execFile = promisify(execFileCallback);

// ==================== CONSTANTS ====================
const BASE_DIR = join(import.meta.dirname, '..');
const RUNS_DIR = join(BASE_DIR, '.runs');
const NOTEBOOKS_DIR = join(BASE_DIR, 'notebooks');
const NOTEBOOK_PATH = join(NOTEBOOKS_DIR, '03-EnrichData.ipynb');

// ==================== HELPER FUNCTIONS ====================

/**
 * Validates dependencies
 */
const validateDependencies = async (): Promise<void> => {
  console.log('🚀 Validating dependencies...');

  const checks = [
    { name: 'dotnet', cmd: 'dotnet', link: 'https://dotnet.microsoft.com/download' },
    { name: 'dotnet-repl', cmd: 'dotnet-repl', link: 'dotnet tool install --global dotnet-repl' }
  ];

  for (const { name, cmd, link } of checks) {
    try {
      await execFile(cmd, ['--version']);
      console.log(`  [OK] ${name} found`);
    } catch {
      console.error(`❌ ERROR: ${name} is not installed or not in PATH.`);
      console.info(`👉 Action: ${link}`);
      exit(1);
    }
  }
};

/**
 * Spawns the dotnet-repl process for enrichment
 */
const runEnrichment = (runOutputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args = [
      'repl', '--run', NOTEBOOK_PATH, '--exit-after-run',
      '--input', `inputDir=../data/cleaned`,
      '--input', `outputDir=../data/enriched`,
      '--input', `outputFilename=enrichedPigments.json`,
      '--input', `submissionsCsv=../../pigmentSubmissions/pigmentSubmissions.csv`,
      '--output-path', runOutputPath,
      '--output-format', 'ipynb'
    ];

    const child = spawn('dotnet', args, { stdio: 'inherit', cwd: 'notebooks' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
};

// ==================== MAIN ====================
const main = async (): Promise<void> => {
  await validateDependencies();

  // Generate timestamp and run output path
  const runTimestamp = new Date().toISOString()
    .replace('T', '-')
    .split('.')[0]
    .replace(/-/g, '')
    .replace(/:/g, '-');
  const runOutputPath = join(RUNS_DIR, `03-EnrichData-RUN-${runTimestamp}.ipynb`);

  // Run enrichment (single execution)
  await runEnrichment(runOutputPath);
};

// ==================== EXECUTE ====================
await main();
