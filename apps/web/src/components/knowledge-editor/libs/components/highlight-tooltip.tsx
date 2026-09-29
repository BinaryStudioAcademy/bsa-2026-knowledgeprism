import {
	type JSX,
	type FocusEvent as ReactFocusEvent,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

const HIGHLIGHT_TOOLTIP_CLOSE_DELAY_MS = 150;
const HIGHLIGHT_ID_ATTRIBUTE = "data-text-highlight-id";
const ZERO_OFFSET = 0;

type ActiveHighlight = {
	id: string;
	left: number;
	top: number;
};

type HighlightTooltipProperties = {
	children: ReactNode;
	onReplace: (highlightId: string, replacement: string) => void;
	renderTooltip: (
		highlightId: string,
		actions: { replace: (replacement: string) => void },
	) => ReactNode;
};

const findHighlightElement = (
	target: EventTarget | null,
): HTMLElement | null => {
	if (!(target instanceof Element)) {
		return null;
	}

	return target.closest<HTMLElement>(`[${CSS.escape(HIGHLIGHT_ID_ATTRIBUTE)}]`);
};

const HighlightTooltip = ({
	children,
	onReplace,
	renderTooltip,
}: HighlightTooltipProperties): JSX.Element => {
	const containerReference = useRef<HTMLDivElement>(null);
	const closeTimeoutReference = useRef<null | ReturnType<typeof setTimeout>>(
		null,
	);
	const [activeHighlight, setActiveHighlight] =
		useState<ActiveHighlight | null>(null);

	const clearCloseTimeout = useCallback((): void => {
		if (closeTimeoutReference.current === null) {
			return;
		}

		clearTimeout(closeTimeoutReference.current);
		closeTimeoutReference.current = null;
	}, []);

	const scheduleClose = useCallback((): void => {
		clearCloseTimeout();
		closeTimeoutReference.current = setTimeout(() => {
			setActiveHighlight(null);
		}, HIGHLIGHT_TOOLTIP_CLOSE_DELAY_MS);
	}, [clearCloseTimeout]);

	const handleHighlightEnter = useCallback(
		(target: EventTarget | null): void => {
			const highlightElement = findHighlightElement(target);
			const highlightId = highlightElement?.getAttribute(
				HIGHLIGHT_ID_ATTRIBUTE,
			);

			if (!highlightElement || !highlightId) {
				return;
			}

			const containerRect = containerReference.current?.getBoundingClientRect();
			const highlightRect = highlightElement.getBoundingClientRect();

			clearCloseTimeout();
			setActiveHighlight({
				id: highlightId,
				left: highlightRect.left - (containerRect?.left ?? ZERO_OFFSET),
				top: highlightRect.bottom - (containerRect?.top ?? ZERO_OFFSET),
			});
		},
		[clearCloseTimeout],
	);

	const handleHighlightLeave = useCallback(
		(target: EventTarget | null): void => {
			if (!findHighlightElement(target)) {
				return;
			}

			scheduleClose();
		},
		[scheduleClose],
	);

	const handleMouseOver = useCallback(
		(event: ReactMouseEvent<HTMLDivElement>): void => {
			handleHighlightEnter(event.target);
		},
		[handleHighlightEnter],
	);

	const handleMouseOut = useCallback(
		(event: ReactMouseEvent<HTMLDivElement>): void => {
			handleHighlightLeave(event.target);
		},
		[handleHighlightLeave],
	);

	const handleFocus = useCallback(
		(event: ReactFocusEvent<HTMLDivElement>): void => {
			handleHighlightEnter(event.target);
		},
		[handleHighlightEnter],
	);

	const handleBlur = useCallback(
		(event: ReactFocusEvent<HTMLDivElement>): void => {
			handleHighlightLeave(event.target);
		},
		[handleHighlightLeave],
	);

	const handleCardMouseEnter = useCallback((): void => {
		clearCloseTimeout();
	}, [clearCloseTimeout]);

	const handleReplace = useCallback(
		(replacement: string): void => {
			if (!activeHighlight) {
				return;
			}

			onReplace(activeHighlight.id, replacement);
			setActiveHighlight(null);
		},
		[activeHighlight, onReplace],
	);

	useEffect(() => {
		if (!activeHighlight) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				setActiveHighlight(null);
			}
		};
		const handleScroll = (): void => {
			setActiveHighlight(null);
		};

		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("scroll", handleScroll, { capture: true });

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("scroll", handleScroll, { capture: true });
		};
	}, [activeHighlight]);

	useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

	return (
		<div
			className="relative"
			onBlur={handleBlur}
			onFocus={handleFocus}
			onMouseOut={handleMouseOut}
			onMouseOver={handleMouseOver}
			ref={containerReference}
		>
			{children}

			{activeHighlight && (
				<div
					className="absolute z-10 mt-1 max-w-xs rounded-md border border-border bg-surface p-2.5 text-xs shadow-sm"
					onMouseEnter={handleCardMouseEnter}
					onMouseLeave={scheduleClose}
					style={{ left: activeHighlight.left, top: activeHighlight.top }}
				>
					{renderTooltip(activeHighlight.id, { replace: handleReplace })}
				</div>
			)}
		</div>
	);
};

export { HighlightTooltip };
