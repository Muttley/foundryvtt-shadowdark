#!/usr/bin/env node

// CLI utility for manipulating packs

import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {getCommand as unpackCommand} from "./smelter/commands/unpack.mjs";

// eslint-disable-next-line no-unused-vars
const argv = yargs(hideBin(process.argv))
	.command(unpackCommand())
	.help().alias("help", "h")
	.argv;
