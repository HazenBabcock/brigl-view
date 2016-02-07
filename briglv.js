/*

  BRIGLV - A wrapper around BRIGL that attempts to recreate
     some of the functionality of LDView. In theory these are
     the more portable parts.

  Hazen Babcock 2016

  FIXME:
    1. If you have a MPD file in which later sub models refer
       to early sub models this will break.

*/

var BRIGLV = BRIGLV || {
    REVISION: '1'
};

function briglRender(model, to_render, callback, errorCallback){
    if (to_render.length > 0){
	step = to_render.pop();
	BRIGLV.log("rendering " + step.name);
	model.brigl_builder.loadModelByData(step.name,
					    step.data,
					    model.mesh_options,
					    function(mesh){
						step.setMesh(mesh);
						briglRender(model, to_render, callback, errorCallback);
					    },
					    errorCallback);
    }
    else {
	BRIGLV.log("loading complete");
	callback();
    }
}


BRIGLV.log = function(msg){
    console.info("BV " + msg);
}

/*
 * A single part, these are used for
 * rendering the parts list for each step.
 */
BRIGLV.Part = function(){
    this.data = "";
    this.mesh = undefined;
}

BRIGLV.Part.prototype = {

    constructor: BRIGLV.Part,

    addLine: function(line){
	this.data = line;
    },

    setMesh: function(mesh){
	this.mesh = mesh;
    }
}

/*
 * Usually this is a single step in the model, but it can 
 * also be an entire group. It contains all the LDraw data 
 * necessary for BRIGL to render this part of the model.
 */
BRIGLV.Step = function(name){
    this.data = "";
    this.mesh = undefined;
    this.name = name;
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
	this.mesh = mesh;
    },

    setName: function(name){
	this.name = name;
    }
}

/*
 * A group in the model, every model has at least one.
 *
 * Step 0 is the entire group. To display a sub-set of
 * the group by steps use steps 1..N.
 */
BRIGLV.Group = function(name){
    this.all_steps = new BRIGLV.Step(name);
    this.cur_step = new BRIGLV.Step(name + "_0");
    this.group_name = name;
    this.steps = [this.all_steps, this.cur_step];
}

BRIGLV.Group.prototype = {
    
    constructor: BRIGLV.Group,

    addLine: function(line) {
	if (line.startsWith("0 STEP")){
	    this.cur_step = new BRIGLV.Step(this.group_name + "_" + (this.steps.length - 1));
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


/*
 * The whole model.
 */
BRIGLV.Model = function(options){
    this.brigl_builder = new BRIGL.Builder("parts/", options);
    this.errorCallback = undefined;
    this.finishedLoadingCallback = undefined;
    this.groups = [];
    this.mesh_options = {};
    this.to_render = [];
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
	    meshs.push(group.steps[i].getMesh());
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

	// Create a list containing everything that we need BRIGL to render.
	for (var i = 0; i < this.groups.length; i++){
	    group = this.groups[i];
	    for (var j = 0; j < group.getNumberSteps(); j++){
		this.to_render.push(group.steps[j]);
	    }
	}

	// Render it.
	briglRender(this, this.to_render, callback, errorCallback);

    },

    reset: function(){
	this.groups = [];
    }

}


/*
 * A slightly modified BRIGL.BriglContainer that 
 * can handle handle multiple meshes.
 */
BRIGLV.Container = BRIGL.BriglContainer;

BRIGLV.Container.prototype.setModel = function(meshs, reset_view) {

    old_mesh = this.mesh;
    
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
