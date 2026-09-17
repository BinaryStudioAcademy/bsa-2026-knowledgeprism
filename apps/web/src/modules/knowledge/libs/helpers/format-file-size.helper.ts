const BYTES_IN_KB = 1024;
const BYTES_IN_MB = BYTES_IN_KB * BYTES_IN_KB;
const DECIMAL_PLACES = 1;

const formatFileSize = (bytes: number): string => {
	if (bytes >= BYTES_IN_MB) {
		return `${(bytes / BYTES_IN_MB).toFixed(DECIMAL_PLACES)} MB`;
	}

	if (bytes >= BYTES_IN_KB) {
		return `${String(Math.round(bytes / BYTES_IN_KB))} KB`;
	}

	return `${String(bytes)} B`;
};

export { formatFileSize };
