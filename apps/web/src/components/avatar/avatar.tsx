import { AvatarClass } from "./libs/constants.js";

type Properties = {
	alt: string;
	initials?: string;
	src?: string;
};

const Avatar: React.FC<Properties> = ({ alt, initials, src }: Properties) => {
	if (src) {
		return (
			<span className={AvatarClass.ROOT}>
				<img alt={alt} className={AvatarClass.IMAGE} src={src} />
			</span>
		);
	}

	return (
		<span aria-label={alt} className={AvatarClass.ROOT} role="img">
			{initials}
		</span>
	);
};

export { Avatar };
