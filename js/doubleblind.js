
///////////////////  Unit  /////////////
const Offmap = -1
const AllFactions = -2
var AllUnits = []
var Faction = [ "Union", "Confederates" ]

function Unit(name,description,mapX,mapY,faction) {
  this.name = name;
  this.mapX = mapX;
  this.mapY = mapY;
  this.description = description;
  this.faction = faction;
  AllUnits.push( this )
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

var selectedUnit = undefined  // better in UIControl?
var testUnit = new Unit('Archer','Cmd 8',5,3,1)
var testUnit2 = new Unit('Iron Brigade','Cmd 7',5,5,0)


///////////////////  Map  /////////////
// Does NOT have x/y positions - unit values
// are important. The Map is rerendered every select/move.

function Map(width,height) {
  this.showFaction = 1
  this.width = width
  this.height = height
  this.svg = document.getElementById('SVGMap')
  this.ns = 'http://www.w3.org/2000/svg'
  this.selectPositionMode = false
  this.visibleSet = [ new Set(), new Set()]
  this.revealedPosition = new Set()
  return this;
}
Map.prototype.draw = function() {
  while (this.svg.lastChild) {
    this.svg.removeChild(this.svg.lastChild);
  }
  this.calculateVisibility()
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  for (var x = 0, lx = this.width; x < lx; x++)
	  {
		this.drawRect(x,y);
	  }
  }
};
Map.prototype.posAsString = function(mapX,mapY) {
	return mapX+","+mapY
};
Map.prototype.calculateVisibility = function() {
	this.revealedPosition.clear()
	// calculate for all factions
	for(var faction = 0; faction < Faction.length; faction++)
	{
		this.visibleSet[faction].clear()
		for (var i = 0, li = AllUnits.length; i < li; i++)
		{
			if(AllUnits[i].faction == faction)
			{
				// add all adjacent positions as strings to the
				// visibility map
				for (var x = -1; x <= 1; x++)
				{
					for (var y = -1; y <= 1; y++)
					{
					  this.visibleSet[faction].add( this.posAsString(
						AllUnits[i].mapX+x,
						AllUnits[i].mapY+y ) )
					}
				}
			}
		}
		// mark enemy positions that are visible
		for (var i = 0, li = AllUnits.length; i < li; i++)
		{
			if(AllUnits[i].faction != faction
			   && this.visibleSet[faction].has(
			   this.posAsString(AllUnits[i].mapX,AllUnits[i].mapY) ) )
			{
			  this.revealedPosition.add( this.posAsString(
				AllUnits[i].mapX,AllUnits[i].mapY) )
			}
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
	     AllUnits[i].mapY == yMapPos &&
		 (AllUnits[i].faction == this.showFaction
		 || this.showFaction == AllFactions
		 || this.visibleSet[this.showFaction].has(this.posAsString(xMapPos,yMapPos) ) ) )
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
  isSelected)
 {
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
  if(this.selectPositionMode)
  {
	  UIController.addUnitAtPosition(xMapPos,yMapPos)
	  return;
  }
  if(selectedUnit != undefined) // move a unit that was selected
  {
	 if(selectedUnit.IsInMovementRange(xMapPos,yMapPos))
	 {
		 selectedUnit.MoveTo(xMapPos,yMapPos)
	 }
    selectedUnit = undefined	
  }
  else // remove selection and select unit on this position
  {
	  selectedUnit = undefined
	  var units = this.getUnitsAtPosition(xMapPos,yMapPos);
	  for (var i = 0, li = units.length; i < li; i++)
	  {
		  selectedUnit = units[i]
	  }
  }
  this.draw()
};
Map.prototype.isPositionRevealed = function(xMapPos,yMapPos) {
	return this.revealedPosition.has(this.posAsString(xMapPos,yMapPos))
};
Map.prototype.drawRect = function(xMapPos,yMapPos) {
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',xMapPos*10+1)
	rect.setAttributeNS(null, 'y',yMapPos*10+1)
	rect.setAttributeNS(null, 'width', 8)
	rect.setAttributeNS(null, 'height',8)
	if(selectedUnit && Math.abs(xMapPos-selectedUnit.mapX) <= 1
	  && Math.abs(yMapPos-selectedUnit.mapY) <= 1)
	  rect.setAttributeNS(null, 'fill', '#A1A1A1')
	else if(this.isPositionRevealed(xMapPos,yMapPos))
	{
	  rect.setAttributeNS(null, 'fill', '#FFF')
	  rect.setAttributeNS(null, 'stroke','black')
	  rect.setAttributeNS(null, 'stroke-width','0.1')
	}
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
	mainMenu : document.getElementById('MainMenu'),
	basicHelp : document.getElementById('BasicHelp'),
	editView : document.getElementById('EditView'),
	editWarning : document.getElementById('EditWarning'),
	addUnitView : document.getElementById('AddUnitView'),
	unitListTemplate : document.querySelector('#UnitListTemplate'),
	unitListTable : document.querySelector('#UnitListTable'),
	unitNameInput : document.querySelector('#NewUnitName'),
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
		this.editWarning.style.display = "none"
	},
	showMap: function(faction)
	{
		map.showFaction = faction
		map.draw()
		this.hideEverything()
		this.mapView.style.display = "block"
	},
	showEdit: function()
	{
		this.hideEverything()
		this.updateUnitList()
		this.editView.style.display = "block"
	},
	showEditWarning: function()
	{
		this.hideEverything()
		this.editWarning.style.display = "block"
	},
	showAddUnit: function()
	{
		this.hideEverything()
		this.addUnitView.style.display = "block"
	},
	addUnit: function()
	{
		this.hideEverything()
		map.selectPositionMode = true
		this.showMap(AllFactions)
	},
	addUnitAtPosition: function(mapX,mapY)
	{
		map.selectPositionMode = false
		new Unit(this.unitNameInput.value,'Add',mapX,mapY,1)
		map.draw()
		this.showEdit()
	},
	updateUnitList: function()
	{
		var new_tbody = document.createElement('tbody')
		for (var i = 0, li = AllUnits.length; i < li; i++)
        {
			var clone = this.unitListTemplate.content.cloneNode(true);
			var td = clone.querySelectorAll("td");
			td[0].textContent = AllUnits[i].name
			td[1].textContent = AllUnits[i].description
			new_tbody.appendChild(clone)
        }
		this.unitListTable.parentNode.replaceChild(
		  new_tbody, this.unitListTable)
		this.unitListTable = new_tbody
	},
}
UIController.showMap(1)