import { type Config } from "stylelint";

const config: Config = {
	extends: ["stylelint-config-standard", "stylelint-config-recess-order"],
	rules: {
		"at-rule-no-unknown": [
			true,
			{
				ignoreAtRules: ["theme"],
			},
		],
		"color-hex-length": "long",
		"declaration-no-important": true,
		"max-nesting-depth": 0,
		"no-descending-specificity": true,
		"selector-class-pattern": null,
		"unit-disallowed-list": ["em", "rem"],
	},
};

export default config;
