module Ivy.Commands {

	function log(...args) {
		Function.apply.call(console.log, console, arguments);
	}

	interface CommandInfo {
		// the command string (ie what is contained inside curly braces)
		commandString: string;
		// the start and end of the command in the source text
		// NOTE: this includes the curly braces. Will be used to strip
		// the tokens later....
		start: number;
		end: number;
		tokens: string[];
		baseToken: string;
		argumentString: string;
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

	function eatExcessWhitespace(s:string): string {
		return s.trim().replace(/  +/g, ' ');
	}

	function findCommandsInText(text:string):CommandInfo[]
	{	
		var commands:CommandInfo[] = [];
		var command;
		while ( command = regex_findCurlyBraces.exec(text) ) {
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

	class ProcessTextSource {
		text:string;
		location:number = 0;
		commands: CommandInfo[] = [];
		outputStrings: string[] = [];
	}

	function consumeCommand(
		source:ProcessTextSource,
		writeOutputString:boolean = true)
		: CommandInfo 
	{
		if (source.commands.length == 0) {
			log("Error in consumeCommand() at", source.location ,"- no more commands to consume.");
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

	function validateNextCommand(source:ProcessTextSource, validCommands:string[]):boolean {
		if (source.commands.length == 0) return false;
		var nextBaseToken = source.commands[0].baseToken;
		return validCommands.indexOf(nextBaseToken) != -1;
	}

	function findNextInstaceOfCommand(source:ProcessTextSource, commandToken:string):CommandInfo {
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
	function eatCommandsUntilToken(source:ProcessTextSource, commandToken:string){
		while(source.commands.length > 0) {
			var c = source.commands[0];
			consumeCommand(source, false);
			if (c.baseToken == commandToken) break;
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
	export function processCommandsInText(sourceText:string):string {
		var source = new ProcessTextSource();
		source.text = sourceText;
		source.commands = findCommandsInText(sourceText);
		// if there are no commands, just return the unmodified source text
		if (source.commands.length == 0) return sourceText;
		while(source.commands.length > 0) {
			var command = consumeCommand(source);
			processCommand(command, source);
		}
		// write remainder
		source.outputStrings.push(source.text.substr(source.location));
		return source.outputStrings.join("");
	}

	function processCommand(commandInfo:CommandInfo, source:ProcessTextSource):void {
		// console.log("Processing Command:", commandInfo.baseToken, commandInfo.argumentString);
		switch (commandInfo.baseToken) {
			case "" : break;

			case "var" : process_var(commandInfo, source); break;
			
			case "setflag" : process_setflag(commandInfo, source); break;
			case "set" : process_set(commandInfo, source); break;
			case "unset" : process_unset(commandInfo, source); break;

			case "if" : process_conditional(commandInfo, source); break;
			case "elif" : process_conditional(commandInfo, source); break;
			case "else" : process_else(commandInfo, source); break;
			
			case "alt" : process_alt(commandInfo, source); break;

			case "inc" : process_inc(commandInfo, source); break;
			case "dec" : process_dec(commandInfo, source); break;
			case "add" : process_add(commandInfo, source); break;
			case "sub" : process_add(commandInfo, source, true); break;

			case "clear" : process_clear(commandInfo, source); break;

			case "func" : process_func(commandInfo, source); break;

			case "embed" : process_embed(commandInfo, source); break;
		}
	}

	function process_setflag(commandInfo:CommandInfo, source:ProcessTextSource):void {
		if (commandInfo.tokens.length < 2) {
			console.log("setflag has too few argumemts:", commandInfo.commandString);
		}
		// default is true {setflag foo} // foo is true
		var value = true;
		if (commandInfo.tokens.length > 2) {
			var parsedArgument = parseFloat(commandInfo.tokens[2]);
			if (!isNaN(parsedArgument)) value = (parsedArgument == 0 ? false : true);
		} 
		Ivy.setFlag(commandInfo.tokens[1], value);
	}

	function process_var(commandInfo:CommandInfo, source:ProcessTextSource):void {
		if (commandInfo.tokens.length < 2) {
			console.log("set has too few argumemts:", commandInfo.commandString);
		}
		var value = 0;
		if (commandInfo.tokens.length > 2) {
			var parsedArgument = parseFloat(commandInfo.tokens[2]);
			if (!isNaN(parsedArgument)) value = parsedArgument;
		} 
		Ivy.setVar(commandInfo.tokens[1], value);
	}

	function process_set(commandInfo:CommandInfo, source:ProcessTextSource):void {
		//  TODO: Validate the key 
		if (commandInfo.tokens.length < 3) {
			console.log("set has too few argumemts:", commandInfo.commandString);
		}
		var variableName = commandInfo.tokens[1];
		var valueToken = commandInfo.tokens[2];
		if (valueToken == "true") {
			Ivy.setFlag(variableName, true);
		} else if (valueToken == "false") {
			Ivy.setFlag(variableName, false);
		} else {
			var value:number = parseFloat(commandInfo.tokens[2]);
			if (isNaN(value)) value = 0;
			Ivy.setVar(commandInfo.tokens[1], value);
		}
	}

	function process_unset(commandInfo:CommandInfo, source:ProcessTextSource):void {
		Ivy.unset(commandInfo.argumentString);
	}

	function process_else(commandInfo:CommandInfo, source:ProcessTextSource):void {
		// in this case we should simply write the rest and then advance to endif
		consumeCommand(source, true);
		// hang on... shouldn't this work already ?
		//eatCommandsUntilToken(source, "endif");
	}	

	function evaluate_condition(argumenString:string):boolean {
		var conditionString = findContentInBrackets(argumenString);
		if (conditionString != null) {
			return Commands.evaluateConditional(conditionString);
		}
		
		// get the token to find out what kind of conditional it is
		var conditionalName = argumenString.split(' ')[0];
		// if the string starts with a "!", we will invert the result
		// should be able to do {if !(blah)} or {if !func blah()}
		var invertResult = false;
		if (conditionalName.substring(0, 1) == '!' ) {
			invertResult = true;
			// remove the "!"
			conditionalName = conditionalName.substring(1);
		}
		var conditionalResult:boolean = false;
		if (conditionalName.substring(0, 1) == "(") {
			console.log("got open bracket. do evaluation...")
		} if (conditionalName == "func") {
			console.log("got func. Call function...")
		} else {
			conditionalResult = Ivy.getFlag(conditionalName);
		}
		conditionalResult = invertResult ? !conditionalResult : conditionalResult;
		return conditionalResult;
	}

	// // this function must be agnistic as to which command initiates it.
	// // It can be called as a result of an if, of an elif
	var validFollowingConditional = ["else", "elif", "endif"];
	function process_conditional(commandInfo:CommandInfo, source:ProcessTextSource):void {
		if (!validateNextCommand(source, validFollowingConditional)){	
			log("Error at", source.location, "- `if` must be immediately followed by else, elif, or endif");
			return;
		}
		var conditionalResult:boolean = false;		
		var conditionalName = commandInfo.tokens[1];
		var conditionalResult = evaluate_condition(commandInfo.argumentString);

		//console.log("conditionalResult of:", conditionalName + ":", conditionalResult);
		if(conditionalResult) {
			var nextCommand = source.commands[0];
			var conditionalContent = source.text.substring(commandInfo.end, nextCommand.start);
			source.outputStrings.push(conditionalContent);
			//console.log("Condition was true. Writing content:", conditionalContent);
			// here we need to advance to the endif to skip elif or else
			// eat up all commands until we hit endif
			eatCommandsUntilToken(source, "endif");
			return;
		} else {
			// advance over the text to the start of the next command
			eatPlaintextToNextCommand(source);
		}
	}

	function process_alt(commandInfo:CommandInfo, source:ProcessTextSource) {
		var altTexts:string[] = commandInfo.argumentString.split('|');
		var selectedAltText:string = altTexts[Math.floor(Math.random() * altTexts.length)];
		source.outputStrings.push(selectedAltText);
	}

	function process_embed(commandInfo:CommandInfo, source:ProcessTextSource) {		
		var id = commandInfo.tokens[1];
		var content = Ivy.nodes.getNodeContent(id);
		if (content) {
			source.outputStrings.push(content);
		}
	}
	
	function removeSubString(str:string, cutStart:number, cutEnd:number) {
		return str.substr(0, cutStart) + str.substr(cutEnd+1);
	}

	function addToVariable(variableName:string, toAdd:number) {
		var value = Ivy.getVar(variableName) + toAdd;
		Ivy.setVar(variableName, value);
	}

	function process_inc(commandInfo:CommandInfo, source:ProcessTextSource):void {
		if (commandInfo.tokens.length < 2) {
			log("Error in inc at", source.location ,"needs second argument");
			return;
		}
		var variableName = commandInfo.tokens[1];
		addToVariable(variableName, 1);
	}

	function process_dec(commandInfo:CommandInfo, source:ProcessTextSource):void {
		if (commandInfo.tokens.length < 2) {
			log("Error in dec at", source.location ,"needs second argument");
			return;
		}
		var variableName = commandInfo.tokens[1];
		addToVariable(variableName, -1);
	}

	function process_add(
		commandInfo:CommandInfo, 
		source:ProcessTextSource, 
		invert:boolean = false):void {
		if (commandInfo.tokens.length < 3) {
			log("Error in inc at", source.location ,"too few arguments.");
			return;
		}
		var toAdd = parseFloat(commandInfo.tokens[2]);
		// invert is used for the sub command
		if (invert) toAdd = -toAdd;
		if (isNaN(toAdd)) {
			console.log("Error - argument was not a number");
		}
		var variableName = commandInfo.tokens[1];
		addToVariable(variableName, toAdd);
	}

	function process_clear(
		commandInfo:CommandInfo, 
		source:ProcessTextSource):void {
		Ivy.clearDisplay();
	}
	
	function process_func(commandInfo:CommandInfo, source:ProcessTextSource):void {
		var functionName = commandInfo.tokens[1];
		functionName = functionName.substr(0, functionName.indexOf('('));
		var returnValue:string= Ivy.callFunction(
			functionName, 
			findContentInBrackets(commandInfo.argumentString));
		if (returnValue) {
			source.outputStrings.push(returnValue);
		}
	}

} // end Ivy.Parse
