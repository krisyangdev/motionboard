import { bindings, defineConfig } from "cf/config";

// No imports from the app (site.config.ts included): the Cloudflare Vite plugin adds every file this
// config imports to Vite's fs.deny list, so the dev server then answers 500 ("Failed to load url
// /site.config.ts") for any page that imports the same file. name and domains repeat SITE.worker and
// SITE.domain; scripts/site/test.mjs checks that they match.
export default defineConfig({
	worker: {
		name: "motionboard",
		compatibilityDate: "2026-10-23",
		compatibilityFlags: ["nodejs_compat"],
		entrypoint: "@tanstack/react-start/server-entry",
		observability: { enabled: true },
		domains: ["motionboard.app"],
		env: {
			// Tables are created by the SQL files in migrations/.
			DB: bindings.d1({ name: "motionboard", id: "56d585f2-3a5b-4698-93f3-91e7abdce70c" }),
		},
	},
});
