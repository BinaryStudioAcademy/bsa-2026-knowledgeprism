import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { type AppError } from "../types/app-error.type.js";

type State = {
	error: AppError | null;
};

const initialState: State = {
	error: null,
};

const { actions, reducer } = createSlice({
	initialState,
	name: "error",
	reducers: {
		setError: (state, action: PayloadAction<AppError | null>): void => {
			state.error = action.payload;
		},
	},
});

export { actions, reducer };
