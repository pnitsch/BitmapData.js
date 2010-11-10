/*
 * BitmapData.js by Peter Nitsch
 * HTML5 Canvas API implementation of Flash BitmapData class
 */

function BitmapData (width, height, transparent, fillColor) {
	this.width = width;
	this.height = height;
	this.rect = new Rectangle(0, 0, this.width, this.height);
	this.transparent = transparent;
	
	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	
	this.imagedata = this.context.createImageData(this.width, this.height);
	this.__defineGetter__("data", function() { 
		return this.imagedata; });  	
	
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
	
	this.clone = function() {
		this.context.putImageData(this.imagedata, 0, 0);
		var bmd = new BitmapData(this.width, this.height, this.transparent, 0);
		bmd.imagedata = this.context.getImageData(0, 0, this.width, this.height);
		return bmd;
	}
	
	this.fillRect = function(rect, color) {
		rgb = this.hexToRGB(color);

		for (y = rect.y; y < rect.y+rect.height; y++) {
			for (x = rect.x; x < rect.x+rect.width; x++) {
				pos = (y*this.width+x)*4;
				this.imagedata.data[pos+0] = rgb.r;
				this.imagedata.data[pos+1] = rgb.g;
				this.imagedata.data[pos+2] = rgb.b;
				this.imagedata.data[pos+3] = 0xff; // alpha
			}
		}	
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
		
	this.fillRect(this.rect, fillColor);
	return this;
};

function Rectangle (x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.topLeft;
	
	return this;
}

function Point (x, y) {
	this.x = x;
	this.y = y;
	this.length = Math.sqrt(x*x + y*y);
	
	this.clone = function() {
		return new Point(this.x, this.y);
	}
	
	return this;
}