
function Unit(name,mapX,mapY) {
  this.name = name;
  this.mapX = mapX;
  this.mapY = mapY;
  return this;
}
Unit.prototype.MoveTo = function(xMapPos,yMapPos) {
  this.mapX = xMapPos;
  this.mapY = yMapPos;
}
Unit.prototype.IsInMovementRange = function(xMapPos,yMapPos) {
	if(Math.abs(xMapPos-this.mapX) <= 1
	  && Math.abs(yMapPos-this.mapY) <= 1)
	  return true;
	else
	  return false;
}

var testUnit = new Unit('Archer',2,0)
var selectedUnit = undefined
var AllUnits = []
AllUnits.push( testUnit )

function Map(width,height) {
  this.width = width;
  this.height = height;
  this.svg = document.getElementById('SVGMap');
  this.ns = 'http://www.w3.org/2000/svg'
  return this;
}
Map.prototype.draw = function() {
  while (this.svg.lastChild) {
    this.svg.removeChild(this.svg.lastChild);
  }
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  for (var x = 0, lx = this.width; x < lx; x++)
	  {
		this.drawRect(x,y);
	  }
  }
};
Map.prototype.getUnitsAtPosition = function(xMapPos,yMapPos) {
  var UnitsAtPosition = [];
  for (var i = 0, li = AllUnits.length; i < li; i++)
  {
	  if(AllUnits[i].mapX == xMapPos &&
	     AllUnits[i].mapY == yMapPos)
	  {
		  UnitsAtPosition.push(AllUnits[i]);
	  }
  }
  return UnitsAtPosition;
}
Map.prototype.drawUnitsAtRect = function(xMapPos,yMapPos) {
  //var UnitsAtPosition = [];
  for (var i = 0, li = AllUnits.length; i < li; i++)
  {
	  if(AllUnits[i].mapX == xMapPos &&
	     AllUnits[i].mapY == yMapPos)
	  {
		  //UnitsAtPosition.push(AllUnits[i]);
		  if(AllUnits[i] == selectedUnit)
		  {
			this.drawText(xMapPos,yMapPos,AllUnits[i].name,true);
		  }
		  else
		  {
		    this.drawText(xMapPos,yMapPos,AllUnits[i].name,false);
		  }
	  }
  }
}
Map.prototype.drawText = function(xMapPos,yMapPos,textToShow,
  isSelected) {
	var text = document.createElementNS(this.ns, 'text')
	text.setAttributeNS(null, 'x',xMapPos*10+5)
	text.setAttributeNS(null, 'y',yMapPos*10+5)
	//text.setAttributeNS(null, 'width', 8)
	//text.setAttributeNS(null, 'height',8)
	text.setAttributeNS(null, 'fill', '#000')
	text.setAttributeNS(null, 'font-size', '2')
	if(isSelected)
	{
	  text.setAttributeNS(null, 'font-weight', 'bold')	
	}
	text.setAttributeNS(null, 'dominant-baseline', 'middle')
	text.setAttributeNS(null, 'text-anchor', 'middle')
	text.setAttributeNS(null, 'onclick', "map.PositionClicked("
	  +xMapPos+","+yMapPos+")")
	text.textContent = textToShow;
	this.svg.appendChild(text)
};
Map.prototype.PositionClicked = function(xMapPos,yMapPos) {
  if(selectedUnit != undefined) // move a unit that was selected
  {
	 if(selectedUnit.IsInMovementRange(xMapPos,yMapPos))
	 {
		 selectedUnit.MoveTo(xMapPos,yMapPos)
	 }
    selectedUnit = undefined	
  }
  else // remove selection and select unit on position
  {
	  selectedUnit = undefined
	  var units = this.getUnitsAtPosition(xMapPos,yMapPos);
	  for (var i = 0, li = units.length; i < li; i++)
	  {
		  selectedUnit = units[i]
	  }
  }
  this.draw()
}
Map.prototype.drawRect = function(xMapPos,yMapPos) {
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',xMapPos*10+1)
	rect.setAttributeNS(null, 'y',yMapPos*10+1)
	rect.setAttributeNS(null, 'width', 8)
	rect.setAttributeNS(null, 'height',8)
	if(selectedUnit && Math.abs(xMapPos-selectedUnit.mapX) <= 1
	  && Math.abs(yMapPos-selectedUnit.mapY) <= 1)
	  rect.setAttributeNS(null, 'fill', '#A1A1A1')
	else
	  rect.setAttributeNS(null, 'fill', '#E1E1E1')
	rect.setAttributeNS(null, 'onclick', "map.PositionClicked("
	  +xMapPos+","+yMapPos+")")
	this.svg.appendChild(rect)
	
	this.drawUnitsAtRect(xMapPos,yMapPos)
};

var map = new Map(12,8)
map.draw()

///////////////////  UI Controller  /////////////
var UIController = {
	mapView : document.getElementById('MapView'),
	mainMenu : document.getElementById('mainMenu'),
	basicHelp : document.getElementById('BasicHelp'),
	editView : document.getElementById('EditView'),
	addUnitView : document.getElementById('AddUnitView'),
	firstStart : true,
	showMainMenu:function()
	{
		this.hideEverything()
		this.mainMenu.style.display = "block"
	},
	hideEverything:function()
	{
		if(this.firstStart == true)
		  this.firstStart = false
		else
		{
			this.basicHelp.style.display = "none"
			this.mapView.style.display = "none"
		}
		this.addUnitView.style.display = "none"
		this.mainMenu.style.display = "none"
		this.editView.style.display = "none"
	},
	showMap: function()
	{
		this.hideEverything()
		this.mapView.style.display = "block"
	},
	showEdit: function()
	{
		this.hideEverything()
		this.editView.style.display = "block"
	},
	showAddUnit: function()
	{
		this.hideEverything()
		this.addUnitView.style.display = "block"
	},
}
UIController.showMap()