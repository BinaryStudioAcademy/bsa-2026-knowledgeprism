import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownContent } from "./markdown-content.js";

describe("MarkdownContent", () => {
	it("renders plain paragraph text", () => {
		render(<MarkdownContent content="This is a simple answer from Prism." />);

		expect(
			screen.getByText("This is a simple answer from Prism."),
		).toBeInTheDocument();
	});

	it("renders headings with correct heading levels", () => {
		const content = "# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4";
		render(<MarkdownContent content={content} />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Heading 1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Heading 2" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 3, name: "Heading 3" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 4, name: "Heading 4" }),
		).toBeInTheDocument();
	});

	it("renders inline bold, italic, strikethrough, and inline code", () => {
		const content =
			"Here is **bold text**, *italic text*, ~~strikethrough~~, and `inline code`.";
		render(<MarkdownContent content={content} />);

		const boldElement = screen.getByText("bold text");
		expect(boldElement.tagName).toBe("STRONG");

		const italicElement = screen.getByText("italic text");
		expect(italicElement.tagName).toBe("EM");

		const strikeElement = screen.getByText("strikethrough");
		expect(strikeElement.tagName).toBe("DEL");

		const codeElement = screen.getByText("inline code");
		expect(codeElement.tagName).toBe("CODE");
	});

	it("renders fenced code blocks with language label", () => {
		const content =
			"```typescript\nconst message = 42;\nconsole.log(message);\n```";
		render(<MarkdownContent content={content} />);

		expect(screen.getByText("typescript")).toBeInTheDocument();
		expect(
			screen.getByText((renderedText) =>
				renderedText.includes("const message = 42;"),
			),
		).toBeInTheDocument();
	});

	it("renders unordered and ordered lists", () => {
		const content =
			"Key benefits:\n- Semantic search\n- Document grounding\n- Citation linking\n\nSteps to run:\n1. Clone repo\n2. Run install\n3. Start dev server";
		render(<MarkdownContent content={content} />);

		expect(screen.getByText("Key benefits:")).toBeInTheDocument();
		expect(screen.getByText("Semantic search")).toBeInTheDocument();
		expect(screen.getByText("Document grounding")).toBeInTheDocument();
		expect(screen.getByText("Citation linking")).toBeInTheDocument();

		expect(screen.getByText("Steps to run:")).toBeInTheDocument();
		expect(screen.getByText("Clone repo")).toBeInTheDocument();
		expect(screen.getByText("Run install")).toBeInTheDocument();
		expect(screen.getByText("Start dev server")).toBeInTheDocument();
	});

	it("renders blockquotes and external links safely", () => {
		const content =
			"> Important safety notice\n\nVisit [Documentation](https://knowledgeprism.io) for more details.";
		render(<MarkdownContent content={content} />);

		expect(screen.getByText("Important safety notice")).toBeInTheDocument();

		const link = screen.getByRole("link", { name: "Documentation" });
		expect(link).toHaveAttribute("href", "https://knowledgeprism.io");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("does not render markdown images for security and privacy", () => {
		const { container } = render(
			<MarkdownContent content="Here is an image: ![Tracker](https://attacker.example/track.png)" />,
		);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(container.querySelector("img")).not.toBeInTheDocument();
	});
});
