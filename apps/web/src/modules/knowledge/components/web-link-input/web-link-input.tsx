import {
	type ChangeEvent,
	type JSX,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

import { Button, Icon } from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { KnowledgeInputFooter } from "../knowledge-input-footer.js";

const WEB_LINK_FETCH_DELAY_MS = 900;
const LINK_ICON_SIZE = 14;
const REMOVE_ICON_SIZE = 12;

const WebLinkStatus = {
	FETCHING: "fetching",
	INDEXED: "indexed",
} as const;

type WebLinkItem = {
	id: string;
	status: (typeof WebLinkStatus)[keyof typeof WebLinkStatus];
	url: string;
};

const ValidationMessage = {
	DUPLICATE_URL: "This link has already been added",
	INVALID_URL: "Enter a valid HTTP or HTTPS URL",
} as const;

const getLinksWithIndexedStatus = (
	links: WebLinkItem[],
	id: string,
): WebLinkItem[] => {
	return links.map((link) =>
		link.id === id
			? {
					...link,
					status: WebLinkStatus.INDEXED,
				}
			: link,
	);
};

const getLinksWithoutId = (links: WebLinkItem[], id: string): WebLinkItem[] => {
	return links.filter((link) => link.id !== id);
};

const getStatusMessage = (
	indexedLinkCount: number,
	fetchingLinkCount: number,
): string => {
	if (!indexedLinkCount && !fetchingLinkCount) {
		return "No knowledge added yet";
	}

	const statusParts: string[] = [];

	if (indexedLinkCount) {
		statusParts.push(`${indexedLinkCount.toString()} ready`);
	}

	if (fetchingLinkCount) {
		statusParts.push(`${fetchingLinkCount.toString()} processing`);
	}

	return statusParts.join(" · ");
};

const isValidWebUrl = (value: string): boolean => {
	try {
		const parsedUrl = new URL(value);

		return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
	} catch {
		return false;
	}
};

type Properties = {
	onCancel: () => void;
	onSubmit: () => void;
};

const WebLinkInput = ({ onCancel, onSubmit }: Properties): JSX.Element => {
	const inputId = useId();
	const [url, setUrl] = useState("");
	const [links, setLinks] = useState<WebLinkItem[]>([]);
	const [validationError, setValidationError] = useState<null | string>(null);
	const fetchTimeoutsReference = useRef(
		new Map<string, ReturnType<typeof setTimeout>>(),
	);

	useEffect(() => {
		const fetchTimeouts = fetchTimeoutsReference.current;

		return (): void => {
			for (const timeoutId of fetchTimeouts.values()) {
				clearTimeout(timeoutId);
			}

			fetchTimeouts.clear();
		};
	}, []);

	const handleUrlChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setUrl(event.target.value);
			setValidationError(null);
		},
		[],
	);

	const handleFetchComplete = useCallback(
		(id: string) => (): void => {
			setLinks((currentLinks) => getLinksWithIndexedStatus(currentLinks, id));
			fetchTimeoutsReference.current.delete(id);
		},
		[],
	);

	const handleFetch = useCallback(
		(event: SyntheticEvent<HTMLFormElement>): void => {
			event.preventDefault();

			const normalizedUrl = url.trim();

			if (!isValidWebUrl(normalizedUrl)) {
				setValidationError(ValidationMessage.INVALID_URL);
				return;
			}

			const hasDuplicateUrl = links.some((link) => link.url === normalizedUrl);

			if (hasDuplicateUrl) {
				setValidationError(ValidationMessage.DUPLICATE_URL);
				return;
			}

			const id = crypto.randomUUID();

			setLinks((currentLinks) => [
				...currentLinks,
				{
					id,
					status: WebLinkStatus.FETCHING,
					url: normalizedUrl,
				},
			]);
			setUrl("");
			setValidationError(null);

			const timeoutId = setTimeout(
				handleFetchComplete(id),
				WEB_LINK_FETCH_DELAY_MS,
			);

			fetchTimeoutsReference.current.set(id, timeoutId);
		},
		[handleFetchComplete, links, url],
	);

	const handleRemove = useCallback(
		(id: string) => (): void => {
			const timeoutId = fetchTimeoutsReference.current.get(id);

			if (timeoutId) {
				clearTimeout(timeoutId);
				fetchTimeoutsReference.current.delete(id);
			}

			setLinks((currentLinks) => getLinksWithoutId(currentLinks, id));
		},
		[],
	);

	const indexedLinkCount = links.filter(
		(link) => link.status === WebLinkStatus.INDEXED,
	).length;

	const fetchingLinkCount = links.filter(
		(link) => link.status === WebLinkStatus.FETCHING,
	).length;

	const statusMessage = getStatusMessage(indexedLinkCount, fetchingLinkCount);

	const validationErrorId = validationError ? `${inputId}-error` : undefined;

	return (
		<div className="flex min-h-85 flex-col">
			<div className="flex-1">
				<form className="flex gap-2" noValidate onSubmit={handleFetch}>
					<label className="visually-hidden" htmlFor={inputId}>
						Web page URL
					</label>

					<input
						aria-describedby={validationErrorId}
						aria-invalid={Boolean(validationError)}
						className={getValidClassNames(
							"h-11 min-w-0 flex-1 rounded-lg border bg-surface px-3.5 font-sans text-sm text-text outline-none transition",
							"focus:border-accent focus:ring-3 focus:ring-accent/15",
							validationError ? "border-error" : "border-border",
						)}
						id={inputId}
						onChange={handleUrlChange}
						placeholder="https://example.com/docs/api-reference"
						type="url"
						value={url}
					/>

					<Button className="shrink-0" disabled={!url.trim()} type="submit">
						Fetch
					</Button>
				</form>

				{validationError && (
					<span
						className="mt-1 block text-xs text-error"
						id={validationErrorId}
						role="alert"
					>
						{validationError}
					</span>
				)}

				<p className="mt-1.5 text-xs text-text-faint">
					Prism will crawl the page and keep it in sync on a weekly schedule.
				</p>

				<div className="mt-4 flex flex-col gap-2">
					{links.map((link) => {
						const isIndexed = link.status === WebLinkStatus.INDEXED;

						return (
							<div
								className="flex items-center gap-3 rounded-lg border border-border bg-bg p-3"
								key={link.id}
							>
								<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-info-bg text-info">
									<Icon name="link" size={LINK_ICON_SIZE} />
								</div>

								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium text-text">
										{link.url}
									</div>

									<div
										className={getValidClassNames(
											"mt-0.5 text-xs",
											isIndexed ? "text-accent" : "text-text-faint",
										)}
									>
										{isIndexed ? "Indexed" : "Fetching…"}
									</div>
								</div>

								<button
									aria-label={`Remove ${link.url}`}
									className="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-muted hover:bg-border-subtle hover:text-text"
									onClick={handleRemove(link.id)}
									type="button"
								>
									<Icon name="close" size={REMOVE_ICON_SIZE} />
								</button>
							</div>
						);
					})}
				</div>
			</div>

			<KnowledgeInputFooter
				isActionDisabled={!indexedLinkCount}
				onCancel={onCancel}
				onSubmit={onSubmit}
				statusMessage={statusMessage}
			/>
		</div>
	);
};

export { WebLinkInput };
