import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePdfPages } from "./parse-pdf-pages.helper.js";

const FONT_SIZE = 24;
const OFFSET_WIDTH = 10;
// PDF object numbers start at 1; object 0 is the xref free-list head.
const FIRST_OBJECT_NUMBER = 1;

// A one-page PDF with a non-embedded CJK font: decoding its text needs pdfjs's bundled
// UniJIS-UCS2-H CMap, which only loads when the resource paths are readable from Node.
const buildCjkPdf = (): Uint8Array => {
	const content = `BT /F1 ${String(FONT_SIZE)} Tf 72 700 Td <30423044> Tj ET`;
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		`<< /Length ${String(content.length)} >>\nstream\n${content}\nendstream`,
		"<< /Type /Font /Subtype /Type0 /BaseFont /KozMinPro-Regular /Encoding /UniJIS-UCS2-H /DescendantFonts [6 0 R] >>",
		"<< /Type /Font /Subtype /CIDFontType0 /BaseFont /KozMinPro-Regular /CIDSystemInfo << /Registry (Adobe) /Ordering (Japan1) /Supplement 4 >> /FontDescriptor 7 0 R >>",
		"<< /Type /FontDescriptor /FontName /KozMinPro-Regular /Flags 4 /FontBBox [0 0 1000 1000] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>",
	];

	let pdf = "%PDF-1.4\n";
	const offsets: number[] = [];

	for (const [index, object] of objects.entries()) {
		offsets.push(pdf.length);
		pdf += `${String(index + FIRST_OBJECT_NUMBER)} 0 obj\n${object}\nendobj\n`;
	}

	const xrefOffset = pdf.length;
	const xrefEntries = offsets
		.map((offset) => `${String(offset).padStart(OFFSET_WIDTH, "0")} 00000 n \n`)
		.join("");

	pdf += `xref\n0 ${String(objects.length + FIRST_OBJECT_NUMBER)}\n0000000000 65535 f \n${xrefEntries}`;
	pdf += `trailer\n<< /Size ${String(objects.length + FIRST_OBJECT_NUMBER)} /Root 1 0 R >>\nstartxref\n${String(xrefOffset)}\n%%EOF\n`;

	return new TextEncoder().encode(pdf);
};

void describe("parsePdfPages", () => {
	void it("decodes text that needs one of pdfjs's bundled CMaps", async () => {
		const pages = await parsePdfPages(buildCjkPdf());

		assert.deepEqual(pages, [
			{
				content: "あい",
				lines: [{ fontSize: FONT_SIZE, text: "あい" }],
				pageNumber: 1,
			},
		]);
	});
});
