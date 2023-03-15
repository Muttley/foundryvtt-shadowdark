/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for ChatCards
 */
import {
	cleanUpActorsByKey,
	waitForInput,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.chat.chatcards";
export const options = {
	displayName: "ShadowDark: Chat: ChatCards",
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