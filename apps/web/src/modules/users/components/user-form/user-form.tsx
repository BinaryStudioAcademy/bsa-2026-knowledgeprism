import { UserValidationMessage } from "@knowledgeprism/constants";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type Control,
	type FieldValues,
	type Path,
	useController,
} from "react-hook-form";

import { Button, Icon, Input, Toggle } from "~/components/components.js";
import { useFormController } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

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
	isAdmin?: boolean;
	isEditMode?: boolean;
	isLoading?: boolean;
	isReadOnly?: boolean;
	onCancel: () => void;
	onSubmit: (event_: React.BaseSyntheticEvent) => void;
};

const EMPTY_LENGTH = 0;
const FIRST_INDEX = 0;
const INDEX_OFFSET = 1;
const NEGATIVE_INDEX = -1;
const CHEVRON_ICON_SIZE = 12;
const CHECK_ICON_SIZE = 14;

const ARROW_DOWN_KEY = "ArrowDown";
const ARROW_UP_KEY = "ArrowUp";
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";
const SPACE_KEY = " ";
const TAB_KEY = "Tab";

const ROLE_OPTIONS = [
	{ label: "Viewer", value: "VIEWER" },
	{ label: "Editor", value: "EDITOR" },
] as const;

const UserForm = <T extends FieldValues>({
	availableProjects = [],
	control,
	isAdmin = false,
	isEditMode = false,
	isLoading = false,
	isReadOnly = false,
	onCancel,
	onSubmit,
}: Properties<T>): React.JSX.Element => {
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

	const projectSectionDescription = (() => {
		if (isAdmin) {
			return "Admin for all projects in organizations";
		}

		if (isReadOnly) {
			return "Projects you're assigned to and your role on each.";
		}

		return "Assign this user to projects and set their roles.";
	})();

	const renderProjectsContent = (): React.ReactNode => {
		if (isAdmin) {
			return null;
		}

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
		<form className="flex w-full flex-col gap-6 pb-8" onSubmit={onSubmit}>
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
					hintInfo={UserValidationMessage.PASSWORD_HINT}
					label={isEditMode ? "Password (Optional)" : "Password"}
					maxLength={32}
					name={"password" as Path<T>}
					placeholder="Enter password"
					type="password"
				/>

				<Input
					control={control}
					hasPasswordToggle={true}
					label="Confirm password"
					maxLength={32}
					name={"confirmPassword" as Path<T>}
					placeholder="Repeat the password"
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
								{projectSectionDescription}
							</div>
						</div>
						{!isAdmin && (
							<div className="flex flex-col gap-4 pt-2">
								{renderProjectsContent()}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="flex justify-end gap-3 border-t border-border pt-6 pb-2">
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

type RoleOptionItemProperties = {
	id?: string;
	isFocused: boolean;
	isSelected: boolean;
	label: string;
	onSelect: (newRole: ProjectRole) => void;
	value: ProjectRole;
};

type RoleSelectProperties = {
	onChange: (newRole: ProjectRole) => void;
	value: ProjectRole;
};

const RoleOptionItem = ({
	id,
	isFocused,
	isSelected,
	label,
	onSelect,
	value,
}: RoleOptionItemProperties): React.JSX.Element => {
	const buttonReference = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isFocused) {
			buttonReference.current?.focus();
		}
	}, [isFocused]);

	const handleClick = useCallback((): void => {
		onSelect(value);
	}, [onSelect, value]);

	return (
		<button
			aria-selected={isSelected}
			className={getValidClassNames(
				"dropdown-item flex w-full cursor-pointer items-center justify-between text-left",
				isSelected && "font-medium text-accent",
				isFocused && "bg-bg-subtle",
			)}
			id={id}
			onClick={handleClick}
			ref={buttonReference}
			role="option"
			type="button"
		>
			<span>{label}</span>
			{isSelected && <Icon name="checkbox-tick" size={CHECK_ICON_SIZE} />}
		</button>
	);
};

const RoleSelect = ({
	onChange,
	value,
}: RoleSelectProperties): React.JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState<number>(NEGATIVE_INDEX);

	const containerReference = useRef<HTMLDivElement>(null);
	const triggerReference = useRef<HTMLButtonElement>(null);

	const handleClose = useCallback((): void => {
		setIsOpen(false);
		setFocusedIndex(NEGATIVE_INDEX);
	}, []);

	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => {
			if (!previous) {
				const selectedIndex = ROLE_OPTIONS.findIndex(
					(option) => option.value === value,
				);
				setFocusedIndex(Math.max(selectedIndex, FIRST_INDEX));
			}

			return !previous;
		});
	}, [value]);

	const handleDismiss = useCallback((): void => {
		handleClose();
		triggerReference.current?.focus();
	}, [handleClose]);

	const handleSelectOption = useCallback(
		(newRole: ProjectRole): void => {
			onChange(newRole);
			handleDismiss();
		},
		[onChange, handleDismiss],
	);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
			if (
				containerReference.current &&
				!containerReference.current.contains(event.target as Node)
			) {
				handleClose();
			}
		};

		const handleKeyDown = (event: KeyboardEvent): void => {
			switch (event.key) {
				case ARROW_DOWN_KEY: {
					event.preventDefault();
					setFocusedIndex((previous) =>
						previous < ROLE_OPTIONS.length - INDEX_OFFSET
							? previous + INDEX_OFFSET
							: FIRST_INDEX,
					);
					break;
				}
				case ARROW_UP_KEY: {
					event.preventDefault();
					setFocusedIndex(
						(previous) =>
							(previous > FIRST_INDEX ? previous : ROLE_OPTIONS.length) -
							INDEX_OFFSET,
					);
					break;
				}
				case ENTER_KEY:
				case SPACE_KEY: {
					event.preventDefault();
					if (
						focusedIndex >= FIRST_INDEX &&
						focusedIndex < ROLE_OPTIONS.length
					) {
						const selected = ROLE_OPTIONS[focusedIndex];
						if (selected) {
							handleSelectOption(selected.value);
						}
					}
					break;
				}
				case ESCAPE_KEY:
				case TAB_KEY: {
					handleDismiss();
					break;
				}
				default: {
					break;
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, focusedIndex, handleClose, handleDismiss, handleSelectOption]);

	const activeOption = ROLE_OPTIONS.find((option) => option.value === value);

	return (
		<div className="relative w-full" ref={containerReference}>
			<Button
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				className="w-full cursor-pointer justify-between"
				onClick={handleToggle}
				ref={triggerReference}
				type="button"
				variant="secondary"
			>
				<span>{activeOption?.label ?? value}</span>
				<span
					className={getValidClassNames(
						"ml-2 transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				>
					<Icon name="chevron-down" size={CHEVRON_ICON_SIZE} />
				</span>
			</Button>

			{isOpen && (
				<div
					aria-activedescendant={
						focusedIndex >= FIRST_INDEX
							? `role-option-${String(focusedIndex)}`
							: undefined
					}
					className="dropdown-menu absolute inset-x-0 top-full z-50 mt-1 w-full min-w-full"
					role="listbox"
					tabIndex={0}
				>
					{ROLE_OPTIONS.map((option, index) => (
						<RoleOptionItem
							id={`role-option-${String(index)}`}
							isFocused={focusedIndex === index}
							isSelected={option.value === value}
							key={option.value}
							label={option.label}
							onSelect={handleSelectOption}
							value={option.value}
						/>
					))}
				</div>
			)}
		</div>
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
		<div className="flex items-center justify-between gap-3">
			<label className="flex min-w-0 items-center gap-2 font-medium text-text">
				<input
					checked={isAssigned}
					className="size-4.5 shrink-0 rounded border-border accent-accent"
					onChange={handleToggle}
					type="checkbox"
				/>
				<span className="truncate">{project.name}</span>
			</label>

			{isAssigned && (
				<div className="w-32 shrink-0">
					<RoleSelect onChange={handleRoleChange} value={role} />
				</div>
			)}
		</div>
	);
};

export { UserForm };
