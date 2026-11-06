import crypto from 'crypto';
import * as svelte from 'svelte/compiler';

const nonMarkupTagPattern = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g;

// Svelte markup contains `<script></script>` and `<style></style>` tags,
// which cannot be directly parsed by `svelte.parse()`, so we must temporarily
// remove them, modify the actual markup, then insert them in their original
// place when we're done.
export const modifySvelteMarkup = async (
	content: string,
	callback: (strippedContent: string, ast: svelte.AST.Root) => string | undefined
): Promise<string> => {
	// throw new Error('ugh');
	const replacements: Array<[string, string]> = [];

	const strippedContent = content.replace(nonMarkupTagPattern, (match) => {
		const placeholder = `<!--${crypto.randomUUID()}-->`;
		replacements.push([placeholder, match]);

		return placeholder;
	});

	let ast: Record<string, any>;
	try {
		ast = svelte.parse(strippedContent);
	} catch (e) {
		console.log(strippedContent, e);
		throw e;
	}

	const newContent = callback(strippedContent, ast) ?? strippedContent;

	return replacements.reduce(
		(acc, [placeholder, content]) => acc.replace(placeholder, content),
		newContent
	);
};
