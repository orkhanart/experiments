import { CONFIG } from './config.js';

export class PointManager {
  constructor() {
    this.points = [];
    this.connectionDistance = 100;
  }

  generatePoints(source, width, height) {
    this.points = [];
    source.loadPixels();
    
    for(let i = 0; i < CONFIG.points.count; i++) {
      let x = floor(random(source.width));
      let y = floor(random(source.height));
      let index = (x + y * source.width) * 4;
      let brightness = (source.pixels[index] + source.pixels[index+1] + source.pixels[index+2]) / 3;
      
      if(brightness > CONFIG.points.brightnessThreshold) {
        let mappedX = map(x, 0, source.width, 0, width);
        let mappedY = map(y, 0, source.height, 0, height);
        
        this.points.push({
          originalX: mappedX,
          originalY: mappedY,
          x: mappedX,
          y: mappedY,
          size: random(CONFIG.points.minSize, CONFIG.points.maxSize),
          color: color(
            source.pixels[index],
            source.pixels[index+1],
            source.pixels[index+2]
          ),
          noiseSeed: random(1000),
          velocity: createVector(0, 0)
        });
      }
    }
  }

  updatePoints(noiseOffset, mouseInteraction, mouseX, mouseY, mouseIsPressed) {
    this.points.forEach(p => {
      // Mouse interaction
      if(mouseInteraction && mouseIsPressed) {
        let d = dist(mouseX, mouseY, p.x, p.y);
        if(d < CONFIG.animation.mouseRadius) {
          let force = p5.Vector.sub(createVector(p.x, p.y), createVector(mouseX, mouseY));
          force.normalize();
          force.mult(CONFIG.animation.mouseForce);
          p.velocity.add(force);
        }
      }
      
      // Noise movement
      let noiseX = map(noise(p.noiseSeed, noiseOffset), 0, 1, 
                      -CONFIG.animation.maxDisplacement, CONFIG.animation.maxDisplacement);
      let noiseY = map(noise(p.noiseSeed + 1000, noiseOffset), 0, 1, 
                      -CONFIG.animation.maxDisplacement, CONFIG.animation.maxDisplacement);
      
      // Update position
      p.x = p.originalX + noiseX + p.velocity.x;
      p.y = p.originalY + noiseY + p.velocity.y;
      
      // Dampen velocity
      p.velocity.mult(CONFIG.animation.dampening);
    });
  }

  drawConnections() {
    for(let i = 0; i < this.points.length; i++) {
      for(let j = i+1; j < this.points.length; j++) {
        let d = dist(this.points[i].x, this.points[i].y, this.points[j].x, this.points[j].y);
        
        if(d < this.connectionDistance) {
          // Line opacity based on distance
          let alpha = map(d, 0, this.connectionDistance, 255, 50);
          let lineColor = color(
            red(this.points[i].color), 
            green(this.points[i].color), 
            blue(this.points[i].color), 
            alpha
          );
          stroke(lineColor);
          line(this.points[i].x, this.points[i].y, this.points[j].x, this.points[j].y);
          
          // Midpoint shape
          let midX = (this.points[i].x + this.points[j].x) / 2;
          let midY = (this.points[i].y + this.points[j].y) / 2;
          
          if(random() > 0.5) {
            fill(
              this.points[j].color.levels[0], 
              this.points[j].color.levels[1], 
              this.points[j].color.levels[2], 
              CONFIG.shapes.opacity
            );
            ellipse(midX, midY, CONFIG.shapes.circleSize);
          } else {
            noFill();
            rectMode(CENTER);
            rect(midX, midY, CONFIG.shapes.rectSize, CONFIG.shapes.rectSize);
          }
        }
      }
    }
  }
}
