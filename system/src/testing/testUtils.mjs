/**
 * @file Utilities for our Quench tests
 */

const inputDelay = 120;

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

export const waitForInput = () => delay(inputDelay);

export const cleanUpActorsByKey = key => {
	game.actors
		?.filter(a => a.name === `Test Actor ${key}`)
		.forEach(a => a.delete());
};

export const cleanUpItemsByKey = key => {
	game.items
		?.filter(i => i.name.includes(`Test Item ${key}:`))
		.forEach(i => i.delete());
};
