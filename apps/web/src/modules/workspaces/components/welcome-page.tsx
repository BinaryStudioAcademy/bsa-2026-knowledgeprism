import React from "react";

import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";

import { WelcomeIllustration } from "./welcome-illustration.js";

const WelcomePage: React.FC = () => {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto flex max-w-xl flex-col items-center text-center">
				<Heading level="1">Welcome aboard!</Heading>
				<Paragraph
					className="mt-4 text-center leading-relaxed text-text-muted"
					size={ParagraphSize.BODY}
				>
					You currently don&apos;t have any projects assigned to you yet. Please
					reach out to your organization administrator to get assigned to a
					project and get started.
				</Paragraph>
				<div className="mt-10 flex justify-center sm:mt-12">
					<WelcomeIllustration />
				</div>
			</div>
		</div>
	);
};

export { WelcomePage };
