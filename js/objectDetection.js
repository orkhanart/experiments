import { CONFIG } from './config.js';

export class ObjectDetector {
  constructor() {
    // Core properties
    this.detector = null;
    this.detectedObjects = [];
    this.isDetecting = false;
    this.detectionCanvas = null;
    this.detectionCtx = null;
    
    // Performance settings
    this.lastDetectionTime = 0;
    this.detectionThrottleMs = 500; // Throttle detection frequency
    this.isProcessing = false;
    this.fpsValues = [];
    this.lastFpsUpdate = 0;
    
    // Detection settings
    this.confidenceThreshold = 0.5;
    this.selectedClasses = new Set(); // Empty means all classes
    this.trackedObjects = new Map(); // id -> object tracking data
    this.nextObjectId = 1;
    
    // Statistics
    this.stats = {
      totalDetections: 0,
      detectionsPerClass: {},
      averageConfidence: 0,
      fps: 0
    };
    
    // Color scheme for different classes
    this.colorScheme = new Map([
      ['person', [255, 105, 97]],    // Coral red
      ['car', [97, 168, 255]],       // Light blue
      ['dog', [255, 179, 97]],       // Light orange
      ['cat', [97, 255, 168]],       // Light green
      ['default', [46, 204, 113]]    // Default green
    ]);
  }

  async init() {
    this.updateStatus('Loading model...', 'loading');
    try {
      if (typeof cocoSsd === 'undefined') {
        throw new Error('COCO-SSD model not loaded');
      }
      
      console.log('Loading COCO-SSD model...');
      this.detector = await cocoSsd.load();
      console.log('Model loaded successfully');
      
      // Create detection canvas
      this.detectionCanvas = document.createElement('canvas');
      this.detectionCanvas.width = CONFIG.detection.width;
      this.detectionCanvas.height = CONFIG.detection.height;
      this.detectionCtx = this.detectionCanvas.getContext('2d');
      
      this.updateStatus('Model loaded. Click Detect Objects to start', 'ready');
      this.setupUI();
    } catch (error) {
      console.error('Error loading model:', error);
      this.updateStatus('Error: ' + error.message, 'error');
    }
  }

  setupUI() {
    // Create confidence threshold slider
    const controls = document.querySelector('.controls-section:has(#detection-status)');
    if (!controls) return;

    const sliderGroup = document.createElement('div');
    sliderGroup.className = 'slider-group';
    sliderGroup.innerHTML = `
      <label for="confidence">Confidence Threshold: <span id="confidenceValue">50%</span></label>
      <input type="range" 
             id="confidence" 
             min="0" 
             max="100" 
             value="50"
             class="detection-slider">
      <div id="detection-fps" class="detection-fps">FPS: --</div>
      <div id="detection-stats" class="detection-stats"></div>
    `;
    
    controls.appendChild(sliderGroup);

    // Add event listener
    const slider = document.getElementById('confidence');
    const confidenceValue = document.getElementById('confidenceValue');
    
    slider.addEventListener('input', (e) => {
      const value = e.target.value;
      this.confidenceThreshold = value / 100;
      confidenceValue.textContent = value + '%';
    });
  }

  updateStatus(message, state = 'info') {
    const statusElement = document.getElementById('detection-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-text status-${state}`;
    }
  }

  updateStats() {
    const now = performance.now();
    
    // Update FPS
    if (now - this.lastFpsUpdate > 1000) {
      const fps = this.fpsValues.length;
      this.stats.fps = fps;
      this.fpsValues = [];
      this.lastFpsUpdate = now;
      
      const fpsElement = document.getElementById('detection-fps');
      if (fpsElement) {
        fpsElement.textContent = `FPS: ${fps}`;
      }
    }
    this.fpsValues.push(now);
    
    // Update statistics display
    const statsElement = document.getElementById('detection-stats');
    if (statsElement) {
      const stats = Object.entries(this.stats.detectionsPerClass)
        .map(([cls, count]) => `${cls}: ${count}`)
        .join(' | ');
      
      statsElement.textContent = `Objects: ${stats}`;
    }
  }

  async detect(source) {
    if (!this.detector || !this.isDetecting || !this.detectionCanvas) return;
    
    const now = performance.now();
    if (this.isProcessing || now - this.lastDetectionTime < this.detectionThrottleMs) return;
    
    this.isProcessing = true;
    this.lastDetectionTime = now;
    
    try {
      // Get source element and prepare for detection
      let sourceElement;
      if (source instanceof p5.Image) {
        sourceElement = source.canvas || source.elt;
      } else if (source instanceof p5.Video) {
        sourceElement = source.elt;
      } else {
        sourceElement = source;
      }
      
      // Clear detection canvas
      this.detectionCtx.clearRect(0, 0, this.detectionCanvas.width, this.detectionCanvas.height);
      
      // Draw source to detection canvas
      this.detectionCtx.save();
      this.detectionCtx.scale(CONFIG.detection.scale, CONFIG.detection.scale);
      this.detectionCtx.drawImage(sourceElement, 0, 0);
      this.detectionCtx.restore();
      
      // Perform detection
      const detections = await this.detector.detect(this.detectionCanvas);
      
      // Filter and process detections
      this.detectedObjects = detections
        .filter(obj => obj.score >= this.confidenceThreshold)
        .filter(obj => this.selectedClasses.size === 0 || this.selectedClasses.has(obj.class))
        .map(obj => {
          const scaleBack = 1 / CONFIG.detection.scale;
          return {
            ...obj,
            bbox: obj.bbox.map(v => v * scaleBack),
            id: this.trackObject(obj)
          };
        });
      
      // Update statistics
      this.updateDetectionStats();
      
    } catch (error) {
      console.error('Detection error:', error);
      this.updateStatus('Detection error: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  trackObject(detection) {
    const [x, y, w, h] = detection.bbox;
    const centerX = x + w/2;
    const centerY = y + h/2;
    
    // Try to match with existing tracked objects
    let minDist = Infinity;
    let matchedId = null;
    
    this.trackedObjects.forEach((tracked, id) => {
      if (tracked.class !== detection.class) return;
      
      const dx = centerX - tracked.centerX;
      const dy = centerY - tracked.centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < minDist && dist < Math.max(w, h)) {
        minDist = dist;
        matchedId = id;
      }
    });
    
    if (matchedId) {
      // Update existing tracked object
      this.trackedObjects.set(matchedId, {
        class: detection.class,
        centerX,
        centerY,
        lastSeen: performance.now()
      });
      return matchedId;
    } else {
      // Create new tracked object
      const newId = this.nextObjectId++;
      this.trackedObjects.set(newId, {
        class: detection.class,
        centerX,
        centerY,
        lastSeen: performance.now()
      });
      return newId;
    }
  }

  updateDetectionStats() {
    // Reset per-class counts
    this.stats.detectionsPerClass = {};
    
    // Count detections per class
    this.detectedObjects.forEach(obj => {
      this.stats.detectionsPerClass[obj.class] = 
        (this.stats.detectionsPerClass[obj.class] || 0) + 1;
    });
    
    // Update total detections
    this.stats.totalDetections = this.detectedObjects.length;
    
    // Calculate average confidence
    this.stats.averageConfidence = this.detectedObjects.reduce(
      (sum, obj) => sum + obj.score, 0
    ) / this.detectedObjects.length || 0;
    
    // Clean up old tracked objects
    const now = performance.now();
    for (const [id, tracked] of this.trackedObjects.entries()) {
      if (now - tracked.lastSeen > 1000) { // Remove after 1 second of not being seen
        this.trackedObjects.delete(id);
      }
    }
    
    this.updateStats();
  }

  drawBoxes() {
    push();
    translate(-width/2, -height/2); // Adjust for centered canvas
    
    this.detectedObjects.forEach(detection => {
      const [x, y, w, h] = detection.bbox;
      const confidence = Math.round(detection.score * 100);
      const label = `#${detection.id} ${detection.class} (${confidence}%)`;
      
      // Get color for this class
      const color = this.colorScheme.get(detection.class) || this.colorScheme.get('default');
      const [r, g, b] = color;
      
      // Draw box with glow effect
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      stroke(r, g, b);
      strokeWeight(2);
      noFill();
      rect(x, y, w, h);
      
      // Reset shadow for text
      drawingContext.shadowBlur = 0;
      
      // Draw label background
      const padding = 6;
      const textHeight = 24;
      textSize(14);
      const labelWidth = textWidth(label) + padding * 2;
      
      // Background with alpha gradient
      noStroke();
      fill(r, g, b, 200);
      rect(x, y - textHeight - 5, labelWidth, textHeight);
      
      // Draw label text
      fill(255);
      textAlign(LEFT, CENTER);
      text(label, x + padding, y - textHeight/2 - 5);
    });
    
    pop();
  }

  toggle() {
    this.isDetecting = !this.isDetecting;
    this.updateStatus(
      this.isDetecting ? 'Detection active' : 'Detection paused',
      this.isDetecting ? 'active' : 'paused'
    );
  }
}
