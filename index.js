var codeValue = "";
var editor = ace.edit("editor");
var ifDrop = document.getElementById("ifCondDrop");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

function loopButtonClick() {
    var inputVal = document.getElementById("loopOn").value;
    var loopStartSpan = document.getElementById("loopStart");
    loopStartSpan.style.display = "inline";
    var loopEndSpan = document.getElementById("loopEnd");
    loopEndSpan.style.display = "inline";
    loopStartSpan.innerHTML = "LOOP_START:" + inputVal;
}

function loopInputChange() {
    var inputVal = document.getElementById("loopOn").value;
    var loopStartSpan = document.getElementById("loopStart");
    var loopEndSpan = document.getElementById("loopEnd");
    loopStartSpan.innerHTML = "LOOP_START:" + inputVal;
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.innerHTML);
}

function ifCondChange(){
    var ifDropText = ifDrop.options[ifDrop.selectedIndex].text;
    //Todo: And and OR can have more than 2 inputs
    if(ifDropText == "GTE" || ifDropText == "LTE" || ifDropText == "GT" || ifDropText == "LT" || ifDropText == "NE" || ifDropText == "EQ" || ifDropText == "AND" || ifDropText == "OR"){
        document.getElementById("input1Drop").style.display = "inline";
        document.getElementById("input2Drop").style.display = "inline";
        document.getElementById("ifInput1").style.display = "inline";
        document.getElementById("ifInput2").style.display = "inline";
    }else{
        document.getElementById("ifInput1").style.display = "none";
        document.getElementById("ifInput2").style.display = "none";
    }
}

function ifInputDropChange(inputDrop){
    if(String(inputDrop.value) === "VAR"){
        return true;
    }else{
        return false;
    }
}

function ifInputChange() {
    var inputVal1 = document.getElementById("ifInput1").value;
    var inputVal2 = document.getElementById("ifInput2").value;
    var ifStartSpan = document.getElementById("ifStart");
    var ifEndSpan = document.getElementById("ifEnd");

    if(ifInputDropChange(input1Drop) === false){
        if(isNaN(inputVal1)){
            inputVal1 = '"' + inputVal1 + '"';
        }
    }

    if(ifInputDropChange(input2Drop) === false){
        if(isNaN(inputVal2)){
            inputVal2 = '"' + inputVal2 + '"';
        }
    }

    ifStartSpan.innerHTML = "IF:("+ ifDrop.options[ifDrop.selectedIndex].text + " " + inputVal1 + " " + inputVal2 + ")";
    // if(isNaN(inputVal2)){
    //     ifStartSpan.innerHTML = "IF:("+ ifDrop.options[ifDrop.selectedIndex].text + " " + inputVal1 + " " + '"' + inputVal2 + '"' + ")";
    // }else{
    //     ifStartSpan.innerHTML = "IF:("+ ifDrop.options[ifDrop.selectedIndex].text + " " + inputVal1 + " " + inputVal2 + ")";
    // }
}

function updateValue() {
    const [file] = document.querySelector('input[type=file]').files;
    const reader = new FileReader();


    reader.addEventListener("load", () => {
        var codeText = reader.result;
        codeValue = codeText;
        editor.setValue(codeValue);
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}