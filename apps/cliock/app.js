var fontsize = 3;
var locale = require("locale");
var marginTop = 40;
var flag = false;
var WeekDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

var hrtOn = false;
var hrtStr = "Hrt: ??? bpm";

const NONE_MODE = "none";
const ID_MODE = "id";
const VER_MODE = "ver";
const BATT_MODE = "batt";
const MEM_MODE = "mem";
const STEPS_MODE = "step";
const HRT_MODE = "hrt";
const NONE_FN_MODE = "no_fn";
const HRT_FN_MODE = "fn_hrt";

let infoMode = NONE_MODE;
let functionMode = NONE_FN_MODE;

function drawAll(){
  updateTime();
  updateRest(new Date());
}

function updateRest(now){
  let date = locale.date(now,false);
  writeLine(WeekDays[now.getDay()],1);
  writeLine(date,2);
  drawInfo(5);
}
function updateTime(){
  if (!Bangle.isLCDOn()) return;
  let now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  h = h>=10?h:"0"+h;
  m = m>=10?m:"0"+m;
  writeLine(h+":"+m,0);
  writeLine(flag?" ":"_",3);
  flag = !flag;
  if(now.getMinutes() == 0)
    updateRest(now);
}
function writeLineStart(line){
  g.drawString(">",4,marginTop+line*30);
}
function writeLine(str,line){
  g.setFont("6x8",fontsize);
  //g.setColor(0,1,0);
  g.setColor(0,0x07E0,0);
  g.setFontAlign(-1,-1);
  g.clearRect(0,marginTop+line*30,((str.length+1)*20),marginTop+25+line*30);
  writeLineStart(line);
  g.drawString(str,25,marginTop+line*30);
} 

function drawInfo(line) {
  let val;
  let str = "";
  let col = 0x07E0; // green

  //console.log("drawInfo(), infoMode=" + infoMode + " funcMode=" + functionMode);

  switch(functionMode) {
  case NONE_FN_MODE:
    break;
  case HRT_FN_MODE:
    col = 0x07FF; // cyan
    str = "HRM: " + (hrtOn ? "ON" : "OFF");
    drawModeLine(line,str,col);
    return;
  }
  
  switch(infoMode) {
  case NONE_MODE:
    col = 0x0000;
    str = "";
    break;
  case HRT_MODE:
    str = hrtStr;
    break;
  case STEPS_MODE:
    str = "Steps: " + stepsWidget().getSteps();
    break;
  case ID_MODE:
    val = NRF.getAddress().split(":");
    str = "Id: " + val[4] + val[5];
    break;
  case VER_MODE:
    str = "Fw: " + process.env.VERSION;
    break;
  case MEM_MODE:
    val = process.memory();
    str = "Memory: " + Math.round(val.usage*100/val.total) + "%";
    break;
  case BATT_MODE:
  default:
    str = "Battery: " + E.getBattery() + "%";
  }

  drawModeLine(line,str,col);
}

function drawModeLine(line, str, col) {
  g.setColor(col);
  g.fillRect(0, marginTop-3+line*30, 239, marginTop+25+line*30);
  g.setColor(0,0,0);
  g.setFontAlign(0, -1);
  g.drawString(str, g.getWidth()/2, marginTop+line*30);
}

function changeInfoMode() {
  switch(functionMode) {
  case NONE_FN_MODE:
    break;
  case HRT_FN_MODE:
    hrtOn = !hrtOn;
    Bangle.buzz();
    Bangle.setHRMPower(hrtOn ? 1 : 0);
    if (hrtOn) infoMode = HRT_MODE;
    return;
  }

  switch(infoMode) {
  case NONE_MODE:
    if (stepsWidget() !== undefined)
      infoMode = hrtOn ? HRT_MODE : STEPS_MODE;
    else
      infoMode = VER_MODE;
    break;
  case HRT_MODE:
    if (stepsWidget() !== undefined)
      infoMode = STEPS_MODE;
    else
      infoMode = VER_MODE;
    break;
  case STEPS_MODE:
    infoMode = ID_MODE;
    break;
  case ID_MODE:
    infoMode = VER_MODE;
    break;
  case VER_MODE:
    infoMode = BATT_MODE;
    break;
  case BATT_MODE:
    infoMode = MEM_MODE;
    break;
  case MEM_MODE:
  default:
    infoMode = NONE_MODE;
  }
}

function changeFunctionMode() {
  //console.log("changeFunctionMode()");
  switch(functionMode) {
  case NONE_FN_MODE:
    functionMode = HRT_FN_MODE;
    break;
  case HRT_FN_MODE:
  default:
    functionMode = NONE_FN_MODE;
  }
  //console.log(functionMode);
  
}

function stepsWidget() {
  if (WIDGETS.activepedom !== undefined) {
    return WIDGETS.activepedom;
  } else if (WIDGETS.wpedom !== undefined) {
    return WIDGETS.wpedom;
  }
  return undefined;
}

Bangle.on('HRM', function(hrm) {
  if(hrm.confidence > 90){
    hrtStr = "Hrt: " + hrm.bpm + " bpm";
  } else {
    hrtStr = "Hrt: ??? bpm";
  }
});

g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();
drawAll();
Bangle.on('lcdPower',function(on) {
  if (on)
    drawAll();
});
var click = setInterval(updateTime, 1000);
setWatch(Bangle.showLauncher, BTN2, {repeat:false,edge:"falling"});
//setWatch(() => { changeInfoMode(); drawAll(); }, BTN1, {repeat: true});
// setWatch(() => { changeFunctionMode(); drawAll(); }, BTN3, {repeat: true});

setWatch(function(e) { 
  var pressedTime = e.time-e.lastTime;
  if (pressedTime > 1.2){
   if (require("Storage").read("chronowid.app.js")===undefined) {
  E.showMessage("App Source\nNot found");
  setTimeout(drawMenu, 2000);
} else {
  E.showMessage("Loading...");
load("chronowid.app.js");} 
  }
}, BTN1, {   repeat:true, edge:'falling' });

setWatch(function(){
  console.log("dunkler");
 // var brightness = (require("Storage").readJSON("setting.json",1)||{})["brightness"];
  var settings = (require("Storage").readJSON("setting.json",1));
  var brightness = settings.brightness;
  var newBrightness;
  console.log(brightness);
  if (brightness > 0.2){
    newBrightness = brightness - 0.2;
    settings.brightness = newBrightness;
    require("Storage").writeJSON("setting.json",settings);
    Bangle.setLCDBrightness(newBrightness);
  }
  console.log(newBrightness);
  console.log(settings);
  
  
}, BTN4, {repeat:true});

setWatch(function(){
  console.log("hell");
  var settings = (require("Storage").readJSON("setting.json",1));
  var brightness = settings.brightness;
  var newBrightness;
  console.log(brightness);
  if (brightness < 1){
    newBrightness = brightness + 0.2;
    settings.brightness = newBrightness;
    require("Storage").writeJSON("setting.json",settings);
    Bangle.setLCDBrightness(newBrightness);
  }
  console.log(newBrightness);
  console.log(settings);
}, BTN5, {repeat:true});
