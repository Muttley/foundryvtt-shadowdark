export default function registerHandlebarsHelpers() {

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

}
