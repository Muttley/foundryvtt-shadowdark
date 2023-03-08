/**
 * @file Utilities for our Quench tests
 */
const inputDelay = 120;

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

export const abilities = ["str", "dex", "con", "int", "wis", "cha"];

export const waitForInput = () => delay(inputDelay);

/* MOCKING FUNCTIONS */
export const createMockActorByKey = async (key, type) => {
	return Actor.create({
		name: `Test Actor ${key}: ${type}`,
		type,
	});
};

export const createMockItemByKey = async (key, type) => {
	return Item.create({
		name: `Test Item ${key}: ${type}`,
		type,
	});
};

/* CLEAN UP HELPERS */
export const cleanUpActorsByKey = key => {
	game.actors
		?.filter(a => a.name.includes(`Test Actor ${key}`))
		.forEach(a => a.delete());
};

export const cleanUpItemsByKey = key => {
	game.items
		?.filter(i => i.name.includes(`Test Item ${key}:`))
		.forEach(i => i.delete());
};

/* UI CLOSE HELPERS */
export const openWindows = className =>
	Object.values(ui.windows).filter(o =>
		o.options.classes.includes(className)
	);

export const closeSheets = async () => {
	openWindows("sheet").forEach(async w => w.close());
	await waitForInput();
};

export const openDialogs = () =>
	Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));

export const closeDialogs = async () => {
	openDialogs()?.forEach(async o => {
		await o.close();
	});
};
