/*
 * BitmapData.js by Peter Nitsch
 * HTML5 Canvas API implementation of Flash BitmapData class
 */

var BitmapDataChannel = new function() {
	this.ALPHA = 24;
	this.BLUE = 1;
	this.GREEN = 8;
	this.RED = 16;
};

function BitmapData (width, height, transparent, fillColor) {
	this.width = width;
	this.height = height;
	this.rect = new Rectangle(0, 0, this.width, this.height);
	this.transparent = transparent || false;
	
	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	
	this.imagedata = this.context.createImageData(this.width, this.height);
	this.__defineGetter__("data", function() { return this.imagedata; });  	
	this.__defineSetter__("data", function(source) { this.imagedata = source; });
	
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
		var bmd = new BitmapData(this.width, this.height, this.transparent, 0xffffff);
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
	
	this.draw = function(source) {
		console.log(source);
		if(source instanceof Image) {
			console.log("hit");
			this.canvas.width = source.width;
			this.canvas.height = source.height;
			
			this.context.drawImage(source, 0, 0, source.width, source.height);
			
			var sourceBitmapData = new BitmapData(source.width, source.height);
			sourceBitmapData.data = this.context.getImageData(0, 0, source.width, source.height);
			this.copyPixels(sourceBitmapData, sourceBitmapData.rect, new Point());
			
		} else if(source instanceof BitmapData) {
			
			sourceBitmapData.data = this.context.getImageData(0, 0, source.width, source.height);
			this.copyPixels(sourceBitmapData, sourceBitmapData.rect, new Point());
		
		}		
	}
	
	this.fillRect = function(rect, color) {
		for (y = rect.y; y < rect.y+rect.height; y++) {
			for (x = rect.x; x < rect.x+rect.width; x++) {
				this.setPixel(x, y, color);
			}
		}	
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
	
	if(fillColor) this.fillRect(this.rect, fillColor);
	return this;
};

