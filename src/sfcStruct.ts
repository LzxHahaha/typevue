import * as t from 'babel-types';
import traverse, { NodePath } from 'babel-traverse';
import * as babylon from 'babylon';

export enum ImportType {
    Specifier,
    Namespace,
    Default
}

export interface ImportDefines {
    [key: string]: {
        source: string;
        sourceName?: string;
        type: ImportType;
    };
}

export interface FunctionDefine {
    params: string[],
    body: string,
    isArrow: boolean,
    async: boolean,
    generator: boolean,
}

export interface PropDefine {
    name: string,
    type?: string,
    default?: FunctionDefine | string;
}

export interface DataDefine {
    name: string;
    value: string;
    lazy: boolean;
    type?: string;
}

export interface ComputedDefine {
    [key: string]: {
        get?: FunctionDefine;
        set?: FunctionDefine;
    };
}

export interface WatcherItem {
    handler?: FunctionDefine;
    handlerName?: string;
    options?: {
        immediate?: boolean;
        deep?: boolean;
    }
}

export interface WatcherDefine {
    [key: string]: WatcherItem[];
}

export interface MethodDefine {
    name: string;
    handler?: FunctionDefine;
    value?: string;
    isWatcher?: boolean;
}

export default class SfcStruct {
    public isVueComponent = false;
    public globals: string[] = [];
    public directImport: string[] = [];
    public imports: ImportDefines = {};
    public components: string[] = [];
    public mixins: string[] = [];
    public props: PropDefine[] = [];
    public data: DataDefine[] = [];
    public computed: ComputedDefine = {};
    public watchers: WatcherDefine = {};
    public filters = '';
    public directives = '';
    public methods: MethodDefine[] = [];
    public hooks: string[] = [];
    // init scoped values in constructor
    public init: string[] = [];

    constructor(public code: string) {
        const ast = babylon.parse(code, {
            sourceType: 'module',
            plugins: [
                'objectRestSpread',
            ]
        });
        traverse(ast, fileVisitor, undefined, this);
    }

    public getSourceCode(node: t.Node) {
        return this.code.substring(node.start, node.end);
    }

    public initWatcher(key: string) {
        if (!this.watchers[key]) {
            this.watchers[key] = [];
        }
    }
    
    public getFunctionDefine(
        node: t.ArrowFunctionExpression | t.FunctionExpression | t.ObjectMethod,
        clearBreak: boolean = false
    ): FunctionDefine {
        let body = this.getSourceCode(node.body).trim();
        if (clearBreak) {
            body = body.replace(/\n */g, ' ');
        }
        return {
            params: node.params.map(param => this.getSourceCode(param)),
            body,
            isArrow: t.isArrowFunctionExpression(node),
            async: node.async,
            generator: node.generator
        };
    }
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

const fileVisitor =  {
    Program(nodePath: NodePath<t.Program>, state: SfcStruct) {
        nodePath.node.body.forEach((node) => {
            if (t.isImportDeclaration(node) || t.isExportDefaultDeclaration(node)) {
                return;
            }
            state.globals.push(state.getSourceCode(node));
        });
    },
    ImportDeclaration(nodePath: NodePath<t.ImportDeclaration>, state: SfcStruct) {
        const source = nodePath.node.source.value;
        if (!nodePath.node.specifiers.length) {
            state.directImport.push(source);
            return;
        }
        nodePath.node.specifiers.forEach(specifier => {
            const name = specifier.local.name;
            let type: ImportType, sourceName = undefined;
            if (t.isImportDefaultSpecifier(specifier)) {
                type = ImportType.Default;
            } else if (t.isImportNamespaceSpecifier(specifier)) {
                type = ImportType.Namespace;
            } else {
                const importedName = specifier.imported.name;
                if (importedName !== name) {
                    sourceName = importedName;
                }
                type = ImportType.Specifier;
            }
            state.imports[name]= {
                source,
                type,
                sourceName
            };
        });
    },
    ExportDefaultDeclaration(nodePath: NodePath<t.ExportDefaultDeclaration>, state: SfcStruct) {
        if (!t.isObjectExpression(nodePath.node.declaration)) {
            state.globals.push(state.getSourceCode(nodePath.node));
            return;
        }
        state.isVueComponent = true;
        nodePath.traverse(defineVisitor, state);
        nodePath.stop();
    }
};

const defineVisitor = {
    // Vue component define
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        const { key, value, loc } = nodePath.node;
        const name = (key as t.Identifier).name;
        switch (name) {
            case 'mixins':
                state.mixins.push(...(value as t.ArrayExpression).elements.map(el => (el as t.Identifier).name));
                break;
            case 'filters':
                state.filters = state.getSourceCode(value);
                break;
            case 'directives':
                state.directives = state.getSourceCode(value);
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
                unknownError('property', name, loc.start);
                break;
        }
        nodePath.skip();
    },
    // data & life cycle
    ObjectMethod(nodePath: NodePath<t.ObjectMethod>, state: SfcStruct) {
        const { key, loc } = nodePath.node;
        const name = (key as t.Identifier).name;
        if (name === 'data') {
            let vars: string[] = [];
            const body = nodePath.get('body').get('body');
            body.forEach((p) => {
                if (t.isReturnStatement(p.node)) {
                    const varSet = new Set(vars);
                    const args = p.get('argument');
                    const dataObj = (Array.isArray(args) ? args[args.length - 1] : args) as NodePath<t.ObjectExpression>;
                    
                    const props = dataObj.get('properties');
                    props.forEach((el) => {
                        if (!t.isObjectProperty(el.node)) {
                            return;
                        }
                        const name = (el.node.key as t.Identifier).name;
                        const valueStr = state.getSourceCode(el.node.value);

                        const value = el.get('value');
                        const valNode = (Array.isArray(value) ? value[value.length - 1] : value);

                        const idState = {
                            lazy: false,
                            varSet
                        };
                        // TODO: visitor
                        valNode.traverse({}, idState);

                        state.data.push({
                            name,
                            value: valueStr,
                            lazy: idState.lazy,
                            type: getValueType(valueStr)
                        });
                    });
                    dataObj.node.properties.forEach((el) => {
                        if (t.isObjectProperty(el)) {
                            const name = (el.key as t.Identifier).name;
                            const value = state.getSourceCode(el.value);
                            const lazy = varSet.has(name);
                            state.data.push({
                                name,
                                value,
                                lazy,
                                type: getValueType(value)
                            });
                        }
                    });
                } else {
                    state.init.push(state.getSourceCode(p.node));
                    p.traverse(saveDataIdVisitor, vars);
                }
            });
            
            nodePath.skip();
        } else if (hooksNames.has(name)) {
            state.hooks.push(state.getSourceCode(nodePath.node));
        } else {
            unknownError('method', name, loc.start);
        }
    }
};

const saveDataIdVisitor = {
    VariableDeclarator(nodePath: NodePath<t.VariableDeclarator>, state: string[]) {
        const id = nodePath.get('id');
        if (t.isIdentifier(id.node)) {
            state.push(id.node.name);
        } else {
            id.traverse({
                Identifier(nodePath: NodePath<t.Identifier>, state: string[]) {
                    state.push(nodePath.node.name);
                }
            }, state);
        }
    }
};

const componentsVisitor = {
    // components: { comp1, comp2 }
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        state.components.push((nodePath.node.key as t.Identifier).name);
    }
};

const propsVisitor = {
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        const { node } = nodePath;
        const name = (node.key as t.Identifier).name;
        if (t.isIdentifier(node.value)) {
            state.props.push({
                name,
                type: node.value.name
            });
        } else {
            const prop: PropDefine = { name };
            // get prop define
            const value = node.value as t.ObjectExpression;
            value.properties.forEach((el) => {
                if (t.isObjectProperty(el)) {
                    const key = (el.key as t.Identifier).name;
                    if (key !== 'default' && key !== 'type' && key !== 'default') {
                        unknownError('prop', key, el.loc.start);
                        return;
                    }

                    if (t.isObjectProperty(el)) {
                        const { value } = el;
                        if (t.isArrowFunctionExpression(value) || t.isFunctionExpression(value)) {
                            // `default: () => ...` or `default: function() { ... }`
                            prop.default = state.getFunctionDefine(value, true);
                        } else if (t.isIdentifier(value)) {
                            prop[key] = value.name;
                        } else {
                            prop[key] = state.getSourceCode(el.value);
                        }
                    } else if (t.isObjectMethod(el)) {
                        // `default() { ... }`
                        prop.default = state.getFunctionDefine(el, true);
                    }
                }
            });
            state.props.push(prop);
        }
        nodePath.skip();
    },
    ArrayExpression(nodePath: NodePath<t.ArrayExpression>, state: SfcStruct) {
        nodePath.node.elements.forEach(el => state.props.push({
            name: (el as t.StringLiteral).value,
            type: 'any'
        }));
        nodePath.skip();
    }
};

const computedVisitor = {
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        const { node } = nodePath;
        const computedName = (node.key as t.Identifier).name;
        if (t.isFunctionExpression(node.value)) {
            state.computed[computedName] = {
                get: state.getFunctionDefine(node.value)
            };
        } else {
            state.computed[computedName] = {};
            const value = node.value as t.ObjectExpression;
            value.properties.forEach((el) => {
                if (t.isObjectProperty(el)) {
                    const { key, value } = el;
                    if (!t.isArrowFunctionExpression(value) && !t.isFunctionExpression(value)) {
                        return;
                    }

                    const method = (key as t.Identifier).name;
                    if (method === 'get' || method === 'set') {
                        if (t.isObjectProperty(el)) {
                            state.computed[computedName][method] = state.getFunctionDefine(value);
                        } else if (t.isObjectMethod(el)) {
                            state.computed[computedName][method] = state.getFunctionDefine(el);
                        }
                    }
                }
            });
        }
        nodePath.skip();
    },
    ObjectMethod(nodePath: NodePath<t.ObjectMethod>, state: SfcStruct) {
        const { node } = nodePath;
        const key = (node.key as t.Identifier).name;
        state.computed[key] = {
            get: state.getFunctionDefine(node)
        };
        nodePath.skip();
    },
};

const watchVisitor = {
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        nodePath.traverse(watchDefineVisitor, state);
        nodePath.skip();
    },
    ObjectMethod(nodePath: NodePath<t.ObjectMethod>, state: SfcStruct) {
        const { node } = nodePath;
        const watcherName = (node.key as t.Identifier).name;
        state.initWatcher(watcherName);
        state.watchers[watcherName].push({
            handler: state.getFunctionDefine(node)
        });
        nodePath.skip();
    },
};

const watchDefineVisitor = {
    FunctionExpression(nodePath: NodePath<t.FunctionExpression>, state: SfcStruct) {
        const { node } = nodePath;
        const key = getWatcherDefindKey(nodePath);
        state.initWatcher(key);
        state.watchers[key].push({
            handler: state.getFunctionDefine(node)
        });

        nodePath.skip();
    },
    StringLiteral(nodePath: NodePath<t.StringLiteral>, state: SfcStruct) {
        if (nodePath.key !== 'value') {
            return;
        }
        const watcherName = getWatcherDefindKey(nodePath);
        state.initWatcher(watcherName);
        state.watchers[watcherName].push({
            handlerName: nodePath.node.value
        });
        nodePath.skip();
    },
    ObjectExpression(nodePath: NodePath<t.ObjectExpression>, state: SfcStruct) {
        const { node } = nodePath;
        const watcherName = getWatcherDefindKey(nodePath);
        state.initWatcher(watcherName);

        const watcher: WatcherItem = {};
        node.properties.forEach((el) => {
            if (t.isObjectProperty(el)) {
            const name = (el.key as t.Identifier).name;
                if (name === 'handler') {
                    if (t.isFunctionExpression(el.value)) {
                        watcher.handler = state.getFunctionDefine(el.value);
                    } else if (t.isStringLiteral(el.value)) {
                        watcher.handlerName = el.value.value;
                    } else {
                        unknownError('watcher hanlder', name, el.loc.start);
                    }
                } else if (name === 'deep' || name === 'immediate') {
                    if (!watcher.options) {
                        watcher.options = {};
                    }
                    watcher.options[name] = (el.value as t.BooleanLiteral).value;
                } else {
                    unknownError('watcher prop', name, el.loc.start);
                }
            }
        });
        state.watchers[watcherName].push(watcher);

        nodePath.skip();
    }
};

const methodsVisitor = {
    ObjectProperty(nodePath: NodePath<t.ObjectProperty>, state: SfcStruct) {
        const { key, value } = nodePath.node;
        const name = (key as t.Identifier).name;
        if (t.isArrowFunctionExpression(value) || t.isFunctionExpression(value)) {
            state.methods.push({
                name,
                handler: state.getFunctionDefine(value)
            });
        } else {
            state.methods.push({
                name,
                value: state.getSourceCode(value)
            });
        }
        nodePath.skip();
    },
    ObjectMethod(nodePath: NodePath<t.ObjectMethod>, state: SfcStruct) {
        state.methods.push({
            name: (nodePath.node.key as t.Identifier).name,
            handler: state.getFunctionDefine(nodePath.node)
        });
        nodePath.skip();
    },
};

function getValueType(valueStr: string) {
    if (!valueStr) {
        return 'any';
    }
    if (valueStr[0] === '[') {
        return 'any[]';
    }
    if (valueStr === 'null' || valueStr === 'undefined' || valueStr[0] === '{' || /a-z/i.test(valueStr[0])) {
        return 'any';
    }
    return undefined;
}

function getWatcherDefindKey(nodePath: NodePath<t.FunctionExpression> | NodePath<t.ObjectExpression> | NodePath<t.StringLiteral>) {
    let key = '';
    const { parent, parentPath } = nodePath;
    if (t.isObjectProperty(parent)) {
        if (t.isIdentifier(parent.key)) {
            key = parent.key.name;
        } else if (t.isStringLiteral(parent.key)) {
            key = parent.key.value;
        }
    } else if (t.isArrayExpression(parent)) {
        key = ((parentPath.parent as t.ObjectProperty).key as t.Identifier).name;
    } else {
        unknownError('wather define', '', nodePath.node.loc.start, true);
    }
    return key;
}

function unknownError(type: string, name: string, loc: { line: number, column: number }, throwError = false) {
    const message = `Unknown ${type}: ${name} at ${loc.line}:${loc.column}`;
    if (throwError) {
        throw new Error(message);
    } else {
        console.error(message);
    }
}
