import { Icon } from "~/components/components.js";

type Properties = Record<string, never>;

const KnowledgeTreeEmptyState: React.FC<Properties> = () => {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="empty-state w-full max-w-sm">
				<div className="mb-4 flex justify-center text-text-faint">
					<Icon name="knowledge-tree" size={36} />
				</div>
				<p className="font-sans text-body text-text-muted">
					No knowledge yet. Add knowledge to get started.
				</p>
			</div>
		</div>
	);
};

export { KnowledgeTreeEmptyState };
