import { spawn, execFile as execFileCallback } from 'node:child_process';
import { join } from 'node:path';
import { exit } from 'node:process';
import { promisify } from 'node:util';
import { glob } from 'node:fs/promises';
import { Readable } from 'node:stream';

// Manually wrap the callback-based API into a Promise
const execFile = promisify(execFileCallback);

// ==================== CONSTANTS ====================
const BASE_DIR = join(import.meta.dirname, '..');
const EXTRACTED_DIR = join(BASE_DIR, 'data', 'extracted');
const CLEANED_DIR = join(BASE_DIR, 'data', 'cleaned');
const RUNS_DIR = join(BASE_DIR, '.runs');
const NOTEBOOKS_DIR = join(BASE_DIR, 'notebooks');
const NOTEBOOK_PATH = join(NOTEBOOKS_DIR, '02-CleanData.ipynb');

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
const runNotebookPartition = (
  inputJson: string,
  outputFilename: string,
  runOutputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args = [
      'repl', '--run', NOTEBOOK_PATH, '--exit-after-run',
      '--input', `inputJson=${inputJson}`,
      '--input', `outputDir=${CLEANED_DIR}`,
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
  const jsonFiles = await Array.fromAsync(glob('ExtractedPigments-*.json', { cwd: EXTRACTED_DIR }));
  const runTimestamp = new Date().toISOString().replace('T', '-').split('.')[0].replace(/-/g, '').replace(/:/g, '-');

  // Views
  const partitions = jsonFiles.map(file => {
    const date = file.replace('ExtractedPigments-', '').replace('.json', '');
    return {
      date,
      originalName: file,
      outputFilename: `CleanedPigments-${date}.json`,
      inputJson: join(EXTRACTED_DIR, file),
      runOutputPath: join(RUNS_DIR, `02-CleanData-RUN-${runTimestamp}-${date}.ipynb`)
    };
  });

  // Materialize
  const CONCURRENCY_LIMIT = 3;
  await Readable.from(partitions)
    .forEach(async (partition) => {
      try {
        await runNotebookPartition(partition.inputJson, partition.outputFilename, partition.runOutputPath);
      } catch (err) {
        console.error(`❌ Failed: ${partition.originalName}`, err);
      }
    }, { concurrency: CONCURRENCY_LIMIT });
};

// ==================== EXECUTE ====================
await main();
