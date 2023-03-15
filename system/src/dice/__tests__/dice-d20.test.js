/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice, D20 rolls
 */
import D20RollSD from "../D20RollSD.mjs";
import {
	waitForInput,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.dice.d20";
export const options = {
	displayName: "ShadowDark: Dice: D20",
};

const createMockActor = async type => {
	return ActorSD.create({
		name: `Test Actor ${key}`,
		type,
	});
};

export default ({ describe, it, after, before, expect }) => {
	after(() => {
		cleanUpActorsByKey(key);
	});
};