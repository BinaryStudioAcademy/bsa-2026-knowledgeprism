type AccountPreferences = {
	documentUpdates: boolean;
	mentions: boolean;
	twoFactorAuth: boolean;
	weeklyDigest: boolean;
};

type AccountSettingsFormValues = {
	currentPassword: string;
	email: string;
	fullName: string;
	newPassword: string;
};

export { type AccountPreferences, type AccountSettingsFormValues };
