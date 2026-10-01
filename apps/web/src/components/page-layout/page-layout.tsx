import { type ReactNode } from "react";

type Properties = {
	children: ReactNode;
	className?: string;
};

const PageLayout: React.FC<Properties> = ({
	children,
	className = "",
}: Properties) => {
	return (
		<div
			className={`relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10 ${className}`.trim()}
		>
			<div className="flex w-full max-w-7xl flex-col gap-3.5 tablet:gap-4.5 desktop:gap-6">
				{children}
			</div>
		</div>
	);
};

export { PageLayout };
