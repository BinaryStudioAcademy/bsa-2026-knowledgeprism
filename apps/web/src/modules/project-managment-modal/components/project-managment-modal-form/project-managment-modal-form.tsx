import { useCallback } from "react";

import { Button, Input, Loader, Textarea } from "~/components/components.js";
import { useAppForm } from "~/hooks/hooks.js";

import { DEFAULT_PROJECT_MANAGMENT_MODAL_FORM_PAYLOAD } from "./lib/constant.js";
import { ProjectFormValue } from "./lib/type.js";
import { ProjectFormValidationSchema } from "./lib/validation-schemta.js";

type Properties = Readonly<{
	error?: null | string;
	initialValues?: ProjectFormValue;
	isSubmitting?: boolean;
	onSubmit: (payload: ProjectFormValue) => void;
	submitLabel: string;
}>;

function ProjectManagmentModalForm({
	error,
	initialValues,
	isSubmitting,
	onSubmit,
	submitLabel,
}: Properties) {
	const { control, handleSubmit } = useAppForm<ProjectFormValue>({
		defaultValues:
			initialValues ?? DEFAULT_PROJECT_MANAGMENT_MODAL_FORM_PAYLOAD,
		validationSchema: ProjectFormValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: ProjectFormValue): void => {
			onSubmit({
				description: values.description,
				projectName: values.projectName,
			});
		},
		[onSubmit],
	);
	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<form
			className="flex flex-col items-center gap-4"
			onSubmit={handleFormSubmit}
		>
			<Input
				control={control}
				label="Project Name"
				name="projectName"
				placeholder="Enter your project name"
			/>
			<Textarea
				control={control}
				label="Description (optional)"
				name="description"
				placeholder="Enter your description"
			/>
			{error && (
				<p className="text-xs text-error w-full text-center">{error}</p>
			)}
			<Button disabled={isSubmitting} type="submit">
				{isSubmitting ? <Loader size="sm" /> : submitLabel}
			</Button>
		</form>
	);
}
export { ProjectManagmentModalForm };
