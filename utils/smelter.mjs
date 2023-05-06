#!/usr/bin/env node

import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {getCommand as unpackCommand} from "./lib/commands/unpack.mjs";
import {getCommand as packCommand} from "./lib/commands/pack.mjs";

const y = yargs();

// eslint-disable-next-line no-unused-vars
const argv = yargs(hideBin(process.argv))
	.command(unpackCommand())
	.command(packCommand())
	.help("h")
	.alias("help", "h")
	.wrap(y.terminalWidth())
	.argv;
