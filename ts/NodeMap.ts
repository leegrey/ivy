module Ivy {
	
	export class NodeMap {

		nodes: any = {};

		// used for aliasing the ids so prevent mouse-over showing id in browser
		nodeIDMap: Array<string> = [];
		
		constructor(){
			
		}

		/**
		 * Adds a node to the Map. 
		 * @param id - a string representing the id of the node
		 * @param content - can be of several types: <br/>
		 * String literal representing html for the node<br/>
		 * A reference to a function that returns a string of html<br/>
		 * if no content is supplied, the DOM will be searched for a container 
		 * with an id that matches the id of the node, and it's html() will be 
		 * used.<br/>
		 */

		// TODO: create temporary aliases for the node ids, so the hover doesn't show
		// the link names (spoiler alert!)

		addNode( id:string, content:any = null, outputs:Array<string> = null ) {
			
			if ( this.nodes[ id ] ) {
				console.log( 'Warning, overwriting node with id', id);
			}
			
			//create the new node
			var node:Node = this.nodes[ id ] = new Node( id, content );
			
			// record outputs, if supplied (TODO: should this be passed into the node constructor?)
			// this is essentially meta data to be used during validation
			// only applies to functional nodes.
			if ( outputs !== null ) {
				node.outputs = outputs;
			}

		}
		
		getNode( id ) {
			return this.nodes[ id ];
		}
		
		/**
		 * Process HTML in the *default format* into the NodeMap.<br/>
		 * @argument - a jquery element ( ie selected with $('#id_of_element') )
		 * Produces a logic-less map.
		 */
		addNodesFromDOM( $element ) {
			
			var that = this;
			
			$element.children( 'div' ).each( function(){
				
				var nodeID = $(this).attr( 'id' );
			
				//skip nodes with no id
				if( nodeID === '' || nodeID === null ) {
					return;
				}

				that.addNode( nodeID, $(this).html() );
				
			});
			
		}

		/**
		 * Load game file and process<br/>
		 * @argument - a path to the game file.
		 * Produces a logic-less map.
		 */
		loadGameFile( path:string ) {
			//that.addNode( nodeID, $(this).html() );
			//processGameFile();
		}

		/**
		 * Process game data in the "plain Ivy" style (ie no html elements)<br/>
		 * @argument - a path to the game file.
		 * Produces a logic-less map.
		 */
		processGameData( data:string ) {
			// Split nodes on "==="
			var nodesData = data.split('===');

			// add nodes data as nodes.
			for (var i = 0; i < nodesData.length; i++) {
				var nodeChunk = nodesData[i];

				var endline = nodeChunk.search(/\r\n|\r|\n/);
				if (endline == -1) continue;

				var nodeID = nodeChunk.substr(0, endline).replace(/\s+/g, '');;
				nodeChunk = nodeChunk.substr(endline);
			
				//nodeChunk.replace(//*.+?*/|//.*(?=[nr])/g, '');

				//console.log("node content:" + nodeChunk);
				this.addNode(nodeID, nodeChunk);
			}
		}
		
		/**
		 * Render the content of the node with the provided id.<br/>
		 * @return {string} HTML formatted representation of the node.
		 */
		renderNode( id ) {
			if( !this.nodes[ id ] ) {
				return this.nodeDoesNotExist() + id;
			}
			
			return this.nodes[ id ].render();
		}
		
		/**
		 *Get the unprocessed html string for the node
		 *If the content is a function, it is executed
		 */
		getNodeContent( id ) {
			
			if( !this.nodes[ id ] ) {
				console.log( 'NodeMap::getNodeRaw() - node does not exist:', id );
				return "Node noes not exist: " + id;
			}
			
			var content = this.nodes[ id ].content;

			// execute content, if it is a function
			if( typeof content === 'function' ) {
				content = content();	
			}

			return content;
		}
		
		/**
		 * renders a default node for situations where a node is not found or
		 * does not exist.
		 */
		nodeDoesNotExist() {
			return '<p>Node does not exist.</p>';
		}
		
		/**
		 * check nodes in / out paths to make sure they are all valid
		 */
		validateNodes( id ) {
			// TODO...
		}

	} // end NodeMap

}