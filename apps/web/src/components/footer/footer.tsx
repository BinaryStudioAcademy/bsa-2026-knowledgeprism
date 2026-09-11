function Footer() {
	const currentYear = new Date().getFullYear();
	return (
		<footer className="flex items-center justify-between w-full px-[10%] bg-border">
			<p className="text-text-faint font-mono font-normal text-sm">
				© {currentYear} KnowledgePrism AI. Order from Chaos.
			</p>
			<ul className="flex items-center gap-6 py-5  ">
				{/* at this moment i left just li and when we have similar pages after this i will add routes */}
				<li className="text-sm text-text-muted font-sans font-normal">
					Privacy
				</li>
				<li className="text-sm text-text-muted font-sans font-normal">Terms</li>
				<li className="text-sm text-text-muted font-sans font-normal">
					API Documentation
				</li>
			</ul>
		</footer>
	);
}
export { Footer };
