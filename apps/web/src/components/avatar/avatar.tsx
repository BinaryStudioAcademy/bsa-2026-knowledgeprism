type Properties = {
	alt: string;
	initials?: string;
	src?: string;
};

const Avatar: React.FC<Properties> = ({ alt, initials, src }: Properties) => {
	if (src) {
		return (
			<span className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-medium text-primary-fg">
				<img alt={alt} className="h-full w-full object-cover" src={src} />
			</span>
		);
	}

	return (
		<span
			aria-label={alt}
			className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-medium text-primary-fg"
			role="img"
		>
			{initials}
		</span>
	);
};

export { Avatar };
