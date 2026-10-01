import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from "react";

type KnowledgeTreePanelContextValue = {
	openKnowledgeTree: OpenKnowledgeTree;
	registerOpenKnowledgeTree: (
		openKnowledgeTree: OpenKnowledgeTree,
	) => () => void;
};

type OpenKnowledgeTree = () => void;

const doNothing = (): void => undefined;

const registerNothing = (): (() => void) => doNothing;

const KnowledgeTreePanelContext = createContext<KnowledgeTreePanelContextValue>(
	{
		openKnowledgeTree: doNothing,
		registerOpenKnowledgeTree: registerNothing,
	},
);

type KnowledgeTreePanelProviderProperties = {
	children: ReactNode;
};

const KnowledgeTreePanelProvider = ({
	children,
}: KnowledgeTreePanelProviderProperties): React.JSX.Element => {
	const openKnowledgeTreeReference = useRef<null | OpenKnowledgeTree>(null);

	const registerOpenKnowledgeTree = useCallback(
		(openKnowledgeTree: OpenKnowledgeTree): (() => void) => {
			openKnowledgeTreeReference.current = openKnowledgeTree;

			return (): void => {
				if (openKnowledgeTreeReference.current === openKnowledgeTree) {
					openKnowledgeTreeReference.current = null;
				}
			};
		},
		[],
	);

	const openKnowledgeTree = useCallback((): void => {
		openKnowledgeTreeReference.current?.();
	}, []);

	const value = useMemo(
		(): KnowledgeTreePanelContextValue => ({
			openKnowledgeTree,
			registerOpenKnowledgeTree,
		}),
		[openKnowledgeTree, registerOpenKnowledgeTree],
	);

	return (
		<KnowledgeTreePanelContext.Provider value={value}>
			{children}
		</KnowledgeTreePanelContext.Provider>
	);
};

const useKnowledgeTreePanel = (): KnowledgeTreePanelContextValue => {
	return useContext(KnowledgeTreePanelContext);
};

export { KnowledgeTreePanelProvider, useKnowledgeTreePanel };
