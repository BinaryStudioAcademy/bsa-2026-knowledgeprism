type Properties = {
	alt: string;
	initials?: string;
	src?: string;
};

const Avatar: React.FC<Properties> = ({ alt, initials, src }: Properties) => {
	if (src) {
		return (
			<span className="avatar overflow-hidden">
				<img alt={alt} className="h-full w-full object-cover" src={src} />
			</span>
		);
	}

	return (
		<span aria-label={alt} className="avatar overflow-hidden" role="img">
			{initials}
		</span>
	);
};

export { Avatar };
