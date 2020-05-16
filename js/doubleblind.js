
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
  this.hasMoved = false;
  AllUnits.push( this )
  return this;
}

Unit.prototype.MoveTo = function(xMapPos,yMapPos) {
  if(this.hasMoved == false)
  {
	  this.mapX = xMapPos;
	  this.mapY = yMapPos;
	  this.hasMoved = true;
  }
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
// Does NOT have x/y positions - unit position values
// are important. The Map is rerendered every selection/move.

const CELL_WIDTH = 10

function Map(width,height) {
  this.showFaction = 1
  this.width = width
  this.height = height
  this.svg = document.getElementById('SVGMap')
  this.ns = 'http://www.w3.org/2000/svg'
  // used to place new units in edit mode
  this.selectPositionMode = false
  // each faction has its own visibility
  this.visibleSet = [ new Set(), new Set()]
  // visible positions to both => put on table
  this.revealedPosition = new Set()
  return this;
}
Map.prototype.draw = function() {
  // delete old map
  while (this.svg.lastChild) {
    this.svg.removeChild(this.svg.lastChild);
  }
  this.calculateVisibility()
  // draw each position: tile + units as text
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  for (var x = 0, lx = this.width; x < lx; x++)
	  {
		this.drawRect(x,y);
	  }
  }
  // draw sector coordinates at border
  for (var y = 0, ly = this.height; y < ly; y++)
  {
	  this.drawSectorPosition(-1,y,y+1,CELL_WIDTH/2-1,0);
	  this.drawSectorPosition(this.width,y,y+1,-(CELL_WIDTH/2-1),0);
  }
  for (var x = 0, lx = this.width; x < lx; x++)
  {
	  this.drawSectorPosition(x,-1,x+1,0,(CELL_WIDTH/2-1));
	  this.drawSectorPosition(x,this.height,x+1,0,-(CELL_WIDTH/2-1));
  }
  this.drawOffboardRect(this.showFaction)
};
Map.prototype.posAsString = function(mapX,mapY) {
	return mapX+","+mapY
};
Map.prototype.calculateVisibility = function() {
	this.revealedPosition.clear()
	// calculate for each faction independantly
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
  const STACKING_STEP = 2
  // this is used to stack friendly units upwards
  var yOffsetFriendly = 0 
  // this is used to stack enemy units downwards
  var yOffsetEnemy = 0   
  for (var i = 0, li = AllUnits.length; i < li; i++)
  {
	  var isFriendly = (AllUnits[i].faction == this.showFaction)
	  if(AllUnits[i].mapX == xMapPos &&
	     AllUnits[i].mapY == yMapPos &&
		 // allways show all friendly units
		 ( isFriendly
		 // or show when all units are to be shown
		 || this.showFaction == AllFactions
		 // or show unit when the position is in the visibleSet
		 || this.visibleSet[this.showFaction].has(
		      this.posAsString(xMapPos,yMapPos) ) ) )
	  {
		  var textToShow = AllUnits[i].name
		  var yOffsets
		  var color = '#000'
		  if(isFriendly)
		  {
			  if(AllUnits[i].hasMoved)
			  {
				  textToShow = "\u21E3"+textToShow+"\u21E3" 
				  // alt: "\u21D3"
			  }
			  yOffset = yOffsetFriendly
			  yOffsetFriendly -= STACKING_STEP
			  if(yOffsetEnemy == 0) // first unit shown centered
				  yOffsetEnemy = STACKING_STEP
		  }
		  else
		  {
			  color = '#F00' // enemies are red
			  yOffset = yOffsetEnemy
			  yOffsetEnemy += STACKING_STEP
			  if(yOffsetFriendly == 0)  // first unit shown centered
				  yOffsetFriendly = -STACKING_STEP
		  }
		  this.drawText(xMapPos,yMapPos,textToShow,
			  (AllUnits[i] == selectedUnit) // selected units are bold
			  ,0,yOffset,color);
	  }
  }
}
Map.prototype.drawSectorPosition = function(xMapPos,yMapPos
  ,textToShow,xOffset,yOffset)
{
	this.drawText(xMapPos,yMapPos,textToShow,false
	  ,xOffset,yOffset,'black')
}
Map.prototype.getMapUpperLeftX = function(xMapPos)
{
	return (xMapPos+1)*CELL_WIDTH
}
Map.prototype.getMapUpperLeftY = function(yMapPos)
{
	return (yMapPos+1)*CELL_WIDTH
}
Map.prototype.getMapCenterX = function(xMapPos)
{
	return this.getMapUpperLeftX(xMapPos)+CELL_WIDTH/2
}
Map.prototype.getMapCenterY = function(yMapPos)
{
	return this.getMapUpperLeftY(yMapPos)+CELL_WIDTH/2
}
Map.prototype.drawText = function(xMapPos,yMapPos,textToShow,
  isSelected,xOffset,yOffset,color)
 {
	var text = document.createElementNS(this.ns, 'text')
	text.setAttributeNS(null, 'x',this.getMapCenterX(xMapPos)+xOffset)
	text.setAttributeNS(null, 'y',this.getMapCenterY(yMapPos)+yOffset)
	text.setAttributeNS(null, 'fill', color)
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
  if(this.selectPositionMode) // used to place units in edit mode
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
		  if(units[i].faction == this.showFaction
		    && (units[i].hasMoved == false) )
		    selectedUnit = units[i]
	  }
  }
  this.draw()
};
Map.prototype.isPositionRevealed = function(xMapPos,yMapPos) {
	return this.revealedPosition.has(this.posAsString(xMapPos,yMapPos))
};
Map.prototype.drawOffboardRect = function(faction) {
	var mapAnchorY = -1
	var yOffsetText = -(CELL_WIDTH/4)
	var yOffsetRect = 0
	if(faction == 0)
	{
		mapAnchorY = this.height
		yOffsetText = (CELL_WIDTH/4)
		yOffsetRect = (CELL_WIDTH/2)
	}
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',this.getMapUpperLeftX(0)+1)
	rect.setAttributeNS(null, 'y',this.getMapUpperLeftY(mapAnchorY)
	  + yOffsetRect)
	rect.setAttributeNS(null, 'width', (this.width*CELL_WIDTH)-2)
	rect.setAttributeNS(null, 'height',(CELL_WIDTH/2))
	rect.setAttributeNS(null, 'fill', '#E1E1E1')
	this.svg.appendChild(rect)
	// ? relative position to rect maybe ?
	this.drawText(0,mapAnchorY,"Offboard:",false,
	  1,yOffsetText,'black')
}
Map.prototype.drawRect = function(xMapPos,yMapPos) {
	var rect = document.createElementNS(this.ns, 'rect')
	rect.setAttributeNS(null, 'x',this.getMapUpperLeftX(xMapPos)+1)
	rect.setAttributeNS(null, 'y',this.getMapUpperLeftY(yMapPos)+1)
	rect.setAttributeNS(null, 'width', CELL_WIDTH-2)
	rect.setAttributeNS(null, 'height',CELL_WIDTH-2)
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



///////////////////  GameEngine  /////////////
var GameEngine = {
	prepareRound:function(faction)
	{
	  for (var i = 0, li = AllUnits.length; i < li; i++)
	  {
		  if(AllUnits[i].faction != faction)
		  {
			  AllUnits[i].hasMoved = false
		  }
	  }
	},
}



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
		GameEngine.prepareRound(faction)
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