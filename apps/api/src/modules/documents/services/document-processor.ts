class DocumentProcessor {
	// Deferred to the worker/SQS extraction pipeline; this ticket only stores and status-tracks manual text.
	public process(): Promise<void> {
		return Promise.resolve();
	}
}

export { DocumentProcessor };
