const HOW_IT_WORKS_SECTION_COPY = {
	eyebrow: "How it works",
	heading: "From raw files to answered questions.",
} as const;

const HOW_IT_WORKS_STEPS = [
	{
		body: "Drop in PDFs, specs and plain text — no formatting required.",
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
		body: "Everything lands in a queryable graph — Knowledge Trees, shared Glossary.",
		number: "03",
		title: "Structure",
		variant: "default",
	},
	{
		body: "Ask Prism questions in plain language. Every answer cites its source.",
		number: "04",
		title: "Ask",
		variant: "highlight",
	},
] as const;

export { HOW_IT_WORKS_SECTION_COPY, HOW_IT_WORKS_STEPS };
