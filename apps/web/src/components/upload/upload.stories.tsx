import type { Meta, StoryObj } from "@storybook/react";

import { type JSX, useCallback, useState } from "react";

import { UploadFileStatus } from "./libs/enums.js";
import { type UploadFile } from "./libs/types.js";
import { Upload } from "./upload.js";

const BYTES_IN_MEGABYTE = 1_000_000;
const FILE_SIZE_DECIMAL_PLACES = 1;
const DEMO_PROGRESS = 45;

type Properties = {
	initialFiles?: UploadFile[];
};

const UploadWrapper = ({ initialFiles = [] }: Properties): JSX.Element => {
	const [files, setFiles] = useState<UploadFile[]>(initialFiles);

	const handleFilesSelected = useCallback((fileList: FileList): void => {
		const newFiles: UploadFile[] = [...fileList].map((file) => ({
			id: crypto.randomUUID(),
			name: file.name,
			sizeLabel: `${(file.size / BYTES_IN_MEGABYTE).toFixed(FILE_SIZE_DECIMAL_PLACES)} MB`,
			status: UploadFileStatus.UPLOADING,
		}));

		setFiles((previousFiles) => [...previousFiles, ...newFiles]);
	}, []);

	const handleFileRemove = useCallback((id: string): void => {
		setFiles((previousFiles) => previousFiles.filter((file) => file.id !== id));
	}, []);

	return (
		<Upload
			files={files}
			onFileRemove={handleFileRemove}
			onFilesSelected={handleFilesSelected}
		/>
	);
};

const meta = {
	component: UploadWrapper,
	title: "Components/Form/Upload",
} satisfies Meta<typeof UploadWrapper>;

type Story = StoryObj<typeof meta>;

const Empty: Story = {
	args: {
		initialFiles: [],
	},
};

const WithFiles: Story = {
	args: {
		initialFiles: [
			{
				id: "1",
				name: "product-requirements.pdf",
				sizeLabel: "2.4 MB",
				status: UploadFileStatus.DONE,
			},
			{
				id: "2",
				name: "architecture-notes.docx",
				progress: DEMO_PROGRESS,
				sizeLabel: "860 KB",
				status: UploadFileStatus.UPLOADING,
			},
			{
				id: "3",
				name: "glossary-export.csv",
				sizeLabel: "12.1 MB",
				status: UploadFileStatus.ERROR,
			},
		],
	},
};

export default meta;
export { Empty, WithFiles };
