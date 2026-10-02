type EnvironmentSchema = {
	AWS: {
		BEDROCK_MAXIMUM_CONCURRENT_REQUESTS: number;
		REGION: string;
		S3_BUCKET_NAME: string;
	};
};

export { type EnvironmentSchema };
