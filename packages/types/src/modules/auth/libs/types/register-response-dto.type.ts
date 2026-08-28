type RegisterResponseDto = {
	organisation: {
		id: number;
		name: string;
	};
	user: {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
	};
};

export { type RegisterResponseDto };
