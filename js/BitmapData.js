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
	
	this.r = new PRNG();
	
	this.hexToRGB = function(hex) {
		var rgb = {
			r: ((hex & 0xff0000) >> 16),
			g: ((hex & 0x00ff00) >> 8),
			b: ((hex & 0x0000ff))
		};

		return rgb;
	}
	
	this.RGBToHex = function(rgb) {
		return rgb.r<<16 | rgb.g<<8 | rgb.b;
	}
	
	this.setPixel = function(x, y, color) {
		rgb = this.hexToRGB(color);
		pos = (x + y * this.width) * 4;

		this.imagedata.data[pos+0] = rgb.r;
		this.imagedata.data[pos+1] = rgb.g;
		this.imagedata.data[pos+2] = rgb.b;
		this.imagedata.data[pos+3] = 0xff;	
	}
	
	this.getPixel = function(x, y) {
		pos = (x + y * this.width) * 4;
		var rgb = {
			r: this.imagedata.data[pos+0],
			g: this.imagedata.data[pos+1],
			b: this.imagedata.data[pos+2]
		};
		
		return this.RGBToHex(rgb);
	}
	
	this.clone = function() {
		this.context.putImageData(this.imagedata, 0, 0);
		var bmd = new BitmapData(this.width, this.height, this.transparent);
		bmd.data = this.context.getImageData(0, 0, this.width, this.height);
		return bmd;
	}
	
	this.copyChannel = function(sourceBitmapData, sourceRect, destPoint, sourceChannel, destChannel) {
		for (y = 0; y < sourceRect.height; y++) {
			for (x = 0; x < sourceRect.width; x++) {
				sourceColor = sourceBitmapData.getPixel(sourceRect.x+x, sourceRect.y+y);
				channelValue = sourceColor >> sourceChannel;
				rgb = this.hexToRGB( this.getPixel(destPoint.x+x, destPoint.y+y) ); // redundancy
				
				switch(destChannel){
					case BitmapDataChannel.RED: rgb.r = channelValue; break;
					case BitmapDataChannel.GREEN: rgb.g = channelValue; break;
					case BitmapDataChannel.BLUE: rgb.b = channelValue; break;
				}
				
				this.setPixel(destPoint.x+x, destPoint.y+y, this.RGBToHex(rgb));
			}
		}
	}
	
	this.copyPixels = function(sourceBitmapData, sourceRect, destPoint, alphaBitmapData, alphaPoint, mergeAlpha) {
		for (y = 0; y < sourceRect.height; y++) {
			for (x = 0; x < sourceRect.width; x++) {
				this.setPixel(destPoint.x+x, destPoint.y+y, sourceBitmapData.getPixel(sourceRect.x+x, sourceRect.y+y));
			}
		}
	}
		
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

		bw = this.canvas.width - sourceRect.width - sourceRect.x;
		bh = this.canvas.height - sourceRect.height - sourceRect.y

		dw = (bw < 0) ? sourceRect.width + (this.canvas.width - sourceRect.width - sourceRect.x) : sourceRect.width;
		dh = (bh < 0) ? sourceRect.height + (this.canvas.height - sourceRect.height - sourceRect.y) : sourceRect.height;
	
		this.context.putImageData(this.imagedata, 0, 0);
		this.context.drawImage(this.drawingCanvas, 
			sourceRect.x, sourceRect.y, dw, dh, 
			sourceRect.x, sourceRect.y, dw, dh);

		this.data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
	
	this.fillRect = function(rect, color) {
		this.context.putImageData(this.imagedata, 0, 0);
		rgb = this.hexToRGB(color);

		this.context.fillStyle = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";  
		this.context.fillRect (rect.x, rect.y, rect.width, rect.height);
		this.data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
	
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

	}
	
	this.noise = function(randomSeed, low, high, channelOptions, grayScale) {
		this.r.seed = randomSeed;
		
		low = low || 0;
		high = high || 255;
		channelOptions = channelOptions || 7;
		grayScale = grayScale || false;
		
		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {
				pos = (x + y * this.width) * 4;

				cr = this.r.nextRange(low, high);
				cg = this.r.nextRange(low, high);
				cb = this.r.nextRange(low, high);
				
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
		
		this.context.putImageData(this.imagedata, 0, 0);
    }
	
	if(fillColor) this.fillRect(this.rect, fillColor);
	return this;
};

