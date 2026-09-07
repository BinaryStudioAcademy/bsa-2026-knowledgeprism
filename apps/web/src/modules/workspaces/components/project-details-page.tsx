import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppRoute } from "~/lib/enums/enums.js";

const ProjectDetailsPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const handleBackToWorkspaces = useCallback(() => {
		void navigate(AppRoute.WORKSPACES);
	}, [navigate]);

	return (
		<div className="mx-auto max-w-7xl px-8 py-8">
			<button
				className="mb-4 text-sm font-medium text-[#8C8880] transition-colors hover:text-[#1C1A17]"
				onClick={handleBackToWorkspaces}
				type="button"
			>
				← Back to Workspaces
			</button>
			<h1 className="font-serif text-3xl text-[#1C1A17]">
				Project Details: {id}
			</h1>
			<p className="mt-2 text-sm text-[#8C8880]">
				Temporary placeholder page for project specs and documentation.
			</p>
		</div>
	);
};

export { ProjectDetailsPage };
