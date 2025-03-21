import { App } from './js/app.js';

let app;

window.preload = function() {
  app = new App();
  app.preload();
};

window.setup = async function() {
  await app.setup();
};

window.draw = function() {
  app.draw();
};

// UI Control Functions
window.toggleAnimation = function() {
  app.toggleAnimation();
};

window.toggleMouseInteraction = function() {
  app.toggleMouseInteraction();
};

window.setEffect = function(effect) {
  app.imageEffects.setEffect(effect);
};

window.toggleInputSource = function() {
  app.toggleInputSource();
};

window.toggleObjectDetection = function() {
  app.objectDetector.toggle();
};

window.toggleArtRecognition = function() {
  app.artRecognizer.toggle();
};

window.dropHandler = function(event) {
  app.handleDrop(event);
};
