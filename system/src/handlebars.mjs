export default function registerHandlebarsHelpers() {

	Handlebars.registerHelper("secondsToMins", seconds => {
		return Math.ceil(seconds / 60);
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

	Handlebars.registerHelper("fromConfig", function(arg1, arg2) {
		return CONFIG.SHADOWDARK[arg1][arg2] ? CONFIG.SHADOWDARK[arg1][arg2] : arg2;
	});

	Handlebars.registerHelper("ifVariableSpellDuration", (value, options) => {
		return CONFIG.SHADOWDARK.VARIABLE_SPELL_DURATIONS
			.includes(value) ? options.fn(this) : options.inverse(this);
	});

	Handlebars.registerHelper("ifBackstabClass", (value, options) => {
		return CONFIG.SHADOWDARK.BACKSTAB_CLASSES
			.includes(value) ? options.fn(this) : options.inverse(this);
	});
}
