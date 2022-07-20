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
var loop_stack = [];

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

    if (!foundSubString) {
        return subStringToReplace;
    }
    
    var count = loop_map[newHbsVariable]
    var x = "../".repeat(depth - count) // Will raise invalid count value error if depth - count < 0
    
    newHbsVariable = newHbsVariable.replace(newHbsVariable, x + 'this')

    return newHbsVariable + subStringToReplace.substring(index)   
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
        throw Error(error);
    }
}

/**
 * Helper function for handling LOOP and any code inside LOOP 
 * Case 1: HANDLE LOOPS ON LIST OF JSON DATA (Done)
 * Case 2: HANDLE LOOPS ON LIST OF NON-JSON DATA (Done)
 * Case 3: HANDLE NESTED LOOPS (Done but could be improved)
 */
async function loopHelper(data) {
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

                /** Converting loop */
                const hbsLoopStart = `{{#each ${await replaceHbsVariable(attr)}}}`
                line = line.replace(result[0], hbsLoopStart)
                
                loop_map[attr] = depth + 1
                foundLoop = true
            }

            /** Converting variables in if condition */
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
        throw Error(error);
    }
}

/**
 * Helper function for handling IF conversion
 * Case 1: HANDLE IF (Done)
 * Case 2: HANDLE COMPLEX IF CONDITIONS (Done but could be improved)
 * Case 3: HANDLE IF INSIDE LOOP (Done in loopHelper)
 * Case 4: HANDLE ELSE IF // {{else if ... }} (Not neccessary)
 */
async function ifHelper(data) {
    try {
        const hbsIfEnd = '{{/if}}';
        data = data.replace(/IF_END/g, hbsIfEnd)

        do {
            var result = ifRegex.exec(data);
            
            if (result) {
                var condition = (result.groups.COND).trim()
                const hbsIfStart = `{{#if ${condition}}}`
                data = data.replace(result[0], hbsIfStart)
            }
        } while (result);
        
        return data;
    } catch (error) {
        throw Error(error);
    }
}

async function ifElseHelper(data) {
    try {
        data = await ifHelper(data)
        const hbsElse = '{{else}}';
        data = data.replace(/ELSE/g, hbsElse)

        return data;
    } catch (error) {
        throw Error(error);
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
    var options = ['Loop', 'IfElse'];
    var newTemplate = await editHelper(options, oldTemplate);

    var filename = "output.html";
    await download(filename, newTemplate);
}


export { editHelper, noneHelper, loopHelper, ifHelper, ifElseHelper };