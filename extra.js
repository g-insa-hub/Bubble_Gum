
p5.Texture.prototype._getTextureDataFromSource = function() {
  let textureData;
  if (this.isFramebufferTexture) {
    textureData = this.src.rawTexture();
  } else if (this.isSrcP5Image) {
  // param is a p5.Image
    textureData = this.src.canvas;
  } else if (
    this.isSrcMediaElement ||
    this.isSrcP5Graphics ||
    this.isSrcP5Renderer ||
    this.isSrcHTMLElement
  ) {
  // if param is a video HTML element
    // ============================================================================
    // UPDATED:
    if (this.src._ensureCanvas) {
      this.src._ensureCanvas()
    }
    textureData = this.src.canvas || this.src.elt;
    // End update
    // ============================================================================
  } else if (this.isImageData) {
    textureData = this.src;
  }
  return textureData;
}