import { type Control, type FieldValues, type Path } from "react-hook-form";

import { Button, Input, Toggle } from "~/components/components.js";
import { useFormController } from "~/hooks/hooks.js";

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	errorMessage?: string | undefined;
	isAdmin?: boolean;
	isEditMode?: boolean;
	isLoading?: boolean;
	onCancel: () => void;
	onSubmit: (event_: React.BaseSyntheticEvent) => void;
};

const UserForm = <T extends FieldValues>({
	control,
	errorMessage,
	isAdmin = false,
	isEditMode = false,
	isLoading = false,
	onCancel,
	onSubmit,
}: Properties<T>): React.JSX.Element => {
	const { field: activeField } = useFormController({
		control,
		name: "isActive" as Path<T>,
	});

	return (
		<form className="flex w-full flex-col gap-6" onSubmit={onSubmit}>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 tablet:flex-row">
					<Input
						control={control}
						label="First name"
						name={"firstName" as Path<T>}
						placeholder="Jane"
					/>
					<Input
						control={control}
						label="Last name"
						name={"lastName" as Path<T>}
						placeholder="Doe"
					/>
				</div>

				<Input
					control={control}
					label="Email"
					name={"email" as Path<T>}
					placeholder="jane.doe@example.com"
					type="email"
				/>

				<Input
					control={control}
					label={isEditMode ? "Password (Optional)" : "Password"}
					name={"password" as Path<T>}
					placeholder="At least 8 characters"
					type="password"
				/>

				{isEditMode && (
					<div className="flex items-center justify-between rounded-lg border border-border p-4">
						<div>
							<div className="font-medium text-text">Active Status</div>
							<div className="text-sm text-text-muted">
								Allow this user to access the organisation
							</div>
						</div>
						<Toggle
							isChecked={Boolean(activeField.value)}
							isDisabled={isAdmin}
							isLabelVisible={false}
							label="Active Status"
							name={activeField.name}
							onChange={activeField.onChange}
						/>
					</div>
				)}
			</div>

			{errorMessage && (
				<div className="text-sm font-medium text-error">{errorMessage}</div>
			)}

			<div className="flex justify-end gap-3 border-t border-border pt-6">
				<Button
					disabled={isLoading}
					onClick={onCancel}
					type="button"
					variant="secondary"
				>
					Cancel
				</Button>
				<Button disabled={isLoading} type="submit">
					{isEditMode ? "Save Changes" : "Create User"}
				</Button>
			</div>
		</form>
	);
};

export { UserForm };
