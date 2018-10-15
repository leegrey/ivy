var Ivy;
(function (Ivy) {
    function stripWhitespace(s) {
        return s.replace(/\s/g, '');
    }
    Ivy.stripWhitespace = stripWhitespace;
    function findContentInBrackets(s) {
        var matches = s.match(/\(([^)]+)\)/);
        if (matches != null && matches.length > 1)
            return matches[1];
        return null;
    }
    Ivy.findContentInBrackets = findContentInBrackets;
})(Ivy || (Ivy = {}));
var Ivy;
(function (Ivy) {
    var Commands;
    (function (Commands) {
        /// evaluate a string as either a numeric value or a variable
        function evaluateValueArgument(s) {
            if ($.isNumeric(s)) {
                return parseFloat(s);
            }
            else if (/"/.test(s)) {
                return s.match(/"(.*?)"/)[1];
            }
            else if (/'/.test(s)) {
                return s.match(/'(.*?)'/)[1];
            }
            else {
                return Ivy.getVar(s);
            }
        }
        Commands.evaluateValueArgument = evaluateValueArgument;
        // TODO: suppor && and || by splitting into multiple evaluations.. (?)
        // NOTE: the single character comparitors need to 
        // go at the end to avoid false positive
        // (same goes for strings containing eachother)
        var validComparitors = ["<=", ">=", "==", "<", ">", "lessorequal", "greaterorequal", "equal", "greater", "less"];
        function evaluateConditional(expression) {
            var operator = null;
            var tokens = null;
            var foundMatch = false;
            // fix browswer encodings of less than and greater than symbols
            // (required when pulling content from a <div> or <pre> block)
            expression = expression.replace("&gt;", ">");
            expression = expression.replace("&lt;", "<");
            for (var i = 0; i < validComparitors.length; i++) {
                operator = validComparitors[i];
                tokens = expression.split(operator);
                if (tokens.length == 2) {
                    foundMatch = true;
                    break;
                }
            }
            var result = false;
            if (foundMatch) {
                var value1 = evaluateValueArgument(Ivy.stripWhitespace(tokens[0]));
                var value2 = evaluateValueArgument(Ivy.stripWhitespace(tokens[1]));
                switch (operator) {
                    case "less":
                    case "<":
                        result = value1 < value2;
                        break;
                    case "greater":
                    case ">":
                        result = value1 > value2;
                        break;
                    case "lessorequal":
                    case "<=":
                        result = value1 <= value2;
                        break;
                    case "greaterorequal":
                    case ">=":
                        result = value1 >= value2;
                        break;
                    case "equal":
                    case "==":
                        result = value1 == value2;
                        break;
                    default: result = false;
                }
            }
            return result;
        }
        Commands.evaluateConditional = evaluateConditional;
    })(Commands = Ivy.Commands || (Ivy.Commands = {}));
})(Ivy || (Ivy = {}));
var Ivy;
(function (Ivy) {
    var Commands;
    (function (Commands) {
        function log() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            Function.apply.call(console.log, console, arguments);
        }
        // {.*}\(.*\)
        // flags object
        var flags = {};
        // find curly brace tags "{...}"
        var regex_findCurlyBraces = /{.*?}/g;
        // find curly braces not followed by argument braces "{...}" not followed by "()"
        var regex_findCurlyBracesWithoutArguments = /{.*}(?!\()/g;
        // problem - gets confused by brackes with no arguments, sees as beginning of 
        //var regex_findCurlyBracesWithArguments = /{.*}\(.*\)/g;
        var regex_findCurlyBracesWithArguments = /{.*}\(.*\)/g;
        function eatExcessWhitespace(s) {
            return s.trim().replace(/  +/g, ' ');
        }
        function findCommandsInText(text) {
            var commands = [];
            var command;
            while (command = regex_findCurlyBraces.exec(text)) {
                var inner = command[0].substr(1, command[0].length - 2);
                var tokens = inner.split(" ");
                var baseToken = tokens.length > 0 ? tokens[0] : null;
                var argumenString = inner.substr(baseToken.length + 1);
                var commandInfo = {
                    commandString: inner,
                    start: command.index,
                    end: command.index + command[0].length,
                    tokens: tokens,
                    baseToken: baseToken,
                    argumentString: argumenString
                };
                commands.push(commandInfo);
            }
            // CHECK start an end points of command strings
            // for (var i = 0; i < commands.length; i++) {
            // 	var element = commands[i];
            // 	console.log("inner: ***" + element.commandString + "***"); 
            // 	console.log("argumentString: ***" + element.argumentString + "***"); 
            // 	console.log("outer:	***" + text.substring(element.start, element.end) + "***");
            // }
            return commands;
        }
        var ProcessTextSource = (function () {
            function ProcessTextSource() {
                this.location = 0;
                this.commands = [];
                this.outputStrings = [];
            }
            return ProcessTextSource;
        }());
        function consumeCommand(source, writeOutputString) {
            if (writeOutputString === void 0) { writeOutputString = true; }
            if (source.commands.length == 0) {
                log("Error in consumeCommand() at", source.location, "- no more commands to consume.");
                return null;
            }
            // get the next command
            var command = source.commands.shift();
            // get the text up to the start of the current command
            if (writeOutputString) {
                source.outputStrings.push(source.text.substring(source.location, command.start));
            }
            // set the location to the end of the command
            source.location = command.end;
            return command;
        }
        function validateNextCommand(source, validCommands) {
            if (source.commands.length == 0)
                return false;
            var nextBaseToken = source.commands[0].baseToken;
            return validCommands.indexOf(nextBaseToken) != -1;
        }
        function findNextInstaceOfCommand(source, commandToken) {
            for (var i = 0; i < source.commands.length; i++) {
                var c = source.commands[i];
                if (c.baseToken == commandToken) {
                    return c;
                }
            }
            return null;
        }
        // this will silently eat all commands up until and including the
        // matching command. This leaves the location directly after the 
        // matching command, at the start of the plaintext. The next call to consume will
        // then write the following plaintext
        function eatCommandsUntilToken(source, commandToken) {
            while (source.commands.length > 0) {
                var c = source.commands[0];
                consumeCommand(source, false);
                if (c.baseToken == commandToken)
                    break;
            }
        }
        function eatPlaintextToNextCommand(source) {
            if (source.commands.length == 0) {
                // go all the way to the end of the text
                source.location = source.text.length;
                return;
            }
            var nextCommand = source.commands[0];
            source.location = nextCommand.start;
        }
        // Find all content contained within curly braces
        // and process it as commands
        // returns the final processed text
        function processCommandsInText(sourceText) {
            var source = new ProcessTextSource();
            source.text = sourceText;
            source.commands = findCommandsInText(sourceText);
            // if there are no commands, just return the unmodified source text
            if (source.commands.length == 0)
                return sourceText;
            while (source.commands.length > 0) {
                var command = consumeCommand(source);
                processCommand(command, source);
            }
            // write remainder
            source.outputStrings.push(source.text.substr(source.location));
            return source.outputStrings.join("");
        }
        Commands.processCommandsInText = processCommandsInText;
        function processCommand(commandInfo, source) {
            // console.log("Processing Command:", commandInfo.baseToken, commandInfo.argumentString);
            switch (commandInfo.baseToken) {
                case "": break;
                case "var":
                    process_var(commandInfo, source);
                    break;
                case "setflag":
                    process_setflag(commandInfo, source);
                    break;
                case "set":
                    process_set(commandInfo, source);
                    break;
                case "unset":
                    process_unset(commandInfo, source);
                    break;
                case "if":
                    process_conditional(commandInfo, source);
                    break;
                case "elif":
                    process_conditional(commandInfo, source);
                    break;
                case "else":
                    process_else(commandInfo, source);
                    break;
                case "alt":
                    process_alt(commandInfo, source);
                    break;
                case "inc":
                    process_inc(commandInfo, source);
                    break;
                case "dec":
                    process_dec(commandInfo, source);
                    break;
                case "add":
                    process_add(commandInfo, source);
                    break;
                case "sub":
                    process_add(commandInfo, source, true);
                    break;
                case "clear":
                    process_clear(commandInfo, source);
                    break;
                case "func":
                    process_func(commandInfo, source);
                    break;
                case "embed":
                    process_embed(commandInfo, source);
                    break;
            }
        }
        function process_setflag(commandInfo, source) {
            if (commandInfo.tokens.length < 2) {
                console.log("setflag has too few argumemts:", commandInfo.commandString);
            }
            // default is true {setflag foo} // foo is true
            var value = true;
            if (commandInfo.tokens.length > 2) {
                var parsedArgument = parseFloat(commandInfo.tokens[2]);
                if (!isNaN(parsedArgument))
                    value = (parsedArgument == 0 ? false : true);
            }
            Ivy.setFlag(commandInfo.tokens[1], value);
        }
        function process_var(commandInfo, source) {
            if (commandInfo.tokens.length < 2) {
                console.log("set has too few argumemts:", commandInfo.commandString);
            }
            var value = 0;
            if (commandInfo.tokens.length > 2) {
                var parsedArgument = parseFloat(commandInfo.tokens[2]);
                if (!isNaN(parsedArgument))
                    value = parsedArgument;
            }
            Ivy.setVar(commandInfo.tokens[1], value);
        }
        function process_set(commandInfo, source) {
            //  TODO: Validate the key 
            if (commandInfo.tokens.length < 3) {
                console.log("set has too few argumemts:", commandInfo.commandString);
            }
            var variableName = commandInfo.tokens[1];
            var valueToken = commandInfo.tokens[2];
            if (valueToken == "true") {
                Ivy.setFlag(variableName, true);
            }
            else if (valueToken == "false") {
                Ivy.setFlag(variableName, false);
            }
            else {
                var value = parseFloat(commandInfo.tokens[2]);
                if (isNaN(value))
                    value = 0;
                Ivy.setVar(commandInfo.tokens[1], value);
            }
        }
        function process_unset(commandInfo, source) {
            Ivy.unset(commandInfo.argumentString);
        }
        function process_else(commandInfo, source) {
            // in this case we should simply write the rest and then advance to endif
            consumeCommand(source, true);
            // hang on... shouldn't this work already ?
            //eatCommandsUntilToken(source, "endif");
        }
        function evaluate_condition(argumenString) {
            var conditionString = Ivy.findContentInBrackets(argumenString);
            if (conditionString != null) {
                return Commands.evaluateConditional(conditionString);
            }
            // get the token to find out what kind of conditional it is
            var conditionalName = argumenString.split(' ')[0];
            // if the string starts with a "!", we will invert the result
            // should be able to do {if !(blah)} or {if !func blah()}
            var invertResult = false;
            if (conditionalName.substring(0, 1) == '!') {
                invertResult = true;
                // remove the "!"
                conditionalName = conditionalName.substring(1);
            }
            var conditionalResult = false;
            if (conditionalName.substring(0, 1) == "(") {
                console.log("got open bracket. do evaluation...");
            }
            if (conditionalName == "func") {
                console.log("got func. Call function...");
            }
            else {
                conditionalResult = Ivy.getFlag(conditionalName);
            }
            conditionalResult = invertResult ? !conditionalResult : conditionalResult;
            return conditionalResult;
        }
        // // this function must be agnistic as to which command initiates it.
        // // It can be called as a result of an if, of an elif
        var validFollowingConditional = ["else", "elif", "endif"];
        function process_conditional(commandInfo, source) {
            if (!validateNextCommand(source, validFollowingConditional)) {
                log("Error at", source.location, "- `if` must be immediately followed by else, elif, or endif");
                return;
            }
            var conditionalResult = false;
            var conditionalName = commandInfo.tokens[1];
            var conditionalResult = evaluate_condition(commandInfo.argumentString);
            //console.log("conditionalResult of:", conditionalName + ":", conditionalResult);
            if (conditionalResult) {
                var nextCommand = source.commands[0];
                var conditionalContent = source.text.substring(commandInfo.end, nextCommand.start);
                source.outputStrings.push(conditionalContent);
                //console.log("Condition was true. Writing content:", conditionalContent);
                // here we need to advance to the endif to skip elif or else
                // eat up all commands until we hit endif
                eatCommandsUntilToken(source, "endif");
                return;
            }
            else {
                // advance over the text to the start of the next command
                eatPlaintextToNextCommand(source);
            }
        }
        function process_alt(commandInfo, source) {
            var altTexts = commandInfo.argumentString.split('|');
            var selectedAltText = altTexts[Math.floor(Math.random() * altTexts.length)];
            source.outputStrings.push(selectedAltText);
        }
        function process_embed(commandInfo, source) {
            var id = commandInfo.tokens[1];
            var content = Ivy.nodes.getNodeContent(id);
            if (content) {
                source.outputStrings.push(content);
            }
        }
        function removeSubString(str, cutStart, cutEnd) {
            return str.substr(0, cutStart) + str.substr(cutEnd + 1);
        }
        function addToVariable(variableName, toAdd) {
            var value = Ivy.getVar(variableName) + toAdd;
            Ivy.setVar(variableName, value);
        }
        function process_inc(commandInfo, source) {
            if (commandInfo.tokens.length < 2) {
                log("Error in inc at", source.location, "needs second argument");
                return;
            }
            var variableName = commandInfo.tokens[1];
            addToVariable(variableName, 1);
        }
        function process_dec(commandInfo, source) {
            if (commandInfo.tokens.length < 2) {
                log("Error in dec at", source.location, "needs second argument");
                return;
            }
            var variableName = commandInfo.tokens[1];
            addToVariable(variableName, -1);
        }
        function process_add(commandInfo, source, invert) {
            if (invert === void 0) { invert = false; }
            if (commandInfo.tokens.length < 3) {
                log("Error in inc at", source.location, "too few arguments.");
                return;
            }
            var toAdd = parseFloat(commandInfo.tokens[2]);
            // invert is used for the sub command
            if (invert)
                toAdd = -toAdd;
            if (isNaN(toAdd)) {
                console.log("Error - argument was not a number");
            }
            var variableName = commandInfo.tokens[1];
            addToVariable(variableName, toAdd);
        }
        function process_clear(commandInfo, source) {
            Ivy.clearDisplay();
        }
        function process_func(commandInfo, source) {
            var functionName = commandInfo.tokens[1];
            functionName = functionName.substr(0, functionName.indexOf('('));
            var returnValue = Ivy.callFunction(functionName, Ivy.findContentInBrackets(commandInfo.argumentString));
            if (returnValue) {
                source.outputStrings.push(returnValue);
            }
        }
    })(Commands = Ivy.Commands || (Ivy.Commands = {}));
})(Ivy || (Ivy = {})); // end Ivy.Parse
var Ivy;
(function (Ivy) {
    var Node = (function () {
        function Node(id, content) {
            if (content === void 0) { content = null; }
            this.outputs = null;
            this.id = id;
            this.content = content;
        }
        Node.prototype.render = function () {
            var contentHTML = null;
            if (typeof this.content === 'string') {
                contentHTML = this.content;
            }
            else if (typeof this.content === 'function') {
                var contentHTML = String(this.content());
            }
            else {
                contentHTML = "<p>Content for node was not defined</p>";
            }
            return this.processContentHTML(contentHTML);
        };
        // TODO: create a numeric alias for the node so as
        // not to show the actual node id on rollover (spoiler danger)
        Node.prototype.processLinks = function ($content) {
            var links = [];
            var hasUnexpiredLinks = false;
            // Pre collect all the links and record if there are unexpired ones
            // so we can decide how to handle fallback links	
            $content.find('a').each(function () {
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
                if (url.substr(0, 1) !== '#') {
                    $(this).attr('href', '#' + url);
                }
                links.push({
                    $link: $link,
                    kind: firstCharacter,
                    url: url,
                    visited: visited
                });
            });
            // now we have pre-gathered the links, actually process them
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                if (link.kind == '+') {
                    // always render	
                }
                else if (link.kind == '~') {
                    if (hasUnexpiredLinks)
                        link.$link.remove();
                }
                else {
                    // use the default behaviour defined by Ivy.config
                    var linksExpire = Ivy.config.linksExpireAfterFirstUse;
                    if (linksExpire && link.visited > 0) {
                        link.$link.replaceWith(link.$link.html());
                    }
                }
            }
            // add click events to the active links
            $content.find('a').click(function () {
                var targetNodeID = $(this).attr('href');
                //remove the hash
                while (targetNodeID.substr(0, 1) === '#') {
                    targetNodeID = targetNodeID.substr(1);
                }
                Ivy.gotoNode(targetNodeID);
                //prevent the default action:
                return false;
            });
        };
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
        Node.prototype.processCollectableItems = function ($content) {
            //process collectable items:			
            $content.find('.collectable').each(function () {
                //use the html content of the item as its name
                var itemName = itemID = $(this).html();
                //get the id attribute
                var itemID = $(this).attr('id');
                //if there is no id attribute, use the html content as an id
                if (typeof itemID === 'undefined') {
                    itemID = $(this).html();
                }
                if (Ivy.inventory.hasItem(itemID)) {
                    // alternate behaviour: just increment?					
                    // TODO: possibly check for a 'resource' or 'non-unique' class
                    // and increment only in that case					
                    console.log('already collected item:', $(this).html());
                    $(this).addClass('collected');
                    return;
                }
                else {
                    //if it has not been collected, add click handler:				
                    $(this).click(function () {
                        Ivy.inventory.addItem(itemID, itemName, 1);
                        $(this).addClass('collected');
                        //use data() to get the data attribute from the element (html5)
                        //console.log('clicked collectable', $(this).html(), $(this).data());
                        console.log('collected item:', $(this).html());
                    });
                }
            });
        };
        /**
         * Returns a jquery object of the node view, with interaction events
         * bound to Ivy
         */
        Node.prototype.processContentHTML = function (contentHTML) {
            // command strings are stripped from the content
            // conditional text is included or removed
            contentHTML = Ivy.Commands.processCommandsInText(contentHTML);
            //console.log("contentHTML after commands:", contentHTML);
            //process content as markdown		
            if (Ivy.config.useMarkdown) {
                contentHTML = marked(contentHTML);
            }
            //create a jquery object from the html
            var $content = $('<div></div>');
            $content.html(contentHTML);
            //alias for this node for use inside event handlers
            var node = this;
            // add inter-node links		
            this.processLinks($content);
            // process collectable items
            this.processCollectableItems($content);
            return $content;
        };
        return Node;
    }()); // end class Node
    Ivy.Node = Node;
})(Ivy || (Ivy = {}));
var Ivy;
(function (Ivy) {
    var NodeMap = (function () {
        function NodeMap() {
            this.nodes = {};
            // used for aliasing the ids so prevent mouse-over showing id in browser
            this.nodeIDMap = [];
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
        NodeMap.prototype.addNode = function (id, content, outputs) {
            if (content === void 0) { content = null; }
            if (outputs === void 0) { outputs = null; }
            if (this.nodes[id]) {
                console.log('Warning, overwriting node with id', id);
            }
            //create the new node
            var node = this.nodes[id] = new Ivy.Node(id, content);
            // record outputs, if supplied (TODO: should this be passed into the node constructor?)
            // this is essentially meta data to be used during validation
            // only applies to functional nodes.
            if (outputs !== null) {
                node.outputs = outputs;
            }
        };
        NodeMap.prototype.getNode = function (id) {
            return this.nodes[id];
        };
        /**
         * @obsolete
         * Process HTML in the into the NodeMap.<br/>
         * @argument - a jquery element ( ie selected with $('#id_of_element') )
         * Produces a logic-less map.
         * NOTE: This is an obsolete function from an ancient version of Ivy,
         * where the source of the story was HTML
         */
        NodeMap.prototype.addNodesFromDOM = function ($element) {
            var that = this;
            $element.children('div').each(function () {
                var nodeID = $(this).attr('id');
                //skip nodes with no id
                if (nodeID === '' || nodeID === null) {
                    return;
                }
                that.addNode(nodeID, $(this).html());
            });
        };
        /**
         * Load game file and process<br/>
         * @argument - a path to the game file.
         * Produces a logic-less map.
         */
        NodeMap.prototype.loadGameFile = function (path) {
            //that.addNode( nodeID, $(this).html() );
            //processGameFile();
        };
        /**
         * Process game data in the "plain Ivy" style (ie no html elements)<br/>
         * @argument - a path to the game file.
         * Produces a logic-less map.
         */
        NodeMap.prototype.processGameData = function (data) {
            // Split nodes on "==="
            var nodesData = data.split('===');
            // add nodes data as nodes.
            for (var i = 0; i < nodesData.length; i++) {
                var nodeChunk = nodesData[i];
                var endline = nodeChunk.search(/\r\n|\r|\n/);
                if (endline == -1)
                    continue;
                var nodeID = nodeChunk.substr(0, endline).replace(/\s+/g, '');
                ;
                nodeChunk = nodeChunk.substr(endline);
                //nodeChunk.replace(//*.+?*/|//.*(?=[nr])/g, '');
                //console.log("node content:" + nodeChunk);
                this.addNode(nodeID, nodeChunk);
            }
        };
        /**
         * Render the content of the node with the provided id.<br/>
         * @return {string} HTML formatted representation of the node.
         */
        NodeMap.prototype.renderNode = function (id) {
            if (!this.nodes[id]) {
                return this.nodeDoesNotExist() + id;
            }
            return this.nodes[id].render();
        };
        /**
         *Get the unprocessed html string for the node
         *If the content is a function, it is executed
         */
        NodeMap.prototype.getNodeContent = function (id) {
            if (!this.nodes[id]) {
                console.log('NodeMap::getNodeRaw() - node does not exist:', id);
                return "Node noes not exist: " + id;
            }
            var content = this.nodes[id].content;
            // execute content, if it is a function
            if (typeof content === 'function') {
                content = content();
            }
            return content;
        };
        /**
         * renders a default node for situations where a node is not found or
         * does not exist.
         */
        NodeMap.prototype.nodeDoesNotExist = function () {
            return '<p>Node does not exist.</p>';
        };
        /**
         * check nodes in / out paths to make sure they are all valid
         */
        NodeMap.prototype.validateNodes = function (id) {
            // TODO...
        };
        return NodeMap;
    }()); // end NodeMap
    Ivy.NodeMap = NodeMap;
})(Ivy || (Ivy = {}));
var Ivy;
(function (Ivy) {
    // NOTE: Incomplete / Work in progress
    var Inventory = (function () {
        function Inventory() {
            this.items = {};
        }
        Inventory.prototype.addItem = function (id, name, quantity, data) {
            if (name === void 0) { name = null; }
            if (quantity === void 0) { quantity = 1; }
            if (data === void 0) { data = null; }
            //raw object format used to ease serialisation of state
            var newItem = {
                id: id,
                name: name,
                quantity: quantity,
                data: data
            };
            //TODO: how to handle this? how to manage accumulation?
            //-need to be able to increment 
            //-need unique and non-unique item types?
            if (this.items[id]) {
                console.log('warning, item being overwritten', id);
            }
            this.items[id] = newItem;
            //console.log( id, this.items[ id ] );
            Ivy.save();
        };
        Inventory.prototype.removeItem = function (id, quantity) {
        };
        Inventory.prototype.hasItem = function (id) {
            //( 'hasItem', this.items[ id ] );
            return (this.items.hasOwnProperty(id));
        };
        return Inventory;
    }());
    Ivy.Inventory = Inventory;
    ;
})(Ivy || (Ivy = {}));
var Ivy;
(function (Ivy) {
    // Root level objects:
    // Configure Ivy behaviour
    Ivy.config = {
        // render each node below the last, in a continuous text
        useStitchAndScroll: true,
        // should links expire after one use (if a node is visited again)
        linksExpireAfterFirstUse: true,
        // process nodes through the markdown interpreter		
        // @deprecated 
        // (NOTE: Don't turn this off! Currently, links are processed through 
        // the markdown preprocessor, so Ivy will not work without it!)
        useMarkdown: true
    };
    // The game name is used to identify the persistent data
    // in the local storage. Therefore it must be unique per game
    // to prevent clashes
    Ivy.gameName = 'ivy_game';
    // a namespace for game specific logic.
    // conditional functions etc will be assumed to
    // be in this namespace.
    // Use an alias within game code,
    // for example: var MyNamespace:any = Ivy.gameNamespace;
    Ivy.gameNamespace = {};
    Ivy.nodes = new Ivy.NodeMap();
    //used to save Ivy internal state and player preferences
    Ivy.stateInternal = {};
    Ivy.state = getDefaultStateObject();
    Ivy.functions = [];
    Ivy.inventory = new Ivy.Inventory();
    Ivy.dataHasBeenLoaded = false;
    var idCounter = 0;
    var $previousContentDiv = null;
    // Root level functions:
    //used to store game state. Defaults:
    function getDefaultStateObject() {
        var stateDefaults = {
            nodeHistory: [],
            visitCounts: {},
            vars: {},
            currentNodeID: null
        };
        return stateDefaults;
    }
    Ivy.getDefaultStateObject = getDefaultStateObject;
    function gotoNode(id) {
        // invoke back function
        if (id === 'ivy_back') {
            back();
            return;
        }
        // continue game 
        if (id === 'ivy_continue') {
            load();
            return;
        }
        var nodeMap = Ivy.nodes;
        // stichAndScroll adds the new content 
        if (Ivy.config.useStitchAndScroll) {
            // make links unclickable in the previous node
            if ($previousContentDiv !== null) {
                $previousContentDiv.find('a').each(function () {
                    $(this).replaceWith($(this).html());
                });
            }
            // create a new container div with a unique id			
            var contentDivID = 'content-div' + idCounter++;
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
            var $window = $(window);
            $window.scrollTo($newContentDiv, 600);
        }
        else {
            // just replace the current content with the new content
            $('#main-container').html(nodeMap.renderNode(id));
            $(window).scrollTop(0); //TODO: just use an anchor for this?
        }
        // add to node history, if it is not a repeat of the current node
        var nodeHistory = Ivy.state.nodeHistory;
        // keep track of times visited
        if (!Ivy.state.visitCounts.hasOwnProperty(id)) {
            // first visit
            Ivy.state.visitCounts[id] = 1;
        }
        else {
            // increment counter
            Ivy.state.visitCounts[id]++;
        }
        // don't keep menu in history
        if (id !== "menu") {
            Ivy.state.currentNodeID = id;
            if (nodeHistory[nodeHistory.length - 1] !== id) {
                nodeHistory.push(id);
            }
        }
        save();
    }
    Ivy.gotoNode = gotoNode;
    ;
    function hasVisitedNode(id) {
        return Ivy.state.visitCounts.hasOwnProperty(id);
    }
    Ivy.hasVisitedNode = hasVisitedNode;
    function timesVisitedNode(id) {
        if (Ivy.state.visitCounts.hasOwnProperty(id)) {
            return Ivy.state.visitCounts[id];
        }
        return 0;
    }
    Ivy.timesVisitedNode = timesVisitedNode;
    function save() {
        if (!Ivy.dataHasBeenLoaded) {
            //console.log( 'Warning - Data is being saved before first load.');
        }
        Ivy.stateInternal.inventoryItems = Ivy.inventory.items;
        $.jStorage.set(Ivy.gameName + '_stateInternal', Ivy.stateInternal);
        $.jStorage.set(Ivy.gameName + '_state', Ivy.state);
    }
    Ivy.save = save;
    function clearDisplay() {
        $('#main-container').html('');
        idCounter = 0;
        $previousContentDiv = null;
    }
    Ivy.clearDisplay = clearDisplay;
    function restart(defaults) {
        reset(defaults);
        clearDisplay();
        gotoNode('start');
    }
    Ivy.restart = restart;
    function reset(defaults) {
        // use deep mixin with defaults passed in
        Ivy.state = $.extend(true, defaults, getDefaultStateObject());
        save();
    }
    Ivy.reset = reset;
    function showMenu() {
        gotoNode("menu");
    }
    Ivy.showMenu = showMenu;
    function load(defaults) {
        if (defaults === void 0) { defaults = {}; }
        var stateSave = $.jStorage.get(Ivy.gameName + '_state') || {};
        var stateInternalSave = $.jStorage.get(Ivy.gameName + '_stateInternal') || {};
        // overwrite defaults using a deep mixin:
        Ivy.state = $.extend(true, defaults, Ivy.state, stateSave);
        Ivy.stateInternal = $.extend(true, Ivy.stateInternal, stateInternalSave);
        Ivy.inventory.items = Ivy.stateInternal.inventoryItems || {};
        Ivy.dataHasBeenLoaded = true;
        if (Ivy.state.currentNodeID) {
            gotoNode(Ivy.state.currentNodeID);
        }
        else {
            //TODO: check if there is a start node defined		
            gotoNode('start');
        }
    }
    Ivy.load = load;
    function back() {
        var nodeHistory = Ivy.state.nodeHistory;
        //need at least 2 entries, the current and the one before
        if (nodeHistory.length < 2) {
            console.log('back() - no more history');
            return;
        }
        var backNode = nodeHistory[nodeHistory.length - 2];
        //remove two entries, because the last one will be re-written
        nodeHistory.length -= 2;
        gotoNode(backNode);
    }
    Ivy.back = back;
    // note: deleteSave is untested...
    function deleteSave() {
        $.jStorage.set(Ivy.gameName + '_stateInternal', null);
        $.jStorage.set(Ivy.gameName + '_state', null);
    }
    Ivy.deleteSave = deleteSave;
    // NOTE: vars are just numbers. 0 is false, non-zero is true
    function setFlag(key, value) {
        if (value === void 0) { value = true; }
        // store 1 or 0 to represent true or false
        Ivy.state.vars[key] = value ? 1 : 0;
        save();
    }
    Ivy.setFlag = setFlag;
    function unset(key) {
        delete Ivy.state.vars[key];
        save();
    }
    Ivy.unset = unset;
    function getFlag(key) {
        var value = (Ivy.state.vars[key] || 0);
        return value != 0 ? true : false;
    }
    Ivy.getFlag = getFlag;
    function setVar(key, value) {
        // store 1 or 0 to represent true or false
        Ivy.state.vars[key] = value;
        //console.log("setvar:", key, "to", Ivy.state.vars[key], Ivy.state.vars );
        save();
    }
    Ivy.setVar = setVar;
    function getVar(key) {
        return Ivy.state.vars[key] || 0;
    }
    Ivy.getVar = getVar;
    function hasVariable(key) {
        return Ivy.state.vars.hasOwnProperty(key);
    }
    Ivy.hasVariable = hasVariable;
    function registerFunction(id, func) {
        Ivy.functions[id] = func;
    }
    Ivy.registerFunction = registerFunction;
    function callFunction(functionName, argumentString) {
        if (!Ivy.functions.hasOwnProperty(functionName))
            return;
        var func = Ivy.functions[functionName];
        var arguments = argumentString.split(',');
        var parsedArguments = [];
        for (var i = 0; i < arguments.length; i++) {
            var argument = arguments[i] = arguments[i].trim();
            parsedArguments[i] = Ivy.Commands.evaluateValueArgument(argument);
        }
        //console.log('called function', functionName, parsedArguments);
        return func.apply(null, parsedArguments);
    }
    Ivy.callFunction = callFunction;
})(Ivy || (Ivy = {}));
/// <reference path="Ivy.ts"/>
var Ivy;
(function (Ivy) {
    function analyseNodes(nodeMap) {
        console.log('****analyseNodes*******');
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
        for (var key in nodes) {
            //console.log( this.nodes[ key ] );
            nodeIDs.push(nodes[key].id);
            var content = nodes[key].content;
            // if function, convert to string
            if (typeof content === 'function') {
                // calling functional nodes is bad. It can corrupt the 
                // persistent state of the game by setting flags etc.
                // TODO: access meta data "node.outputs" field
                continue;
                //content = content();
            }
            if (Ivy.config.useMarkdown) {
                content = marked(content);
            }
            // cache jquery object for content
            var $content = $(content);
            var outgoingLinkCount = 0;
            //find all outgoing links
            $content.find('a').each(function () {
                outgoingLinks.push($(this).attr('href'));
                outgoingLinkCount++;
            });
            if (outgoingLinkCount === 0) {
                terminalNodes.push(nodes[key].id);
            }
        }
        //search for nodes with no incoming links
        var nodeID;
        var hasReference = false;
        for (var i = 0; i < nodeIDs.length; i++) {
            hasReference = false;
            nodeID = nodeIDs[i];
            for (var j = 0; j < outgoingLinks.length; j++) {
                if (nodeID === outgoingLinks[j]) {
                    hasReference = true;
                    break;
                }
            }
            if (!hasReference) {
                unreferencedNodes.push(nodeID);
                var nodeContent = nodes[nodeID].content;
                if (typeof nodeContent !== "function") {
                    unreferencedTextNodes.push(nodeID);
                }
            }
        }
        // find broken links
        for (var i = 0; i < outgoingLinks.length; i++) {
            var hasTarget = false;
            for (var j = 0; j < nodeIDs.length; j++) {
                if (outgoingLinks[i] === nodeIDs[j]) {
                    hasTarget = true;
                    break;
                }
            }
            if (!hasTarget) {
                brokenLinks.push(outgoingLinks[i]);
            }
        }
        console.log('Node IDs:', nodeIDs);
        console.log('Outgoing Links:', outgoingLinks);
        console.log('Unreferenced Nodes:', unreferencedNodes);
        console.log('Unreferenced text Nodes:', unreferencedTextNodes);
        console.log('Terminal Nodes:', terminalNodes);
        console.log('Broken Links:', brokenLinks);
    }
    Ivy.analyseNodes = analyseNodes;
    // TODO: render nodes and play through all choices
    function autoPlaythrough() { }
    Ivy.autoPlaythrough = autoPlaythrough;
    // use for validation. Playthrough executes functional nodes
})(Ivy || (Ivy = {}));
/*

Ivy Story Engine
Copyright Lee Grey 2012 - all rights reserved

Dependancies:

    jQuery - DOM manipulation
    jStorage - persistence
    json2 - dependancy of jStorage

*/
/// <reference path="lib/jquery.d.ts"/>
/// <reference path="lib/jstorage.d.ts"/>
/// <reference path="lib/marked/marked.d.ts"/>
/// <reference path="Utils.ts"/>
/// <reference path="Evaluate.ts"/>
/// <reference path="Commands.ts"/>
/// <reference path="Node.ts"/>
/// <reference path="NodeMap.ts"/>
/// <reference path="Inventory.ts"/>
/// <reference path="IvyCore.ts"/>
/// <reference path="Analysis.ts"/>
