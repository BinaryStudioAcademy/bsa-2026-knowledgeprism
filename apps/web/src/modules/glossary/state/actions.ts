import {
	type GlossaryTermRequestDto,
	type GlossaryTermResponseDto,
	type GlossaryTermsResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./glossary.slice.js";

const loadTerms = createAsyncThunk<
	GlossaryTermsResponseDto,
	{ projectId: string; query: string },
	AsyncThunkConfig
>(
	`${sliceName}/load-terms`,
	async ({ projectId, query }, { extra, signal }) => {
		return await extra.glossaryApi.getAll({ projectId, query, signal });
	},
);

const loadTermOptions = createAsyncThunk<
	GlossaryTermsResponseDto,
	{ projectId: string },
	AsyncThunkConfig
>(`${sliceName}/load-term-options`, async ({ projectId }, { extra }) => {
	return await extra.glossaryApi.getAll({ projectId, query: "" });
});

const loadTerm = createAsyncThunk<
	GlossaryTermResponseDto,
	{ id: number; projectId: string },
	AsyncThunkConfig
>(`${sliceName}/load-term`, async ({ id, projectId }, { extra, signal }) => {
	return await extra.glossaryApi.getById({ id, projectId, signal });
});

const createTerm = createAppAsyncThunk<
	GlossaryTermResponseDto,
	{ payload: GlossaryTermRequestDto; projectId: string }
>(`${sliceName}/create-term`, async ({ payload, projectId }, { extra }) => {
	return await extra.glossaryApi.create({ payload, projectId });
});

const updateTerm = createAppAsyncThunk<
	GlossaryTermResponseDto,
	{ id: number; payload: GlossaryTermRequestDto; projectId: string }
>(`${sliceName}/update-term`, async ({ id, payload, projectId }, { extra }) => {
	return await extra.glossaryApi.update({ id, payload, projectId });
});

const deleteTerm = createAsyncThunk<
	number,
	{ id: number; projectId: string },
	AsyncThunkConfig
>(`${sliceName}/delete-term`, async ({ id, projectId }, { extra }) => {
	await extra.glossaryApi.delete({ id, projectId });

	return id;
});

export {
	createTerm,
	deleteTerm,
	loadTerm,
	loadTermOptions,
	loadTerms,
	updateTerm,
};
