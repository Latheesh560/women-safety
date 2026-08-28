import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const nodeBackendPath = path.join(repoRoot, 'backend', 'server.js');
const pythonBackendPath = path.join(repoRoot, 'python-backend', 'main.py');

const nodeSource = fs.readFileSync(nodeBackendPath, 'utf8');
const pythonSource = fs.readFileSync(pythonBackendPath, 'utf8');

const nodeRoutes = new Set();
const pythonRoutes = new Set();

const nodeRegex = /app\.(get|post|put|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const pythonRegex = /@app\.(get|post|put|delete)\(\s*["']([^"']+)["']/g;

for (const match of nodeSource.matchAll(nodeRegex)) {
  nodeRoutes.add(`${match[1].toUpperCase()} ${match[2]}`);
}

for (const match of pythonSource.matchAll(pythonRegex)) {
  pythonRoutes.add(`${match[1].toUpperCase()} ${match[2]}`);
}

const onlyInNode = [...nodeRoutes].filter((route) => !pythonRoutes.has(route)).sort();
const onlyInPython = [...pythonRoutes].filter((route) => !nodeRoutes.has(route)).sort();

if (onlyInNode.length === 0 && onlyInPython.length === 0) {
  console.log('✅ API route parity check passed (Node and FastAPI routes match).');
  process.exit(0);
}

console.error('❌ API route parity check failed.');
if (onlyInNode.length > 0) {
  console.error('\nRoutes only in Node backend:');
  onlyInNode.forEach((route) => console.error(`  - ${route}`));
}

if (onlyInPython.length > 0) {
  console.error('\nRoutes only in FastAPI backend:');
  onlyInPython.forEach((route) => console.error(`  - ${route}`));
}

process.exit(1);
