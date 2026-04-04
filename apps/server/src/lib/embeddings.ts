import type { Env } from "../index.js";

export function createCloudflareEmbeddings(env: Env) {
	return {
		async embedQuery(text: string): Promise<number[]> {
			const result = (await env.AI.run("@cf/baai/bge-m3", {
				text: [text],
			})) as any;
			console.log("akira.result", result);
			return result.data[0];
		},
	};
}
