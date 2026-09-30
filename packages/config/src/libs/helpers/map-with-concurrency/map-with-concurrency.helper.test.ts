import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapWithConcurrency } from "./map-with-concurrency.helper.js";

const LIMIT = 2;
const SHORT_DELAY = 5;
const MEDIUM_DELAY = 15;
const LONG_DELAY = 30;
const INPUTS = [LONG_DELAY, SHORT_DELAY, MEDIUM_DELAY, SHORT_DELAY];

const wait = (milliseconds: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

void describe("mapWithConcurrency", () => {
	void it("keeps results in input order when calls finish out of order", async () => {
		const results = await mapWithConcurrency(INPUTS, LIMIT, async (delay) => {
			await wait(delay);

			return delay;
		});

		assert.deepEqual(results, INPUTS);
	});

	void it("never runs more calls at once than the limit", async () => {
		let inFlight = 0;
		let maxInFlight = 0;

		await mapWithConcurrency(INPUTS, LIMIT, async (delay) => {
			inFlight++;
			maxInFlight = Math.max(maxInFlight, inFlight);
			await wait(delay);
			inFlight--;
		});

		assert.equal(maxInFlight, LIMIT);
	});

	void it("stops starting new calls after one fails", async () => {
		const failure = new Error("Permanent failure");
		const started: number[] = [];

		await assert.rejects(
			mapWithConcurrency(INPUTS, LIMIT, (delay) => {
				started.push(delay);

				return Promise.reject(failure);
			}),
			failure,
		);

		assert.equal(started.length, LIMIT);
	});

	void it("returns an empty list for no inputs", async () => {
		const results = await mapWithConcurrency([], LIMIT, () =>
			Promise.resolve(null),
		);

		assert.deepEqual(results, []);
	});
});
