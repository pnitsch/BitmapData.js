function Point (x, y) {
	this.x = x;
	this.y = y;
	this.length = Math.sqrt(x*x + y*y);
	
	this.clone = function() {
		return new Point(this.x, this.y);
	}
	
	return this;
}