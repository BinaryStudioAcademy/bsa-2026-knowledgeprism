import { type ChangeEvent, type JSX, useCallback, useState } from "react";

import { Button } from "~/components/components.js";

const WebLinkPanel = (): JSX.Element => {
	const [url, setUrl] = useState("");

	const handleUrlChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setUrl(event.target.value);
		},
		[],
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex gap-2">
				<input
					className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none
focus:border-accent
focus:ring-2 focus:ring-accent/15"
					onChange={handleUrlChange}
					placeholder="https://example.com/docs/api-reference"
					type="url"
					value={url}
				/>
				<Button disabled={!url.trim()}>Fetch</Button>
			</div>

			<div className="text-xs text-text-muted">
				Prism will crawl the page and keep it in sync on a weekly schedule.
			</div>
		</div>
	);
};

export { WebLinkPanel };
