import { loopHelper, noneHelper, ifElseHelper } from "../modules/converter.js";

/** 
 * Example of handlebars if statement with below mentioned helpers:
 * {{ #if (OR (EQ section1 "foo") (NE section2 "bar")) }} .. content {{ /if }}
 */

Handlebars.registerHelper({
    EQ: (v1, v2) => v1 === v2,
    NE: (v1, v2) => v1 !== v2,
    LT: (v1, v2) => v1 < v2,
    GT: (v1, v2) => v1 > v2,
    LTE: (v1, v2) => v1 <= v2,
    GTE: (v1, v2) => v1 >= v2,
    AND() {
        return Array.prototype.every.call(arguments, Boolean);
    },
    OR() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    }
});

/** Regular expression for finding {{ <variables> }} in template */
const varRegex = RegExp('(?:{{(?<VAR>[.a-zA-Z0-9_\\[\\]\\s\\\'\\"]*)}})', 'g');

/** Regular expression for finding LOOP_START:<variable_name> in template */
const loopStartRegex = RegExp('(?:LOOP_START:)(?<ATTR>[a-zA-Z0-9_.\\[\\]\\(\\)\\\'\\"]*)', 'g');

/** Regular expression for finding IF:<conditions> in template */
const ifRegex = RegExp('(?:IF:(?<COND>[a-zA-Z0-9_.\\[\\]\\(\\)\\\'\\"\\s]*))', 'g');

/** Possible characters in IF conditions other than variables */
const ifConditionOptions = ["AND", "OR", "GTE", "LTE", "GE", "LE", "NE", "EQ", ")", "(", "NULL", "UNDEFINED"];

/**
 * Map between a option and it's function
 */
const templateEditingOptions = { 
    'None': noneHelper, 
    'Loop': loopHelper, 
    'IfElse': ifElseHelper,
};

export { templateEditingOptions, varRegex, loopStartRegex, ifRegex, ifConditionOptions };