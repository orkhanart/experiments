import { CONFIG } from './config.js';
import { ObjectDetector } from './objectDetection.js';
import { ArtRecognizer } from './artRecognition.js';
import { PointManager } from './points.js';
import { ImageEffects } from './imageEffects.js';

export class App {
  constructor() {
    this.source = null;
    this.isAnimating = true;
    this.isMouseInteractive = true;
    this.useCamera = false;
    this.video = null;
    
    // Initialize components
    this.objectDetector = new ObjectDetector();
    this.artRecognizer = new ArtRecognizer();
    this.pointManager = new PointManager();
    this.imageEffects = new ImageEffects();
  }

  preload() {
    // Preload default image if needed
  }

  async setup() {
    createCanvas(CONFIG.canvas.width, CONFIG.canvas.height, WEBGL);
    await Promise.all([
      this.objectDetector.init(),
      this.artRecognizer.init()
    ]);
  }

  draw() {
    background(0);
    
    if (!this.source) return;
    
    // Apply current effect
    const processedImage = this.imageEffects.apply(this.source);
    
    // Update and draw points
    if (this.isAnimating) {
      this.pointManager.update(processedImage, this.isMouseInteractive);
    }
    this.pointManager.draw();
    
    // Draw detection boxes if active
    if (this.objectDetector.isDetecting) {
      this.objectDetector.detect(this.source);
      this.objectDetector.drawBoxes();
    }
    
    // Draw art recognition results if active
    if (this.artRecognizer.isProcessing) {
      await this.artRecognizer.recognize(this.source);
      this.artRecognizer.drawRecognitions(window._renderer);
    }
  }

  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
  }

  toggleMouseInteraction() {
    this.isMouseInteractive = !this.isMouseInteractive;
  }

  async toggleInputSource() {
    if (this.useCamera) {
      if (this.video) {
        this.video.remove();
        this.video = null;
      }
      this.source = null;
      this.useCamera = false;
    } else {
      try {
        this.video = createCapture(VIDEO);
        this.video.size(CONFIG.canvas.width, CONFIG.canvas.height);
        this.video.hide();
        this.source = this.video;
        this.useCamera = true;
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  }

  handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file.type.match('image.*')) {
      // Stop camera if it's running
      if (this.useCamera && this.video) {
        this.video.remove();
        this.video = null;
        this.useCamera = false;
      }
      
      // Load the dropped image
      loadImage(URL.createObjectURL(file), (img) => {
        this.source = img;
      });
    }
  }
}
