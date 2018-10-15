module Ivy.Commands {
    
    /// evaluate a string as either a numeric value or a variable
    export function evaluateValueArgument(s:string):any {
        if ($.isNumeric(s)) {
            return parseFloat(s);
        } else if (/"/.test(s)){
            return s.match(/"(.*?)"/)[1];    
        } else if (/'/.test(s)){
            return s.match(/'(.*?)'/)[1];
        } else {
            return Ivy.getVar(s);
        }
    }

    // TODO: suppor && and || by splitting into multiple evaluations.. (?)
    // NOTE: the single character comparitors need to 
    // go at the end to avoid false positive
    // (same goes for strings containing eachother)
    var validComparitors:string[] = ["<=", ">=", "==", "<", ">", "lessorequal", "greaterorequal", "equal", "greater", "less"];
    export function evaluateConditional(expression:string):boolean {        
        var operator = null;
        var tokens = null;
        var foundMatch = false;
        // fix browswer encodings of less than and greater than symbols
        // (required when pulling content from a <div> or <pre> block)
        expression = expression.replace("&gt;", ">");
        expression = expression.replace("&lt;", "<");
        for(var i = 0; i < validComparitors.length; i++) {
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
            switch(operator)
            {
                case "less":
                case "<" : result = value1 < value2; break;
                case "greater":
                case ">" : result = value1 > value2; break;
                case "lessorequal":
                case "<=" : result = value1 <= value2; break;
                case "greaterorequal":
                case ">=" : result = value1 >= value2; break;
                case "equal":
                case "==" : result = value1 == value2; break;
                default: result = false;
            }
        }
        return result;
    }
}