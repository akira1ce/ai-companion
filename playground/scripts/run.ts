import path from "node:path";
import { execSync } from "node:child_process";
import fg from "fast-glob";
import inquirer from "inquirer";

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

  const choices = files.map((file) => ({
    name: file,
    value: file,
  }));

  const { selected } = await inquirer.prompt<{
    selected: string;
  }>([
    {
      type: "select",
      name: "selected",
      message: "Select a script to run",
      choices,
      pageSize: 20,
    },
  ]);

  const fullPath = path.join(SCRIPTS_DIR, selected);

  execSync(`tsx "${fullPath}"`, {
    stdio: "inherit",
  });
}

main();
