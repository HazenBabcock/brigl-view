/*

  BRIGLView - A wrapper around BRIGL that attempts to recreate
     some of the functionality of LDView.

  Hazen Babcock 2016

*/

var BRIGLV = BRIGLV || {
    REVISION: '1'
};

function splitLines(modelData){
    var lines = modelData.split("\n");
    
    for (var i = 0; i < lines.length; i++){
	var li = lines[i].trim();
	if (li === '') continue;
	BRIGLV.log(li)
    }
}


BRIGLV.log = function(msg){
    console.info(msg);
}


// A single step in the model.
BRIGLV.Step = function(){
    this.lines = [];
}

BRIGLV.Step.prototype = {

    constructor: BRIGLV.Step,

    addLine: function(line){
	this.lines.push(line);
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
    }
}


// The whole model.
BRIGLV.Model = function(options){
    this.brigl_builder = new BRIGL.Builder("parts/", options);
    this.groups = [];
}

BRIGLV.Model.prototype = {

    constructor: BRIGLV.Model,

    loadModel: function(modelData) {
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

	for (var i = 0; i < this.groups.length; i++){
	    BRIGLV.log(this.groups[i].group_name + " has " + this.groups[i].steps.length + " steps");
	}
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
