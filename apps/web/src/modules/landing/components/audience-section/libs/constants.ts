const AUDIENCE_SECTION_COPY = { eyebrow: "Who it's for" } as const;

const AUDIENCES = [
	{
		body: "Find answers across requirements, technical specs, architecture decisions, and project documentation — without digging through multiple tools.",
		title: "Development teams",
	},
	{
		body: "Get clear answers from process documentation, procedures, and internal guidelines without having to ask a colleague.",
		title: "Operations teams",
	},
	{
		body: "Get a clear view of organisational knowledge, requirements, and project documentation without relying on scattered sources or asking teams for information.",
		title: "Management teams",
	},
] as const;

export { AUDIENCE_SECTION_COPY, AUDIENCES };
