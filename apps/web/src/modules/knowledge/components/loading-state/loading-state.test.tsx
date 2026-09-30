import {
	DocumentErrorMessage,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoadingState } from "./loading-state.js";

describe("LoadingState", () => {
	it("shows the document failure message instead of a generic processing error", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.FAILED}
				errorMessage={DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED}
				hasError
				onCancel={vi.fn()}
				onRetry={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Something went wrong. Please try again."),
		).not.toBeInTheDocument();
	});
});
