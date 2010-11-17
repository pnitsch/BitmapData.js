/*
 * BitmapData.js by Peter Nitsch - https://github.com/pnitsch/BitmapData.js
 * HTML5 Canvas API implementation of the AS3 BitmapData class. 
 */

var BlendMode = new function() {
	this.ADD = "add";
	this.ALPHA = "alpha";
	this.DARKEN = "darken";
	this.DIFFERENCE = "difference";
	this.ERASE = "erase";
	this.HARDLIGHT = "hardlight";
	this.INVERT = "invert";
	this.LAYER = "layer";
	this.LIGHTEN = "lighten";
	this.MULTIPLY = "multiply";
	this.NORMAL = "normal";
	this.OVERLAY = "overlay";
	this.SCREEN = "screen";
	this.SHADER = "shader";
	this.SUBTRACT = "subtract";
};

var BitmapDataChannel = new function() {
	this.ALPHA = 8;
	this.BLUE = 4;
	this.GREEN = 2;
	this.RED = 1;
};

// RGB <-> Hex conversion
function hexToRGB (hex) { return { r: ((hex & 0xff0000) >> 16), g: ((hex & 0x00ff00) >> 8), b: ((hex & 0x0000ff)) }; };
function RGBToHex(rgb) { return rgb.r<<16 | rgb.g<<8 | rgb.b; };

// 256-value binary Vector struct
function histogramVector(n) { 
	var v=[]; 
	for (var i=0; i<256; i++) { v[i] = n; }
	return v
}

// Park-Miller-Carta Pseudo-Random Number Generator
function PRNG() {
	this.seed = 1;
	this.next = function() { return (this.gen() / 2147483647); };
	this.nextRange = function(min, max)	{ return min + ((max - min) * this.next()) };
	this.gen = function() { return this.seed = (this.seed * 16807) % 2147483647; };
};

function BitmapData(width, height, transparent, fillColor) {
	this.width = width;
	this.height = height;
	this.rect = new Rectangle(0, 0, this.width, this.height);
	this.transparent = transparent || false;
	
	this.drawingCanvas = document.createElement("canvas");
	this.drawingContext = this.drawingCanvas.getContext("2d");
	
	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.canvas.setAttribute('width', this.width);
	this.canvas.setAttribute('height', this.height);
	
	this.imagedata = this.context.createImageData(this.width, this.height);
	this.__defineGetter__("data", function() { return this.imagedata; });  	
	this.__defineSetter__("data", function(source) { this.imagedata = source; });
	
	this.rand;
	
	this.setPixel = function(x, y, color) {
		var rgb = hexToRGB(color);
		var pos = (x + y * this.width) * 4;

		this.imagedata.data[pos+0] = rgb.r;
		this.imagedata.data[pos+1] = rgb.g;
		this.imagedata.data[pos+2] = rgb.b;
		this.imagedata.data[pos+3] = 0xff;	
	};
	
	this.getPixel = function(x, y) {
		var pos = (x + y * this.width) * 4;
		var rgb = {
			r: this.imagedata.data[pos+0],
			g: this.imagedata.data[pos+1],
			b: this.imagedata.data[pos+2]
		};
		
		return RGBToHex(rgb);
	};
	
	this.clone = function() {
		this.context.putImageData(this.imagedata, 0, 0);
		
		var result = new BitmapData(this.width, this.height, this.transparent);
		result.data = this.context.getImageData(0, 0, this.width, this.height);
		return result;
	};
	
	this.compare = function(otherBitmapData) {
		if(this.width != otherBitmapData.width) return -3;
		if(this.height != otherBitmapData.height) return -4;
		if(this.data === otherBitmapData.data) return 0; 
		
		var otherRGB, thisRGB, dif;
		var result = new BitmapData(this.width, this.height);
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				otherRGB = hexToRGB( otherBitmapData.getPixel(x, y) );
				thisRGB = hexToRGB( this.getPixel(x, y) );
				
				dif = {
					r: Math.abs(otherRGB.r - thisRGB.r),
					g: Math.abs(otherRGB.g - thisRGB.g),
					b: Math.abs(otherRGB.b - thisRGB.b)
				};
				
				result.setPixel(x, y, RGBToHex(dif));
			}
		}
		
		return result;
	};
	
	this.copyCanvas = function(sourceCanvas, sourceRect, destPoint) {
		this.context.putImageData(this.imagedata, 0, 0);
		
		var bw = this.canvas.width - sourceRect.width - destPoint.x;
		var bh = this.canvas.height - sourceRect.height - destPoint.y

		var dw = (bw < 0) ? sourceRect.width + (this.canvas.width - sourceRect.width - destPoint.x) : sourceRect.width;
		var dh = (bh < 0) ? sourceRect.height + (this.canvas.height - sourceRect.height - destPoint.y) : sourceRect.height;
		
		this.context.drawImage(sourceCanvas, 
			sourceRect.x, sourceRect.y, dw, dh, 
			destPoint.x, destPoint.y, dw, dh);

		this.data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	};
	
	this.copyChannel = function(sourceBitmapData, sourceRect, destPoint, sourceChannel, destChannel) {
		var sourceColor, sourceRGB, rgb;
		
		for (var y=0; y<sourceRect.height; y++) {
			for (var x=0; x<sourceRect.width; x++) {
				sourceColor = sourceBitmapData.getPixel(sourceRect.x+x, sourceRect.y+y);
				sourceRGB = hexToRGB(sourceColor);
				switch(sourceChannel) {
					case BitmapDataChannel.RED: channelValue = sourceRGB.r; break;
					case BitmapDataChannel.GREEN: channelValue = sourceRGB.g; break;
					case BitmapDataChannel.BLUE: channelValue = sourceRGB.b; break;
				}
				
				rgb = hexToRGB( this.getPixel(destPoint.x+x, destPoint.y+y) ); // redundancy
				switch(destChannel){
					case BitmapDataChannel.RED: rgb.r = channelValue; break;
					case BitmapDataChannel.GREEN: rgb.g = channelValue; break;
					case BitmapDataChannel.BLUE: rgb.b = channelValue; break;
				}
				
				this.setPixel(destPoint.x+x, destPoint.y+y, RGBToHex(rgb));
			}
		}
	};
	
	this.copyPixels = function(sourceBitmapData, sourceRect, destPoint, alphaBitmapData, alphaPoint, mergeAlpha) {
		this.copyCanvas(sourceBitmapData.canvas, sourceRect, destPoint);
	};
	
	this.draw = function(source, matrix, colorTransform, blendMode, clipRect, smoothing) {

		/*
		 * currently only supports Image object
		 * TODO: implement instanceof switches
		 */
		
		sourceMatrix = matrix || new Matrix();
		sourceRect = clipRect || new Rectangle(0, 0, source.width, source.height);
		
		this.drawingCanvas.setAttribute('width', source.width);
		this.drawingCanvas.setAttribute('height', source.height);
		
		this.drawingContext.transform(
			sourceMatrix.a,
			sourceMatrix.b,
			sourceMatrix.c,
			sourceMatrix.d,
			sourceMatrix.tx,
			sourceMatrix.ty);
			
		this.drawingContext.drawImage(source, 
			0, 0, source.width, source.height, 
			0, 0, source.width, source.height);
		
		this.copyCanvas(this.drawingCanvas, sourceRect, new Point(sourceRect.x, sourceRect.y));
	}
	
	this.fillRect = function(rect, color) {
		this.context.putImageData(this.imagedata, 0, 0);
		var rgb = hexToRGB(color);

		this.context.fillStyle = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";  
		this.context.fillRect (rect.x, rect.y, rect.width, rect.height);
		this.data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	};
	
	this.floodFill = function(x, y, color) {
		var queue = new Array();
		queue.push(new Point(x, y));

		var old = this.getPixel(x, y);
		var iterations = 0;

		var searchBmp = new BitmapData(this.width, this.height, true, 0xffffff);
		var currPoint, newPoint;
	
		while (queue.length > 0) {
			currPoint = queue.shift();
			++iterations;

			if (currPoint.x < 0 || currPoint.x >= this.width) continue;
			if (currPoint.y < 0 || currPoint.y >= this.height) continue;

			searchBmp.setPixel(currPoint.x, currPoint.y, 0x00);

			if (this.getPixel(currPoint.x, currPoint.y) == old) {
				this.setPixel(currPoint.x, currPoint.y, color);

				if (searchBmp.getPixel(currPoint.x + 1, currPoint.y) == 0xffffff) {
					queue.push(new Point(currPoint.x + 1, currPoint.y));
				} 
				if (searchBmp.getPixel(currPoint.x, currPoint.y + 1) == 0xffffff) {
					queue.push(new Point(currPoint.x, currPoint.y + 1));
				} 
				if (searchBmp.getPixel(currPoint.x - 1, currPoint.y) == 0xffffff) {
					queue.push(new Point(currPoint.x - 1, currPoint.y));
				} 
				if (searchBmp.getPixel(currPoint.x, currPoint.y - 1) == 0xffffff) {
					queue.push(new Point(currPoint.x, currPoint.y - 1));
				}
			}
		}       

	};
	
	this.histogram = function(hRect) {
		hRect = hRect || this.rect;
		
		var rgb = { r: [], g: [], b: [] };
		var rv = histogramVector(0);
		var gv = histogramVector(0);
		var bv = histogramVector(0);
		
		var p = hRect.width*hRect.height;
		var itr = -1;
		var pos;
		var color = [];
		
		var bw = this.canvas.width - hRect.width - hRect.x;
		var bh = this.canvas.height - hRect.height - hRect.y
		var dw = (bw < 0) ? hRect.width + (this.canvas.width - hRect.width - hRect.x) : hRect.width;
		var dh = (bh < 0) ? hRect.height + (this.canvas.height - hRect.height - hRect.y) : hRect.height;
		
		for(var y=hRect.y; y<dh; y++) {
			for(var x=hRect.x; x<dw; x++) {
				pos = (x + y * this.width) * 4;
				color[itr++] = this.imagedata.data[pos+0];
				color[itr++] = this.imagedata.data[pos+1];
				color[itr++] = this.imagedata.data[pos+2];
			}
		}
		
		itr = 0;
		for(var i=0; i<p; i+=Math.floor(p/256)) {
			px = itr*3;
			rv[itr] = color[px+0];
			gv[itr] = color[px+1];
			bv[itr] = color[px+2];
			itr++;
		}
		
		rgb.r = rv;
		rgb.g = gv;
		rgb.b = bv;

		return rgb;
	};
				
	this.noise = function(randomSeed, low, high, channelOptions, grayScale) {
		this.rand = this.rand || new PRNG();
		this.rand.seed = randomSeed;
		
		low = low || 0;
		high = high || 255;
		channelOptions = channelOptions || 7;
		grayScale = grayScale || false;
		
		var pos, cr, cg, cb, gray;
		for (var y=0; y<this.height; y++) {
			for (var x=0; x<this.width; x++) {
				pos = (x + y * this.width) * 4;

				cr = this.rand.nextRange(low, high);
				cg = this.rand.nextRange(low, high);
				cb = this.rand.nextRange(low, high);
				
				if(grayScale) {
					gray = (cr + cg + cb) / 3;
					cr = cg = cb = gray;
				}
				
				this.imagedata.data[pos+0] = (channelOptions & BitmapDataChannel.RED) ? (1 * cr) : 0x00;
				this.imagedata.data[pos+1] = (channelOptions & BitmapDataChannel.GREEN) ? (1 * cg) : 0x00;
				this.imagedata.data[pos+2] = (channelOptions & BitmapDataChannel.BLUE) ? (1 * cb) : 0x00;
				this.imagedata.data[pos+3] = 0xff;
			}
		}	
	};
	
	
	this.simplexR;
	
	this.perlinNoise = function(baseX, baseY, randomSeed, channelOptions, grayScale) {
		this.rand = this.rand || new PRNG();
		this.rand.seed = randomSeed;
		
		channelOptions = channelOptions || 7;
		grayScale = grayScale || false;
		
		var numChannels = 0;
		if(channelOptions & BitmapDataChannel.RED){
			this.simplexR = this.simplexR || new SimplexNoise(this.rand);
			this.simplexR.setSeed(randomSeed);
			numChannels++;
		} 
		if(channelOptions & BitmapDataChannel.GREEN) {
			this.simplexG = this.simplexG || new SimplexNoise(this.rand);
			this.simplexG.setSeed(randomSeed+1);
			numChannels++;
		}
		if(channelOptions & BitmapDataChannel.BLUE) {
			this.simplexB = this.simplexB || new SimplexNoise(this.rand);
			this.simplexB.setSeed(randomSeed+2);
			numChannels++;
		}
		
		var pos, cr, cg, cb;
		for(var y=0; y<this.height; y++) {
			for(var x=0; x<this.width; x++) {
				pos = (x + y * this.width) * 4;
				
				cr = (channelOptions & BitmapDataChannel.RED) ? parseInt(((this.simplexR.noise(x/baseX, y/baseY)+1)*0.5)*255) : 0x00;
				cg = (channelOptions & BitmapDataChannel.GREEN) ? parseInt(((this.simplexG.noise(x/baseX, y/baseY)+1)*0.5)*255) : 0x00;
				cb = (channelOptions & BitmapDataChannel.BLUE) ? parseInt(((this.simplexB.noise(x/baseX, y/baseY)+1)*0.5)*255) : 0x00;

				if(grayScale) {
					gray = (cr + cg + cb) / numChannels;
					cr = cg = cb = gray;
				}
				
				this.imagedata.data[pos+0] = cr;
				this.imagedata.data[pos+1] = cg;
				this.imagedata.data[pos+2] = cb;
				this.imagedata.data[pos+3] = 0xff;
			}
		}
	};
	
	if(fillColor) this.fillRect(this.rect, fillColor);
	return this;
};

