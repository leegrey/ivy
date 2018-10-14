/// <reference path="Ivy.ts"/>

module Ivy {

	export function analyseNodes ( nodeMap:NodeMap ) {
		 
		console.log( '****analyseNodes*******' );

		var nodeIDs = [];
		var outgoingLinks = [];

		// nodes with no other node that links to it:
		var unreferencedNodes = [];
		var unreferencedTextNodes = [];

		// nodes that contain no outgoing links:
		var terminalNodes = [];
		
		// outgoing links to non-existant targets
		var brokenLinks = [];

		var nodes = nodeMap ? nodeMap.nodes : Ivy.nodes.nodes;

		for ( var key in nodes ) {
			//console.log( this.nodes[ key ] );

			nodeIDs.push( nodes[ key ].id );

			var content = nodes[ key ].content;

			// if function, convert to string
			if( typeof content === 'function' ) {
				// calling functional nodes is bad. It can corrupt the 
				// persistent state of the game by setting flags etc.

				// TODO: access meta data "node.outputs" field

				continue;
				//content = content();
			}
			
			if( Ivy.config.useMarkdown ) {
				content = marked( content );
			}

			// cache jquery object for content
			var $content = $(content);

			var outgoingLinkCount = 0;

			//find all outgoing links
			$content.find('a').each(function(){
				outgoingLinks.push( $(this).attr('href') );
				outgoingLinkCount++;
			});

			if( outgoingLinkCount === 0 ) {
				terminalNodes.push( nodes[ key ].id )
			}

		}

		//search for nodes with no incoming links
		var nodeID;
		var hasReference = false;
		for (var i = 0; i < nodeIDs.length; i++) {

			hasReference = false;

			nodeID = nodeIDs[ i ];

			for (var j = 0; j < outgoingLinks.length; j++) {	
				if( nodeID === outgoingLinks[ j ] ) {
					hasReference = true;
					break;
				}
			}

			if( !hasReference ) {
				unreferencedNodes.push( nodeID );
				var nodeContent = nodes[ nodeID ].content;
				if( typeof nodeContent !== "function" ) {
					unreferencedTextNodes.push( nodeID );	
				}
			}
		}

		// find broken links
		for ( var i = 0; i < outgoingLinks.length; i++ ) {
			var hasTarget = false;
			for ( var j = 0; j < nodeIDs.length; j++ ) {
				if ( outgoingLinks[ i ] === nodeIDs[ j ] ) {
					hasTarget = true;
					break;
				}
			}
			if( !hasTarget ) {
				brokenLinks.push( outgoingLinks[ i ] );
			}
		}

		console.log( 'Node IDs:', nodeIDs );
		console.log( 'Outgoing Links:', outgoingLinks );
		console.log( 'Unreferenced Nodes:', unreferencedNodes );
		console.log( 'Unreferenced text Nodes:', unreferencedTextNodes );
		console.log( 'Terminal Nodes:', terminalNodes );
		console.log( 'Broken Links:', brokenLinks );
	}

	// TODO: render nodes and play through all choices
	export function autoPlaythrough () {}

	// use for validation. Playthrough executes functional nodes
}