import React from "react";

import { KnowledgeEditor } from "~/components/knowledge-editor/knowledge-editor.js";

import { type KnowledgeEntryResponseDto } from "../../libs/mock-knowledge-tree.js";
import "./knowledge-tree-content.css";

type Properties = {
	entry: KnowledgeEntryResponseDto;
};

const KnowledgeTreeContent: React.FC<Properties> = ({ entry }: Properties) => {
	return (
		<div className="flex flex-1 items-start justify-center overflow-y-scroll px-4 py-6 @3xl:px-10 @3xl:py-9">
			<div className="w-full max-w-190 min-w-0 rounded-lg border border-border bg-surface p-6 shadow-md @3xl:p-10">
				<h1 className="mb-2.5 font-serif text-h1 text-text">{entry.title}</h1>
				<div className="mb-7 font-mono text-xs text-text-faint">
					<span>
						Last updated:{" "}
						{new Date(entry.updatedAt).toLocaleDateString("en-GB")}
					</span>
				</div>

				<div className="knowledge-tree-editor-wrapper">
					<KnowledgeEditor
						initialContent={entry.contentJson}
						isEditable={false}
					/>
				</div>
			</div>
		</div>
	);
};

export { KnowledgeTreeContent };
