import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const versions = {
  package: packageJson.version,
  tauri: tauriConfig.version,
  cargo: cargoVersion,
};

const unique = new Set(Object.values(versions));
if (unique.size !== 1) {
  console.error('Version mismatch:', versions);
  process.exit(1);
}

console.log(`Version synchronized: ${packageJson.version}`);
