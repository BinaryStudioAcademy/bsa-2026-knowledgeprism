type GeneratePresignedUploadUrl = (parameters: {
	contentType: string;
	key: string;
}) => Promise<string>;

export { type GeneratePresignedUploadUrl };
