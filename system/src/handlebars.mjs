import EffectPanelSD from "./apps/EffectPanelSD.mjs";

export default function registerHandlebarsHelpers() {

	Handlebars.registerHelper("activeEffectIcon", effect => {
		return shadowdark.utils.foundryMinVersion(12)
			? effect.img
			: effect.icon;
	});

	Handlebars.registerHelper("addEmptySlots", (objects, max) => {
		const newOjects = objects.map(a => ({...a}));
		for (let j = 0; j < max - objects.length; j++) {
			newOjects.push(null);
		}
		return newOjects;
	});

	Handlebars.registerHelper('calculateAbilityTabIndex', function(index) {
		const row = Math.floor(index / 2);
		const col = index % 2;
		return row + (col === 0 ? 1 : 4); // 1-3 for col 1, 4-6 for col 2
	});

	Handlebars.registerHelper("concat", function() {
		let outStr = "";
		for (let arg in arguments) {
			if (typeof arguments[arg] != "object") {
				outStr += arguments[arg];
			}
		}
		return outStr;
	});

	Handlebars.registerHelper("displayCost", item => {
		let costInGp = item.system.cost.gp
		+ (item.system.cost.sp /10 )
		+ (item.system.cost.cp /100 );
		costInGp = costInGp * item.system.quantity;
		return costInGp.toString().concat(" gp");
	});

	Handlebars.registerHelper("fromConfig", function(arg1, arg2) {
		return CONFIG.SHADOWDARK[arg1][arg2] ? CONFIG.SHADOWDARK[arg1][arg2] : arg2;
	});

	Handlebars.registerHelper("getSpellDuration", (type, value) => {
		return (CONFIG.SHADOWDARK.VARIABLE_DURATIONS.includes(type))
			? `${value} ${CONFIG.SHADOWDARK.SPELL_DURATIONS[type]}`
			: CONFIG.SHADOWDARK.SPELL_DURATIONS[type];
	});

	Handlebars.registerHelper("ifCond", function(v1, operator, v2, options) {
		switch (operator) {
			case "==":
				return v1 === v2 ? options.fn(this) : options.inverse(this);
			case "===":
				return v1 === v2 ? options.fn(this) : options.inverse(this);
			case "!=":
				return v1 !== v2 ? options.fn(this) : options.inverse(this);
			case "!==":
				return v1 !== v2 ? options.fn(this) : options.inverse(this);
			case "<":
				return v1 < v2 ? options.fn(this) : options.inverse(this);
			case "<=":
				return v1 <= v2 ? options.fn(this) : options.inverse(this);
			case ">":
				return v1 > v2 ? options.fn(this) : options.inverse(this);
			case ">=":
				return v1 >= v2 ? options.fn(this) : options.inverse(this);
			case "&&":
				return v1 && v2 ? options.fn(this) : options.inverse(this);
			case "||":
				return v1 || v2 ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	});

	Handlebars.registerHelper("ifEq", function(arg1, arg2, options) {
		return arg1 === arg2 ? options.fn(this) : options.inverse(this);
	});

	Handlebars.registerHelper("ifNeq", function(arg1, arg2, options) {
		return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
	});

	Handlebars.registerHelper("ifObjIndex", function(obj, index, options) {
		return obj[index] ? options.fn(this) : options.inverse(this);
	});

	Handlebars.registerHelper("ifVariableSpellDuration", (value, options) => {
		return CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(value) ? options.fn(this) : options.inverse(this);
	});

	Handlebars.registerHelper("joinStrings", value => {
		value = value ? value : [];
		return value.join(", ");
	});

	Handlebars.registerHelper("uuidToName", uuid => {
		if (!uuid) return "";
		return shadowdark.utils.getFromUuidSync(uuid).name;
	});

	/* -------------------------------------------- */
	/*  Effect Panel Handlebars                     */
	/* -------------------------------------------- */
	Handlebars.registerHelper("getProgressColor", progress => {
		if (progress <= 70) {
			return "--progress-color: rgba(214, 102, 241, 0.534);";
		}
		else if (progress <= 80) {
			return "--progress-color: rgba(255, 243, 72, 0.534);";
		}
		else if (progress <= 90) {
			return "--progress-color: rgba(253, 148, 61, 0.534);";
		}
		else {
			return "--progress-color: rgba(253, 61, 61, 0.534);";
		}
	});

	Handlebars.registerHelper("remainingTimeLabel", (effect, options) => {
		const remainingDuration = effect.remainingDuration.remaining;
		if (effect.rounds > 0) {
			if (remainingDuration === 1) {
				return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_round");
			}
			else {
				return game.i18n.format(
					"SHADOWDARK.apps.effect_panel.duration_label.x_rounds",
					{rounds: remainingDuration }
				);
			}
		}
		else if (remainingDuration === Infinity) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.unlimited");
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_TWO_YEARS) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_years",
				{ years:
					Math.floor(remainingDuration / EffectPanelSD.DURATION_CONVERSION.IN_ONE_YEAR),
				}
			);
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_ONE_YEAR) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_year");
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_TWO_WEEKS) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_weeks",
				{ weeks:
					Math.floor(remainingDuration / EffectPanelSD.DURATION_CONVERSION.IN_ONE_WEEK),
				}
			);
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_ONE_WEEK) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_week");
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_TWO_DAYS) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_days",
				{ days:
					Math.floor(remainingDuration / EffectPanelSD.DURATION_CONVERSION.IN_ONE_DAY),
				}
			);
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_ONE_DAY) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_day");
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_TWO_HOURS) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_hours",
				{ hours:
					Math.floor(remainingDuration / EffectPanelSD.DURATION_CONVERSION.IN_ONE_HOUR),
				}
			);
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_ONE_HOUR) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_hour");
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_TWO_MINUTES) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_minutes",
				{ minutes:
					Math.floor(remainingDuration / EffectPanelSD.DURATION_CONVERSION.IN_ONE_MINUTE),
				}
			);
		}
		else if (remainingDuration >= EffectPanelSD.DURATION_CONVERSION.IN_ONE_MINUTE) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_minute");
		}
		else if (remainingDuration >= 2) {
			return game.i18n.format(
				"SHADOWDARK.apps.effect_panel.duration_label.x_seconds",
				{ seconds: remainingDuration }
			);
		}
		else if (remainingDuration === 1) {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.one_second");
		}
		else {
			return game.i18n.localize("SHADOWDARK.apps.effect_panel.duration_label.expired");
		}
	});

	Handlebars.registerHelper("remove-p-tag", str1 => {
		return str1.replace(/(<p[^>]+?>|<p>|<\/p>)/img, "");
	});

	Handlebars.registerHelper("secondsToMins", seconds => {
		return Math.ceil(seconds / 60);
	});

	Handlebars.registerHelper("select", function(selected, options) {
		const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected));
		const rgx = new RegExp(` value=["']${escapedValue}["']`);
		const html = options.fn(this);
		return html.replace(rgx, "$& selected");
	});

}
