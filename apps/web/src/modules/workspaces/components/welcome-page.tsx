import React from "react";

import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";

const WELCOME_TITLE = "Welcome aboard!";
const WELCOME_MESSAGE =
	"You currently don't have any projects assigned to you yet. Please reach out to your organization administrator to get assigned to a project and get started.";

const ILLUSTRATION_WIDTH = 300;
const ILLUSTRATION_HEIGHT = 170;

const WelcomeIllustration: React.FC = () => (
	<svg
		aria-hidden="true"
		className="h-auto w-full max-w-[300px]"
		fill="none"
		height={ILLUSTRATION_HEIGHT}
		viewBox="0 0 300 170"
		width={ILLUSTRATION_WIDTH}
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M 115 65 C 88 65 76 56 76 42"
			fill="none"
			stroke="#c4c0b6"
			strokeWidth="1.2"
		/>
		<path
			d="M 115 95 C 90 95 74 110 74 125"
			fill="none"
			stroke="#c4c0b6"
			strokeWidth="1.2"
		/>
		<path
			d="M 185 55 C 205 55 210 72 210 80"
			fill="none"
			stroke="#c4c0b6"
			strokeWidth="1.2"
		/>

		<rect
			fill="#ffffff"
			height="85"
			rx="14"
			stroke="#c4c0b6"
			strokeWidth="1.2"
			width="70"
			x="115"
			y="35"
		/>

		<path
			d="M 134 50 H 157 L 166 59 V 105 H 134 Z"
			fill="#ffffff"
			stroke="#9e988c"
			strokeLinejoin="round"
			strokeWidth="1.2"
		/>
		<path
			d="M 157 50 V 59 H 166"
			fill="none"
			stroke="#9e988c"
			strokeLinejoin="round"
			strokeWidth="1.2"
		/>
		<line
			stroke="#9e988c"
			strokeLinecap="round"
			strokeWidth="1.2"
			x1="141"
			x2="159"
			y1="72"
			y2="72"
		/>
		<line
			stroke="#9e988c"
			strokeLinecap="round"
			strokeWidth="1.2"
			x1="141"
			x2="159"
			y1="79"
			y2="79"
		/>
		<line
			stroke="#9e988c"
			strokeLinecap="round"
			strokeWidth="1.2"
			x1="141"
			x2="153"
			y1="86"
			y2="86"
		/>

		<rect
			fill="#ffffff"
			height="28"
			rx="8"
			stroke="#c4c0b6"
			strokeWidth="1.2"
			width="28"
			x="62"
			y="14"
		/>
		<circle cx="76" cy="28" fill="#769382" r="5" />

		<rect
			fill="#ffffff"
			height="28"
			rx="8"
			stroke="#c4c0b6"
			strokeWidth="1.2"
			width="28"
			x="60"
			y="125"
		/>
		<polygon fill="#769382" points="74,133 80,143 68,143" />

		<rect
			fill="#ffffff"
			height="28"
			rx="8"
			stroke="#c4c0b6"
			strokeWidth="1.2"
			width="28"
			x="210"
			y="80"
		/>
		<rect fill="#769382" height="8" rx="1" width="8" x="220" y="90" />
	</svg>
);

const WelcomePage: React.FC = () => {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto flex max-w-xl flex-col items-center text-center">
				<Heading level="1">{WELCOME_TITLE}</Heading>
				<Paragraph
					className="mt-4 text-center leading-relaxed text-text-muted"
					size={ParagraphSize.BODY}
				>
					{WELCOME_MESSAGE}
				</Paragraph>
				<div className="mt-10 flex justify-center sm:mt-12">
					<WelcomeIllustration />
				</div>
			</div>
		</div>
	);
};

export { WelcomePage };
