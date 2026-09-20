import React, { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { Button, Heading, Icon, Modal } from "~/components/components.js";
import { type AppDispatch } from "~/lib/store/store.js";
import { ProjectFormValue } from "~/modules/project-managment-modal/components/project-managment-modal-form/lib/type.js";
import { ProjectManagmentModalForm } from "~/modules/project-managment-modal/components/project-managment-modal-form/project-managment-modal-form.js";

import {
	CreateProjectPayload,
	UpdateProjectPayload,
} from "../api/workspaces-api.js";
import {
	createProject,
	updateProject,
	workspacesActions,
} from "../state/workspaces.slice.js";
import {
	type ProjectItem,
	type RecentDocumentItem,
	type RoleFilter,
} from "../types/types.js";
import { ProjectCard } from "./project-card.js";
import { RecentDocuments } from "./recent-documents.js";

const EMPTY_LENGTH = 0;
const EVEN_MODULO = 2;
const INDEX_OFFSET = 1;

const ROLE_FILTERS: { label: string; value: RoleFilter }[] = [
	{ label: "All roles", value: "ALL" },
	{ label: "Admin", value: "ADMIN" },
	{ label: "Editor", value: "EDITOR" },
	{ label: "Viewer", value: "VIEWER" },
];

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

interface EmptyStateViewProperties {
	hasProjects: boolean;
	isOrgAdmin: boolean;
	onOpenCreateModal: () => void;
	selectedRole: RoleFilter;
}

interface FilterOptionProperties {
	filter: { label: string; value: RoleFilter };
	isSelected: boolean;
	onSelect: (role: RoleFilter) => void;
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
	isCreating?: boolean;
	isLoadingRecent?: boolean;
	isOrgAdmin?: boolean;
	isUpdating?: boolean;
	onCreateProject?: (
		payload: CreateProjectPayload,
	) => Promise<unknown> | undefined;
	onDeleteProject?: (id: string) => Promise<boolean>;
	onEditProject?: (
		payload: UpdateProjectPayload,
	) => Promise<unknown> | undefined;
	onSelectDocument?: (document: RecentDocumentItem) => void;
	onSelectProject: (id: string) => void;
	projects: ProjectItem[];
	recentDocuments?: RecentDocumentItem[];
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

const FilterOption: React.FC<FilterOptionProperties> = ({
	filter,
	isSelected,
	onSelect,
}) => {
	const handleClick = useCallback((): void => {
		onSelect(filter.value);
	}, [filter.value, onSelect]);

	return (
		<button
			className={`dropdown-item w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-secondary ${
				isSelected ? "font-semibold text-text" : "text-text-muted"
			}`}
			onClick={handleClick}
			role="menuitem"
			type="button"
		>
			{filter.label}
		</button>
	);
};

const EmptyStateView: React.FC<EmptyStateViewProperties> = ({
	hasProjects,
	isOrgAdmin,
	onOpenCreateModal,
	selectedRole,
}) => {
	if (!hasProjects) {
		if (isOrgAdmin) {
			return (
				<div className="flex flex-col items-center gap-4">
					<p className="text-sm">
						No projects yet. Create your first project to get started.
					</p>
					<Button onClick={onOpenCreateModal}>
						<span className="flex items-center gap-1.5">
							<Icon name="plus" size={10} />
							<span>Create new project</span>
						</span>
					</Button>
				</div>
			);
		}

		return <p className="text-sm">No projects assigned to you yet.</p>;
	}

	return (
		<p className="text-sm">
			No projects found for the selected role filter &quot;{selectedRole}&quot;.
		</p>
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
	const canDelete = isOrgAdmin;
	const canEdit = isOrgAdmin;

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
				updatedAt={project.lastActivityAt ?? project.updatedAt}
				{...(canDelete ? { onDelete: handleDelete } : {})}
				{...(canEdit ? { onEdit: handleEdit } : {})}
			/>
		</div>
	);
};

const WorkspacePage: React.FC<WorkspacePageProperties> = ({
	creationError = null,
	isCreating = false,
	isLoadingRecent = false,
	isOrgAdmin = false,
	isUpdating = false,
	onCreateProject,
	onDeleteProject,
	onEditProject,
	onSelectDocument,
	onSelectProject,
	projects: initialProjects,
	recentDocuments = [],
	updateError = null,
}) => {
	const dispatch = useDispatch<AppDispatch>();

	const [localProjects, setLocalProjects] =
		useState<ProjectItem[]>(initialProjects);
	const [previousInitialProjects, setPreviousInitialProjects] =
		useState<ProjectItem[]>(initialProjects);

	if (initialProjects !== previousInitialProjects) {
		setPreviousInitialProjects(initialProjects);
		setLocalProjects(initialProjects);
	}

	const [selectedRole, setSelectedRole] = useState<RoleFilter>("ALL");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<null | ProjectItem>(
		null,
	);
	const [deletingProjectId, setDeletingProjectId] = useState<null | string>(
		null,
	);
	const [deletedIds, setDeletedIds] = useState<string[]>([]);

	const filterContainerReference = useRef<HTMLDivElement>(null);

	const visibleProjects = useMemo(() => {
		return localProjects.filter((project) => !deletedIds.includes(project.id));
	}, [deletedIds, localProjects]);

	const filteredProjects = useMemo(() => {
		if (selectedRole === "ALL") {
			return visibleProjects;
		}

		return visibleProjects.filter((project) => project.role === selectedRole);
	}, [selectedRole, visibleProjects]);

	const filterLabel = useMemo(() => {
		if (selectedRole === "ALL") {
			return "Filter";
		}

		const currentFilter = ROLE_FILTERS.find(
			(filter) => filter.value === selectedRole,
		);

		return `Filter: ${currentFilter?.label ?? selectedRole}`;
	}, [selectedRole]);

	const handleToggleFilter = useCallback((): void => {
		setIsFilterOpen((previous) => !previous);
	}, []);

	const handleSelectRole = useCallback((role: RoleFilter): void => {
		setSelectedRole(role);
		setIsFilterOpen(false);
	}, []);

	const handleOpenCreateModal = useCallback((): void => {
		setIsCreateModalOpen(true);
	}, []);

	const handleCloseCreateModal = useCallback((): void => {
		dispatch(workspacesActions.clearCreationError());
		setIsCreateModalOpen(false);
	}, [dispatch]);

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
		dispatch(workspacesActions.clearUpdateError());
		setEditingProject(null);
	}, [dispatch]);

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

		const projectIdToDelete = deletingProjectId;

		void (async (): Promise<void> => {
			try {
				const isSuccess = await onDeleteProject?.(projectIdToDelete);

				if (isSuccess) {
					setDeletedIds((previous) => [...previous, projectIdToDelete]);
				}
			} finally {
				setDeletingProjectId(null);
			}
		})();
	}, [deletingProjectId, onDeleteProject]);

	const hasProjects = localProjects.length > EMPTY_LENGTH;

	return (
		<div className="workspace-page relative min-h-screen bg-bg">
			<main className="workspace-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
				<div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
					<div>
						<Heading level="2">Your Workspaces</Heading>
						<p className="mt-1 text-sm text-text-muted">
							Manage your product documentation and engineering specs.
						</p>
					</div>

					{hasProjects && (
						<div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
							<div
								className="relative w-full sm:w-auto"
								ref={filterContainerReference}
							>
								<Button
									aria-expanded={isFilterOpen}
									aria-haspopup="menu"
									className="w-full cursor-pointer justify-center sm:w-auto"
									onClick={handleToggleFilter}
									variant="secondary"
								>
									<span className="flex items-center gap-2">
										<Icon name="filter" size={14} />
										<span>{filterLabel}</span>
									</span>
								</Button>

								{isFilterOpen && (
									<div
										className="dropdown-menu absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-border bg-surface py-1 shadow-lg sm:left-auto sm:right-0 sm:min-w-36"
										role="menu"
									>
										{ROLE_FILTERS.map((filter) => (
											<FilterOption
												filter={filter}
												isSelected={selectedRole === filter.value}
												key={filter.value}
												onSelect={handleSelectRole}
											/>
										))}
									</div>
								)}
							</div>

							{isOrgAdmin && (
								<Button
									className="w-full justify-center bg-neutral-900 text-white hover:bg-neutral-800 sm:w-auto"
									onClick={handleOpenCreateModal}
								>
									<span className="flex items-center gap-1.5">
										<Icon name="plus" size={12} />
										<span>New Project</span>
									</span>
								</Button>
							)}
						</div>
					)}
				</div>

				{filteredProjects.length > EMPTY_LENGTH && (
					<div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
				)}

				{filteredProjects.length === EMPTY_LENGTH && (
					<div className="mb-10 py-16 text-center text-text-muted">
						<EmptyStateView
							hasProjects={hasProjects}
							isOrgAdmin={isOrgAdmin}
							onOpenCreateModal={handleOpenCreateModal}
							selectedRole={selectedRole}
						/>
					</div>
				)}

				<RecentDocuments
					documents={recentDocuments}
					isLoading={isLoadingRecent}
					{...(onSelectDocument ? { onSelectDocument } : {})}
				/>
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

			<Modal
				className="w-full max-w-sm rounded-lg border border-border bg-(--color-surface) p-5 text-center shadow-md sm:p-6"
				isOpen={Boolean(deletingProjectId)}
				onClose={handleCancelDelete}
				title="Delete Project?"
			>
				<p className="mb-6 text-xs text-text-muted">
					This action cannot be undone.
				</p>
				<div className="flex justify-center gap-2.5">
					<Button onClick={handleCancelDelete} variant="secondary">
						Cancel
					</Button>
					<Button onClick={handleDeleteProjectConfirm} variant="destructive">
						Delete
					</Button>
				</div>
			</Modal>
		</div>
	);
};

export { WorkspacePage };
