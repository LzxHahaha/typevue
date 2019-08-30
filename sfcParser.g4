parser grammar sfcParser;

options {
    tokenVocab=sfcLexer;
}

sfcFile: template WS* script WS* style*;

template: TEMPLATE;

script: SCRIPT;

style: STYLE;
