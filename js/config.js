// Configuration for the application
export const CONFIG = {
  canvas: {
    width: 1200,
    height: 900,
    maxWidth: 3000,
    maxHeight: 2000,
    padding: 10
  },
  points: {
    count: 500,
    minSize: 3,
    maxSize: 8,
    brightnessThreshold: 150
  },
  animation: {
    noiseSpeed: 0.01,
    maxDisplacement: 20,
    mouseForce: 3,
    mouseRadius: 100,
    dampening: 0.95
  },
  shapes: {
    circleSize: 8,
    rectSize: 10,
    opacity: 50
  },
  detection: {
    width: 640,
    height: 480,
    scale: 0.5
  }
};
