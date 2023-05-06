import gulp from "gulp";
import {deleteAsync} from "del";

import PackHandler from "./lib/pack-handler.mjs";

const PACK_DST_PATH  = "./system/packs";
const PACK_SRC_PATH = "./data/packs";

const packHandler = new PackHandler({
	destination: PACK_DST_PATH,
	inputFormat: "json",
	outputFormat: "nedb",
	source: PACK_SRC_PATH,
});

function cleanupPackFiles() {
	return deleteAsync(PACK_DST_PATH);
}
export const clean = cleanupPackFiles;

function compilePacks() {
	return packHandler.pack();
}
export const compile = compilePacks;
