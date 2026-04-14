import { spawn, execFile as execFileCallback } from 'node:child_process';
import { join } from 'node:path';
import { exit } from 'node:process';
import { promisify } from 'node:util';
import { glob } from 'node:fs/promises';

// Manually wrap the callback-based API into a Promise
const execFile = promisify(execFileCallback);

// ==================== CONSTANTS ====================
const BASE_DIR = join(import.meta.dirname, '..');
const RAW_DIR = join(BASE_DIR, 'data', 'raw');
const EXTRACTED_DIR = join(BASE_DIR, 'data', 'extracted');
const NOTEBOOK_PATH = join(BASE_DIR, 'notebooks', '01-ExtractData.ipynb');
const RUNS_DIR = join(BASE_DIR, '.runs'); 

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
 * Spawns the dotnet-repl process for a specific partition
 */
const runNotebookPartition = (inputCsv: string, outputFilename: string, runOutputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args = [
      'repl', '--run', NOTEBOOK_PATH, '--exit-after-run',
      '--input', `inputCsv=${inputCsv}`,
      '--input', `outputDir=${EXTRACTED_DIR}`,
      '--input', `outputFilename=${outputFilename}`,
      '--output-path', runOutputPath,
      '--output-format', 'ipynb'
    ];

    const child = spawn('dotnet', args, { stdio: 'inherit', cwd: 'notebooks' });

    // Handle launch failures (e.g., binary not found)
    child.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });

    // Handle process completion
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

  // Datasource
  const csvFiles = await Array.fromAsync(glob('Pigments-*.csv', { cwd: RAW_DIR }));
  const runTimestamp = new Date().toISOString().replace('T', '-').split('.')[0].replace(/-/g, '').replace(/:/g, '-');

  // Views
  const partitions = csvFiles.map(file => {
    const date = file.replace('Pigments-', '').replace('.csv', '');
    return {
      date,
      originalName: file,
      outputFilename: `ExtractedPigments-${date}.json`,
      inputCsv: join(RAW_DIR, file),
      runOutputPath: join(RUNS_DIR, `01-ExtractData-RUN-${runTimestamp}-${date}.ipynb`)
    };
  });

  // Materalize
  for (const partition of partitions) {
    console.log(`Processing ${partition.originalName}...`);
    try {
      await runNotebookPartition(partition.inputCsv, partition.outputFilename, partition.runOutputPath);
    } catch (err) {
      console.log(err);
    }
  }
};

// ==================== EXECUTE ====================
await main();
