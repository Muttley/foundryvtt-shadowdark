import * as foundryCommon from "../../../../third_party/foundryvtt-13.351/common/server.mjs";
import SHADOWDARK from "../../config.mjs";

globalThis.foundry = {
	abstract: foundryCommon.abstract,
	data: foundryCommon.data,
};
globalThis.CONST = foundryCommon.CONST;
globalThis.CONFIG = { SHADOWDARK };
globalThis.shadowdark = {
	defaults: SHADOWDARK.DEFAULTS,
	dice: {
		resolveFormula(formula, _rollData) {
			const n = Number(formula);
			if (Number.isFinite(n)) return n;
			return formula;
		},
		createToolTip(name, value, op, key) {
			return `${name}: ${op}${value}`;
		},
		formatBonus(value) {
			return value >= 0 ? `+${value}` : `${value}`;
		},
	},
};
