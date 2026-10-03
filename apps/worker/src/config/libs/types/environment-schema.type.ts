type EnvironmentSchema = {
	AWS: {
		BEDROCK_ACCESS_KEY_ID: null | string;
		BEDROCK_MAXIMUM_CONCURRENT_REQUESTS: number;
		BEDROCK_SECRET_ACCESS_KEY: null | string;
		REGION: string;
		S3_BUCKET_NAME: string;
	};
};

export { type EnvironmentSchema };
