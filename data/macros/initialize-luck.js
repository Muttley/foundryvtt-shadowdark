/**
 ****************************************************************
 * This macro can be used to initialize every player character's
 * starting luck values in the following way:
 *
 *    - Ensure every player character has a luck token.
 *
 *    - Roll the starting luck value for a character which will
 *      be used in Pulp mode.
 *
 * @param {string} [rollFormula] The formula to use for starting
 *                               luck in Pulp mode.
 *                               default: "1d4"
 *
 * @example
 * shadowdark.macro.initializeLuck();
 *
 * @example
 * shadowdark.macro.initializeLuck("2d4");
 *
 * NOTE: Only users with the Game Master user role can run this
 * macro, and only characters actively selected by a player are
 * affected (regardless of whether they are currently logged in
 * or not).
 ***************************************************************/

shadowdark.macro.initializeLuck();
