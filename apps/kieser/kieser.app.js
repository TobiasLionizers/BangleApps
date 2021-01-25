var machineArray = require("Storage").readJSON("kieser-trainingplan.json", false);
var startDate = new Date().toUTCString();

var trainingTimes = [];

//array to temporary skip machine
var tempArray = machineArray.slice();

function showSettings(machine){
  clearWatch();

  var settingY = 100;
  console.log("Show Setting for " + machine.machine);
  g.clear();
  g.setFontAlign(0,0); // center font
  g.setFont("Vector",200); // vector font, 80px  
  // draw the current counter value
  E.showMessage("", machine.machine);
  
  g.drawString("Weight: "+ machine.weight, 100, 70);
  for (let setting of machine.settings) {
    g.drawString(setting, 100, settingY);
    settingY += 30;
  }
  
  g.setFont("6x8", 2);
    g.setFontAlign(0, 0, 3);
    g.drawString("Menu", 230, 50);
    g.drawString("Start", 230, 110);
    g.setFont("Vector", 35);
    g.setFontAlign(-1, -1);
  
  setWatch(function() {
    showMenu();
  }, BTN1, {repeat:true});


  setWatch(function() {
    startTraining(machine);
  }, BTN2, {repeat:true});
  
  // optional - this keeps the watch LCD lit up
  g.flip();
}

function startTraining(machine){
  clearWatch();
  var time = 0;
  console.log("start training for " + machine.machine);
  
  function draw(){
  g.clear();
  g.setFontAlign(0,0); // center font
  g.setFont("Vector",100); // vector font, 80px  
  // draw the current counter value
  g.drawString(time, 120, 120);
  
  g.setFont("6x8", 2);
    g.setFontAlign(0, 0, 3);
    g.drawString("Buzz", 230, 50);
    g.drawString("Stop", 230, 110);
    g.setFont("Vector", 35);
    g.setFontAlign(-1, -1);
  }
  
  setInterval(function () {
    time++;
    draw();
  }, 1000);
  
  
  setWatch(function() {
    vibrate();
  }, BTN1, {repeat:true});


  setWatch(function() {
    clearInterval();
     setFinished(machine, time);
  }, BTN2, {repeat:true});
  
}

function vibrate() {
   
  //Bangle.buzz()
  //  .then(() => new Promise(resolve => setTimeout(resolve, 4000)))
  //  .then(() => Bangle.buzz())
  //  .then(() => new Promise(resolve => setTimeout(resolve, 2000)))
   // .then(() => Bangle.buzz());

  setTimeout(function () {
  Bangle.buzz();
}, 4000);
  setTimeout(function () {
  Bangle.buzz();
}, 2000);
  //setTimeout(vibrate, 2000);
}

function setFinished(machine, time){
  console.log("finished "+ machine.machine); 
  clearWatch();
  machine.finished = true;
  oldWeight = machine.weight;
  fiveProcent = Math.ceil(oldWeight / 100 * 5);
  
  console.log("alt" + oldWeight);
  console.log("prozent" + fiveProcent);
  if (time < 90){
    newWeight = oldWeight - fiveProcent;
  } else if (time > 120) {
    newWeight = oldWeight + fiveProcent;
  } else {
    newWeight = oldWeight;
  }
  if (newWeight%2 != 0){
    newWeight++;
  }
  console.log("neu" + newWeight);
  machine.weight = newWeight;
  require("Storage").writeJSON("kieser-trainingplan.json", machineArray);
  trainingTimes.push(machine.machine+ " "  + oldWeight + " " + time);
  
  g.clear();
  g.setFontAlign(0,0); // center font
  g.setFont("Vector",200); // vector font, 80px  
  // draw the current counter value
  E.showMessage("Training finished for ", machine.machine);
  E.showMessage("Time was " + time);
  
  g.setFont("6x8", 2);
    g.setFontAlign(0, 0, 3);
    g.drawString("Next", 230, 110);
    g.setFont("Vector", 35);
    g.setFontAlign(-1, -1);
  
  setWatch(function() {
  }, BTN1, {repeat:true});


  setWatch(function() {
     showNext();
  }, BTN2, {repeat:true});
}

function showNext(){
  var nextMachine;
  for (let i = 0; i < tempArray.length; i++){
    if (tempArray[i].finished == false){
      nextMachine = machineArray[i];
      break;
    }
  }
  if (nextMachine == undefined) {showFinished();}
  console.log(nextMachine);
  showSettings(nextMachine);
}

function showFinished(){
       var dateString = (new Date()).toISOString().substr(0,16).replace("T","_");
    
  var resultFile = require("Storage").open("kieser-results.json", a);
  resultFile.dataString = trainingTimes;

}

function showMenu(){
  clearWatch();

  function createMenuItems(){
    menuObjekt = {};
    menuObjekt[""] = {"title" : "machines left"};

    tempArray.forEach(function(m, i) {
       if (m.finished == false){
          menuObjekt[m.machine] = function(){showSettings(m);};
          }
    });
    
    menuObjekt.Exit = function() { E.showMenu();};
    return menuObjekt;
  }
  
  var mainmenu = createMenuItems();
  console.log(mainmenu);
  E.showMenu(mainmenu);
}


function init(){
  for (let machine of tempArray){
   var finished = false;
   machine.finished = finished;
  }
  console.log(startDate);
  
  g.clear();
  g.setFontAlign(0,0); // center font
  g.setFont("Vector",200); // vector font, 80px  
  // draw the current counter value
  E.showMessage("Start training", "Welcome");

  g.setFont("6x8", 2);
    g.setFontAlign(0, 0, 3);
    g.drawString("Menu", 230, 50);
    g.drawString("Start", 230, 110);
    g.setFont("Vector", 35);
    g.setFontAlign(-1, -1);
  
  setWatch(function() {
    showMenu();
  }, BTN1, {repeat:false});


  setWatch(function() {
showNext();
  }, BTN2, {repeat:false});
}


init();
