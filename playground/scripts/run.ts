import fg from "fast-glob";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";
import { execSync } from "node:child_process";
import path from "node:path";

inquirer.registerPrompt("autocomplete", autocomplete);

const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");

async function main() {
	const files = await fg(["**/*.ts"], {
		cwd: SCRIPTS_DIR,
		onlyFiles: true,
	});

	if (files.length === 0) {
		console.log("No TS files found.");
		return;
	}

	const { selected } = await inquirer.prompt<{
		selected: string;
	}>([
		{
			type: "autocomplete",
			name: "selected",
			message: "Select a script to run",
			pageSize: 20,
			source: async (_: any, input: string) => {
				const keyword = (input || "").toLowerCase();

				return files
					.filter((file) => file.toLowerCase().includes(keyword))
					.map((file) => ({
						name: file,
						value: file,
					}));
			},
		},
	]);

	const fullPath = path.join(SCRIPTS_DIR, selected);

	execSync(`tsx "${fullPath}"`, {
		stdio: "inherit",
	});
}

main();
