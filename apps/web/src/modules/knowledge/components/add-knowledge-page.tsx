import { type JSX } from "react";

import { Heading, Paragraph } from "~/components/components.js";

import { DocumentUpload } from "./document-upload.js";

const AddKnowledgePage = (): JSX.Element => (
	<div className="mx-auto flex w-full max-w-[600px] flex-col gap-6 py-8">
		<div className="flex flex-col gap-1.5 border-b border-border pb-4">
			<Heading level="3">Document Upload</Heading>
			<Paragraph className="text-text-muted">
				Upload PDF or TXT documents to extract and process knowledge.
			</Paragraph>
		</div>

		<DocumentUpload />
	</div>
);

export { AddKnowledgePage };
