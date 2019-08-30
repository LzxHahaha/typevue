const t = require('babel-types');
const traverse = require('babel-traverse').default;
const babylon = require('babylon');

module.exports = function(code) {
    const ast = babylon.parse(code, {
        sourceType: 'module',
    });
    const state = {
        code,
        globals: [],
        imports: {
            // for import 'xxx';
            0: []
        },
        components: [],
        mixins: [],
        props: [],
        data: [],
        computed: {},
        watchers: {},
        filters: '',
        directives: '',
        methods: [],
        hooks: [],
        // init scoped values in constructor
        init: [],
    };
    traverse(ast, fileVisitor, null, state);
    // delete state.code;
    // console.log(JSON.stringify(state));
    return state;
}

const hooksNames = new Set([
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'activated',
    'deactivated',
    'beforeDestroy',
    'destroyed',
    'errorCaptured',
]);

const fileVisitor = {
    ImportDeclaration(nodePath, state) {
        const source = nodePath.node.source.value;
        if (!nodePath.node.specifiers.length) {
            state.imports[0].push(source);
            return;
        }
        nodePath.node.specifiers.forEach(specifier => {
            const name = specifier.local.name;
            const importDefine = { source };
            if (t.isImportDefaultSpecifier(specifier)) {
                importDefine.type = 'default';
            } else if (t.isImportNamespaceSpecifier(specifier)) {
                importDefine.type = 'namespace';
            } else if (t.isImportSpecifier(specifier)) {
                const sourceName = specifier.imported.name;
                if (sourceName !== name) {
                    importDefine.souceName = sourceName;
                }
                importDefine.type = 'specifier';
            }
            state.imports[name]= importDefine;
        });
    },
    VariableDeclaration(nodePath, state) {
        state.globals.push(state.code.substring(nodePath.node.start, nodePath.node.end));
    },
    ExpressionStatement(nodePath, state) {
        state.globals.push(state.code.substring(nodePath.node.start, nodePath.node.end));
    },
    ExportDefaultDeclaration(nodePath, state) {
        nodePath.traverse(defineVisitor, state);
        nodePath.stop();
    }
};

const defineVisitor = {
    // Vue component define
    ObjectProperty(nodePath, state) {
        const { node } = nodePath;
        const { key, loc } = node;
        switch (key.name) {
            case 'mixins':
                state.mixins.push(...node.value.elements.map(el => el.name));
                break;
            case 'filters':
                state.filters = state.code.substring(node.value.start, node.value.end);
                break;
            case 'directives':
                state.directives = state.code.substring(node.value.start, node.value.end);
                break;
            case 'components':
                nodePath.traverse(componentsVisitor, state);
                break;
            case 'props':
                nodePath.traverse(propsVisitor, state);
                break;
            case 'computed':
                nodePath.traverse(computedVisitor, state);
                break;
            case 'watch':
                nodePath.traverse(watchVisitor, state);
                break;
            case 'methods':
                nodePath.traverse(methodsVisitor, state);
                break;
            default:
                console.error(`Unknown property: ${key.name} at ${loc.start.line}:${loc.start.column}`);
                break;
        }
        nodePath.skip();
    },
    // data & life cycle
    ObjectMethod(nodePath, state) {
        const { key, loc, start, end } = nodePath.node;
        if (key.name === 'data') {
            let vars = [];
            nodePath.node.body.body.forEach((node) => {
                if (t.isReturnStatement(node)) {
                    const varReg = vars.length ? new RegExp(vars.join('|')) : null;
                    node.argument.properties.forEach((el) => {
                        const name = el.key.name;
                        const value = state.code.substring(el.value.start, el.value.end);
                        const lazy = varReg ? varReg.test(value) : false;
                        state.data.push({
                            name,
                            value,
                            lazy,
                            type: getValueType(value)
                        });
                    });
                } else {
                    if (t.isVariableDeclaration(node)) {
                        vars = vars.concat(node.declarations.map(el => el.id.name));
                    }
                    state.init.push(state.code.substring(node.start, node.end));
                }
            });
            
            nodePath.skip();
        } else if (hooksNames.has(key.name)) {
            state.hooks.push(state.code.substring(start, end));
        } else {
            console.error(`Unknown method: ${key.name} at ${loc.start.line}:${loc.start.column}`);
        }
    }
};

const componentsVisitor = {
    // components: { comp1, comp2 }
    ObjectProperty(nodePath, state) {
        state.components.push(nodePath.node.key.name);
    }
};

const propsVisitor = {
    ObjectProperty(nodePath, state) {
        const { node } = nodePath;
        const name = node.key.name;
        if (t.isIdentifier(node.value)) {
            state.props.push({
                name,
                type: node.value.name
            });
        } else {
            const prop = { name };
            // get prop define
            node.value.properties.forEach((el) => {
                const key = el.key.name;
                if (t.isObjectProperty(el)) {
                    const { value } = el;
                    if (t.isIdentifier(value)) {
                        prop[key] = value.name;
                    } else if (t.isArrowFunctionExpression(value) || t.isFunctionExpression(value)) {
                        // `default: () => ...` or `default: function() { ... }`
                        prop[key] = getFunctionDefine(value, state, true);
                    }
                } else if (t.isObjectMethod(el)) {
                    // `default() { ... }`
                    prop[key] = getFunctionDefine(el, state, true);
                }
            });
            state.props.push(prop);
        }
        nodePath.skip();
    },
    ArrayExpression(nodePath, state) {
        nodePath.node.elements.forEach(el => state.props.push({
            name: el.value,
            type: 'any'
        }));
        nodePath.skip();
    }
};

const computedVisitor = {
    ObjectProperty(nodePath, state) {
        const { node } = nodePath;
        const key = node.key.name;
        if (t.isFunctionExpression(node.value)) {
            state.computed[key] = {
                get: getFunctionDefine(node.value, state)
            };
        } else {
            state.computed[key] = {};
            node.value.properties.forEach((el) => {
                const method = el.key.name;
                // TODO: ObjectMethod
                if (method === 'get' || method === 'set') {
                    if (t.isObjectProperty(el)) {
                        state.computed[key][method] = getFunctionDefine(el.value, state);
                    } else if (t.isObjectMethod(el)) {
                        state.computed[key][method] = getFunctionDefine(el, state);
                    }
                }
            });
        }
        nodePath.skip();
    },
    ObjectMethod(nodePath, state) {
        const { node } = nodePath;
        const key = node.key.name;
        state.computed[key] = {
            get: getFunctionDefine(node, state)
        };
        nodePath.skip();
    },
};

const watchVisitor = {
    ObjectProperty(nodePath, state) {
        nodePath.traverse(watchDefineVisitor, state);
        nodePath.skip();
    },
    ObjectMethod(nodePath, state) {
        const { node } = nodePath;
        const key = node.key.name;
        initWatcher(state, key);
        state.watchers[key].push({
            handler: getFunctionDefine(node, state)
        });
        nodePath.skip();
    },
};

const watchDefineVisitor = {
    FunctionExpression(nodePath, state) {
        const { node } = nodePath;
        const key = getWatcherDefindKey(nodePath);
        initWatcher(state, key);
        state.watchers[key].push({
            handler: getFunctionDefine(node, state)
        });

        nodePath.skip();
    },
    StringLiteral(nodePath, state) {
        const { node } = nodePath;
        if (node.key !== 'value') {
            return;
        }
        const key = getWatcherDefindKey(nodePath);
        initWatcher(state, key);
        state.watchers[key].push({
            handlerName: node.value
        });
        nodePath.skip();
    },
    ObjectExpression(nodePath, state) {
        const { node } = nodePath;
        const key = getWatcherDefindKey(nodePath);
        initWatcher(state, key);

        const watcher = {};
        node.properties.forEach((el) => {
            const name = el.key.name;
            if (name === 'handler') {
                if (t.isFunctionExpression(el.value)) {
                    watcher.handler = getFunctionDefine(el.value, state);
                } else if (t.isStringLiteral(el.value)) {
                    watcher.handlerName = el.value.value;
                } else {
                    console.error(`Unkonwn watcher handler ${name} at ${el.loc.line}:${el.loc.column}`);
                }
            } else if (name === 'deep' || name === 'immediate') {
                if (!watcher.options) {
                    watcher.options = {};
                }
                watcher.options[name] = el.value.value;
            } else {
                console.error(`Unkonwn watcher prop ${name} at ${el.loc.line}:${el.loc.column}`);
            }
        });
        state.watchers[key].push(watcher);

        nodePath.skip();
    }
};

const methodsVisitor = {
    ObjectProperty(nodePath, state) {
        const { key, value } = nodePath.node;
        if (t.isArrowFunctionExpression(value) || t.isFunctionExpression(value)) {
            state.methods.push({
                name: key.name,
                handler: getFunctionDefine(value, state)
            });
        } else {
            state.methods.push({
                name: key.name,
                value: state.code.substring(value.start, value.end)
            });
        }
        nodePath.skip();
    },
    ObjectMethod(nodePath, state) {
        const { key } = nodePath.node;
        state.methods.push({
            name: key.name,
            handler: getFunctionDefine(nodePath.node, state)
        });
        nodePath.skip();
    },
};

function getValueType(valueStr) {
    if (!valueStr) {
        return 'any';
    }
    if (valueStr[0] === '[') {
        return 'any[]';
    }
    if (valueStr === 'null' || valueStr === 'undefined' || valueStr[0] === '{' || /a-z/i.test(valueStr[0])) {
        return 'any';
    }
    return null;
}

function getWatcherDefindKey(nodePath) {
    let key = '';
    if (t.isObjectProperty(nodePath.parent)) {
        if (t.isIdentifier(nodePath.parent.key)) {
            key = nodePath.parent.key.name;
        } else {
            key = nodePath.parent.key.value;
        }
    } else if (t.isArrayExpression(nodePath.parent)) {
        key = nodePath.parentPath.parent.key.name;
    } else {
        const { line, column } = nodePath.node.loc;
        throw new Error(`Unknown wather define at ${line}:${column}`);
    }
    return key;
}

function initWatcher(state, key) {
    if (!state.watchers[key]) {
        state.watchers[key] = [];
    }
}

function getFunctionDefine(node, state, clearBreak) {
    let body = state.code.substring(node.body.start, node.body.end).trim();
    if (clearBreak) {
        body = body.replace(/\n */g, ' ');
    }
    return {
        params: node.params.map(param => param.name),
        body,
        isArrow: t.isArrowFunctionExpression(node),
        async: node.async,
        generator: node.generator
    };
}
