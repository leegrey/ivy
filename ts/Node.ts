module Ivy {
	export class Node {	
		id: string;
		content: any; // can be string or function 
		outputs: Array<string> = null;
	
		constructor(id:string, content:string = null) {
			this.id = id;
			this.content = content;
		}

		render() {			
			var contentHTML:string = null;
			if (typeof this.content === 'string') {				
				contentHTML = this.content;
			} else if (typeof this.content === 'function') {
				var contentHTML = String(this.content());
			} else {				
				contentHTML = "<p>Content for node was not defined</p>";				
			}
			return this.processContentHTML(contentHTML);			
		}

		// TODO: create a numeric alias for the node so as
		// not to show the actual node id on rollover (spoiler danger)

		processLinks($content):void {			
			
			var links:{$link:any, kind:string, url:string, visited:number}[] = [];

			// TODO: Add a global override expiring flag for games that
			// really dont want that behaviour. This can be per node.
			// start false and become true below if unexpired is found
			var hasUnexpiredLinks = false;		
			// Pre collect all the links and record if there are unexpired ones
			// so we can decide how to handle fallback links	
			$content.find('a').each(function(){
				var $link = $(this);
				var url = $(this).attr('href');
				var firstCharacter = url.substr(0, 1);		
				var visited = -1;						
				if (firstCharacter != "+" && firstCharacter != "~") {
					firstCharacter = "default";
					// since it is not + or ~ we know it is a default (expiring) link
					// so we can check to see if it is expired or not
					visited = Ivy.timesVisitedNode(url);
					if (visited == 0) {
						hasUnexpiredLinks = true;
					}
				}
				else {
					// remove the modifier character 
					url = url.substr(1);
					// don't actually need this but adding for consistency
					visited = Ivy.timesVisitedNode(url);
				}
				
				// TODO: build a non human readable alias lookup
				// so people can't hover-cheat the link
				// prepend a hash now
				if(url.substr(0, 1) !== '#') {
					$(this).attr('href', '#' + url);
				}
				links.push({
					$link:$link,
					kind:firstCharacter,
					url:url,
					visited:visited});
			});

			// now we have pre-gathered the links, actually process them
			for(var i = 0; i < links.length; i++) {
				var link = links[i];				
				if (link.kind == '+') {
					// always render	
				} else if (link.kind == '~') {
					if (hasUnexpiredLinks) link.$link.remove();
				} else {
					// default behaviour (expire after one visit)
					if (link.visited > 0) link.$link.replaceWith(link.$link.html());
				}
			}

			// add click events to the active links
			$content.find('a').click(function(){
				var targetNodeID = $(this).attr('href');
				//remove the hash
				while(targetNodeID.substr(0, 1) === '#') {
					targetNodeID = targetNodeID.substr(1);
				}
				Ivy.gotoNode(targetNodeID);
				//prevent the default action:
				return false;
			});			
		}

		/**
		This will be a default collectable behaviour for simple items 
		in non-logical nodes. 
		
			After being collected, it will be crossed out in the text.
					
			Simplest approach would be to assume all items are unique.		
					
		An alternative might be to have an outer collectable span that marks an 
		entire passage as being about a collectable, with an inner span marking
		the item. When the item is collected, the outer span is removed. 
		 
		Yet another way would be to have two texts: the pre-collected and the 
		post-collected (which would be optional). 
		 
		 <span class ="collectable">
			On the floor, there is a suspicious looking <span class = 'item' id = 'crumb'>crumb</span>.
			<span class = 'collected'>
				This optional text would be displayed after the item had been collected.
			</span>
		</span>
		 */

		// TODO: delete this.... 		
		processCollectableItems($content):void {
			//process collectable items:			
			$content.find('.collectable').each(function(){ 							
				//use the html content of the item as its name
				var itemName = itemID = $(this).html();				
				//get the id attribute
				var itemID = $(this).attr('id');
				//if there is no id attribute, use the html content as an id
				if(typeof itemID === 'undefined') {
					itemID = $(this).html();
				}
				if(inventory.hasItem(itemID)) {					
					// alternate behaviour: just increment?					
					// TODO: possibly check for a 'resource' or 'non-unique' class
					// and increment only in that case					
					console.log('already collected item:', $(this).html());
					$(this).addClass('collected');					
					return;					
				} else {					
					//if it has not been collected, add click handler:				
					$(this).click(function(){
						inventory.addItem(itemID, itemName, 1);
						$(this).addClass('collected');
						//use data() to get the data attribute from the element (html5)
						//console.log('clicked collectable', $(this).html(), $(this).data());
						console.log('collected item:', $(this).html());
					});
				}				
			});
		}

		/**
		 * Returns a jquery object of the node view, with interaction events
		 * bound to Ivy
		 */		
		processContentHTML(contentHTML:string) {			
			// command strings are stripped from the content
			// conditional text is included or removed
			contentHTML = Ivy.Commands.processCommandsInText(contentHTML);
			//console.log("contentHTML after commands:", contentHTML);
			//process content as markdown		
			if(config.useMarkdown) {
				contentHTML = marked(contentHTML);
			}
			//create a jquery object from the html
			var $content = $('<div></div>')
			$content.html(contentHTML);			
			//alias for this node for use inside event handlers
			var node = this;
			// add inter-node links		
			this.processLinks($content);
			// process collectable items
			this.processCollectableItems($content);
			return $content;				
		}
	}	// end class Node

}	