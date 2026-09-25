import { zodResolver } from "@hookform/resolvers/zod";
import {
	type Control,
	type DefaultValues,
	type FieldErrors,
	type FieldValues,
	type UseFormClearErrors,
	type UseFormHandleSubmit,
	type UseFormProps,
	type UseFormReset,
	type UseFormSetError,
	type ValidationMode,
} from "react-hook-form";
import { useForm } from "react-hook-form";

import { type ValidationSchema } from "~/lib/types/types.js";

type Parameters<T extends FieldValues = FieldValues> = {
	defaultValues: DefaultValues<T>;
	mode?: keyof ValidationMode;
	validationSchema?: ValidationSchema;
};

type ReturnValue<T extends FieldValues = FieldValues> = {
	clearErrors: UseFormClearErrors<T>;
	control: Control<T, null>;
	errors: FieldErrors<T>;
	handleSubmit: UseFormHandleSubmit<T>;
	reset: UseFormReset<T>;
	setError: UseFormSetError<T>;
};

const useAppForm = <T extends FieldValues = FieldValues>({
	defaultValues,
	mode = "onSubmit",
	validationSchema,
}: Parameters<T>): ReturnValue<T> => {
	let parameters: UseFormProps<T> = {
		defaultValues,
		mode,
	};

	if (validationSchema) {
		parameters = {
			...parameters,
			resolver: zodResolver(validationSchema as never),
		};
	}

	const {
		clearErrors,
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setError,
	} = useForm<T>(parameters);

	return {
		clearErrors,
		control,
		errors,
		handleSubmit,
		reset,
		setError,
	};
};

export { useAppForm };
