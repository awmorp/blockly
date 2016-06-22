/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility functions for handling variables.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Variables');

goog.require('Blockly.Blocks');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
 * Category to separate variable names from procedures and generated functions.
 */
Blockly.Variables.NAME_TYPE = 'VARIABLE';

/**
 * Find all user-created variables, optionally of specified type.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @param {string=} type Type of variables to return. If non-null, returns
 *    all variables of given type. If null, returns all variables of any type.
 * @return {!Array.<string>} Array of variable names.
 */
Blockly.Variables.allVariables = function(root, type) {
  var blocks;
  var workspace;
  if (root.getDescendants) {
    // Root is Block.
    blocks = root.getDescendants();
    workspace = root.workspace;
  } else if (root.getAllBlocks) {
    // Root is Workspace.
    blocks = root.getAllBlocks();
    workspace = root;
  } else {
    throw 'Not Block or Workspace: ' + root;
  }
  var variableHash = Object.create(null);
  // Iterate through every block and add each variable to the hash.
  for (var x = 0; x < blocks.length; x++) {
    var blockVariables = blocks[x].getVars();
    for (var y = 0; y < blockVariables.length; y++) {
      if( blockVariables[y] instanceof String ) {
        /* Variable is untyped */
        if( !type ) {
          var varName = blockVariables[y];
          // Variable name may be null if the block is only half-built.
          if (varName ) {
            variableHash[varName.toLowerCase()] = varName;
          }            
        }
      } else if( blockVariables[y] instanceof Array ) {
        /* Variable is typed - blockVariables[y] is an array [name, type] */
        var varName = blockVariables[y][0];
        var varType = blockVariables[y][1];
        // Variable name may be null if the block is only half-built.
        if (varName && (!type || (type == varType))) {
          variableHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  // Add predefined global variables
  if( workspace.globalVariables ) {
    for (var y = 0; y < workspace.globalVariables.length; y++) {
      if( workspace.globalVariables[y] instanceof String ) {
        /* Variable is untyped */
        if( !type ) {
          var varName = workspace.globalVariables[y];
          if (varName ) {
            variableHash[varName.toLowerCase()] = varName;
          }            
        }
      } else if( workspace.globalVariables[y] instanceof Array ) {
        /* Variable is typed - workspace.globalVariables[y] is an array [name, type] */
        var varName = workspace.globalVariables[y][0];
        var varType = workspace.globalVariables[y][1];
        // Variable name may be null if the block is only half-built.
        if (varName && (!type || (type == varType))) {
          variableHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var variableList = [];
  for (var name in variableHash) {
    variableList.push(variableHash[name]);
  }
  return variableList;
};


/**
 * Find all instances of the specified variable and rename them.
 * @param {string} oldName Variable to rename.
 * @param {string} newName New variable name.
 * @param {!Blockly.Workspace} workspace Workspace rename variables in.
 */
Blockly.Variables.renameVariable = function(oldName, newName, workspace) {
  Blockly.Events.setGroup(true);
  var blocks = workspace.getAllBlocks();
  // Iterate through every block.
  for (var i = 0; i < blocks.length; i++) {
    blocks[i].renameVar(oldName, newName);
  }
  Blockly.Events.setGroup(false);
};

/**
 * Construct the blocks required by the flyout for the variable category.
 * @param {!Blockly.Workspace} workspace The workspace contianing variables.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Variables.flyoutCategory = function(workspace) {
  var variableList = Blockly.Variables.allVariables(workspace);
  variableList.sort(goog.string.caseInsensitiveCompare);
  // In addition to the user's variables, we also want to display the default
  // variable name at the top.  We also don't want this duplicated if the
  // user has created a variable of the same name.
  goog.array.remove(variableList, Blockly.Msg.VARIABLES_DEFAULT_NAME);
  variableList.unshift(Blockly.Msg.VARIABLES_DEFAULT_NAME);

  var xmlList = [];
  for (var i = 0; i < variableList.length; i++) {
    if (Blockly.Blocks['variables_set']) {
      // <block type="variables_set" gap="8">
      //   <field name="VAR">item</field>
      // </block>
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'variables_set');
      if (Blockly.Blocks['variables_get']) {
        block.setAttribute('gap', 8);
      }
      var field = goog.dom.createDom('field', null, variableList[i]);
      field.setAttribute('name', 'VAR');
      block.appendChild(field);
      xmlList.push(block);
    }
    if (Blockly.Blocks['variables_get']) {
      // <block type="variables_get" gap="24">
      //   <field name="VAR">item</field>
      // </block>
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'variables_get');
      if (Blockly.Blocks['variables_set']) {
        block.setAttribute('gap', 24);
      }
      var field = goog.dom.createDom('field', null, variableList[i]);
      field.setAttribute('name', 'VAR');
      block.appendChild(field);
      xmlList.push(block);
    }
  }
  return xmlList;
};

/**
* Return a new variable name that is not yet being used. This will try to
* generate single letter variable names in the range 'i' to 'z' to start with.
* If no unique name is located it will try 'i' to 'z', 'a' to 'h',
* then 'i2' to 'z2' etc.  Skip 'l'.
 * @param {!Blockly.Workspace} workspace The workspace to be unique in.
* @return {string} New variable name.
*/
Blockly.Variables.generateUniqueName = function(workspace) {
  var variableList = Blockly.Variables.allVariables(workspace);
  var newName = '';
  if (variableList.length) {
    var nameSuffix = 1;
    var letters = 'ijkmnopqrstuvwxyzabcdefgh';  // No 'l'.
    var letterIndex = 0;
    var potName = letters.charAt(letterIndex);
    while (!newName) {
      var inUse = false;
      for (var i = 0; i < variableList.length; i++) {
        if (variableList[i].toLowerCase() == potName) {
          // This potential name is already used.
          inUse = true;
          break;
        }
      }
      if (inUse) {
        // Try the next potential name.
        letterIndex++;
        if (letterIndex == letters.length) {
          // Reached the end of the character sequence so back to 'i'.
          // a new suffix.
          letterIndex = 0;
          nameSuffix++;
        }
        potName = letters.charAt(letterIndex);
        if (nameSuffix > 1) {
          potName += nameSuffix;
        }
      } else {
        // We can use the current potential name.
        newName = potName;
      }
    }
  } else {
    newName = 'i';
  }
  return newName;
};
