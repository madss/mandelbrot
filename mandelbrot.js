document.addEventListener('DOMContentLoaded', function() {

  var MandelbrotCanvas = function(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.resize(width, height);
  };

  MandelbrotCanvas.prototype.resize = function(width, height) {
    this.width = width;
    this.height = height;
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
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.max = max;

    this.scale = 1;
    this.centerX = -0.75;
    this.centerY = 0.0;
    this.initialWidth = 2.6;
    this.initialHeight = 2.4;

    var canvasRatio = this.canvasWidth/this.canvasHeight;
    var ratio = this.initialWidth/this.initialHeight;
    if (canvasRatio < ratio) {
      this.initialHeight += this.initialHeight*(1/canvasRatio - 1/ratio);
    } else {
      this.initialWidth += this.initialWidth*(canvasRatio - ratio);
    }
    this.width = this.initialWidth;
    this.height = this.initialHeight;
  };

  Mandelbrot.prototype.zoom = function(canvasX, canvasY, factor) {
    this.centerX += -0.5*this.width + (canvasX/this.canvasWidth)*this.width;
    this.centerY += -0.5*this.height + (canvasY/this.canvasHeight)*this.height;
    this.scale /= factor;
    this.width = this.initialWidth*this.scale;
    this.height = this.initialHeight*this.scale;
  };

  Mandelbrot.prototype.escape = function(canvasX, canvasY) {
    var x0, y0, q, i, x, y, xtmp, ytmp, logZn, nu;

    // Find the point of interest
    x0 = this.centerX - 0.5*this.width + (canvasX/this.canvasWidth)*this.width;
    y0 = this.centerY - 0.5*this.height + (canvasY/this.canvasHeight)*this.height;

    // Skip if inside the cardioid
    q = (x0 - 0.25)*(x0 - 0.25) + y0*y0;
    if ((q*(q + (x0 - 0.25))) < 0.25*y0*y0) {
      return this.max;
    }

    // Skip if inside the period-2 bulb
    if ((x0 + 1)*(x0 + 1) + y0*y0 < 1/16) {
      return this.max;
    }

    // Do the actual escape calculation
    i = 0;
    x = y = 0;
    while (x*x + y*y <= 256 && i < this.max) {
      xtmp = x*x - y*y + x0;
      ytmp = 2*x*y + y0;

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
    var canvasX, canvasY;
    for (canvasY = 0; canvasY < this.canvasHeight; canvasY++) {
      for (canvasX = 0; canvasX < this.canvasWidth; canvasX++) {
        draw(canvasX, canvasY, this.escape(canvasX, canvasY));
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

  var randomPalette = function(max) {
    var p, n, i;
    p = [];
    n = Math.floor(max*Math.random());
    for (i = 0; i < n; i++) {
      p.push({
        r: Math.floor(255*Math.random()),
        g: Math.floor(255*Math.random()),
        b: Math.floor(255*Math.random())
      });
    }
    return p;
  };

  var max = 500;
  var canvas = document.querySelector('canvas');
  var mandelbrotCanvas = new MandelbrotCanvas(
    canvas,
    window.innerWidth,
    window.innerHeight
  );
  var mandelbrot = new Mandelbrot(
    mandelbrotCanvas.width,
    mandelbrotCanvas.height,
    max
  );
  var palette = randomPalette(max);
  var render = function() {
    mandelbrot.render(function(canvasX, canvasY, i) {
      var r = 0, g = 0, b = 0;
      if (i < max) {
        var n = Math.floor(i);
        var f = i%1;
        var color1 = palette[n%palette.length];
        var color2 = palette[(n + 1)%palette.length];
        r = Math.floor(color1.r - f*(color1.r - color2.r));
        g = Math.floor(color1.g - f*(color1.g - color2.g));
        b = Math.floor(color1.b - f*(color1.b - color2.b));
      }
      mandelbrotCanvas.putPixelRGB(canvasX, canvasY, r, g, b);
    });
    mandelbrotCanvas.draw();
  };

  canvas.addEventListener('click', function(e) {
    var canvasX = e.pageX - canvas.offsetLeft;
    var canvasY = e.pageY - canvas.offsetTop;
    var zoom = e.shiftKey ? 1.1 : 5.0;
    if (e.ctrlKey) {
      zoom = 1.0/zoom;
    }
    mandelbrot.zoom(canvasX, canvasY, zoom);
    console.log('Location:', mandelbrot.centerX, mandelbrot.centerY, mandelbrot.scale);
    render();
  });

  var time = measure(render);
  console.log('Initial render took', time/1000, 'ms');
});
