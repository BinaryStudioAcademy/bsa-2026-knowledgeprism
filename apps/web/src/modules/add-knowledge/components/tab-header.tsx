import { type JSX, useCallback } from "react";

import { Icon } from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { KnowledgeInputTab } from "../libs/enums/enums.js";

type Properties = {
	activeTab: ValueOf<typeof KnowledgeInputTab>;
	onTabChange: (tab: ValueOf<typeof KnowledgeInputTab>) => void;
};

const TabHeader = ({ activeTab, onTabChange }: Properties): JSX.Element => {
	const handleTabClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			const { tabId } = event.currentTarget.dataset;
			if (tabId) {
				onTabChange(tabId as ValueOf<typeof KnowledgeInputTab>);
			}
		},
		[onTabChange],
	);

	const tabs = [
		{
			icon: "upload" as const,
			id: KnowledgeInputTab.UPLOAD,
			label: "Upload files",
		},
		{
			icon: "paste-text" as const,
			id: KnowledgeInputTab.TEXT,
			label: "Paste text",
		},
		{
			icon: "link" as const,
			id: KnowledgeInputTab.LINK,
			label: "Web link",
		},
	];

	return (
		<div className="flex gap-5 border-b border-border px-6.5">
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;

				return (
					<button
						className={getValidClassNames(
							"flex cursor-pointer items-center gap-2",
							"border-b-2 py-3 text-[13px] font-medium transition-colors",
							isActive
								? "border-accent text-accent"
								: "border-transparent text-text-muted hover:text-text",
						)}
						data-tab-id={tab.id}
						key={tab.id}
						onClick={handleTabClick}
						type="button"
					>
						<Icon name={tab.icon} size={14} />
						<span>{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
};

export { TabHeader };
