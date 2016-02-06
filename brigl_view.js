/*

  BRIGLView - A wrapper around BRIGL that attempts to recreate
     some of the functionality of LDView.

  Hazen Babcock 2016

*/

var BRIGLV = BRIGLV || {
    REVISION: '1'
};

function modelLoadGroupsSteps(model, callback, errorCallback, current_group, current_step) {
    BRIGLV.log("loading " + current_group + " " + current_step);
	
    // Check if we have loaded everything.
    if (current_group < 0){
	BRIGLV.log("loading complete");
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
						modelLoadGroupsSteps(model, callback, errorCallback, next_group, next_step);
					    },
					    errorCallback);
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

/*
 * A group in the model, every model has at least one.
 *
 * Step 0 is the entire group. To display a sub-set of
 * the group by steps use steps 1..N.
 */
BRIGLV.Group = function(name){
    this.all_steps = new BRIGLV.Step();
    this.cur_step = new BRIGLV.Step();
    this.group_name = name;
    this.steps = [this.all_steps, this.cur_step];
}

BRIGLV.Group.prototype = {
    
    constructor: BRIGLV.Group,

    addLine: function(line) {
	if (line.startsWith("0 STEP")){
	    this.cur_step = new BRIGLV.Step();
	    this.steps.push(this.cur_step);
	}
	else {
	    this.all_steps.addLine(line);
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

    getGroup: function(group_number){
	
	// group_number range checking.
	if (group_number >= this.groups.length){
	    BRIGLV.log("group number out of range");
	    group_number = this.groups.length - 1;
	}
	if (group_number < 0){
	    BRIGLV.log("group number out of range");
	    group_number = 0;
	}
	
	return this.groups[group_number];
    },

    getGroupNames: function(){
	group_names = [];
	for (var i = 0; i < this.groups.length; i++){
	    group_names.push(this.groups[i].group_name);
	}

	return group_names;
    },

    getMaxStep: function(group_number){
	return this.getGroup(group_number).getNumberSteps();
    },
    
    getMeshs: function(group_number, step_number){
	group = this.getGroup(group_number);

	// step_number range checking.
	if (step_number > group.getNumberSteps()){
	    BRIGLV.log("step number out of range");
	    step_number = group.getNumberSteps();
	}
	if (step_number < 2){
	    BRIGLV.log("step number out of range");
	    step_number = 2;
	}

	// Create an array with the meshes.
	meshs = []
	for (var i = 1; i < step_number; i++){
	    meshs.push(group.steps[i].getMesh())
	}

	return meshs;
    },
    
    loadModel: function(modelData, mesh_options, callback, errorCallback) {
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
			     errorCallback,
			     start_group,
			     this.groups[start_group].getNumberSteps() - 1);
    },

    reset: function(){
	this.groups = [];
    }

}

BRIGLV.Container = BRIGL.BriglContainer;

BRIGLV.Container.prototype.setModel = function(meshs, reset_view) {

    old_mesh = this.mesh;

    console.log("sm " + reset_view);
    
    //
    // Create a group with all the meshs. Fortunately this has
    // enough functionality that BRIGL.Container can use it the
    // same way as a normal mesh.
    //
    this.mesh = new THREE.Object3D();
    for (var i = 0; i < meshs.length; i++){
	this.mesh.add(meshs[i]);
    }
    
    this.mesh.useQuaternion = true;
    if (reset_view){
	this.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, -0.5).normalize(), 3.34);

	// Place the camera at a right distance to gracefully fill the area.
	var radius_delta = 0.0;
	for (var i = 0; i < meshs.length; i++){	
	    var temp = meshs[i].brigl.radius / 180.0; // empirical
	    if (temp > radius_delta){
		radius_delta = temp;
	    }
	}
	this.camera.position.set(0 * radius_delta, 150 * radius_delta, 400 * radius_delta);
	this.camera.lookAt(this.scene.position);
    }
    else {
	if (old_mesh){
	    this.mesh.position.copy(old_mesh.position);
	    this.mesh.quaternion.copy(old_mesh.quaternion);
	}
    }
    
    this.scene.add(this.mesh);
    if (old_mesh) this.scene.remove(old_mesh);
    
    this.render();
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
