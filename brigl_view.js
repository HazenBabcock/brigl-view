/*

  Javascript that is specific to the brigl_view.html page.

  Hazen Babcock 2016

*/

var builder;
var briglv_container;
var briglv_partcontainer;
var cur_step;
var have_model;
var group_number;
var logarea;
var max_step;
var model;
var mpd_select;
//var part_display;
//var webgl_canvas;

function handleError(msg)
{
    alert("Error: " + msg);
}

function handleFile(event){
    if (!model) return;
    
    var input = event.target;
    logarea.value = ""
    
    var reader = new FileReader();
    reader.onload = function(){
	model.reset();
	model.loadModel(reader.result,
			{},
			function(){
			    group_number = 0;
			    cur_step = max_step = model.getMaxStep(group_number);
			    populateMPDSelect(model.getGroupNames());
			    handleUpdate(group_number, max_step, true);
			    have_model = true;
			},
			handleError);
    };
    reader.readAsText(input.files[0]);       
}

function handleMPDSelect(){
    if (!have_model) return;
    group_number = mpd_select.value;
    cur_step = max_step = model.getMaxStep(group_number);
    handleUpdate(group_number, max_step, true);
}

function handleUpdate(group_number, step_number, reset_view){

    // Render model.
    briglv_container.setModel(model.getMeshs(group_number, step_number), reset_view);

    // Render parts.
    var parts = model.getParts(group_number, step_number);
    briglv_partcontainer.setPart(parts[0][0]);
    
    var part_display = document.getElementById("part");
    var part_context = part_display.getContext("2d");
    var webgl_canvas = document.getElementById("webgl_canvas");
    part_context.clearRect(0, 0, part_display.width, part_display.height);
    part_context.drawImage(webgl_canvas, 0, 0);
    part_context.stroke();
    console.log("asdf");
    
    // Remove any old part renders.
    /*
    var parts_display = document.getElementById("parts");
    while(parts_display.hasChildNodes()) {
	parts_display.removeChild(parts_display.childNodes[0]);
    }
    */
    
    // Render and add parts used for this step.
    /*
    var part_display = document.getElementById("part");
    var parts = model.getParts(group_number, step_number);
    for (var i = 0; i < parts.length; i++){
	briglv_partcontainer.setPart(parts[i][0]);
	var clone = part_display.cloneNode(true);
	clone.style.visibility= "visible";
	parts_display.appendChild(clone);
    }
    */
}

function incStep(delta){
    if (!have_model) return;
    
    cur_step += delta;
    if(cur_step < 2){
	cur_step = 2;
    }
    if(cur_step > max_step){
	cur_step = max_step;
    }
    handleUpdate(group_number, cur_step, false);
}

function init(){
    if ( ! Detector.webgl ) { alert("no webgl"); return; }
    
    have_model = false;
    max_step = 0;
    
    model = new BRIGLV.Model();
    briglv_container = new BRIGLV.Container(document.getElementById("model"));

    //var webgl_canvas = document.getElementById("webgl_canvas");
    //webgl_canvas.width = 100;
    //webgl_canvas.height = 100;
    briglv_partcontainer = new BRIGLV.PartContainer(document.getElementById("webgl_canvas"));

    //part_display = document.getElementById("part");
    //part_display.width = 110;
    //part_display.height = 110;
   
    logarea = document.getElementById("log");
    BRIGL.log = function(msg){
  	logarea.textContent = "BRIGL: " + msg;
    }
    BRIGLV.log = function(msg){
  	logarea.textContent = "BRIGL-View: " + msg;
    }
    
    mpd_select = document.getElementById("mpd_select");
    document.getElementById("mpd").style.visibility = 'hidden';
}

function populateMPDSelect(group_names){
    
    // Clear old options.
    for (var i = mpd_select.options.length-1; i >= 0; i--){
	mpd_select.remove(i)
    }
    
       // Add new options.
    for (var i = 0; i < group_names.length; i++){
	var opt = document.createElement('option');
	opt.innerHTML = group_names[i];
	opt.value = i;
	mpd_select.appendChild(opt);
    }
    
    if (group_names.length > 1){
	document.getElementById("mpd").style.visibility = 'visible';
    }
    else {
	document.getElementById("mpd").style.visibility = 'hidden';
    }
}

/*

  The MIT License
  
  Copyright (c) 2016 Hazen Babcock

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*/

