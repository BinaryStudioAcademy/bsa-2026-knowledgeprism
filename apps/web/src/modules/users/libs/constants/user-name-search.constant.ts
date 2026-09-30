import { UserValidationRule } from "@knowledgeprism/constants";

const NAME_PART_COUNT = 2;
const NAME_SEPARATOR_LENGTH = 1;

const USERNAME_SEARCH_MAXIMUM_LENGTH =
	UserValidationRule.NAME_MAXIMUM_LENGTH * NAME_PART_COUNT +
	NAME_SEPARATOR_LENGTH;

const UsernameSearchCopy = {
	CLEAR_LABEL: "Clear search",
	EMPTY_RESULTS: "No users match that name.",
	LABEL: "Search by name",
	PLACEHOLDER: "Search by name",
} as const;

export { USERNAME_SEARCH_MAXIMUM_LENGTH, UsernameSearchCopy };
