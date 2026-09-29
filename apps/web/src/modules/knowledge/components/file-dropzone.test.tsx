import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDropzone } from "./file-dropzone.js";

const FILE_NAMES = ["requirements.pdf", "architecture.pdf", "notes.pdf"];

const createFiles = (): File[] =>
	FILE_NAMES.map(
		(name) => new File(["content"], name, { type: "application/pdf" }),
	);

const getFileInput = (container: HTMLElement): HTMLInputElement => {
	const input = container.querySelector<HTMLInputElement>("input[type=file]");

	if (!input) {
		throw new Error("File input not found");
	}

	return input;
};

describe("FileDropzone", () => {
	it("allows selecting multiple files through the file picker", () => {
		const handleFilesSelected = vi.fn();
		const files = createFiles();
		const { container } = render(
			<FileDropzone onFilesSelected={handleFilesSelected} />,
		);
		const input = getFileInput(container);

		expect(input.multiple).toBe(true);

		fireEvent.change(input, { target: { files } });

		expect(handleFilesSelected).toHaveBeenCalledWith(files);
	});

	it("passes every dropped file to the handler", () => {
		const handleFilesSelected = vi.fn();
		const files = createFiles();
		render(<FileDropzone onFilesSelected={handleFilesSelected} />);

		fireEvent.drop(screen.getByText(/drag files here/i), {
			dataTransfer: { files },
		});

		expect(handleFilesSelected).toHaveBeenCalledWith(files);
	});

	it("ignores dropped files when disabled", () => {
		const handleFilesSelected = vi.fn();
		render(<FileDropzone disabled onFilesSelected={handleFilesSelected} />);

		fireEvent.drop(screen.getByText(/drag files here/i), {
			dataTransfer: { files: createFiles() },
		});

		expect(handleFilesSelected).not.toHaveBeenCalled();
	});
});
