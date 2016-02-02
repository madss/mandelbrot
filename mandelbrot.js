document.addEventListener('DOMContentLoaded', function() {

  var MandelbrotCanvas = function(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
  };

  MandelbrotCanvas.prototype.putPixelRGB = function(x, y, r, g, b) {
    var index = (x + y*this.width)*4;
    this.imageData.data[index + 0] = r;
    this.imageData.data[index + 1] = g;
    this.imageData.data[index + 2] = b;
    this.imageData.data[index + 3] = 255;
  };

  MandelbrotCanvas.prototype.draw = function() {
    this.ctx.putImageData(this.imageData, 0, 0);
  };


  var Mandelbrot = function(width, height, max) {
    this.width = width;
    this.height = height;
    this.max = max;
    // FIXME: Fit inside re [-2, 1], im [-1, 1]
    this.imMin = -1;
    this.imMax = 1;
    this.reMin = -2;
    this.reMax = this.width*((this.imMax - this.imMin)/this.height) + this.reMin;
  };

  Mandelbrot.prototype.escape = function(x, y) {
    var re, im, x, y, i, tmp;
    re = (x/this.width)*(this.reMax - this.reMin) + this.reMin;
    im = (y/this.height)*(this.imMax - this.imMin) + this.imMin;
    x = y = 0;
    i = 0;
    while (x*x + y*y <= 4 && i < this.max) {
      tmp = x*x - y*y + re;
      y = 2*x*y + im;
      x = tmp;
      i++;
    }
    return i;
  };

  Mandelbrot.prototype.render = function(draw) {
    var x, y;
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        draw(x, y, this.escape(x, y));
      }
    }
  };

  var canvas = document.querySelector('canvas');
  var mandelbrotCanvas = new MandelbrotCanvas(canvas, window.innerWidth, window.innerHeight);
  var mandelbrot = new Mandelbrot(mandelbrotCanvas.width, mandelbrotCanvas.height, 500);
  var render = function() {
    mandelbrot.render(function(x, y, i) {
      mandelbrotCanvas.putPixelRGB(
        x, y,
        Math.floor((i/mandelbrot.max)*255),
        Math.floor((i/mandelbrot.max)*255),
        Math.floor((i/mandelbrot.max)*255)
      );
    });
    mandelbrotCanvas.draw();
  };
  render();
});
