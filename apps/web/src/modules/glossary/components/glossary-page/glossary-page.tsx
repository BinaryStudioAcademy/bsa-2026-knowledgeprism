import { useCurrentProjectId } from "~/hooks/hooks.js";

import { GlossaryContent } from "../glossary-content/glossary-content.js";

const GlossaryPage: React.FC = () => {
	const projectId = useCurrentProjectId();

	return <GlossaryContent key={projectId} projectId={projectId} />;
};

export { GlossaryPage };
