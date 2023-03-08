/**
 * @file Utilities for our Quench tests
 */

const inputDelay = 120;

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

export const waitForInput = () => delay(inputDelay);

export const cleanUpActorsByKey = async key => {
	game.actors
		?.filter(a => a.name === `Test Actor ${key}`)
		.forEach(async a => await a.delete());
};
