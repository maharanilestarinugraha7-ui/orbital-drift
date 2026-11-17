/**
 * @fileoverview Main entrypoint for hand-in flow.
 *
 * This script prepares the submission for the judge by:
 * 1. Determining the output directory (default /output or environment variable MAKEFUN_OUTPUT_DIR).
 * 2. Copying the 'game/' and 'screenshots/' directories to the output destination.
 * 3. Constructing the judge's dossier via the vendored 'makefun-game' library.
 * 4. Writing the final 'dossier.json' to the output directory.
 */

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// --- Configuration & Paths ---

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Dossier limits as defined by the scorer's requirements
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// --- Helpers ---

/** Ensures the target directory exists and copies contents from source to destination. */
function copyDir(source: string, destination: string, recursive: boolean = true): void {
  if (existsSync(source)) {
    mkdirSync(destination, { recursive: true });
    cpSync(source, destination, { recursive });
  }
}

/** Builds and writes the judge's dossier. */
function generateDossier(outputDir: string): void {
  const dossierPath = join(outputDir, 'dossier.json');
  const dossierData = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(dossierPath, dossierData);
}

// --- Main Execution ---

function main(): void {
  // 1. Prepare output structure
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 2. Copy assets
  copyDir(join(HERE, 'game'), join(OUTPUT_DIR, 'game'));
  copyDir(join(HERE, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));

  // 3. Build and write dossier
  generateDossier(OUTPUT_DIR);

  process.exit(0);
}

// Run the hand-in process
main();
