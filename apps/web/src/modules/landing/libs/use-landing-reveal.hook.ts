import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import { LANDING_REVEAL_CLASS, LANDING_REVEAL_IN_CLASS } from "./constants.js";

const REVEAL_ROOT_MARGIN = "0px 0px -12% 0px";
const REVEAL_VISIBILITY_THRESHOLD = 0.2;

const isReducedMotionPreferred = (): boolean =>
	matchMedia("(prefers-reduced-motion: reduce)").matches;

type LandingReveal = readonly [
	RefObject<HTMLElement | null>,
	typeof LANDING_REVEAL_CLASS | typeof LANDING_REVEAL_IN_CLASS,
];

const useLandingReveal = (): LandingReveal => {
	const sectionReference = useRef<HTMLElement>(null);
	const [isShown, setIsShown] = useState(isReducedMotionPreferred);

	useLayoutEffect(() => {
		const node = sectionReference.current;

		if (!node || isReducedMotionPreferred()) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;

				if (entry?.isIntersecting) {
					setIsShown(true);
					observer.disconnect();
				}
			},
			{
				rootMargin: REVEAL_ROOT_MARGIN,
				threshold: REVEAL_VISIBILITY_THRESHOLD,
			},
		);

		observer.observe(node);

		return (): void => {
			observer.disconnect();
		};
	}, []);

	return [
		sectionReference,
		isShown ? LANDING_REVEAL_IN_CLASS : LANDING_REVEAL_CLASS,
	];
};

export { useLandingReveal };
