class ProcessingSupersededError extends Error {
	public constructor() {
		super("Processing attempt is no longer current.");
		this.name = "ProcessingSupersededError";
	}
}

export { ProcessingSupersededError };
