// -*- mode: java; c-basic-offset: 2; -*-
// Copyright 2013-2014 MIT, All rights reserved
// Released under the Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0
/**
 * @license
 * @fileoverview Field in which mouseover displays flyout-like menu of blocks
 * and mouse click edits the field name.
 * Flydowns are used in App Inventor for displaying get/set blocks for parameter names
 * and callers for procedure declarations.
 * @author fturbak@wellesley.edu (Lyn Turbak)
 */

'use strict';

goog.provide('Blockly.FieldFlydown');

goog.require('Blockly.FieldTextInput');

/**
 * Class for a clickable parameter field.
 * @param {string} text The initial parameter name in the field.
 * @param {Function} opt_changeHandler An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change. E.g., for an associated getter/setter this could change
 *     references to names in this field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */

Blockly.FieldFlydown = function(initialText, isEditable, displayLocation, opt_validator, opt_maxlength) {
  Blockly.FieldFlydown.superClass_.constructor.call(this, initialText, opt_validator, opt_maxlength);

  this.EDITABLE = isEditable; // This by itself does not control editability
  this.displayLocation = displayLocation;
  };
goog.inherits(Blockly.FieldFlydown, Blockly.FieldTextInput);

/**
 * Milliseconds to wait before showing flydown after mouseover event on flydown field.
 * @type {number}
 * @const
 */
Blockly.FieldFlydown.flydownTimeout = 750;

/**
 * Process ID for timer event to show flydown (scheduled by mouseover event)
 * @type {number}
 * @const
 */
Blockly.FieldFlydown.showPid_ = 0;

// Note: To be correct, the next two should be per-workspace. App Inventor code assumes only one (non-flyout) Blockly workspace is present.
/**
 * The flydown which is currently active (if any)
 */
Blockly.FieldFlydown.activeFlydown_ = null;

/**
 * Which instance of FieldFlydown (or a subclass) is an open flydown attached to?
 * @type {Blockly.FieldFlydown (or subclass)}
 * @private
 */
Blockly.FieldFlydown.flydownOwner_ = null;

/**
 * Control positioning of flydown
 */
Blockly.FieldFlydown.DISPLAY_BELOW = "BELOW";
Blockly.FieldFlydown.DISPLAY_RIGHT = "RIGHT";
Blockly.FieldFlydown.DISPLAY_LOCATION = Blockly.FieldFlydown.DISPLAY_BELOW; // [lyn, 10/14/13] Make global for now, change in future

/**
 * Default CSS class name for the flydown that flies down from the field
 * @type {String}
 * @const
 */
Blockly.FieldFlydown.prototype.flyoutCSSClassName = 'blocklyFieldFlydownFlydown';

// Override FieldTextInput's showEditor_ so it's only called for EDITABLE field.
Blockly.FieldFlydown.prototype.showEditor_ = function() {
  if (this.EDITABLE) {
    Blockly.FieldFlydown.superClass_.showEditor_.call(this);
  }
}

Blockly.FieldFlydown.prototype.init = function() {
  Blockly.FieldFlydown.superClass_.init.call(this);

  Blockly.Flydown.workspaceInit( this.sourceBlock_.workspace );  // Set up Flydown for this workspace
  
   /* Bind mouse handlers */
  this.mouseOverWrapper_ =
      Blockly.bindEvent_(this.fieldGroup_, 'mouseover', this, this.onMouseOver_);
  this.mouseOutWrapper_ =
      Blockly.bindEvent_(this.fieldGroup_, 'mouseout', this, this.onMouseOut_);
};

Blockly.FieldFlydown.prototype.onMouseOver_ = function(e) {
//  console.log("FieldFlydown mouseover");
  if (! this.sourceBlock_.isInFlyout) { // [lyn, 10/22/13] No flydowns in a flyout!
    var field = this;
    var callback = function() {
      Blockly.FieldFlydown.showPid_ = 0;
      field.showFlydown_();
    };
    if( Blockly.FieldFlydown.showPid_ ) window.clearTimeout( Blockly.FieldFlydown.showPid_ );
    Blockly.FieldFlydown.showPid_ = window.setTimeout( callback, Blockly.FieldFlydown.flydownTimeout );
    // This event has been handled.  No need to bubble up to the document.
  }
  e.stopPropagation();
};

Blockly.FieldFlydown.prototype.onMouseOut_ = function(e) {
  // Clear any pending timer event to show flydown
//  console.log( "FieldFlydown onmouseout" );
  if( Blockly.FieldFlydown.showPid_ != 0 ) {
    window.clearTimeout(Blockly.FieldFlydown.showPid_);
    Blockly.FieldFlydown.showPid_ = 0;
  }
  e.stopPropagation();
};


/**
 * Creates a Flydown block of the getter and setter blocks for the parameter name in this field.
 */
Blockly.FieldFlydown.prototype.showFlydown_ = function() {
  // Create XML elements from blocks and then create the blocks from the XML elements.
  // This is a bit crazy, but it's simplest that way. Otherwise, we'd have to duplicate
  // much of the code in Blockly.Flydown.prototype.show.
//  console.log("FieldFlydown show Flydown");
  if( !this.getValue() || this.getValue() == "" ) return; // No flydown if no input entered
  
  Blockly.hideChaff(); // Hide open context menus, dropDowns, flyouts, and other flydowns
  Blockly.FieldFlydown.flydownOwner_ = this; // Remember field to which flydown is attached
  var flydown = this.sourceBlock_.workspace.flydown_;
  Blockly.FieldFlydown.activeFlydown_ = flydown;
  flydown.setCSSClass(this.flyoutCSSClassName); // This could have been changed by another field.
  var blocksXMLText = this.flydownBlocksXML_()
  var blocksDom = Blockly.Xml.textToDom(blocksXMLText);
  var blocksXMLList = goog.dom.getChildren(blocksDom); // List of blocks for flydown
  var xy = Blockly.getSvgXY_(this.borderRect_, this.sourceBlock_.workspace);
  var borderBBox = this.borderRect_.getBBox();
  var x = xy.x;
  var y = xy.y;
  if (this.displayLocation === Blockly.FieldFlydown.DISPLAY_BELOW) {
    y = y + borderBBox.height;
  } else { // if (this.displayLocation === Blockly.FieldFlydown.DISPLAY_RIGHT) {
    x = x + borderBBox.width;
  }
  flydown.showAt(blocksXMLList, x, y);
};

/**
 * Hide the flydown menu and squash any timer-scheduled flyout creation
 */
Blockly.FieldFlydown.hideFlydown = function() {
  // Clear any pending timer event to show flydown
  if( Blockly.FieldFlydown.showPid_ != 0 ) {
    window.clearTimeout(Blockly.FieldFlydown.showPid_);
    Blockly.FieldFlydown.showPid_ = 0;
  }
  // Clear any displayed flydown
  if( Blockly.FieldFlydown.activeFlydown_ ) {
    Blockly.FieldFlydown.activeFlydown_.hide();
    Blockly.FieldFlydown.activeFlydown_ = null;
  }
  if( Blockly.FieldFlydown.flydownOwner_ ) Blockly.FieldFlydown.flydownOwner_ = null;
};

/**
 * Close the flydown and dispose of all UI.
 */
Blockly.FieldFlydown.prototype.dispose = function() {
  if (Blockly.FieldFlydown.flydownOwner_ == this) {
    Blockly.FieldFlydown.hideFlydown();
  }
  // Call parent's destructor.
  Blockly.FieldFlydown.superClass_.dispose.call(this);
};
