// Generated from sfcParser.g4 by ANTLR 4.7.1
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by sfcParser.
function sfcParserListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

sfcParserListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
sfcParserListener.prototype.constructor = sfcParserListener;

// Enter a parse tree produced by sfcParser#sfcFile.
sfcParserListener.prototype.enterSfcFile = function(ctx) {
};

// Exit a parse tree produced by sfcParser#sfcFile.
sfcParserListener.prototype.exitSfcFile = function(ctx) {
};


// Enter a parse tree produced by sfcParser#template.
sfcParserListener.prototype.enterTemplate = function(ctx) {
};

// Exit a parse tree produced by sfcParser#template.
sfcParserListener.prototype.exitTemplate = function(ctx) {
};


// Enter a parse tree produced by sfcParser#script.
sfcParserListener.prototype.enterScript = function(ctx) {
};

// Exit a parse tree produced by sfcParser#script.
sfcParserListener.prototype.exitScript = function(ctx) {
};


// Enter a parse tree produced by sfcParser#style.
sfcParserListener.prototype.enterStyle = function(ctx) {
};

// Exit a parse tree produced by sfcParser#style.
sfcParserListener.prototype.exitStyle = function(ctx) {
};



exports.sfcParserListener = sfcParserListener;