
/** @type {import('lint-staged').Config} */
const config = {
	"*": [
		() => "npm --prefix ../.. run lint:editor",
		() => "npm --prefix ../.. run lint:fs",
		() => "npm --prefix ../.. run lint:trash",
		() => "npm --prefix ../.. run lint:format",
	],
	"**/*.css": [() => "npm --prefix ../.. run lint:css -w @knowledgeprism/web"],
	"**/*.{ts,tsx}": [
		() => "npm --prefix ../.. run lint:js",
		() => "npm --prefix ../.. run lint:type",
	],
};

export default config;
