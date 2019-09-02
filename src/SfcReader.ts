import fs from 'fs';
import antlr4 from 'antlr4';
import { sfcLexer } from './lib/sfcLexer';
import { sfcParser } from './lib/sfcParser';
import { sfcParserListener } from './lib/sfcParserListener';

import SfcStruct from './SfcStruct';
import transform from './Transform';

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

function getCode(filePath: string) {
    const code = fs.readFileSync(filePath).toString();
    const stream = new antlr4.InputStream(code);
    const lexer = new sfcLexer(stream);
    // @ts-ignore
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new sfcParser(tokens);
    // @ts-ignore
    parser.buildParseTrees = true;

    const tree = parser.sfcFile();
    const listener = new sfcParserListener();

    let template = '', script = '';
    const styles: {
        code: string,
        isScoped: boolean
    }[] = [];

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

    // @ts-ignore
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);
    return { template, script, styles };
}

export default function(filePath: string, className: string, config: any) {
    const { template, script, styles } = getCode(filePath);
    let code = script;
    if (code) {
        const struct = new SfcStruct(code);
        code = transform(className, struct, config);
    }
    return {
        template,
        script: code,
        styles
    };
}
