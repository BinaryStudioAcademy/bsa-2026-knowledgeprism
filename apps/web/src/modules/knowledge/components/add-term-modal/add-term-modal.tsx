import {
	type BaseSyntheticEvent,
	type JSX,
	useCallback,
	useEffect,
} from "react";
import { type Resolver, useForm } from "react-hook-form";

import { Button, Input, Modal, Textarea } from "~/components/components.js";

const DEFINITION_TEXTAREA_ROWS = 4;
const DEFAULT_TAG = "GENERAL";

type AddTermFormValues = {
	definition: string;
	tag: string;
	term: string;
};

const DEFAULT_ADD_TERM_VALUES: AddTermFormValues = {
	definition: "",
	tag: "",
	term: "",
};

const resolveAddTermForm: Resolver<AddTermFormValues> = (payload) => {
	const isTermEmpty = !payload.term.trim();
	const isDefinitionEmpty = !payload.definition.trim();

	if (!isTermEmpty && !isDefinitionEmpty) {
		return {
			errors: {},
			values: payload,
		};
	}

	return {
		errors: {
			...(isTermEmpty && {
				term: { message: "Term is required", type: "required" },
			}),
			...(isDefinitionEmpty && {
				definition: { message: "Definition is required", type: "required" },
			}),
		},
		values: {},
	};
};

type AddTermPayload = {
	content: string;
	tag: string;
	title: string;
};

type Properties = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: AddTermPayload) => void;
};

const AddTermModal = ({
	isOpen,
	onClose,
	onSubmit,
}: Properties): JSX.Element => {
	const { control, handleSubmit, reset } = useForm<AddTermFormValues>({
		defaultValues: DEFAULT_ADD_TERM_VALUES,
		mode: "onTouched",
		resolver: resolveAddTermForm,
	});

	useEffect(() => {
		if (!isOpen) {
			reset(DEFAULT_ADD_TERM_VALUES);
		}
	}, [isOpen, reset]);

	const handleValidSubmit = useCallback(
		(values: AddTermFormValues): void => {
			onSubmit({
				content: values.definition.trim(),
				tag: (values.tag.trim() || DEFAULT_TAG).toUpperCase(),
				title: values.term.trim(),
			});
		},
		[onSubmit],
	);

	const handleFormSubmit = useCallback(
		(event: BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<Modal hasCloseButton isOpen={isOpen} onClose={onClose} title="Add Term">
			<form className="flex flex-col gap-3" onSubmit={handleFormSubmit}>
				<Input
					control={control}
					label="Term"
					name="term"
					placeholder="e.g. Latency Budget"
				/>

				<Input
					control={control}
					label="Category tag"
					name="tag"
					placeholder="e.g. PERFORMANCE"
				/>

				<Textarea
					control={control}
					label="Definition"
					name="definition"
					placeholder="What does this term mean?"
					rows={DEFINITION_TEXTAREA_ROWS}
				/>

				<div className="mt-2 flex justify-end gap-3">
					<Button onClick={onClose} type="button" variant="secondary">
						Cancel
					</Button>
					<Button type="submit">Add Term</Button>
				</div>
			</form>
		</Modal>
	);
};

export { AddTermModal };
