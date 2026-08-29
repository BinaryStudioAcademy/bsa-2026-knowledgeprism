type UserSignInResponseDto = {
	organisation: {
		id: number;
		name: string;
	};
	token: string;
	user: {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
	};
};

export { type UserSignInResponseDto };
