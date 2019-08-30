const fs = require('fs');
const antlr4 = require('antlr4');
const { sfcLexer } = require('./lib/sfcLexer');
const { sfcParser } = require('./lib/sfcParser');
const { sfcParserListener } = require('./lib/sfcParserListener');

const resolver = require('./resolver');
const transform = require('./transform');

function removeTag(code = '') {
    if (!code) {
        return code;
    }

    let i = 0, j = code.length - 1;
    while (i < code.length && code[i] !== '>') {
        ++i;
    }
    while (j >= 0 && code[j] !== '<') {
        --j;
    }
    return code.substring(i + 1, j).trim();
}

function getCode(filePath) {
    const code = fs.readFileSync(filePath).toString();
    const stream = new antlr4.InputStream(code);
    const lexer = new sfcLexer(stream);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new sfcParser(tokens);
    parser.buildParseTrees = true;

    const tree = parser.sfcFile();
    const listener = new sfcParserListener();

    let template = '', script = '', styles = [];

    listener.enterTemplate = function(ctx) {
        template = ctx.getText().trim();
    }
    listener.enterScript = function(ctx) {
        script = removeTag(ctx.getText().trim());
    }
    listener.enterStyle = function(ctx) {
        const code = ctx.getText().trim();
        styles.push({
            code: removeTag(code),
            isScoped: /<style[^>]*scoped[^>]*>/.test(code)
        });
    }

    antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);
    return { template, script, styles };
}

module.exports = function(filePath, className, config) {
    const { template, script, styles } = getCode(filePath);
    try {
        let code = script;
        if (code) {
            const struct = resolver(code);
            code = transform(className, struct, config);
        }
        return {
            template,
            script: code,
            styles
        }
    } catch (e) {
        console.error(e);
    }
}
