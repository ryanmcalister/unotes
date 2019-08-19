/**
 * A custom remark plugin to format markdown 
 */

var repeat = require('repeat-string')
var streak = require('longest-streak')
var pad = require('./pad')
var count = require('ccount')
var lineFeed = '\n'
var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var leftParenthesis = '('
var rightParenthesis = ')'
var exclamationMark = '!'
var lessThan = '<'
var greaterThan = '>'

var expression = /\s/

var quotationMark = '"'
var apostrophe = "'"

// Expression for a protocol:
// See <http://en.wikipedia.org/wiki/URI_scheme#Generic_syntax>.
var protocol = /^[a-z][a-z+.-]+:\/?/i
var lowercaseX = 'x'

var ceil = Math.ceil
var blank = lineFeed + lineFeed

var tabSize = 4

var opts

// Wrap `url` in angle brackets when needed, or when
// forced.
// In links, images, and definitions, the URL part needs
// to be enclosed when it:
//
// - has a length of `0`
// - contains white-space
// - has more or less opening than closing parentheses
function enclose_uri(uri, always) {
    if (
        always ||
        uri.length === 0 ||
        expression.test(uri) ||
        count(uri, leftParenthesis) !== count(uri, rightParenthesis)
    ) {
        return lessThan + uri + greaterThan
    }

    return uri
}

function enclose_title(title) {
    var delimiter =
        title.indexOf(quotationMark) === -1 ? quotationMark : apostrophe
    return delimiter + title + delimiter
}


module.exports = plugin

function plugin(options) {
    opts = options;
    if (opts.listItemTabSize) {
        tabSize = Math.min(Math.max(opts.listItemTabSize, 1), 8)
    }

    return function () {
        var Compiler = this.Compiler
        var visitors = Compiler.prototype.visitors
        Compiler.prototype.setOptions.escape = function(txt){ return txt; };
        
        visitors.listItem = listItem
        visitors.link = link
        visitors.code = code
        visitors.image = image
        visitors.text = text
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

function link(node) {
    var self = this
    var content = self.encode(node.url || '', node)
    var exit = self.enterLink()
    var value = self.all(node).join('')

    exit()

    if (content === value && protocol.test(content)) {
        // Backslash escapes do not work in autolinks, so we do not escape.
        return enclose_uri(self.encode(node.url), true)
    }

    content = enclose_uri(content)

    if (node.title) {
        content += space + enclose_title(self.encode(node.title, node))
    }

    return (
        leftSquareBracket +
        value +
        rightSquareBracket +
        leftParenthesis +
        content +
        rightParenthesis
    )
}

function code(node, parent) {
    var self = this
    var value = node.value
    var options = self.options
    var marker = options.fence
    var info = node.lang || ''
    var fence
  
    if (info && node.meta) {
      info += space + node.meta
    }
  
    info = self.encode(info)
  
    // Without (needed) fences.
    if (!info && !options.fences && value) {
      // Throw when pedantic, in a list item which isn’t compiled using a tab.
      if (
        parent &&
        parent.type === 'listItem' &&
        options.listItemIndent !== 'tab' &&
        options.pedantic
      ) {
        self.file.fail(
          'Cannot indent code properly. See https://git.io/fxKR8',
          node.position
        )
      }
  
      return pad(value, 1)
    }
  
    fence = repeat(marker, Math.max(streak(value, marker) + 1, 3))
  
    return fence + info + lineFeed + value + lineFeed + fence
  }

  function image(node) {
    var self = this
    var content = enclose_uri(self.encode(node.url || '', node))
    var exit = self.enterLink()
    var alt = self.encode(node.alt || '')
  
    exit()
  
    if (node.title) {
      content += space + enclose_title(self.encode(node.title, node))
    }
  
    return (
      exclamationMark +
      leftSquareBracket +
      alt +
      rightSquareBracket +
      leftParenthesis +
      content +
      rightParenthesis
    )
  }

  function text(node, parent) {
    return this.encode(node.value, node)
  }


