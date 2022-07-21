import { templateEditingOptions, ifConditionOptions } from "../config/constants.js" ;
import { varRegex, ifRegex, loopStartRegex } from "../config/constants.js";

/**
 * Indicates how many loops you are within during execution (top most loop is assigned depth 0)
 */
var depth = -1;

/**
 * Array implementation of a stack to keep track of loops as we encounter them
 * Also helps in finding out any syntax error in template (Balanced Paranthesis Problem)
 */
var loop_stack;

/**
 * Array implementation of a stack to keep track of if as we encounter them
 * Also helps in finding out any syntax error in template (Balanced Paranthesis Problem)
 */
var if_stack;

/**
 * Map between loop and their own depth's
 */
let loop_map = {};

/**
 * Replaces and returns variables according to their scope
 * @param subStringToReplace: Variable to replace 
 */
async function replaceHbsVariable(subStringToReplace) {
    var foundSubString = false
    var newHbsVariable = subStringToReplace
    var index = newHbsVariable.length

    /**
     * Searches for longest and right most (starting from left) 
     * variable that is in scope (or in other words is in loop_map).
     * Only this needs to be converted, rest remains the same.
     */
    while (!foundSubString) {
        if (newHbsVariable in loop_map) {
            foundSubString = true
        } else {
            index = newHbsVariable.lastIndexOf(".")
            if (index === -1) {
                foundSubString = false
                break
            }
            newHbsVariable = newHbsVariable.slice(0, index)
        }
    }

    /** If no such variable found return original variable */
    if (!foundSubString) {
        return subStringToReplace;
    }
    
    /** Convert variable to it's handlebars equivalent */
    var count = loop_map[newHbsVariable]
    var x = "../".repeat(depth - count) // Will raise invalid count value error if depth - count < 0
    newHbsVariable = newHbsVariable.replace(newHbsVariable, x + 'this')
    newHbsVariable += subStringToReplace.substring(index) // Append the rest of original variable

    return newHbsVariable
}

const editHelper = async (options, oldTemplate) => {
    try {    
        for (var option of options) {
            if (option in templateEditingOptions && templateEditingOptions[option] !== "") {
                var helper = templateEditingOptions[option.toString()];
                oldTemplate = await helper(oldTemplate)
            } else {
                throw TypeError(`Option type "${option}" is invalid`);
            }
        }

        return oldTemplate;
    } catch (error) {
        throw error;
    }
}

/**
 * Helper function for handling LOOP and any code inside LOOP 
 * Case 1: HANDLE LOOPS ON LIST OF JSON DATA (Done)
 * Case 2: HANDLE LOOPS ON LIST OF NON-JSON DATA (Done)
 * Case 3: HANDLE NESTED LOOPS (Done but could be improved)
 */
async function loopHelper(data) {
    loop_stack = [];    

    try {
        const hbsLoopEnd = '{{/each}}';

        data = data.replace(/LOOP_END/g, hbsLoopEnd);
        data = data.split("\n");

        for (let i = 0; i < data.length; i++) {
            var line = data[i];
            var result = loopStartRegex.exec(line);
            var foundLoop = false

            if (result) {
                var attr = (result.groups.ATTR).trim()
                loop_stack.push(attr)

                /** Converting LOOP_START */
                const hbsLoopStart = `{{#each ${await replaceHbsVariable(attr)}}}`
                line = line.replace(result[0], hbsLoopStart)
                
                loop_map[attr] = depth + 1
                foundLoop = true
            }

            /** Converting variables in IF condition */
            result = line.matchAll(ifRegex)
            for (const match of result) {
                var condition = (match.groups.COND).trim()

                condition = condition.replace(/\)/g, "")
                condition = condition.replace(/\(/g, "")
                condition = condition.split(/\s+/g)

                for (const element of condition) {
                    var temp = element.trim()
                    if (!ifConditionOptions.includes(temp) && temp !== '') { 
                        line = line.replace(temp, await replaceHbsVariable(temp))
                    }
                }
            }

            /** Converting variables inside loop code */ 
            result = line.matchAll(varRegex)
            for (const match of result) {
                var hbsVariable = (match.groups.VAR).trim()
                line = line.replace(hbsVariable, await replaceHbsVariable(hbsVariable))
            }

            /** Increment depth */
            if (foundLoop) { depth += 1 }

            /** Check if reached loop end */
            const eachRegex = RegExp(hbsLoopEnd, 'g');
            if (eachRegex.exec(line)) {
                if (loop_stack.length !== 0) {
                    delete loop_map[loop_stack.pop()]
                } else {
                    throw Error("Syntax Error In Template")
                }
                depth -= 1
            }

            data[i] = line
        }

        if (loop_stack.length !== 0) {
            throw Error("Syntax Error In Template")
        }

        return data.join("\n");
    } catch (error) {
        throw error;
    }
}

/**
 * Helper function for handling IF and ELSE conversion
 * Case 1: HANDLE IF (Done)
 * Case 2: HANDLE COMPLEX IF CONDITIONS (Done but could be improved)
 * Case 3: HANDLE IF INSIDE LOOP (Done in loopHelper)
 * Case 4: HANDLE ELSE IF // {{else if ... }} (Not neccessary)
 */
async function ifElseHelper(data) {
    if_stack = []; 

    try {
        const hbsIfEnd = '{{/if}}';
        const hbsElse = '{{else}}';

        data = data.replace(/ELSE/g, hbsElse);
        data = data.replace(/IF_END/g, hbsIfEnd);
        data = data.split("\n");

        for (let i = 0; i < data.length; i++) {
            var line = data[i]
            var result = ifRegex.exec(line);

            if (result) {
                if_stack.push("IF")

                /** Converting IF */
                var condition = (result.groups.COND).trim()
                const hbsIfStart = `{{#if ${condition}}}`
                line = line.replace(result[0], hbsIfStart)
            }

            /** Checking for syntax error due to else */
            const elseRegex = RegExp(hbsElse, 'g');
            if (elseRegex.exec(line)) {
                if (if_stack.length === 0) {
                    throw Error("Syntax Error In Template")
                }
            }

            /** Check if reached if end */
            const ifEndRegex = RegExp(hbsIfEnd, 'g');
            if (ifEndRegex.exec(line)) {
                if (if_stack.length !== 0) {
                    if_stack.pop()
                } else {
                    throw Error("Syntax Error In Template")
                }
            }

            data[i] = line;
        }

        if (if_stack.length !== 0) {
            throw Error("Syntax Error In Template")
        }
        
        return data.join("\n");
    } catch (error) {
        throw error;
    }
}

async function noneHelper(data) { return data };

/** File download function */
async function download(filename, textInput) {
    var element = document.createElement('a');
    element.setAttribute('href','data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/** Function that is executed when Convert is clicked */
window.convertButton = async function () {
    var editor = ace.edit("editor");
    var oldTemplate = editor.getValue().trim();

    /** 
     * TODO: Optimize here by calling only those helpers that are neccessary.
     * TODO: Fix their order issue (try reverse order of options)
    */ 
    var optionsUsed = ['Loop', 'IfElse']; 
    
    var newTemplate = await editHelper(optionsUsed, oldTemplate);

    var filename = "output.html";
    await download(filename, newTemplate);
}


export { editHelper, noneHelper, loopHelper, ifElseHelper };