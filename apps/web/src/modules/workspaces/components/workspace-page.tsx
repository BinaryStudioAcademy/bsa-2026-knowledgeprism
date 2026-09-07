import React, { useCallback, useMemo, useState } from "react";

import { ProjectCard, ProjectRole } from "./project-card.js";
import { RecentDocuments } from "./recent-documents.js";
import { WorkspaceHeader } from "./workspace-header.js";

interface DocumentItem {
	id: string;
	title: string;
	updatedAt: string;
}

interface ProjectItem {
	description?: string;
	id: string;
	members?: string[];
	name: string;
	role: ProjectRole;
	updatedAt: string;
}

interface WorkspacePageProperties {
	documents?: DocumentItem[];
	firstName: string;
	isOrgAdmin?: boolean;
	lastName: string;
	onCreateProject?: () => void;
	onDeleteProject?: (id: string) => void;
	onEditProject?: (project: ProjectItem) => void;
	onLogOut: () => void;
	onOpenSettings: () => void;
	onSelectDocument?: (id: string) => void;
	onSelectProject: (id: string) => void;
	organizationName: string;
	projects: ProjectItem[];
}

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
	const isLastOdd = index === totalCount - 1 && totalCount % 2 !== 0;

	const handleDelete = useCallback((): void => {
		onDelete(project.id);
	}, [onDelete, project.id]);

	const handleEdit = useCallback((): void => {
		onEdit(project);
	}, [onEdit, project]);

	const canEdit =
		isOrgAdmin || project.role === "ADMIN" || project.role === "EDITOR";
	const canDelete = isOrgAdmin || project.role === "ADMIN";

	return (
		<div className={isLastOdd ? "sm:col-span-2 lg:col-span-1" : ""}>
			<ProjectCard
				description={project.description ?? ""}
				id={project.id}
				members={project.members ?? []}
				name={project.name}
				onSelect={onSelect}
				role={project.role}
				updatedAt={project.updatedAt}
				{...(canEdit ? { onEdit: handleEdit } : {})}
				{...(canDelete ? { onDelete: handleDelete } : {})}
			/>
		</div>
	);
};

const WorkspacePage: React.FC<WorkspacePageProperties> = ({
	documents = [],
	firstName,
	isOrgAdmin = false,
	lastName,
	onCreateProject,
	onDeleteProject,
	onEditProject,
	onLogOut,
	onOpenSettings,
	onSelectDocument,
	onSelectProject,
	organizationName,
	projects: initialProjects,
}) => {
	const [prevProjects, setPrevProjects] =
		useState<ProjectItem[]>(initialProjects);
	const [localProjects, setLocalProjects] =
		useState<ProjectItem[]>(initialProjects);

	if (prevProjects !== initialProjects) {
		setPrevProjects(initialProjects);
		setLocalProjects(initialProjects);
	}

	const [selectedRole, setSelectedRole] = useState<ProjectRole | "ALL">("ALL");
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
			const role = event.currentTarget.dataset["role"] as ProjectRole | "ALL";
			setSelectedRole(role);
			setIsFilterOpen(false);
		},
		[],
	);

	const handleOpenCreateModal = useCallback((): void => {
		setIsCreateModalOpen(true);
		onCreateProject?.();
	}, [onCreateProject]);

	const handleCloseCreateModal = useCallback((): void => {
		setIsCreateModalOpen(false);
	}, []);

	const handleSubmitCreateModal = useCallback(
		(newProject: ProjectItem): void => {
			setLocalProjects((previous) => [newProject, ...previous]);
			setIsCreateModalOpen(false);
		},
		[],
	);

	const handleCloseEditModal = useCallback((): void => {
		setEditingProject(null);
	}, []);

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

	const handleSelectDocument = useCallback(
		(id: string): void => {
			onSelectDocument?.(id);
		},
		[onSelectDocument],
	);

	return (
		<div className="workspace-page relative min-h-screen bg-white">
			<WorkspaceHeader
				firstName={firstName}
				isOrgAdmin={isOrgAdmin}
				lastName={lastName}
				onLogOut={onLogOut}
				onOpenSettings={onOpenSettings}
				organizationName={organizationName}
			/>
			<main className="workspace-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
				<div className="mb-6 sm:mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="font-serif text-2xl sm:text-3xl font-normal text-text">
							Your Workspaces
						</h1>
						<p className="mt-1 text-xs sm:text-sm text-text-muted">
							Manage your product documentation and engineering specs.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
						{isOrgAdmin && (
							<button
								className="order-1 sm:order-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D2A26] px-3.5 sm:px-4.5 py-2.5 sm:py-2 text-xs font-medium text-white shadow-sm hover:bg-black transition-colors cursor-pointer w-full sm:w-auto"
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

						<div className="relative order-2 sm:order-1 w-full sm:w-auto">
							<button
								aria-expanded={isFilterOpen}
								aria-haspopup="true"
								aria-label="Filter projects by role"
								className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3.5 sm:px-4 py-2 text-xs font-medium text-text shadow-sm hover:bg-surface transition-colors cursor-pointer w-full sm:w-auto"
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
										className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 rounded-lg border border-border bg-white p-1.5 shadow-xl z-30"
										role="menu"
									>
										{(["ALL", "ADMIN", "EDITOR", "VIEWER"] as const).map(
											(role) => (
												<button
													key={role}
													aria-selected={selectedRole === role}
													className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
														selectedRole === role
															? "bg-[#2D2A26] text-white font-medium"
															: "hover:bg-surface text-text"
													}`}
													data-role={role}
													onClick={handleSelectRole}
													role="menuitem"
													type="button"
												>
													{role === "ALL" ? "All Roles" : role}
												</button>
											),
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
					{filteredProjects.map((project, index) => (
						<ProjectItemCard
							key={project.id}
							index={index}
							isOrgAdmin={isOrgAdmin}
							onDelete={handleSetDeletingProjectId}
							onEdit={handleSetEditingProject}
							onSelect={onSelectProject}
							project={project}
							totalCount={filteredProjects.length}
						/>
					))}
				</div>

				{filteredProjects.length === 0 && (
					<div className="py-12 text-center text-sm text-text-muted">
						No projects found for the selected filter.
					</div>
				)}

				{localProjects.length > 0 && (
					<RecentDocuments
						documents={documents}
						onSelect={handleSelectDocument}
					/>
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
					role="dialog"
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
				>
					<div className="w-full max-w-sm rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-border text-center">
						<h2 className="font-serif text-lg sm:text-xl font-normal text-text mb-2">
							Delete Project?
						</h2>
						<p className="text-xs text-text-muted mb-6">
							This action cannot be undone.
						</p>
						<div className="flex justify-center gap-2.5">
							<button
								className="rounded-lg px-4 py-2 text-xs font-medium text-text hover:bg-surface border border-border transition-colors cursor-pointer"
								onClick={handleCancelDelete}
								type="button"
							>
								Cancel
							</button>
							<button
								className="rounded-lg bg-[#C4433A] px-4 py-2 text-xs font-medium text-white hover:bg-[#a83830] transition-colors cursor-pointer"
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

export { type DocumentItem, type ProjectItem, WorkspacePage };
