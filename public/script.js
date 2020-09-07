////////////////////////CANVAS & SIGNATURE////////////////////////////////////////////////

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
console.log("sanity check!");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

ctx.strokeStyle = "#440047";
ctx.lineWidth = 3;
let signing;
let signature;

canvas.addEventListener("mousedown", down, true);
canvas.addEventListener("mouseup", up, true);

function down(event) {
    //console.log("mousesown happened!");
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
    canvas.addEventListener("mousemove", sign, true);
}

function up(event) {
    //console.log("mouseup happened!");
    canvas.removeEventListener("mousemove", sign, true);
    sign(event);
    getSignature();
}
function sign(event) {
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
}

function getSignature() {
    signature = canvas.toDataURL();
    //console.log(signature);
    document.getElementById("signature").value = signature;
}

function visible() {
    document.getElementById("message").style.visiblity = "visible";
}
