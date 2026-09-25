import React from "react";

const WelcomeIllustration: React.FC = () => (
	<svg
		aria-hidden="true"
		className="h-auto w-full max-w-[300px]"
		fill="none"
		height="170"
		viewBox="0 0 300 170"
		width="300"
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

export { WelcomeIllustration };
