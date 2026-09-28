type Properties = {
	message: string;
};

const EmptyState: React.FC<Properties> = ({ message }: Properties) => (
	<div className="py-10 text-center font-sans text-sm text-text-faint">
		{message}
	</div>
);

export { EmptyState };
