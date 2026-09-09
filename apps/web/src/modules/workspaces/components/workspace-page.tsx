import React, { useCallback, useState } from "react";

import { type ProjectItem } from "../types/types.js";
import { ProjectCard, WorkspaceHeader } from "./components.js";

const EMPTY_LENGTH = 0;
const EVEN_MODULO = 2;
const INDEX_OFFSET = 1;

interface CreateProjectModalProperties {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (newProject: ProjectItem) => void;
}

interface EditProjectModalProperties {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (updatedProject: ProjectItem) => void;
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
	firstName: string;
	isLoading?: boolean;
	isOrgAdmin?: boolean;
	lastName: string;
	onCreateProject?: () => void;
	onDeleteProject?: (id: string) => void;
	onEditProject?: (project: ProjectItem) => void;
	onLogOut: () => void;
	onOpenSettings?: () => void;
	onSelectProject: (id: string) => void;
	organizationName: string;
	projects: ProjectItem[];
}

const CreateProjectModal: React.FC<CreateProjectModalProperties> = () => null;
const EditProjectModal: React.FC<EditProjectModalProperties> = () => null;

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
				updatedAt={project.updatedAt}
				{...(canDelete ? { onDelete: handleDelete } : {})}
				{...(canEdit ? { onEdit: handleEdit } : {})}
			/>
		</div>
	);
};

const WorkspacePage: React.FC<WorkspacePageProperties> = ({
	firstName,
	isLoading = false,
	isOrgAdmin = false,
	lastName,
	onCreateProject,
	onDeleteProject,
	onEditProject,
	onLogOut,
	onOpenSettings,
	onSelectProject,
	organizationName,
	projects: initialProjects,
}) => {
	const [deletingProjectId, setDeletingProjectId] = useState<null | string>(
		null,
	);
	const [editingProject, setEditingProject] = useState<null | ProjectItem>(
		null,
	);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [localProjects, setLocalProjects] =
		useState<ProjectItem[]>(initialProjects);
	const [previousInitialProjects, setPreviousInitialProjects] =
		useState<ProjectItem[]>(initialProjects);

	if (initialProjects !== previousInitialProjects) {
		setPreviousInitialProjects(initialProjects);
		setLocalProjects(initialProjects);
	}

	const handleCancelDelete = useCallback((): void => {
		setDeletingProjectId(null);
	}, []);

	const handleCloseCreateModal = useCallback((): void => {
		setIsCreateModalOpen(false);
	}, []);

	const handleCloseEditModal = useCallback((): void => {
		setEditingProject(null);
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

	const handleOpenCreateModal = useCallback((): void => {
		setIsCreateModalOpen(true);
		onCreateProject?.();
	}, [onCreateProject]);

	const handleSetDeletingProjectId = useCallback((id: string): void => {
		setDeletingProjectId(id);
	}, []);

	const handleSetEditingProject = useCallback((project: ProjectItem): void => {
		setEditingProject(project);
	}, []);

	const handleSubmitCreateModal = useCallback(
		(newProject: ProjectItem): void => {
			setLocalProjects((previous) => [newProject, ...previous]);
			setIsCreateModalOpen(false);
		},
		[],
	);

	const handleSubmitEditModal = useCallback(
		(updatedProject: ProjectItem): void => {
			setLocalProjects((previous) =>
				previous.map((project) =>
					project.id === updatedProject.id ? updatedProject : project,
				),
			);
			onEditProject?.(updatedProject);
			setEditingProject(null);
		},
		[onEditProject],
	);

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

					{isOrgAdmin && (
						<button
							className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2.5 text-(length:--text-xs) font-medium text-(--color-primary-fg) shadow-(--shadow-sm) transition-opacity hover:opacity-90 sm:w-auto sm:px-4.5 sm:py-2"
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
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
					{localProjects.map((project, index) => (
						<ProjectItemCard
							index={index}
							isOrgAdmin={isOrgAdmin}
							key={project.id}
							onDelete={handleSetDeletingProjectId}
							onEdit={handleSetEditingProject}
							onSelect={onSelectProject}
							project={project}
							totalCount={localProjects.length}
						/>
					))}
				</div>

				{localProjects.length === EMPTY_LENGTH && (
					<div className="py-12 text-center text-control text-text-muted">
						No projects found.
					</div>
				)}
			</main>

			{isCreateModalOpen && (
				<CreateProjectModal
					isOpen={isCreateModalOpen}
					onClose={handleCloseCreateModal}
					onSubmit={handleSubmitCreateModal}
				/>
			)}

			{editingProject && (
				<EditProjectModal
					isOpen={Boolean(editingProject)}
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
