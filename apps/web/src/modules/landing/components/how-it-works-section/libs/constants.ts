const HOW_IT_WORKS_SECTION_COPY = {
	eyebrow: "How it works",
	heading: "Simple steps to structured knowledge",
} as const;

const HOW_IT_WORKS_STEPS = [
	{
		body: "Upload PDF and TXT documents, or write content manually. No formatting required.",
		number: "01",
		title: "Ingest",
		variant: "default",
	},
	{
		body: "Prism identifies entities, relationships and hierarchies automatically.",
		number: "02",
		title: "Extract",
		variant: "default",
	},
	{
		body: "Everything lands in a queryable graph — Knowledge Trees, shared Glossary. Preview and make any necessary edits before committing.",
		number: "03",
		title: "Structure",
		variant: "default",
	},
	{
		body: "Discover information and ask Prism questions in plain language. Every answer cites its sources.",
		number: "04",
		title: "Enjoy",
		variant: "highlight",
	},
] as const;

export { HOW_IT_WORKS_SECTION_COPY, HOW_IT_WORKS_STEPS };
