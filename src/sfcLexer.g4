lexer grammar sfcLexer;

TEMPLATE: TEMPLATE_OPEN (TEMPLATE|.)*? TEMPLATE_CLOSE;

fragment TEMPLATE_OPEN: '<template>';
fragment TEMPLATE_CLOSE: '</template>';

SCRIPT: SCRIPT_OPEN .*? SCRIPT_CLOSE;

fragment SCRIPT_OPEN: '<script>';
fragment SCRIPT_CLOSE: '</script>';

STYLE: STYLE_OPEN .*? STYLE_CLOSE;

fragment STYLE_OPEN: '<style' ~'>'* '>';
fragment STYLE_CLOSE: '</style>';

WS: (' '|'\t'|'\r'? '\n')+ -> skip;
