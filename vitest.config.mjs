import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["system/src/**/__tests__/**/*.test.mjs"],
	},
});
