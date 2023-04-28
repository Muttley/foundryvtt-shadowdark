/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for the Effect Panel
 */

import { EffectPanelSD } from "../EffectPanelSD.mjs";

export const key = "shadowdark.apps.effect-panel";
export const options = {
	displayName: "Shadowdark: Apps: Effect Panel",
	preSelected: true,
};

export default ({ describe, it, after, expect }) => {
	describe("Effect Panel", () => {
		it("Can construct", () => {
			const _panel = new EffectPanelSD();
			expect(_panel).to.be.defined;
		});
	});
};
