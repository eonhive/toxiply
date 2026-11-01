/**
 * Company: EonHive Inc. | Title: Offline dataset review workflow
 * Purpose: Validate/import immutable local datasets and compare existing analyzers.
 * Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
 * Notes: Vibe coded with Codex.
 */
import { fileURLToPath } from 'node:url';
import { compareReviewedDataset } from './evaluate-reviewed.mjs';
import { DatasetError, importReviewDataset, loadReviewDataset, readDatasetText, sha256,
  writePrivateArtifact } from './review-dataset.mjs';
import { applyReviewResponse, prepareResponseTemplate, prepareReviewPacket, reviewJson } from './review-packet.mjs';

const bundled = ['native-text.v1.json', 'context-attribution.v1.json', 'text-review.example.v1.json']
  .map((name) => fileURLToPath(new URL(name, import.meta.url)));

function parseArgs(args) {
  const [command, ...rest] = args;
  const counts = { validate: 1, import: 2, compare: null,
    'prepare-review': 2, 'review-template': 2, 'apply-review': 4 };
  if (!Object.hasOwn(counts, command)) throw new DatasetError('invalid_command');
  const files = [];
  const references = [];
  for (let index = 0; index < rest.length; index++) {
    if (rest[index] === '--reference' && rest[index + 1] && !rest[index + 1].startsWith('--')) {
      references.push(rest[++index]);
    } else if (rest[index].startsWith('--')) throw new DatasetError('invalid_arguments');
    else files.push(rest[index]);
  }
  if (command === 'compare' ? files.length > 1 : files.length !== counts[command]) {
    throw new DatasetError('invalid_arguments');
  }
  return { command, files, references };
}

try {
  const { command, files, references } = parseArgs(process.argv.slice(2));
  // Always check held-out declarations against development material already exposed in this repository.
  const referenceTexts = await Promise.all([...bundled, ...references].map(readDatasetText));
  if (command === 'prepare-review' || command === 'review-template') {
    const input = await readDatasetText(files[0]);
    const output = command === 'prepare-review'
      ? prepareReviewPacket(input, referenceTexts) : prepareResponseTemplate(input);
    const text = reviewJson(output);
    const suffix = command === 'prepare-review' ? 'packet' : 'response-template';
    const destination = await writePrivateArtifact(files[1], `review-${sha256(input)}.${suffix}.json`, text);
    console.log(JSON.stringify({ destination, artifactSha256: sha256(text) }, null, 2));
  } else if (command === 'apply-review') {
    const [source, packet, response] = await Promise.all(files.slice(0, 3).map(readDatasetText));
    const result = applyReviewResponse(source, packet, response, referenceTexts);
    const destination = await writePrivateArtifact(files[3],
      `${result.audit.datasetId}@${result.audit.datasetVersion}.json`, result.datasetText,
      { existsCode: 'dataset_version_exists', failureCode: 'import_failed' });
    console.log(JSON.stringify({ destination, ...result.audit }, null, 2));
  } else if (command === 'import') {
    console.log(JSON.stringify(await importReviewDataset(files[0], files[1], referenceTexts), null, 2));
  } else if (command === 'validate') {
    const loaded = loadReviewDataset(await readDatasetText(files[0]), referenceTexts);
    console.log(JSON.stringify({ datasetId: loaded.dataset.datasetId, datasetVersion: loaded.dataset.datasetVersion,
      split: loaded.dataset.split, reviewStatus: loaded.dataset.reviewStatus, cases: loaded.dataset.cases.length,
      datasetSha256: loaded.datasetSha256, referenceHashes: loaded.referenceHashes,
      attestations: loaded.attestations }, null, 2));
  } else {
    const reports = [];
    for (const path of files.length ? files : bundled) {
      reports.push(await compareReviewedDataset(await readDatasetText(path), referenceTexts));
    }
    console.log(JSON.stringify({ reportVersion: 'toxiply.text-review-run.v1', reports }, null, 2));
    if (reports.some((report) => report.executionFailed)) process.exitCode = 1;
  }
} catch (error) {
  // Do not echo private dataset text, file paths, or arbitrary analyzer exceptions.
  console.error(JSON.stringify({ error: error instanceof DatasetError ? error.code : 'evaluation_command_failed',
    issues: error instanceof DatasetError ? error.issues : [] }));
  process.exitCode = 1;
}
