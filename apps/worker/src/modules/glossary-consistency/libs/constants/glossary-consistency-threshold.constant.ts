// Calibrated on measured cohere.embed-multilingual-v3 scores (both sides embedded as
// SEARCH_DOCUMENT — see kp-397, comparing a term's "name: definition" text against a
// paraphrase that should match it):
//   "application programming interface..." vs API           -> 0.635
//   "structured setup process..."          vs Onboarding     -> 0.634
//   "agreed service level agreement..."    vs SLA             -> 0.719
// against unrelated content, every term scored 0.40-0.49. 0.55 sits clear of both bands.
const GlossaryConsistencyThreshold = {
	MINIMUM: 0.55,
} as const;

export { GlossaryConsistencyThreshold };
