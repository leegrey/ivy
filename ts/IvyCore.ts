module Ivy {
	
	// Root level objects:
	export var config:any = {
		useMarkdown : true,
		useStitchAndScroll : true
	};
	
	// The game name is used to identify the persistent data
	// in the local storage. Therefore it must be unique per game
	// to prevent clashes
	export var gameName:string = 'ivy_game';
	// a namespace for game specific logic.
	// conditional functions etc will be assumed to
	// be in this namespace.
	// Use an alias within game code,
	// for example: var MyNamespace:any = Ivy.gameNamespace;
	export var gameNamespace:any = {};
	export var nodes:NodeMap = new NodeMap();
	//used to save Ivy internal state and player preferences
	export var stateInternal:any = {};
	export var state = getDefaultStateObject();
	export var functions:Function[] = [];
	export var inventory = new Inventory();
	export var dataHasBeenLoaded = false;
	var idCounter = 0;
	var $previousContentDiv = null;
	
	// Root level functions:
	//used to store game state. Defaults:
	export function getDefaultStateObject() {
		var stateDefaults = {
			nodeHistory : [],
			visitCounts : {},
			vars : {},
			currentNodeID : null
		};
		return stateDefaults;
	}

	export function gotoNode ( id:string ) {
		// invoke back function
		if ( id === 'ivy_back' ) {
			back();
			return;
		}
		// continue game 
		if ( id === 'ivy_continue' ) {
			load();
			return;
		}		
		var nodeMap = nodes;
		// stichAndScroll adds the new content 
		if( config.useStitchAndScroll ) {
			// make links unclickable in the previous node
			if( $previousContentDiv !== null) {
				$previousContentDiv.find('a').each(function() {
				    $(this).replaceWith($(this).html());
				});
			}
			// create a new container div with a unique id			
			var contentDivID:string = 'content-div' + idCounter++;
			var $newContentDiv = $('<div id = "' + contentDivID + '" class = "node-content">');
			// if this is not the first node, show a divider
			if (idCounter !== 1) {
				$newContentDiv.addClass('node_divider');
			}
			// remember this div so we can make the links unclickable next time
			$previousContentDiv = $newContentDiv;
			// populate the new div with the node content
			$newContentDiv.html(nodeMap.renderNode(id));
			// append the div to the main content container
			$('#main-container').append($newContentDiv);
			// fade the new node in
			$newContentDiv.hide().fadeIn(400);
			// scroll the window to the new content
			var $window:any = $(window);
			$window.scrollTo($newContentDiv , 600);
		} else {
			// just replace the current content with the new content
			$('#main-container').html( nodeMap.renderNode( id ) );
			$(window).scrollTop(0);//TODO: just use an anchor for this?
		}

		// add to node history, if it is not a repeat of the current node
		var nodeHistory = state.nodeHistory;
		// keep track of times visited
		if( !state.visitCounts.hasOwnProperty( id ) ) {
			// first visit
			state.visitCounts[ id ] = 1;
		} else {
			// increment counter
			state.visitCounts[ id ]++;
		}
		// don't keep menu in history
		if( id !== "menu" ) {
			state.currentNodeID = id;
			if( nodeHistory[ nodeHistory.length - 1 ] !== id ) {
				nodeHistory.push( id );	
			}
		}
		save();
	};

	export function hasVisitedNode( id ) {
		return state.visitCounts.hasOwnProperty( id );
	}

	export function timesVisitedNode( id ) {
		if( state.visitCounts.hasOwnProperty( id ) ) {
			return state.visitCounts[ id ];
		} 
		return 0;
	}

	export function save () {
		if( !dataHasBeenLoaded ) {
			//console.log( 'Warning - Data is being saved before first load.');
		}
		stateInternal.inventoryItems = inventory.items;
		$.jStorage.set( gameName + '_stateInternal' , stateInternal );
		$.jStorage.set( gameName + '_state' , state );
	}

	export function clearDisplay() {
		$('#main-container').html('');
		idCounter = 0;
		$previousContentDiv = null;
	}

	export function restart ( defaults ) {
		reset( defaults );
		clearDisplay();
		gotoNode( 'start' );
	}

	export function reset ( defaults ) {
		// use deep mixin with defaults passed in
		state = $.extend( true, defaults, getDefaultStateObject() );
		save();
	}

	export function showMenu () {
		gotoNode( "menu" );
	}

	export function load (defaults = {}) {
		var stateSave: any = $.jStorage.get( gameName + '_state' ) || {};
		var stateInternalSave: any = $.jStorage.get( gameName + '_stateInternal' ) || {};
		// overwrite defaults using a deep mixin:
		state = $.extend( true, defaults, state, stateSave );
		stateInternal = $.extend( true, stateInternal, stateInternalSave );
		inventory.items = stateInternal.inventoryItems || {};
		dataHasBeenLoaded = true;
		if( state.currentNodeID ){
			gotoNode( Ivy.state.currentNodeID );
		} else {
			//TODO: check if there is a start node defined		
			gotoNode('start');
		}
	}

	export function back () {		
		var nodeHistory = state.nodeHistory;
		//need at least 2 entries, the current and the one before
		if( nodeHistory.length < 2 ) {
			console.log( 'back() - no more history');
			return;
		}
		var backNode = nodeHistory[ nodeHistory.length - 2 ];
		//remove two entries, because the last one will be re-written
		nodeHistory.length -= 2;
		gotoNode( backNode );
	}

	// note: deleteSave is untested...
	export function deleteSave () {
		$.jStorage.set( gameName + '_stateInternal' , null );
		$.jStorage.set( gameName + '_state' , null );
	}

	// NOTE: vars are just numbers. 0 is false, non-zero is true
	export function setFlag (key:string, value:boolean = true) {
		// store 1 or 0 to represent true or false
		Ivy.state.vars[key] = value ? 1 : 0;
		save();
	}

	export function unset(key:string) {
		delete Ivy.state.vars[key];
		save();
	}

	export function getFlag (key:string) {
		var value: number = (Ivy.state.vars[key] || 0);
		return value != 0 ? true : false;
	}

	export function setVar (key:string, value:number):void {
		// store 1 or 0 to represent true or false
		Ivy.state.vars[key] = value;
		//console.log("setvar:", key, "to", Ivy.state.vars[key], Ivy.state.vars );
		save();
	}
	
	export function getVar (key:string):number {
		return Ivy.state.vars[key] || 0;
	}

	export function hasVariable(key:string) {
		return Ivy.state.vars.hasOwnProperty(key);
	}

	export function registerFunction(id:string, func:Function) {
		functions[id] = func;
	}

	export function callFunction(functionName:string, argumentString:string) {
		if (!functions.hasOwnProperty(functionName)) return;
		var func = functions[functionName];
		var arguments = argumentString.split(',');
		var parsedArguments = [];
		for (var i = 0; i < arguments.length; i++) {
			var argument = arguments[i] = arguments[i].trim();
			parsedArguments[i] = Ivy.Commands.evaluateValueArgument(argument);
		}
		//console.log('called function', functionName, parsedArguments);
		return func.apply(null, parsedArguments);
	}
}	