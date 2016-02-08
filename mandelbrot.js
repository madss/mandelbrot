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
    this.reCenter = -0.5;
    this.imCenter = 0.0;
    this.scale = 1;
    // FIXME: Fit inside re [-2, 1], im [-1, 1] while keeping aspect ratio
    this.reSize = 3;
    this.imSize = 2;
  };

  Mandelbrot.prototype.zoom = function(x, y, factor) {
    var reSize = this.reSize*this.scale;
    var imSize = this.imSize*this.scale;
    this.reCenter = this.reCenter - reSize/2 + (x/this.width)*reSize;
    this.imCenter = this.imCenter - imSize/2 + (y/this.height)*imSize;
    this.scale = this.scale/factor;
  };

  Mandelbrot.prototype.escape = function(x, y) {
    var re, im, q, i, x, y, xtmp, ytmp, logZn, nu;

    // FIXME: Doesn't belong here
    // Calculate the model size of the new area to draw
    var reSize = this.reSize*this.scale;
    var imSize = this.imSize*this.scale;

    // Find the point of interest
    re = this.reCenter - reSize/2 + (x/this.width)*reSize;
    im = this.imCenter - imSize/2 + (y/this.height)*imSize;

    // Skip if inside the cardioid
    q = (re - 0.25)*(re - 0.25) + im*im;
    if ((q*(q + (re - 0.25))) < 0.25*im*im) {
      return this.max;
    }

    // Skip if inside the period-2 bulb
    if ((re + 1)*(re + 1) + im*im < 1/16) {
      return this.max;
    }

    // Do the actual escape calculation
    i = 0;
    x = y = 0;
    while (x*x + y*y <= 256 && i < this.max) {
      xtmp = x*x - y*y + re;
      ytmp = 2*x*y + im;
      // Abort if nothing changes
      if (x === xtmp && y === ytmp) {
        return this.max;
      }
      x = xtmp;
      y = ytmp;
      i++;
    }

    // Smoothen the result
    if (i < this.max) {
      logZn = Math.log(x*x + y*y)/2;
      nu = Math.log(logZn/Math.LN2)/Math.LN2;
      i = i + 1 - nu;
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

  function measure(f) {
    var start, end;
    start = performance.now();
    f();
    end = performance.now();
    return end - start;
  }

  var GradientPalette = function(max, from, to) {
    this.max = max;
    this.from = from;
    this.to = to;
  };

  GradientPalette.prototype.value = function(i, c) {
    return Math.floor(255*((i/this.max)*(this.to[c] - this.from[c]) + this.from[c]));
  }

  GradientPalette.prototype.r = function(i) { return this.value(i, 'r'); };
  GradientPalette.prototype.g = function(i) { return this.value(i, 'g'); };
  GradientPalette.prototype.b = function(i) { return this.value(i, 'b'); };

  var max = 500;
  var canvas = document.querySelector('canvas');
  var mandelbrotCanvas = new MandelbrotCanvas(canvas, window.innerWidth, window.innerHeight);
  var mandelbrot = new Mandelbrot(mandelbrotCanvas.width, mandelbrotCanvas.height, max);
  var palette = [
    { r: 255, g:   0, b:   0 },
    { r:   0, g: 255, b:   0 },
    { r:   0, g:   0, b: 255 },
  ];
  var render = function() {
    mandelbrot.render(function(x, y, i) {
      if (i < max) {
        var n = Math.floor(i);
        var f = i%1;
        var color1 = palette[n%palette.length];
        var color2 = palette[(n + 1)%palette.length];
        var r = Math.floor(color1.r - f*(color1.r - color2.r));
        var g = Math.floor(color1.g - f*(color1.g - color2.g));
        var b = Math.floor(color1.b - f*(color1.b - color2.b));
        mandelbrotCanvas.putPixelRGB(x, y, r, g, b);
      } else {
        mandelbrotCanvas.putPixelRGB(x, y, 0, 0, 0);
      }
    });
    mandelbrotCanvas.draw();
  };

  canvas.addEventListener('click', function(e) {
    var x = e.pageX - canvas.offsetLeft;
    var y = e.pageY - canvas.offsetTop;
    var zoom = e.shiftKey ? 1.1 : 5.0;
    if (e.ctrlKey) {
      zoom = 1.0/zoom;
    }
    mandelbrot.zoom(x, y, zoom);
    console.log('Location:', mandelbrot.reCenter, mandelbrot.imCenter, mandelbrot.scale);
    render();
  });

  var time = measure(render);
  console.log('Initial render took', time/1000, 'ms');
});
