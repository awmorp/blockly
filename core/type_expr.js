/**
 * @fileoverview Classes for representing type expressions and type variables.
 */
'use strict';

goog.provide('Blockly.TypeExpr');
goog.provide('Blockly.TypeVar');


Blockly.TypeExpr = function(name, children /* = [] */ ) {
  this.name = name;
  this.children = arguments.length == 2 ? children : [];
}

Blockly.TypeExpr.prototype.isTypeVar = function() {
  return this.name in Blockly.TypeVar.getTypeVarDB_();
}

Blockly.TypeExpr.prototype.unify = function(other, subst /* = {} */ ) {
  var s, a, b;
  if (arguments.length == 2) {
    s = subst;
    a = this.apply(s);
    b = other.apply(s);
  } else {
    s = {};
    a = this;
    b = other;
  }
  var result = {};
  for (var attr in s) { 
    result[attr] = s[attr];
  }
  if (a.isTypeVar() && b.isTypeVar()) {
    result[b.name] = a;
  } else if (a.isTypeVar() && !b.isTypeVar()) {
    if (a.name in result) {
      result = result[a.name].unify(b, result);
    } else {
      result[a.name] = b;
    }
  } else if (!a.isTypeVar() && b.isTypeVar()) {
    if (b.name in result) {
      result = a.unify(result[b.name], result);
    } else {
      result[b.name] = a;
    }
  } else {
    if (a.name != b.name) return false;
    if (a.children.length != b.children.length) return false;
    for (var i = 0; i < a.children.length; i++) {
      result = a.children[i].unify(b.children[i], result);
      if (result === false) return false;
    }
  }
  return result;
}

Blockly.TypeExpr.prototype.apply = function(subst) {
  if (this.isTypeVar() && this.name in subst) {
    return subst[this.name];
  }
  return new Blockly.TypeExpr(
    this.name, 
    this.children.map(function (x) { return x.apply(subst); }));
}

Blockly.TypeVar = function(name, color) {
  this.name = name;
  this.color = color;
  this.used = false;
}

Blockly.TypeVar.getTypeVarDB_ = function() {
  if (!Blockly.TypeVar.typeVarDB_) {
    Blockly.TypeVar.initTypeVarDB_();
  }
  return Blockly.TypeVar.typeVarDB_;
}

Blockly.TypeVar.initTypeVarDB_ = function() {
  Blockly.TypeVar.typeVarDB_ = {};
  Blockly.TypeVar.addTypeVar_("A", "Red");
  Blockly.TypeVar.addTypeVar_("B", "Blue");
  Blockly.TypeVar.addTypeVar_("C", "Green");
  Blockly.TypeVar.addTypeVar_("D", "Cyan");
  Blockly.TypeVar.addTypeVar_("E", "BlueViolet");
  Blockly.TypeVar.addTypeVar_("F", "Brown");
  Blockly.TypeVar.addTypeVar_("G", "Black");
  Blockly.TypeVar.addTypeVar_("H", "Chartreuse");
  Blockly.TypeVar.addTypeVar_("I", "Gold");
  Blockly.TypeVar.addTypeVar_("J", "HotPink");
  Blockly.TypeVar.addTypeVar_("K", "LightSkyBlue");
  Blockly.TypeVar.addTypeVar_("L", "Orange");
  Blockly.TypeVar.addTypeVar_("M", "Gray");
  Blockly.TypeVar.addTypeVar_("N", "YellowGreen");
  Blockly.TypeVar.addTypeVar_("O", "Maroon");
  Blockly.TypeVar.addTypeVar_("P", "Purple");
  Blockly.TypeVar.addTypeVar_("Q", "Yellow");
  Blockly.TypeVar.addTypeVar_("R", "Teal");
  Blockly.TypeVar.addTypeVar_("S", "Aqua");
  Blockly.TypeVar.addTypeVar_("T", "Olive");
  Blockly.TypeVar.addTypeVar_("U", "Fuchsia");
  Blockly.TypeVar.addTypeVar_("V", "Navy");
  Blockly.TypeVar.addTypeVar_("W", "Lime");
  Blockly.TypeVar.addTypeVar_("X", "Chocolate");
  Blockly.TypeVar.addTypeVar_("Y", "DarkSlateGray");
  Blockly.TypeVar.addTypeVar_("Z", "RosyBrown");
  Blockly.TypeVar.addTypeVar_("AA", "Red");
  Blockly.TypeVar.addTypeVar_("AB", "Blue");
  Blockly.TypeVar.addTypeVar_("AC", "Green");
  Blockly.TypeVar.addTypeVar_("AD", "Cyan");
  Blockly.TypeVar.addTypeVar_("AE", "BlueViolet");
  Blockly.TypeVar.addTypeVar_("AF", "Brown");
  Blockly.TypeVar.addTypeVar_("AG", "Black");
  Blockly.TypeVar.addTypeVar_("AH", "Chartreuse");
  Blockly.TypeVar.addTypeVar_("AI", "Gold");
  Blockly.TypeVar.addTypeVar_("AJ", "HotPink");
  Blockly.TypeVar.addTypeVar_("AK", "LightSkyBlue");
  Blockly.TypeVar.addTypeVar_("AL", "Orange");
  Blockly.TypeVar.addTypeVar_("AM", "Gray");
  Blockly.TypeVar.addTypeVar_("AN", "YellowGreen");
  Blockly.TypeVar.addTypeVar_("AO", "Maroon");
  Blockly.TypeVar.addTypeVar_("AP", "Purple");
  Blockly.TypeVar.addTypeVar_("AQ", "Yellow");
  Blockly.TypeVar.addTypeVar_("AR", "Teal");
  Blockly.TypeVar.addTypeVar_("AS", "Aqua");
  Blockly.TypeVar.addTypeVar_("AT", "Olive");
  Blockly.TypeVar.addTypeVar_("AU", "Fuchsia");
  Blockly.TypeVar.addTypeVar_("AV", "Navy");
  Blockly.TypeVar.addTypeVar_("AW", "Lime");
  Blockly.TypeVar.addTypeVar_("AX", "Chocolate");
  Blockly.TypeVar.addTypeVar_("AY", "DarkSlateGray");
  Blockly.TypeVar.addTypeVar_("AZ", "RosyBrown");
}

Blockly.TypeVar.addTypeVar_ = function(name, color) {
  Blockly.TypeVar.typeVarDB_[name] = new Blockly.TypeVar(name, color);
}

Blockly.TypeVar.getTypeVarColor = function(name) {
  var db = Blockly.TypeVar.getTypeVarDB_();
  return db[name].color;
}

Blockly.TypeVar.getUnusedTypeVar = function() {
  Blockly.TypeVar.doGarbageCollection();
  var db = Blockly.TypeVar.getTypeVarDB_();
  for (name in db) {
    if (!db[name].used) {
      db[name].used = true;
      return new Blockly.TypeExpr(name);
    }
  }
  throw 'Ran out of type variables!';
}

Blockly.TypeVar.triggerGarbageCollection = function () {
  Blockly.TypeVar.needGC = true;
  setTimeout(Blockly.TypeVar.doGarbageCollection, 500);
}

Blockly.TypeVar.doGarbageCollection = function () {
  if (Blockly.TypeVar.needGC === false) {
    return;
  }
  var db = Blockly.TypeVar.getTypeVarDB_();
  for (name in db) {
    db[name].used = false;
  }
  function traverse(t) {
    if (t.isTypeVar()) {
      db[t.name].used = true;
    }
    t.children.map(function (c) { traverse(c) } );
  };
  for( var i in Blockly.Workspace.WorkspaceDB_ ) {
    var workspace = Blockly.Workspace.WorkspaceDB_[i];
//    console.log( "doGC: checking workspace ", workspace );
    var blocks = workspace.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
      var connections = blocks[i].getConnections_(true);
      for (var j = 0; j < connections.length; j++) {
        if (connections[j].typeExpr) {
          traverse(connections[j].typeExpr)
        }
      }
    }
  }
  Blockly.TypeVar.needGC = false;
}
