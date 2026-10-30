/**
 * Company: EonHive Inc. | Title: Portable schema export
 * Purpose: Write deterministic JSON Schema artifacts from the runtime contracts.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { requestJsonSchema, resultJsonSchema } from '../dist/index.js';

await mkdir(new URL('../schemas/', import.meta.url), { recursive: true });
for (const [name, schema] of [['request', requestJsonSchema], ['result', resultJsonSchema]]) {
  await writeFile(new URL(`../schemas/${name}.v1.json`, import.meta.url), `${JSON.stringify(schema, null, 2)}\n`);
}
