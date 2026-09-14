const AUDIENCE_SECTION_COPY = { eyebrow: "Who it's for" } as const;

const AUDIENCES = [
	{
		body: "Centralize specs and documentation that used to live in a dozen tools.",
		title: "Enterprise knowledge teams",
	},
	{
		body: "Get straight answers from process docs without pinging a colleague.",
		title: "Operations teams",
	},
	{
		body: "Keep terminology consistent across every project with a shared glossary.",
		title: "Documentation teams",
	},
] as const;

export { AUDIENCE_SECTION_COPY, AUDIENCES };
