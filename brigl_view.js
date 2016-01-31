/*

  BRIGLView - A wrapper around BRIGL that attempts to recreate
     some of the functionality of LDView.

  Hazen Babcock 2016

*/

var BRIGLV = BRIGLV || {
    REVISION: '1'
};

function modelLoadGroupsSteps(model, callback, current_group, current_step) {
    BRIGLV.log("loading " + current_group + " " + current_step);
	
    // Check if we have loaded everything.
    if (current_group < 0){
	BRIGLV.log("loading complete " + typeof(callback));
	callback(model.groups[0].steps[0].getMesh());
    }
    else {
	// Figure out next group and step.
	next_group = current_group;
	next_step = current_step - 1;
	if (next_step < 0){
	    next_group -= 1;
	    if (next_group >= 0){
		next_step = model.groups[next_group].getNumberSteps() - 1;
	    }
	}

	// Get current group and step objects.
	group = model.groups[current_group];
	step = group.steps[current_step];
	if (current_step == 0){
	    partName = group.group_name;
	}
	else {
	    partName = group.group_name + "_" + current_step;
	}
	
	// Create the mesh for the current group and step using BRIGL.
	BRIGLV.log("loading " + partName)
	model.brigl_builder.loadModelByData(partName,
					    step.data,
					    model.mesh_options,
					    function(mesh){
						step.setMesh(mesh);
						modelLoadGroupsSteps(model, callback, next_group, next_step);
					    });
    }
}


function splitLines(modelData){
    var lines = modelData.split("\n");
    
    for (var i = 0; i < lines.length; i++){
	var li = lines[i].trim();
	if (li === '') continue;
	BRIGLV.log(li)
    }
}


BRIGLV.log = function(msg){
    console.info("BV " + msg);
}


// A single step in the model.
BRIGLV.Step = function(){
    this.data = "";
    this.mesh = undefined;
}

BRIGLV.Step.prototype = {

    constructor: BRIGLV.Step,

    addLine: function(line){
	this.data = this.data + "\n" + line;
    },

    getMesh: function(){
	return this.mesh;
    },
    
    setMesh: function(mesh){
	BRIGLV.log("setting mesh");
	this.mesh = mesh;
    }
}


// A group in the model, every model has at least one.
BRIGLV.Group = function(name){
    this.cur_step = new BRIGLV.Step();
    this.group_name = name;
    this.steps = [this.cur_step];
}

BRIGLV.Group.prototype = {
    
    constructor: BRIGLV.Group,

    addLine: function(line) {
	if (line.startsWith("0 STEP")){
	    this.steps.push(this.cur_step);
	    this.cur_step = new BRIGLV.Step();
	}
	else {
	    this.cur_step.addLine(line);
	}
    },

    getNumberSteps: function(){
	return this.steps.length;
    }
}


// The whole model.
BRIGLV.Model = function(options){
    this.brigl_builder = new BRIGL.Builder("parts/", options);
    this.errorCallback = undefined;
    this.finishedLoadingCallback = undefined;
    this.groups = [];
    this.mesh_options = {};
}

BRIGLV.Model.prototype = {

    constructor: BRIGLV.Model,
	
    loadModel: function(modelData, mesh_options, callback, errorCallback) {
	this.errorCallback = errorCallback;
	this.finishedLoadingCallback = callback;
	this.mesh_options = mesh_options;

	// Read in the model, creating separate objects for each group and step.
	var lines = modelData.split("\n");
	for (var i = 0; i < lines.length; i++){
	    var li = lines[i].trim();
	    if (li === '') continue;

	    if (li.startsWith("0 FILE ")){
		this.cur_group = new BRIGLV.Group(li.substring(7).toLowerCase());
		this.groups.push(this.cur_group);
	    }
	    else {
		this.cur_group.addLine(li);
	    }
	}

	// Load the model.
	start_group = this.groups.length - 1;
	modelLoadGroupsSteps(this,
			     callback,
			     start_group,
			     this.groups[start_group].getNumberSteps() - 1);
    },

    reset: function(){
	this.groups = [];
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
