import assert from 'node:assert/strict';
import test from 'node:test';
import { editorialFoundation } from '../scripts/seo-editorial-foundation.mjs';
import { foundationSources, validateGroundedSources } from '../scripts/seo-source-grounding.mjs';
import { proposalFocus, validateProposedBrief } from '../scripts/seo-replenishment.mjs';
import { refillCandidates } from './fixtures/seo-refill.mjs';

test('curated sources are derived locally, bounded and deduplicated', () => {
  const refs = ['joined-unit-dispatch-identity', 'arrival-label-notice-disposition'];
  const sources = foundationSources(refs, editorialFoundation);
  assert.equal(sources.length, 1);
  assert.match(sources[0].url, /^https:\/\/ref.gs1.org\//);
  assert.throws(() => validateGroundedSources({ foundationRefs: refs }, editorialFoundation), /must match/);
  assert.throws(() => validateGroundedSources({ foundationRefs: refs, sources: [{ name: 'invented', url: 'https://example.com' }] }, editorialFoundation), /must match/);
  assert.deepEqual(validateGroundedSources({ foundationRefs: refs, sources }, editorialFoundation), sources);
  assert.deepEqual(validateGroundedSources({ foundationRefs: ['entity-identity', 'reference-context'] }, editorialFoundation), []);
});

test('source URLs cannot be injected by a proposal or exempt unsupported claims', () => {
  const raw = refillCandidates()[0];
  const options = { existingArticles: [], existingBriefs: [] };
  assert.throws(() => validateProposedBrief({ ...raw, sources: [{ name: 'fake', url: 'https://example.com' }] }, options), /only area/);
  assert.throws(() => validateProposedBrief({ ...raw, foundationRefs: ['joined-unit-dispatch-identity', 'entity-identity'], plan: { ...raw.plan, keyAnswer: 'This guarantees safe transport for every customer and every shipment.' } }, options), /unsupported wording/);
});

test('exploration rotates concrete source-backed decisions rather than abstract synonyms', () => {
  const first = proposalFocus(editorialFoundation, [], 0);
  const next = proposalFocus(editorialFoundation, [], 1);
  assert.ok(first.every(id => editorialFoundation.find(item => item.id === id).source));
  assert.notDeepEqual(first, next);
});

test('a grounded packaging decision passes offline topic gates against the complete current archive', async () => {
  const { readFile } = await import('node:fs/promises');
  const { extractExistingArticleSignals } = await import('../scripts/seo-quality.mjs');
  const { manualEditorialBriefs } = await import('../scripts/seo-editorial-briefs.mjs');
  const store = JSON.parse(await readFile(new URL('../scripts/seo-auto-briefs.json', import.meta.url), 'utf8'));
  const archive = extractExistingArticleSignals(await readFile(new URL('../app/insights/articles.ts', import.meta.url), 'utf8'));
  const evidence = [
    'A packaging evaluation for a unitized direct route should not by itself establish suitability for individual packages handled after load breakup.',
    'Compare the handling environment represented by the prior evaluation with the new distribution path before deciding whether further evaluation is needed.',
    'Ask a qualified testing partner to review gaps rather than assume that a prior result covers the new handling environment.',
  ];
  const raw = {
    area: 'reviewing packaging evaluation when the distribution mode changes',
    readerQuestion: 'Can a packaging evaluation for unitized direct transport be reused when the load is broken down for parcel handling?',
    foundationRefs: ['distribution-mode-packaging-validation', 'instruction-scope'], evidence,
    plan: {
      title: 'Reviewing Packaging Tests When the Distribution Mode Changes',
      description: 'Compare the handling represented by an earlier packaging evaluation with a new distribution route before assuming the same result applies.',
      excerpt: 'A prior unitized-load evaluation may not represent individual-package handling after the load is broken down.',
      keywords: ['packaging test scope', 'distribution mode change', 'unitized load breakup'],
      keyAnswer: evidence.slice(0, 2).join(' '),
      outline: ['Describe the handling in the earlier evaluation', 'Locate where the new distribution path differs', 'Take the evidence gap to a qualified testing partner'],
    },
  };
  const options = { existingArticles: archive, existingBriefs: [...manualEditorialBriefs, ...store.briefs] };
  const candidate = validateProposedBrief(raw, options);
  assert.equal(candidate.sources[0].url, 'https://www.ista.org/getting_started_with_design.php');
  assert.throws(() => validateProposedBrief(raw, { ...options, existingBriefs: [...options.existingBriefs, candidate] }), /already exists/);
  // Deterministic gates only. This fixture is NOT semantic approval or pool inventory.
});
