# Interactive Art Generator

An interactive web-based art generator that combines real-time image processing, object detection, and art recognition using p5.js and modern web technologies.

## Features

- Real-time image processing and effects
- Object detection using computer vision
- Art recognition capabilities
- Interactive point-based animations
- Multiple input sources (camera, image upload)
- Configurable visual effects
- Toggleable animation and mouse interaction

## Tech Stack

- **Frontend**: p5.js, HTML5 Canvas
- **UI Components**: shadcn/ui
- **Core Libraries**: TensorFlow.js (for object detection and art recognition)

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/orkhanart/experiments.git
cd experiments
```

2. Install dependencies:
```bash
npm install
```

### Running the Project

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:8080`

## Project Structure

- `/js/` - Main JavaScript source files
  - `app.js` - Main application class
  - `objectDetection.js` - Object detection functionality
  - `artRecognition.js` - Art recognition implementation
  - `points.js` - Point-based animation management
  - `imageEffects.js` - Visual effects implementation
  - `config.js` - Application configuration

- `/node_modules/` - Project dependencies
- `index.html` - Main entry point
- `sketch.js` - p5.js sketch initialization
- `styles.css` - Custom styling
- `package.json` - Project configuration and dependencies

## Usage

1. **Image Upload**: Drag and drop images or use the file picker
2. **Camera Input**: Toggle camera input for real-time processing
3. **Effects**: Apply various visual effects to your input
4. **Object Detection**: Toggle object detection to highlight recognized objects
5. **Art Recognition**: Enable art recognition to analyze your input
6. **Animation**: Toggle animations and mouse interactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- p5.js for the creative coding framework
- TensorFlow.js for machine learning capabilities
- shadcn/ui for modern UI components
