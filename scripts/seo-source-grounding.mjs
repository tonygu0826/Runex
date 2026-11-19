// A curated evidence register, not a crawler or permission to expand claim scope.
// Guidance is an editorial inference; source limitations must travel with it.
export const reviewedDecisionFoundations = [
  {
    id: 'distribution-mode-packaging-validation',
    guidance: 'When a load changes from unitized direct transport to mixed handling or parcel delivery after breakup, compare the proposed distribution handling with the conditions represented by the packaging evaluation. Ask a qualified testing partner to assess the gap rather than treating a prior result as proof for the new route.',
    source: { name: 'ISTA, Getting Started with Package Performance Testing', url: 'https://www.ista.org/getting_started_with_design.php' },
    support: 'Test selection considers package type and actual distribution handling. Individual testing may be needed instead of or alongside unitized testing when loads are broken down. This is a decision framework, not a universal test prescription or guarantee against damage.',
    reviewedAt: '2026-11-19',
  },
  {
    id: 'joined-unit-dispatch-identity',
    guidance: 'Before describing stacked packages as one dispatch unit, distinguish units merely transported together from units physically joined and intended to move together. Preserve the identities needed when the group is separated. Do not infer safe stacking or carrier acceptance from a group identifier.',
    source: { name: 'GS1 Logistic Label Guideline, section 8.3', url: 'https://ref.gs1.org/guidelines/logistic-label/1.3.0/' },
    support: 'Section 8.3 distinguishes independent stacked logistic units from physically joined units shipped as one group. Its identifier rules apply within the GS1 labeling model, not universally.',
    reviewedAt: '2026-11-19',
  },
  {
    id: 'reversible-containment-or-new-output',
    guidance: 'For a repacking record, determine whether the original items remain individually identifiable and can be separated again, or whether the process consumes inputs to create different outputs. Do not classify every packaging change as production; first establish what physically happened.',
    source: { name: 'GS1 EPCIS and CBV Implementation Guideline, section 4.5', url: 'https://ref.gs1.org/guidelines/epcis-cbv/2.0.0/' },
    support: 'Section 4.5 distinguishes reversible aggregation retaining child identities from transformation consuming inputs and producing outputs in the EPCIS event model. This does not require any software or prescribe all repacking operations.',
    reviewedAt: '2026-11-19',
  },
  {
    id: 'arrival-label-notice-disposition',
    guidance: 'When a physical unit identifier differs from the advance notice, establish the supplier-receiver agreement governing verification before treating the notice as proof of receipt. Distinguish a reference mismatch from a confirmed quantity discrepancy; do not invent a universal rejection or holding rule.',
    source: { name: 'GS1 Logistic Label Guideline, sections 9.5.2–9.5.4', url: 'https://ref.gs1.org/guidelines/logistic-label/1.3.0/' },
    support: 'Sections 9.5.2–9.5.4 describe matching scanned unit identifiers to the advance notice and making inspection versus scan-based acceptance depend on the parties agreement. These are bounded labeling-workflow recommendations, not legal receiving requirements.',
    reviewedAt: '2026-11-19',
  },
];

export function foundationSources(refs, foundation) {
  const cited = foundation.filter(item => refs.includes(item.id) && item.source);
  for (const item of cited) {
    if (!item.support || !item.reviewedAt || !item.source.name || !/^https:\/\//.test(item.source.url)) throw new Error('Incomplete reviewed source grounding.');
  }
  return [...new Map(cited.map(item => [item.source.url, { ...item.source }])).values()];
}

export function validateGroundedSources(brief, foundation) {
  const expected = foundationSources(brief.foundationRefs || [], foundation);
  if (JSON.stringify(brief.sources || []) !== JSON.stringify(expected)) throw new Error('Automatic brief sources must match its reviewed foundation.');
  return expected;
}
