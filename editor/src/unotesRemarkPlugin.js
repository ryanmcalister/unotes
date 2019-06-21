/**
 * A custom remark plugin to format markdown 
 */

var repeat = require('repeat-string')
var pad = require('./pad')
var lineFeed = '\n'
var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var lowercaseX = 'x'

var ceil = Math.ceil
var blank = lineFeed + lineFeed

var tabSize = 4

var opts

module.exports = plugin

function plugin(options) {
    opts = options;
    if(opts.listItemTabSize){
        tabSize = Math.min(Math.max(opts.listItemTabSize, 1), 8)
    }

    return function() {
        var Compiler = this.Compiler
        var visitors = Compiler.prototype.visitors

        visitors.listItem = listItem
    }
}

function listItem(node, parent, position, bullet) {
    var self = this
    var style = self.options.listItemIndent
    var marker = bullet || self.options.bullet
    var spread = node.spread == null ? true : node.spread
    var checked = node.checked
    var children = node.children
    var length = children.length
    var values = []
    var index = -1
    var value
    var indent
    var spacing

    while (++index < length) {
        values[index] = self.visit(children[index], node)
    }

    value = values.join(spread ? blank : lineFeed)

    if (typeof checked === 'boolean') {

        value =
            leftSquareBracket +
            (checked ? lowercaseX : space) +
            rightSquareBracket +
            space +
            value
    }

    if (style === '1' || (style === 'mixed' && value.indexOf(lineFeed) === -1)) {
        indent = marker.length + 1
        spacing = space

    } else if (typeof opts.listItemSpace === 'number') {
        indent = ceil((marker.length + 1) / tabSize) * tabSize
        spacing = repeat(space, opts.listItemSpace)

    } else {
        indent = ceil((marker.length + 1) / tabSize) * tabSize
        spacing = repeat(space, indent - marker.length)
    }

    return value
        ? marker + spacing + pad(value, indent / tabSize, tabSize).slice(indent)
        : marker
}

