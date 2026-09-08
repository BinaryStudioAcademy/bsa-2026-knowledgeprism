import {
	type AccountPreferences,
	type AccountSettingsFormValues,
} from "./types.js";

const PLACEHOLDER_USER = {
	email: "sarah@knowledgeprism.ai",
	fullName: "Sarah J.",
	initials: "SJ",
} as const;

const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
	documentUpdates: true,
	mentions: true,
	twoFactorAuth: true,
	weeklyDigest: false,
};

const DEFAULT_ACCOUNT_SETTINGS_PAYLOAD: AccountSettingsFormValues = {
	currentPassword: "",
	email: PLACEHOLDER_USER.email,
	fullName: PLACEHOLDER_USER.fullName,
	newPassword: "",
};

const TOAST_DISMISS_DELAY_MS = 1600;

export {
	DEFAULT_ACCOUNT_PREFERENCES,
	DEFAULT_ACCOUNT_SETTINGS_PAYLOAD,
	PLACEHOLDER_USER,
	TOAST_DISMISS_DELAY_MS,
};
