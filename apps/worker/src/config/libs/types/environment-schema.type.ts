type EnvironmentSchema = {
	AWS: {
		REGION: string;
		S3_BUCKET_NAME: string;
	};
	BEDROCK: {
		ACCESS_KEY_ID: null | string;
		SECRET_ACCESS_KEY: null | string;
	};
};

export { type EnvironmentSchema };
