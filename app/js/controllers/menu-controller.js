var util = require('util');
var ViewController = require('./view-controller');
var MapSurface = require('../views/map-surface');
var Famous = require('../shims/famous');
var _ = require('lodash');

function MenuController() {
  this.buttonModifiers = [];
  this.buttonShowModifiers = [];
}
util.inherits(MenuController, ViewController);

MenuController.prototype.buildSectionButton = function(section) {
  var renderNode = new Famous.RenderNode();
  var surface = new Famous.Surface({
    classes: ['menu-button'],
  });
  var buttonText = new Famous.Surface({
    classes: ['menu-button-text'],
    content: section + 1,
    size: [true, true],
  });
  var textModifier = new Famous.StateModifier({
    transform: Famous.Transform.inFront,
    align: [0.5, 0.5],
    origin: [0.5, 0.5],
  });
  var modifier = new Famous.Modifier();
  var showModifier = new Famous.ShowModifier({
    visible: false,
  });
  var node = renderNode.add(modifier).add(showModifier);
  node.add(surface);
  node.add(textModifier).add(buttonText);

  this.buttonModifiers[section] = modifier;
  this.buttonShowModifiers[section] = showModifier;
  modifier.section = section;

  surface.on('click', this.navigateToSection.bind(this, section));
  return renderNode;
};

var distance = 30;

MenuController.prototype.navigateToSection = function (section) {
  if (this.navigatedAway) { return; }
  this.presentOut(section);
  this.navigatedAway = true;
};

MenuController.prototype.present = function (isIn, skip) {
  var self = this;

  var start = isIn ? 0 : 1;
  var end = isIn ? 1 : 0;
  var easing = isIn ? 'easeOut' : 'easeIn';

  var buttons = _.shuffle(self.buttonModifiers);
  _.each(buttons, function(modifier, i) {
    var delay = i * 20;
    if (modifier.section === skip) {
      delay = 150;
    }
    Famous.Timer.setTimeout(function() {
      self.buttonShowModifiers[modifier.section].show();

      var state = new Famous.Transitionable(start);
      state.set(end, {
        duration: 200,
        curve: easing,
      }, function () {
        if (!isIn) {
          self.buttonShowModifiers[modifier.section].hide();
        }
      });

      modifier.opacityFrom(state);
      if (modifier.section !== skip) {
        modifier.transformFrom(function() {
          return Famous.Transform.translate(0, 0, (1 - state.get()) * distance);
        });
      }
    }, delay);
  });
};

MenuController.prototype.presentOut = function (section) {
  this.present(false, section);
};

MenuController.prototype.presentIn = function () {
  this.present(true);
};

MenuController.prototype.buildRenderTree = function (parentNode) {
  var self = this;

  var borderWidth = 15;

  var verticalLayout = new Famous.GridLayout({
    dimensions: [1, 4],
    gutterSize: [0, borderWidth],
  });

  var verticalViews = [];
  var horizontalLayout, horizontalViews;
  verticalLayout.sequenceFrom(verticalViews);
  for (var i = 0; i < 4; i++) {
    horizontalViews = [];
    horizontalLayout = new Famous.GridLayout({
      dimensions: [((i === 3) ? 1 : 2), 1],
      gutterSize: [borderWidth, 0]
    });

    verticalViews.push(horizontalLayout);
    horizontalLayout.sequenceFrom(horizontalViews);

    if (i === 3) {
      horizontalViews.push(self.buildSectionButton(i * 2));
    } else {
      horizontalViews.push(self.buildSectionButton(i * 2));
      horizontalViews.push(self.buildSectionButton(i * 2 + 1));
    }
  }

  var verticalGutter = new Famous.FlexibleLayout({
    ratios: [true, 1, true],
    direction: 1,
  });
  verticalGutter.sequenceFrom([new Famous.Surface({
    size: [undefined, borderWidth],
  }), verticalLayout, new Famous.Surface({
    size: [undefined, borderWidth],
  })]);

  var horizontalGutter = new Famous.FlexibleLayout({
    ratios: [true, 1, true],
    direction: 0,
  });
  horizontalGutter.sequenceFrom([new Famous.Surface({
    size: [borderWidth, undefined],
  }), verticalGutter, new Famous.Surface({
    size: [borderWidth, undefined],
  })]);

  parentNode.add(horizontalGutter);

  Famous.Timer.setTimeout(function () {
    console.log('plm');
    self.presentIn();
  }, 600);
};

module.exports = MenuController;
