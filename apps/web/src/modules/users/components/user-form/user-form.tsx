import React, { useCallback, useMemo } from "react";
import {
	type Control,
	type FieldValues,
	type Path,
	useController,
} from "react-hook-form";

import { Button, Input, Select, Toggle } from "~/components/components.js";
import { useFormController } from "~/hooks/hooks.js";

type AssignedProject = {
	projectId: number;
	role: ProjectRole;
};

type AvailableProject = {
	id: number;
	name: string;
};

type ProjectRole = "EDITOR" | "VIEWER";

type Properties<T extends FieldValues> = {
	availableProjects?: AvailableProject[];
	control: Control<T, null>;
	errorMessage?: string | undefined;
	isAdmin?: boolean;
	isEditMode?: boolean;
	isLoading?: boolean;
	isReadOnly?: boolean;
	onCancel: () => void;
	onSubmit: (event_: React.BaseSyntheticEvent) => void;
};

const UserForm = <T extends FieldValues>({
	availableProjects = [],
	control,
	errorMessage,
	isAdmin = false,
	isEditMode = false,
	isLoading = false,
	isReadOnly = false,
	onCancel,
	onSubmit,
}: Properties<T>): React.JSX.Element => {
	const EMPTY_LENGTH = 0;

	const { field: activeField } = useFormController({
		control,
		name: "isActive" as Path<T>,
	});

	const { field: assignedProjectsField } = useController({
		control,
		name: "assignedProjects" as Path<T>,
	});

	const assignedProjects = useMemo(
		() => (assignedProjectsField.value as AssignedProject[] | undefined) ?? [],
		[assignedProjectsField.value],
	);

	const handleProjectAssign = useCallback(
		(projectId: number) => {
			assignedProjectsField.onChange([
				...assignedProjects,
				{ projectId, role: "VIEWER" },
			]);
		},
		[assignedProjects, assignedProjectsField],
	);

	const handleProjectUnassign = useCallback(
		(projectId: number) => {
			assignedProjectsField.onChange(
				assignedProjects.filter((p) => p.projectId !== projectId),
			);
		},
		[assignedProjects, assignedProjectsField],
	);

	const handleRoleChange = useCallback(
		(projectId: number, newRole: string) => {
			assignedProjectsField.onChange(
				assignedProjects.map((p) =>
					p.projectId === projectId
						? { ...p, role: newRole as ProjectRole }
						: p,
				),
			);
		},
		[assignedProjects, assignedProjectsField],
	);

	const handleTransformName = useCallback((value: string) => {
		return value.replaceAll(/\d/g, "");
	}, []);

	const handleTransformEmail = useCallback((value: string) => {
		return value.trim();
	}, []);

	const hasAssignableProjects = availableProjects.length > EMPTY_LENGTH;
	const hasAssignedProjects = assignedProjects.length > EMPTY_LENGTH;
	const shouldShowProjectsSection = isReadOnly ? hasAssignedProjects : true;

	const renderProjectsContent = (): React.ReactNode => {
		if (isReadOnly) {
			return (
				<>
					{assignedProjects.map((assignment) => {
						const project = availableProjects.find(
							(candidate) => candidate.id === assignment.projectId,
						);

						return project ? (
							<div
								className="flex items-center justify-between"
								key={project.id}
							>
								<span className="font-medium text-text">{project.name}</span>
								<span className="text-sm text-text-muted">
									{assignment.role}
								</span>
							</div>
						) : null;
					})}
				</>
			);
		}

		if (hasAssignableProjects) {
			return (
				<>
					{availableProjects.map((project) => {
						const assignment = assignedProjects.find(
							(candidate) => candidate.projectId === project.id,
						);
						const isAssigned = Boolean(assignment);

						return (
							<ProjectListItem
								isAssigned={isAssigned}
								key={project.id}
								onAssign={handleProjectAssign}
								onRoleChange={handleRoleChange}
								onUnassign={handleProjectUnassign}
								project={project}
								role={assignment?.role ?? "VIEWER"}
							/>
						);
					})}
				</>
			);
		}

		return (
			<div className="text-sm text-text-muted">
				No projects available in this organisation.
			</div>
		);
	};

	return (
		<form className="flex w-full flex-col gap-6" onSubmit={onSubmit}>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 tablet:flex-row">
					<Input
						control={control}
						label="First name"
						maxLength={50}
						name={"firstName" as Path<T>}
						placeholder="Jane"
						transformValue={handleTransformName}
					/>
					<Input
						control={control}
						label="Last name"
						maxLength={50}
						name={"lastName" as Path<T>}
						placeholder="Doe"
						transformValue={handleTransformName}
					/>
				</div>

				<Input
					control={control}
					disabled={isReadOnly}
					label="Email"
					name={"email" as Path<T>}
					placeholder="jane.doe@example.com"
					transformValue={handleTransformEmail}
					type="email"
				/>

				<Input
					control={control}
					hasPasswordToggle={true}
					hintInfo="Password must be at least 8 characters long"
					label={isEditMode ? "Password (Optional)" : "Password"}
					maxLength={32}
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
							isDisabled={isAdmin || isReadOnly}
							isLabelVisible={false}
							label="Active Status"
							name={activeField.name}
							onChange={activeField.onChange}
						/>
					</div>
				)}

				{shouldShowProjectsSection && (
					<div className="flex flex-col gap-3 rounded-lg border border-border p-4">
						<div>
							<div className="font-medium text-text">Project Assignment</div>
							<div className="text-sm text-text-muted">
								{isReadOnly
									? "Projects you're assigned to and your role on each."
									: "Assign this user to projects and set their roles."}
								{/* NOTE: Projects are currently mocked. When GET /projects endpoint is implemented, this should consume actual project data. */}
							</div>
						</div>
						<div className="flex flex-col gap-4 pt-2">
							{renderProjectsContent()}
						</div>
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

type ProjectListItemProperties = {
	isAssigned: boolean;
	onAssign: (projectId: number) => void;
	onRoleChange: (projectId: number, newRole: string) => void;
	onUnassign: (projectId: number) => void;
	project: AvailableProject;
	role: ProjectRole;
};

const ProjectListItem = ({
	isAssigned,
	onAssign,
	onRoleChange,
	onUnassign,
	project,
	role,
}: ProjectListItemProperties): React.JSX.Element => {
	const handleToggle = useCallback(
		(event_: React.ChangeEvent<HTMLInputElement>) => {
			if (event_.target.checked) {
				onAssign(project.id);
			} else {
				onUnassign(project.id);
			}
		},
		[onAssign, onUnassign, project.id],
	);

	const handleRoleChange = useCallback(
		(newRole: string) => {
			onRoleChange(project.id, newRole);
		},
		[onRoleChange, project.id],
	);

	return (
		<div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
			<label className="flex items-center gap-2 font-medium text-text">
				<input
					checked={isAssigned}
					className="size-4.5 rounded border-border accent-accent"
					onChange={handleToggle}
					type="checkbox"
				/>
				{project.name}
			</label>

			{isAssigned && (
				<div className="w-full tablet:w-40">
					<Select
						onChange={handleRoleChange}
						options={[
							{ label: "Viewer", value: "VIEWER" },
							{ label: "Editor", value: "EDITOR" },
						]}
						value={role}
					/>
				</div>
			)}
		</div>
	);
};

export { UserForm };
