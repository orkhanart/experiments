import { CONFIG } from './config.js';

export class ArtRecognizer {
  constructor() {
    this.model = null;
    this.isProcessing = false;
    this.lastProcessTime = 0;
    this.processThrottleMs = 1000;
    this.recognizedElements = [];
    
    // Art categories mapped to common objects
    this.artCategories = [
      { name: 'Portrait', keywords: ['face', 'person', 'head', 'eye', 'hair'] },
      { name: 'Landscape', keywords: ['mountain', 'tree', 'sky', 'sea', 'beach', 'cloud'] },
      { name: 'Still Life', keywords: ['bottle', 'vase', 'fruit', 'flower', 'table'] },
      { name: 'Architecture', keywords: ['building', 'house', 'church', 'tower', 'bridge'] },
      { name: 'Nature', keywords: ['flower', 'bird', 'cat', 'dog', 'plant', 'tree'] },
      { name: 'Urban', keywords: ['street', 'car', 'building', 'traffic', 'shop'] },
      { name: 'Abstract', keywords: ['pattern', 'line', 'circle', 'square', 'triangle'] }
    ];
  }

  async init() {
    try {
      this.updateStatus('Loading art recognition model...', 'loading');
      
      // Load MobileNet model
      this.model = await mobilenet.load();
      
      this.updateStatus('Art recognition ready', 'ready');
      console.log('MobileNet model loaded successfully');
      
    } catch (error) {
      console.error('Error loading art recognition model:', error);
      this.updateStatus('Error loading model: ' + error.message, 'error');
    }
  }

  updateStatus(message, state = 'info') {
    const statusElement = document.getElementById('art-recognition-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-text status-${state}`;
    }
  }

  async recognize(imageElement) {
    if (!this.model || !this.isProcessing) return;
    
    const now = performance.now();
    if (now - this.lastProcessTime < this.processThrottleMs) return;
    
    try {
      // Get predictions from MobileNet
      const predictions = await this.model.classify(imageElement, 10);
      console.log('Raw predictions:', predictions);
      
      // Process predictions into art categories
      this.recognizedElements = this.processArtPredictions(predictions);
      
      this.updateStatus(
        `Recognized ${this.recognizedElements.length} artistic elements`,
        'active'
      );
      
    } catch (error) {
      console.error('Art recognition error:', error);
      this.updateStatus('Recognition error: ' + error.message, 'error');
    }
    
    this.lastProcessTime = now;
  }

  processArtPredictions(predictions) {
    const results = new Map();
    
    // Process each prediction
    predictions.forEach(pred => {
      const className = pred.className.toLowerCase();
      const probability = pred.probability;
      
      // Check each art category
      this.artCategories.forEach(category => {
        // Check if prediction matches any keywords
        const matchingKeywords = category.keywords.filter(keyword => 
          className.includes(keyword.toLowerCase())
        );
        
        if (matchingKeywords.length > 0) {
          // Update category score (take highest probability if multiple matches)
          const currentScore = results.get(category.name) || 0;
          results.set(category.name, Math.max(currentScore, probability));
        }
      });
    });
    
    // Convert to array and sort by score
    return Array.from(results.entries())
      .map(([category, score]) => ({
        category,
        score
      }))
      .filter(item => item.score > 0.1) // Filter low confidence
      .sort((a, b) => b.score - a.score);
  }

  drawRecognitions(p5Instance) {
    if (!this.recognizedElements.length) return;

    p5Instance.push();
    p5Instance.translate(-p5Instance.width/2, -p5Instance.height/2);
    
    // Draw recognition panel
    const padding = 20;
    const itemHeight = 30;
    const panelWidth = 300;
    const panelHeight = Math.min(
      this.recognizedElements.length * itemHeight + padding * 2 + 40,
      400
    );
    
    // Panel background with blur effect
    p5Instance.drawingContext.save();
    p5Instance.drawingContext.filter = 'blur(10px)';
    p5Instance.fill(0, 0, 0, 100);
    p5Instance.noStroke();
    p5Instance.rect(
      p5Instance.width - panelWidth - padding - 10,
      padding - 10,
      panelWidth + 20,
      panelHeight + 20,
      15
    );
    p5Instance.drawingContext.restore();
    
    // Main panel
    p5Instance.fill(0, 0, 0, 200);
    p5Instance.rect(
      p5Instance.width - panelWidth - padding,
      padding,
      panelWidth,
      panelHeight,
      12
    );
    
    // Title
    p5Instance.fill(255);
    p5Instance.textSize(16);
    p5Instance.textAlign(p5Instance.LEFT, p5Instance.TOP);
    p5Instance.text(
      'Artistic Elements',
      p5Instance.width - panelWidth - padding + 15,
      padding + 15
    );
    
    // List items
    p5Instance.textSize(14);
    this.recognizedElements.forEach((item, index) => {
      if (index > 8) return; // Show top 8 results
      
      const y = padding + 45 + index * itemHeight;
      const score = Math.round(item.score * 100);
      
      // Score bar background
      p5Instance.fill(155, 89, 182, 30);
      p5Instance.rect(
        p5Instance.width - panelWidth - padding + 15,
        y,
        panelWidth - 30,
        itemHeight - 8,
        5
      );
      
      // Score bar fill
      p5Instance.fill(155, 89, 182, 100);
      p5Instance.rect(
        p5Instance.width - panelWidth - padding + 15,
        y,
        (panelWidth - 30) * (score/100),
        itemHeight - 8,
        5
      );
      
      // Text
      p5Instance.fill(255);
      p5Instance.text(
        `${item.category}`,
        p5Instance.width - panelWidth - padding + 25,
        y + itemHeight/2 - 8
      );
      p5Instance.textAlign(p5Instance.RIGHT);
      p5Instance.text(
        `${score}%`,
        p5Instance.width - padding - 25,
        y + itemHeight/2 - 8
      );
      p5Instance.textAlign(p5Instance.LEFT);
    });
    
    p5Instance.pop();
  }

  toggle() {
    this.isProcessing = !this.isProcessing;
    this.updateStatus(
      this.isProcessing ? 'Art recognition active' : 'Art recognition paused',
      this.isProcessing ? 'active' : 'paused'
    );
  }
}
