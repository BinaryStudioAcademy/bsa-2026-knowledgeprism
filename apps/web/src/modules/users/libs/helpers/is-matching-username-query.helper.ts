const EMPTY_QUERY_LENGTH = 0;
const WHITESPACE_PATTERN = /\s+/g;

type NamedUser = {
	firstName: null | string;
	lastName: null | string;
};

const isMatchingUsernameQuery = (user: NamedUser, query: string): boolean => {
	const normalizedQuery = query.trim().toLocaleLowerCase();

	if (normalizedQuery.length === EMPTY_QUERY_LENGTH) {
		return true;
	}

	const fullName = [user.firstName, user.lastName]
		.filter((part) => {
			return Boolean(part?.trim());
		})
		.join(" ")
		.replaceAll(WHITESPACE_PATTERN, " ")
		.toLocaleLowerCase();

	return fullName.includes(normalizedQuery);
};

export { isMatchingUsernameQuery };
