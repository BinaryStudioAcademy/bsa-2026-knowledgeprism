const mapWithConcurrency = async <Input, Output>(
	inputs: readonly Input[],
	limit: number,
	mapper: (input: Input) => Promise<Output>,
): Promise<Output[]> => {
	const outputs = Array.from<Output>({ length: inputs.length });
	let nextIndex = 0;
	let hasFailed = false;

	const runWorker = async (): Promise<void> => {
		while (!hasFailed && nextIndex < inputs.length) {
			const index = nextIndex++;

			try {
				outputs[index] = await mapper(inputs[index] as Input);
			} catch (error) {
				hasFailed = true;

				throw error;
			}
		}
	};

	const workerCount = Math.min(limit, inputs.length);

	await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

	return outputs;
};

export { mapWithConcurrency };
