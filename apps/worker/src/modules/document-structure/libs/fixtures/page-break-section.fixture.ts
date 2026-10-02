import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import { body, heading, toFixturePage } from "./to-fixture-page.helper.js";

const RELEASE_PLAN_FIRST_PAGE = 4;
const RELEASE_PLAN_LAST_PAGE = 5;
const RELEASE_PLAN_CONTINUATION =
	"M4 General availability on 3 March 2027 with public pricing.";

const PAGE_BREAK_SECTION_PAGES: ParsedPageBlock[] = [
	toFixturePage(RELEASE_PLAN_FIRST_PAGE, [
		heading("Release Plan"),
		body("M1 Internal alpha on 30 October 2026 with offline inspections."),
		body("M2 Closed beta on 8 December 2026 with three pilot customers."),
		body("M3 Open beta on 26 January 2027 with conditional questions."),
	]),
	toFixturePage(RELEASE_PLAN_LAST_PAGE, [
		body(RELEASE_PLAN_CONTINUATION),
		heading("Pricing"),
		body("Starter costs 9 EUR per technician per month."),
		body("Business costs 15 EUR per technician per month."),
	]),
];

export {
	PAGE_BREAK_SECTION_PAGES,
	RELEASE_PLAN_CONTINUATION,
	RELEASE_PLAN_FIRST_PAGE,
	RELEASE_PLAN_LAST_PAGE,
};
