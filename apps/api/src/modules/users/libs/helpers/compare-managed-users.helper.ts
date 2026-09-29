const ADMIN_SORT_FIRST = -1;
const ADMIN_SORT_LAST = 1;
const SAME_ORDER = 0;

type ManagedUserSortKey = {
	isOrganisationAdmin: boolean;
	updatedAt: string;
};

const compareManagedUsers = (
	left: ManagedUserSortKey,
	right: ManagedUserSortKey,
): number => {
	if (left.isOrganisationAdmin !== right.isOrganisationAdmin) {
		return left.isOrganisationAdmin ? ADMIN_SORT_FIRST : ADMIN_SORT_LAST;
	}

	const leftUpdatedAt = Date.parse(left.updatedAt);
	const rightUpdatedAt = Date.parse(right.updatedAt);

	if (Number.isNaN(leftUpdatedAt) || Number.isNaN(rightUpdatedAt)) {
		return SAME_ORDER;
	}

	return rightUpdatedAt - leftUpdatedAt;
};

export { compareManagedUsers };
