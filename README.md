## Ivy

Ivy is a language for writing interactive fiction.

The Ivy syntax is a simple markup around plaintext. 

The parser is written in TypeScript, and runs in the browser.

The syntax is influenced by Inkle's IF language, [Ink](https://github.com/inkle/ink), but it supports hyperlink style links within the text (like those in [Twine](https://twinery.org/)), unlike Ink's option-based system where links can only be placed after the body text of a node.

Ivy runs in the browser, and Ivy text can be formatted using [Markdown](https://daringfireball.net/projects/markdown/syntax).

### Why?

Given how many awesome IF technologies are now available, one might ask why anyone would bother making another one. The answer to this is that Ivy has been a slow-burn project in progress for a number of years, developed in short bursts, often during holidays or after being inspired by some superb piece of interactive fiction, narrative games in general, or by trying out some excellent IF tech. Ivy is a love letter to the Interactive Fiction genre, and a personal education in writing a parser.

For serious IF development, I highly recommend Inkle's [Ink](https://github.com/inkle/ink) language, as well as [Twine](https://twinery.org/), and the more recent entry, [Yarn Spinner](https://www.secretlab.com.au/yarnspinner/).

### Features

- Plaintext format with markup (not an editor / ide)
- Hyperlink-style interactable links within body text
- Variables and Flags
- Basic math operations
- Conditionals with basic expression evaluation
- Bind and call javascript functions
- Persistent state
- Supports Markdown text formatting
- MIT License

### License

Ivy is licensed under the MIT License.

Ivy also depends on jquery, jquery.scrollTo.js, marked.js, and jstorage.js, which all have their own MIT-style licenses.

### How to use Ivy

The easiest way to get started writing Ivy stories is to simply clone the `www` directory containing the sample story. This template is all you need to create an entire Ivy story. The html file will run in a browser just by double clicking.

### Bulding

If you want to rebuild the library from source, install the [typescript](https://www.typescriptlang.org/) compiler, and run the build_typescript.sh script, or just build directly with:

```tsc --out ./www/js/ivy.js ./ts/Ivy.ts```

## Syntax

Nodes are indicated with `===` symbol, followed by a node name.

=== name_of_node

The `[red door](some_other_node)` leads to another node.

=== some_other_node

This is another node.

### Link Types

Expiring node, link can only be used once (default behaviour):

`[Link text](node_name)`

Non-expiring node, can be traversed many times:

`[Link text](+node_name)`

Explicitly expiring node (for if default is non-expiring):

`[Link text](-node_name)`

Fallback node, will only display when all expiring nodes are depleted...

`[Link text](~node_name)`

### Embed

Embed the content of another node inside the current one:

`{embed node_id}`

### Flags

`{setflag flag_name}`         - set true

`{unset flag_name}`           - delete flag (will evaluate to false)

`{set flag_name true}`        - set true

`{set flag_name false}`       - set false

`{set flag_name 1}`           - set true

`{set flag_name 0}`           - set false

### Variables

`{var variable_name}`         - initialise variable to 0
 
`{set variable_name 10}`      - initialise variable to 10

`{unset variable_name}`       - delete variable (will evaluate to 0)

### Basic Math

`{inc variable_name}`         - increment variable by 1

`{dec variable_name}`         - decrement increment by 1

`{add variable_name 10}`      - add 10 to variable

`{sub variable_name 10}`      - subtract 10 from variable

### Conditionals

`{if flag_name}`  

This text will be displayed if flag is true

`{elif flag2_name}`

This text will be displayed if flag2 is true

`{else}`

This will be displayed if flag and flag2 are both false

`{endif}`

### Conditional Expressions

`{if (var_name >= 5)}`

Display text...

`{elif (var_name == 55)}`

Display text...

`{endif}`

### Variants within text

This is a `{alt short|boring|precise|mysterious|shifty}` sentence.

### Clear the Screen

To clear the text of the story displayed so far:

`{clear}`

### Calling custom JavaScript functions

Javascript functions can be bound to custom Ivy commands using the `Ivy.registerFunction()` function.

Javascript functions can be used to generate passages of text, or perform other more complex logic outside the scope of Ivy's own basic scripting capabilities.

Attach custom function to Ivy (within javascript context):

`Ivy.registerFunction(function(argumentString){});`

Call the funcion from the Ivy story:

`{if func myCustomFunction(arg1, arg2)}`

The arguments are sent to the javascript function:

`{func myCustomFunction(20, 23, variable_name)}`

The javascript function has a matching signature: 

```
function myCustomFunction (a, b, c) {
    console.log("arguments:", a, b, c);
}
```

## Example Story Script

This example shows the most basic useage, with links from one node to another.

```
=== start

There are two doors.

The `[red door](red_door)` is rusted and hot to the touch.

The `[blue door](blue_door)` is cool, and coated with condensation.

=== red_door

As the red door opens, a blast of hot air pours through, and orange light floods the hallway.

...

=== blue_door

A freezing mist flows out into the hall, and frost immediately begins to form on the floor and the walls.

...

```

## Author

Ivy was written in New Zealand, by Lee Grey.

[@mothteeth](https://twitter.com/mothteeth)

