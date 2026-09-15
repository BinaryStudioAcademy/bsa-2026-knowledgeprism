type Properties = {
	query: string;
};

const EmptyState: React.FC<Properties> = ({ query }: Properties) => (
	<div className="py-10 text-center font-sans text-sm text-text-faint">
		No terms match &quot;{query}&quot;.
	</div>
);

export { EmptyState };
