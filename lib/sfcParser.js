// Generated from sfcParser.g4 by ANTLR 4.7.1
// jshint ignore: start
var antlr4 = require('antlr4/index');
var sfcParserListener = require('./sfcParserListener').sfcParserListener;
var grammarFileName = "sfcParser.g4";

var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0003\u0006%\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004\u0004\t",
    "\u0004\u0004\u0005\t\u0005\u0003\u0002\u0003\u0002\u0007\u0002\r\n\u0002",
    "\f\u0002\u000e\u0002\u0010\u000b\u0002\u0003\u0002\u0003\u0002\u0007",
    "\u0002\u0014\n\u0002\f\u0002\u000e\u0002\u0017\u000b\u0002\u0003\u0002",
    "\u0007\u0002\u001a\n\u0002\f\u0002\u000e\u0002\u001d\u000b\u0002\u0003",
    "\u0003\u0003\u0003\u0003\u0004\u0003\u0004\u0003\u0005\u0003\u0005\u0003",
    "\u0005\u0002\u0002\u0006\u0002\u0004\u0006\b\u0002\u0002\u0002#\u0002",
    "\n\u0003\u0002\u0002\u0002\u0004\u001e\u0003\u0002\u0002\u0002\u0006",
    " \u0003\u0002\u0002\u0002\b\"\u0003\u0002\u0002\u0002\n\u000e\u0005",
    "\u0004\u0003\u0002\u000b\r\u0007\u0006\u0002\u0002\f\u000b\u0003\u0002",
    "\u0002\u0002\r\u0010\u0003\u0002\u0002\u0002\u000e\f\u0003\u0002\u0002",
    "\u0002\u000e\u000f\u0003\u0002\u0002\u0002\u000f\u0011\u0003\u0002\u0002",
    "\u0002\u0010\u000e\u0003\u0002\u0002\u0002\u0011\u0015\u0005\u0006\u0004",
    "\u0002\u0012\u0014\u0007\u0006\u0002\u0002\u0013\u0012\u0003\u0002\u0002",
    "\u0002\u0014\u0017\u0003\u0002\u0002\u0002\u0015\u0013\u0003\u0002\u0002",
    "\u0002\u0015\u0016\u0003\u0002\u0002\u0002\u0016\u001b\u0003\u0002\u0002",
    "\u0002\u0017\u0015\u0003\u0002\u0002\u0002\u0018\u001a\u0005\b\u0005",
    "\u0002\u0019\u0018\u0003\u0002\u0002\u0002\u001a\u001d\u0003\u0002\u0002",
    "\u0002\u001b\u0019\u0003\u0002\u0002\u0002\u001b\u001c\u0003\u0002\u0002",
    "\u0002\u001c\u0003\u0003\u0002\u0002\u0002\u001d\u001b\u0003\u0002\u0002",
    "\u0002\u001e\u001f\u0007\u0003\u0002\u0002\u001f\u0005\u0003\u0002\u0002",
    "\u0002 !\u0007\u0004\u0002\u0002!\u0007\u0003\u0002\u0002\u0002\"#\u0007",
    "\u0005\u0002\u0002#\t\u0003\u0002\u0002\u0002\u0005\u000e\u0015\u001b"].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

var sharedContextCache = new antlr4.PredictionContextCache();

var literalNames = [  ];

var symbolicNames = [ null, "TEMPLATE", "SCRIPT", "STYLE", "WS" ];

var ruleNames =  [ "sfcFile", "template", "script", "style" ];

function sfcParser (input) {
	antlr4.Parser.call(this, input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = ruleNames;
    this.literalNames = literalNames;
    this.symbolicNames = symbolicNames;
    return this;
}

sfcParser.prototype = Object.create(antlr4.Parser.prototype);
sfcParser.prototype.constructor = sfcParser;

Object.defineProperty(sfcParser.prototype, "atn", {
	get : function() {
		return atn;
	}
});

sfcParser.EOF = antlr4.Token.EOF;
sfcParser.TEMPLATE = 1;
sfcParser.SCRIPT = 2;
sfcParser.STYLE = 3;
sfcParser.WS = 4;

sfcParser.RULE_sfcFile = 0;
sfcParser.RULE_template = 1;
sfcParser.RULE_script = 2;
sfcParser.RULE_style = 3;

function SfcFileContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sfcParser.RULE_sfcFile;
    return this;
}

SfcFileContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
SfcFileContext.prototype.constructor = SfcFileContext;

SfcFileContext.prototype.template = function() {
    return this.getTypedRuleContext(TemplateContext,0);
};

SfcFileContext.prototype.script = function() {
    return this.getTypedRuleContext(ScriptContext,0);
};

SfcFileContext.prototype.WS = function(i) {
	if(i===undefined) {
		i = null;
	}
    if(i===null) {
        return this.getTokens(sfcParser.WS);
    } else {
        return this.getToken(sfcParser.WS, i);
    }
};


SfcFileContext.prototype.style = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(StyleContext);
    } else {
        return this.getTypedRuleContext(StyleContext,i);
    }
};

SfcFileContext.prototype.enterRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.enterSfcFile(this);
	}
};

SfcFileContext.prototype.exitRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.exitSfcFile(this);
	}
};




sfcParser.SfcFileContext = SfcFileContext;

sfcParser.prototype.sfcFile = function() {

    var localctx = new SfcFileContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, sfcParser.RULE_sfcFile);
    var _la = 0; // Token type
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 8;
        this.template();
        this.state = 12;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while(_la===sfcParser.WS) {
            this.state = 9;
            this.match(sfcParser.WS);
            this.state = 14;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
        }
        this.state = 15;
        this.script();
        this.state = 19;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while(_la===sfcParser.WS) {
            this.state = 16;
            this.match(sfcParser.WS);
            this.state = 21;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
        }
        this.state = 25;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while(_la===sfcParser.STYLE) {
            this.state = 22;
            this.style();
            this.state = 27;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function TemplateContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sfcParser.RULE_template;
    return this;
}

TemplateContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
TemplateContext.prototype.constructor = TemplateContext;

TemplateContext.prototype.TEMPLATE = function() {
    return this.getToken(sfcParser.TEMPLATE, 0);
};

TemplateContext.prototype.enterRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.enterTemplate(this);
	}
};

TemplateContext.prototype.exitRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.exitTemplate(this);
	}
};




sfcParser.TemplateContext = TemplateContext;

sfcParser.prototype.template = function() {

    var localctx = new TemplateContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, sfcParser.RULE_template);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 28;
        this.match(sfcParser.TEMPLATE);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ScriptContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sfcParser.RULE_script;
    return this;
}

ScriptContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ScriptContext.prototype.constructor = ScriptContext;

ScriptContext.prototype.SCRIPT = function() {
    return this.getToken(sfcParser.SCRIPT, 0);
};

ScriptContext.prototype.enterRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.enterScript(this);
	}
};

ScriptContext.prototype.exitRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.exitScript(this);
	}
};




sfcParser.ScriptContext = ScriptContext;

sfcParser.prototype.script = function() {

    var localctx = new ScriptContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, sfcParser.RULE_script);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 30;
        this.match(sfcParser.SCRIPT);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function StyleContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sfcParser.RULE_style;
    return this;
}

StyleContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
StyleContext.prototype.constructor = StyleContext;

StyleContext.prototype.STYLE = function() {
    return this.getToken(sfcParser.STYLE, 0);
};

StyleContext.prototype.enterRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.enterStyle(this);
	}
};

StyleContext.prototype.exitRule = function(listener) {
    if(listener instanceof sfcParserListener ) {
        listener.exitStyle(this);
	}
};




sfcParser.StyleContext = StyleContext;

sfcParser.prototype.style = function() {

    var localctx = new StyleContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, sfcParser.RULE_style);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 32;
        this.match(sfcParser.STYLE);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


exports.sfcParser = sfcParser;
