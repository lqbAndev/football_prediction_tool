import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Run the TS regression fixture in Node; imported club logos are irrelevant here.
const result = await build({
  entryPoints: [fileURLToPath(new URL(process.argv[2] || './ucl-tier1.test.ts', import.meta.url))],
  bundle: true, platform: 'node', format: 'esm', write: false,
  loader: { '.png': 'empty', '.jpg': 'empty', '.svg': 'empty', '.webp': 'empty' },
});
try {
  await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
} catch (error) {
  console.error(error.name + ': ' + error.message);
  process.exitCode = 1;
}
