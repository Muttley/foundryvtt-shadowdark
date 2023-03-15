/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice, D20 rolls
 */
export const key = "shadowdark.dice.d20";
export const options = {
	displayName: "ShadowDark: Dice: D20",
};

export default ({ describe, it, after, before, expect }) => {
	describe("digestCritical(roll)", () => {
		it("providing a non-d20 roll returns null");
		it("providing a d20 with 20 as total result returns 'success'");
		it("providing a d20 with 1 as total result returns 'failure'");
		it("providing any other d20 result returns 'null");
	});

	describe("digestResult(data,roll)", () => {
		describe("returns an object with critical", () => {});
		it("returns the roll total in objcet");
	});

	describe("d20Roll({})", () => {
		describe("item provided");
		describe("item not provided");

		describe("evaluates roll to targetValue if given");

		describe("providing @abilityBonus in parts adds ability bonuses");
		describe("providing @abilityBonus in parts but not abilityBonus doesn't adds ability bonuses");
		describe("providing no @abilityBonus in parts but abilityBonus doesn't adds ability bonuses");

		describe("providing @itemBonus in parts adds item bonuses");
		describe("providing @itemBonus in parts but not itemBonus doesn't adds ability bonuses");
		describe("providing no @itemBonus in parts but itemBonus doesn't adds ability bonuses");

		describe("providing @talentBnous in parts adds talent bonuses");
		describe("providing @talentBnous in parts but not talentBnous doesn't adds ability bonuses");
		describe("providing no @talentBnous in parts but talentBnous doesn't adds ability bonuses");

		describe("not changing chatMessage do generate a chatmessage");
		describe("setting chatMessage to true do generate a chatmessage");
		describe("setting chatMessage to false doesn't generate a chatmessage");

		describe("holding ctrl skips roll dialogs and rolls normal");
		describe("holding meta skips roll dialogs and rolls normal");
		describe("holding shift skips roll dialogs and rolls with advantage");
		describe("holding alt skips roll dialogs and rolls with disadvantage");

		// @todo: this requires refactoring, so the above tests needs to be defined and running
		//        before implementing this.
		describe("mocking roll results");
	});
};
