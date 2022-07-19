import { loopHelper, noneHelper, ifHelper, ifElseHelper } from "../modules/converter.js";

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

const varRegex = RegExp('(?:{{(?<VAR>[.a-zA-Z0-9_\\[\\]\\s\\\'\\"]*)}})', 'g');
const loopStartRegex = RegExp('(?:LOOP_START:)(?<ATTR>[a-zA-Z0-9_.\\[\\]\\(\\)\\\'\\"]*)', 'g');
const ifRegex = RegExp('(?:IF:(?<COND>[a-zA-Z0-9_.\\[\\]\\(\\)\\\'\\"\\s]*))', 'g');

const ifConditionOptions = ["AND", "OR", "GTE", "LTE", "GE", "LE", "NE", "EQ", ")", "(", "NULL", "UNDEFINED"];

/**
 * Map between a option and it's function
 */
const templateEditingOptions = { 
    'None': noneHelper, 
    'Loop': loopHelper,
    'If': ifHelper, 
    'IfElse': ifElseHelper,
};

export { templateEditingOptions, varRegex, loopStartRegex, ifRegex, ifConditionOptions };