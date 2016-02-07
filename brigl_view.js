/*

  Javascript that is specific to the brigl_view.html page.

  Hazen Babcock 2016

*/

var builder;
var briglv_container;
var cur_step;
var have_model;
var group_number;
var logarea;
var max_step;
var model;
var mpd_select;

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
			    briglv_container.setModel(model.getMeshs(group_number, max_step), true);
			    have_model = true;
			},
			handleError);
    };
    reader.readAsText(input.files[0]);       
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
    briglv_container.setModel(model.getMeshs(group_number, cur_step), false);
}

function init(){
    if ( ! Detector.webgl ) { alert("no webgl"); return; }
    
    have_model = false;
    max_step = 0;
    
    model = new BRIGLV.Model();
    briglv_container = new BRIGLV.Container(document.getElementById("container"));
       
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

function handleMPDSelect(){
    if (!have_model) return;
    group_number = mpd_select.value;
    cur_step = max_step = model.getMaxStep(group_number);
    briglv_container.setModel(model.getMeshs(group_number, max_step), true);
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

