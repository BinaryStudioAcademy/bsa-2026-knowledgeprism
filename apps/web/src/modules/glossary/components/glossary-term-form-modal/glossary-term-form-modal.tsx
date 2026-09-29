import { GlossaryValidationRule } from "@knowledgeprism/constants";
import { glossaryTermRequestValidationSchema } from "@knowledgeprism/schemas";
import { type GlossaryTermRequestDto } from "@knowledgeprism/types";

import { Button, Input, Modal, Textarea } from "~/components/components.js";
import {
	useAppDispatch,
	useAppForm,
	useAppSelector,
	useCallback,
	useEffect,
	useState,
} from "~/hooks/hooks.js";
import { normalizeError } from "~/lib/helpers/normalize-error.helper.js";
import { HTTPCode } from "~/lib/http/http.js";

import { actions } from "../../state/state.js";
import { RelatedTermsPicker } from "../related-terms-picker/related-terms-picker.js";

const DEFINITION_ROWS = 5;

const EMPTY_TERM: GlossaryTermRequestDto = {
	definition: "",
	name: "",
	relatedTermIds: [],
};

type Properties = {
	initialValues?: GlossaryTermRequestDto;
	onCancel: () => void;
	onSubmit: (payload: GlossaryTermRequestDto) => Promise<void>;
	projectId: string;
	submitLabel: string;
	termId: null | number;
	title: string;
};

const GlossaryTermFormModal: React.FC<Properties> = ({
	initialValues = EMPTY_TERM,
	onCancel,
	onSubmit,
	projectId,
	submitLabel,
	termId,
	title,
}: Properties) => {
	const dispatch = useAppDispatch();
	const termOptions = useAppSelector(({ glossary }) => glossary.termOptions);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [serverError, setServerError] = useState<null | string>(null);
	const { control, handleSubmit, setError } =
		useAppForm<GlossaryTermRequestDto>({
			defaultValues: initialValues,
			mode: "onTouched",
			validationSchema: glossaryTermRequestValidationSchema,
		});

	useEffect(() => {
		void dispatch(actions.loadTermOptions({ projectId }));
	}, [dispatch, projectId]);

	const handleValidSubmit = useCallback(
		async (values: GlossaryTermRequestDto): Promise<void> => {
			setIsSubmitting(true);
			setServerError(null);

			try {
				await onSubmit(values);
			} catch (error: unknown) {
				const { message, status } = normalizeError(error);

				if (status === HTTPCode.CONFLICT) {
					setError("name", { message, type: "server" });
				} else {
					setServerError(message);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[onSubmit, setError],
	);

	const handleFormSubmit = useCallback(
		(event: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<Modal
			hasCloseButton
			isFullScreenOnMobile
			isOpen
			onClose={onCancel}
			size="large"
			title={title}
		>
			<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
				<Input
					control={control}
					disabled={isSubmitting}
					label="Term name"
					maxLength={GlossaryValidationRule.NAME_MAXIMUM_LENGTH}
					name="name"
					placeholder="e.g. Knowledge Base"
				/>
				<Textarea
					control={control}
					disabled={isSubmitting}
					label="Definition"
					maxLength={GlossaryValidationRule.DEFINITION_MAXIMUM_LENGTH}
					name="definition"
					placeholder="What does this term mean in this project?"
					rows={DEFINITION_ROWS}
				/>
				<RelatedTermsPicker
					control={control}
					disabled={isSubmitting}
					options={termOptions.filter((option) => option.id !== termId)}
				/>
				{serverError && <p className="text-xs text-error">{serverError}</p>}
				<div className="mt-2 flex justify-end gap-3">
					<Button
						disabled={isSubmitting}
						onClick={onCancel}
						variant="secondary"
					>
						Cancel
					</Button>
					<Button isLoading={isSubmitting} type="submit">
						{submitLabel}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

export { GlossaryTermFormModal };
