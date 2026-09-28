const normalizeEmail = (email: string): string => {
	return email.trim().toLowerCase();
};

export { normalizeEmail };
