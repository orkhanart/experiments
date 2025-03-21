export class ImageEffects {
  constructor() {
    this.currentEffect = 'none';
  }

  apply(source) {
    switch(this.currentEffect) {
      case 'invert':
        source.filter(INVERT);
        break;
      case 'threshold':
        source.filter(THRESHOLD);
        break;
      case 'posterize':
        source.filter(POSTERIZE, 4);
        break;
      default:
        // No effect
        break;
    }
  }

  setEffect(effect) {
    this.currentEffect = effect;
  }
}
