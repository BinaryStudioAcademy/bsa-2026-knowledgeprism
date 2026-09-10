import React, { useCallback, useMemo, useState } from "react";

import { Modal } from "~/components/components.js";
import { ProjectFormValue } from "~/modules/project-managment-modal/components/project-managment-modal-form/lib/type.js";
import { ProjectManagmentModalForm } from "~/modules/project-managment-modal/components/project-managment-modal-form/project-managment-modal-form.js";

import {
	CreateProjectPayload,
	UpdateProjectPayload,
} from "../api/workspaces-api.js";
import { FILTER_ROLE_OPTIONS } from "../libs/constants/mock-data.constants.js";
import { createProject, updateProject } from "../state/workspaces.slice.js";
import { type ProjectItem, type ProjectRole } from "../types/types.js";
import { ProjectCard, WorkspaceHeader } from "./components.js";

const EMPTY_LENGTH = 0;
const EVEN_MODULO = 2;
const INDEX_OFFSET = 1;

interface CreateProjectModalProperties {
	error: null | string;
	isOpen: boolean;
	isSubmitting: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateProjectPayload) => void;
}

interface EditProjectModalProperties {
	error: null | string;
	isOpen: boolean;
	isSubmitting: boolean;
	onClose: () => void;
	onSubmit: (payload: UpdateProjectPayload) => void;
	project: ProjectItem;
}

interface ProjectItemCardProperties {
	index: number;
	isOrgAdmin: boolean;
	onDelete: (id: string) => void;
	onEdit: (project: ProjectItem) => void;
	onSelect: (id: string) => void;
	project: ProjectItem;
	totalCount: number;
}

interface WorkspacePageProperties {
	creationError?: null | string;
	firstName: string;
	isCreating?: boolean;
	isLoading?: boolean;
	isOrgAdmin?: boolean;
	isUpdating?: boolean;
	lastName: string;
	onCreateProject?: (
		payload: CreateProjectPayload,
	) => Promise<unknown> | undefined;
	onDeleteProject?: (id: string) => void;
	onEditProject?: (
		payload: UpdateProjectPayload,
	) => Promise<unknown> | undefined;
	onLogOut: () => void;
	onOpenSettings?: () => void;
	onSelectProject: (id: string) => void;
	organizationName: string;
	projects: ProjectItem[];
	updateError?: null | string;
}

const CreateProjectModal: React.FC<CreateProjectModalProperties> = ({
	error,
	isOpen,
	isSubmitting,
	onClose,
	onSubmit,
}) => {
	const handleCreate = useCallback(
		(payload: ProjectFormValue): void => {
			onSubmit({
				description: payload.description ?? "",
				name: payload.projectName,
			});
		},
		[onSubmit],
	);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="New Project">
			<ProjectManagmentModalForm
				error={error}
				isSubmitting={isSubmitting}
				onSubmit={handleCreate}
				submitLabel="Create Project"
			/>
		</Modal>
	);
};

const EditProjectModal: React.FC<EditProjectModalProperties> = ({
	error,
	isOpen,
	isSubmitting,
	onClose,
	onSubmit,
	project,
}) => {
	const handleUpdate = useCallback(
		(payload: ProjectFormValue): void => {
			onSubmit({
				description: payload.description ?? "",
				id: project.id,
				name: payload.projectName,
			});
		},
		[onSubmit, project.id],
	);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
			<ProjectManagmentModalForm
				error={error}
				initialValues={{
					description: project.description ?? "",
					projectName: project.name,
				}}
				isSubmitting={isSubmitting}
				onSubmit={handleUpdate}
				submitLabel="Save Changes"
			/>
		</Modal>
	);
};

const ProjectItemCard: React.FC<ProjectItemCardProperties> = ({
	index,
	isOrgAdmin,
	onDelete,
	onEdit,
	onSelect,
	project,
	totalCount,
}) => {
	const canEdit =
		isOrgAdmin || project.role === "ADMIN" || project.role === "EDITOR";
	const canDelete = isOrgAdmin || project.role === "ADMIN";

	const handleDelete = useCallback((): void => {
		onDelete(project.id);
	}, [onDelete, project.id]);

	const handleEdit = useCallback((): void => {
		onEdit(project);
	}, [onEdit, project]);

	const isLastOdd =
		index === totalCount - INDEX_OFFSET &&
		totalCount % EVEN_MODULO !== EMPTY_LENGTH;

	return (
		<div className={isLastOdd ? "sm:col-span-2 lg:col-span-1" : ""}>
			<ProjectCard
				description={project.description ?? ""}
				id={project.id}
				name={project.name}
				onSelect={onSelect}
				role={project.role}
				updatedAt={project.updatedAt}
				{...(canDelete ? { onDelete: handleDelete } : {})}
				{...(canEdit ? { onEdit: handleEdit } : {})}
			/>
		</div>
	);
};

const WorkspacePage: React.FC<WorkspacePageProperties> = ({
	creationError = null,
	firstName,
	isCreating = false,
	isLoading = false,
	isOrgAdmin = false,
	isUpdating = false,
	lastName,
	onCreateProject,
	onDeleteProject,
	onEditProject,
	onLogOut,
	onOpenSettings,
	onSelectProject,
	organizationName,
	projects: initialProjects,
	updateError = null,
}) => {
	const [localProjects, setLocalProjects] =
		useState<ProjectItem[]>(initialProjects);
	const [previousInitialProjects, setPreviousInitialProjects] =
		useState<ProjectItem[]>(initialProjects);

	if (initialProjects !== previousInitialProjects) {
		setPreviousInitialProjects(initialProjects);
		setLocalProjects(initialProjects);
	}

	const [selectedRole, setSelectedRole] = useState<"ALL" | ProjectRole>("ALL");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<null | ProjectItem>(
		null,
	);
	const [deletingProjectId, setDeletingProjectId] = useState<null | string>(
		null,
	);

	const filteredProjects = useMemo(() => {
		if (selectedRole === "ALL") {
			return localProjects;
		}

		return localProjects.filter((project) => project.role === selectedRole);
	}, [localProjects, selectedRole]);

	const handleToggleFilter = useCallback((): void => {
		setIsFilterOpen((previous) => !previous);
	}, []);

	const handleCloseFilter = useCallback((): void => {
		setIsFilterOpen(false);
	}, []);

	const handleSelectRole = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			const role = event.currentTarget.dataset["role"] as "ALL" | ProjectRole;
			setSelectedRole(role);
			setIsFilterOpen(false);
		},
		[],
	);

	const handleOpenCreateModal = useCallback((): void => {
		setIsCreateModalOpen(true);
	}, []);

	const handleCloseCreateModal = useCallback((): void => {
		setIsCreateModalOpen(false);
	}, []);

	const handleSubmitCreateModal = useCallback(
		(payload: CreateProjectPayload): void => {
			void (async (): Promise<void> => {
				const action = await onCreateProject?.(payload);

				if (action && createProject.fulfilled.match(action)) {
					setIsCreateModalOpen(false);
				}
			})();
		},
		[onCreateProject],
	);

	const handleCloseEditModal = useCallback((): void => {
		setEditingProject(null);
	}, []);

	const handleSubmitEditModal = useCallback(
		(payload: UpdateProjectPayload): void => {
			void (async (): Promise<void> => {
				const action = await onEditProject?.(payload);

				if (action && updateProject.fulfilled.match(action)) {
					setEditingProject(null);
				}
			})();
		},
		[onEditProject],
	);

	const handleSetDeletingProjectId = useCallback((id: string): void => {
		setDeletingProjectId(id);
	}, []);

	const handleSetEditingProject = useCallback((project: ProjectItem): void => {
		setEditingProject(project);
	}, []);

	const handleCancelDelete = useCallback((): void => {
		setDeletingProjectId(null);
	}, []);

	const handleDeleteProjectConfirm = useCallback((): void => {
		if (!deletingProjectId) {
			return;
		}

		setLocalProjects((previous) =>
			previous.filter((item) => item.id !== deletingProjectId),
		);
		onDeleteProject?.(deletingProjectId);
		setDeletingProjectId(null);
	}, [deletingProjectId, onDeleteProject]);

	return (
		<div className="workspace-page relative min-h-screen bg-bg">
			<WorkspaceHeader
				firstName={firstName}
				isLoading={isLoading}
				lastName={lastName}
				onLogOut={onLogOut}
				onOpenSettings={onOpenSettings}
				organizationName={organizationName}
			/>
			<main className="workspace-content mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
				<div className="mb-6 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-center">
					<div>
						<span className="block text-(length:--text-xs) font-semibold uppercase tracking-wider text-text-muted">
							WORKSPACE
						</span>
						<h1 className="mt-0.5 font-serif text-2xl font-normal text-text sm:text-3xl">
							Your projects
						</h1>
					</div>

					<div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center">
						{isOrgAdmin && (
							<button
								className="order-1 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2.5 text-(length:--text-xs) font-medium text-(--color-primary-fg) shadow-(--shadow-sm) transition-opacity hover:opacity-90 sm:order-2 sm:w-auto sm:px-4.5 sm:py-2"
								onClick={handleOpenCreateModal}
								type="button"
							>
								<svg
									fill="currentColor"
									height="10"
									viewBox="0 0 10.5 10.5"
									width="10"
								>
									<path d="M4.5 0h1.5v4.5H10.5v1.5H6v4.5H4.5V6H0V4.5h4.5z" />
								</svg>
								New Project
							</button>
						)}

						<div className="relative order-2 w-full sm:order-1 sm:w-auto">
							<button
								aria-expanded={isFilterOpen}
								aria-haspopup="true"
								aria-label="Filter projects by role"
								className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-(length:--text-xs) font-medium text-text shadow-sm transition-colors hover:bg-surface sm:w-auto sm:px-4"
								onClick={handleToggleFilter}
								type="button"
							>
								<svg
									aria-hidden="true"
									className="text-text-muted"
									fill="currentColor"
									height="8"
									viewBox="0 0 13.5 9"
									width="12"
								>
									<path d="M0 0h13.5L8.5 5.5v3h-3v-3z" />
								</svg>
								Filter {selectedRole !== "ALL" && `(${selectedRole})`}
							</button>

							{isFilterOpen && (
								<>
									<div
										aria-hidden="true"
										className="fixed inset-0 z-20"
										onClick={handleCloseFilter}
									/>
									<div
										className="absolute left-0 z-30 mt-2 w-full rounded-lg border border-border bg-white p-1.5 shadow-xl sm:right-0 sm:left-auto sm:w-40"
										role="menu"
									>
										{FILTER_ROLE_OPTIONS.map((role) => (
											<button
												aria-checked={selectedRole === role}
												className={`w-full rounded-md px-3 py-1.5 text-left text-(length:--text-xs) transition-colors ${
													selectedRole === role
														? "bg-text font-medium text-white"
														: "text-text hover:bg-surface"
												}`}
												data-role={role}
												key={role}
												onClick={handleSelectRole}
												role="menuitemradio"
												type="button"
											>
												{role === "ALL" ? "All Roles" : role}
											</button>
										))}
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
					{filteredProjects.map((project, index) => (
						<ProjectItemCard
							index={index}
							isOrgAdmin={isOrgAdmin}
							key={project.id}
							onDelete={handleSetDeletingProjectId}
							onEdit={handleSetEditingProject}
							onSelect={onSelectProject}
							project={project}
							totalCount={filteredProjects.length}
						/>
					))}
				</div>

				{filteredProjects.length === EMPTY_LENGTH && (
					<div className="py-12 text-center text-control text-text-muted">
						No projects found for the selected filter.
					</div>
				)}
			</main>

			{isCreateModalOpen && (
				<CreateProjectModal
					error={creationError}
					isOpen={isCreateModalOpen}
					isSubmitting={isCreating}
					onClose={handleCloseCreateModal}
					onSubmit={handleSubmitCreateModal}
				/>
			)}

			{editingProject && (
				<EditProjectModal
					error={updateError}
					isOpen={Boolean(editingProject)}
					isSubmitting={isUpdating}
					key={editingProject.id}
					onClose={handleCloseEditModal}
					onSubmit={handleSubmitEditModal}
					project={editingProject}
				/>
			)}

			{deletingProjectId && (
				<div
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
					role="dialog"
				>
					<div className="w-full max-w-sm rounded-lg border border-border bg-(--color-surface) p-5 text-center shadow-(--shadow-md) sm:p-6">
						<h2 className="mb-2 font-serif text-lg font-normal text-text sm:text-xl">
							Delete Project?
						</h2>
						<p className="mb-6 text-(length:--text-xs) text-text-muted">
							This action cannot be undone.
						</p>
						<div className="flex justify-center gap-2.5">
							<button
								className="cursor-pointer rounded-md border border-border px-4 py-2 text-(length:--text-xs) font-medium text-text transition-colors hover:bg-(--color-secondary)"
								onClick={handleCancelDelete}
								type="button"
							>
								Cancel
							</button>
							<button
								className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-(length:--text-xs) font-medium text-white transition-colors hover:bg-red-700"
								onClick={handleDeleteProjectConfirm}
								type="button"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export { WorkspacePage };
