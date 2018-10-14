module Ivy {
	export function stripWhitespace(s:string):string {
		return s.replace(/\s/g,'');
	}
        
	export function findContentInBrackets(s:string) {
		var matches = s.match(/\(([^)]+)\)/);
		if (matches != null && matches.length > 1) return matches[1];
		return null;
	}
}