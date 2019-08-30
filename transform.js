function getFunctionCode(func, name, shorthand) {
    const { params, body, isArrow, async, generator } = func;
    const paramsStr = `(${params.join(', ')})`;
    const generatorStr = generator ? '*' : '', asyncStr = async ? 'async ' : '';
    if (isArrow) {
        return `${asyncStr}${generatorStr}${paramsStr} => ${body}`;
    }
    const code = `${asyncStr}${generatorStr}${name || ''}${paramsStr} ${body}`;
    return shorthand ? code : `function ${code}`;
}

function getImports(imports, importMap) {
    let res = '';

    const reference = {};
    Object.keys(imports).forEach((key) => {
        if (key == 0) {
            return;
        }
        const { source, type, sourceName } = imports[key];
        if (!reference[source]) {
            reference[source] = [];
        }
        const m = importMap[key];
        if (m) {
            const { oldPath, oldPathReg, newPath } = m;
            if (oldPath === source || (oldPathReg && new RegExp(oldPathReg).test(source))) {
                if (!reference[newPath]) {
                    reference[newPath] = [];
                }
                reference[newPath].push({
                    name: key,
                    type,
                    sourceName
                })
                return;
            }
        }
        reference[source].push({
            name: key,
            type,
            sourceName
        });
    
    });
    Object.entries(reference).forEach(([importPath, modules]) => {
        if (!modules.length) {
            return;
        }
        const tmp = [], exports = [];
        modules.forEach(({ name, type, sourceName }) => {
            switch (type) {
                case 'default':
                    tmp.unshift(name);
                    break;
                case 'namespace':
                    tmp.push(`* as ${name}`);
                    break;
                case 'specifier':
                    exports.push(sourceName ? `${sourceName} as ${name}` : name);
                    break;
                default: break;
            }
        });
        const vars = [];
        tmp.length && vars.push(...tmp);
        exports.length && vars.push(`{ ${exports.join(', ')} }`);
        res += `import ${vars.join(', ')} from '${importPath}';\n`;
    });
    res += imports[0].map(el => `import '${el}';\n`).join('');

    return res;
}

function getAtComponent(components, directives, filters) {
    let res = '@Component'
    let componentOpts = [];
    if (components.length) {
        componentOpts.push(`components: { ${components.join(',')} }`);
    }
    if (directives) {
        componentOpts.push(`directives: ${directives}`);
    }
    if (filters) {
        componentOpts.push(`filters: ${filters}`);
    }
    res += componentOpts.length ? `({\n${componentOpts.join(',\n')}\n})` : '';
    return res;
}

function getData(data) {
    let res = '';
    data.forEach((el) => {
        const { name, value, type, lazy } = el;
        let varType = '';
        if (type) {
            varType = `: ${type}`;
        } else if (lazy) {
            varType = ': any';
        }
        let init = lazy ? '' : ` = ${value}`;
        res += `public ${name}${varType}${init};\n`;
    });
    return res;
}

function getProps(props) {
    let res = '';
    props.forEach((el) => {
        const propOpts = [];
        let varType = ': any', hadDefault = '';
        if (el.type) {
            propOpts.push(`type: ${el.type}`);
            if (el.type === 'Array') {
                varType = ': any[]';
            } else if (el.type !== 'Object' && el.type !== 'Function') {
                varType = `: ${el.type.toLowerCase()}`;
            }
        }
        if (el.default) {
            hadDefault = '!';
            // force to use arrow function
            el.default.isArrow = true;
            propOpts.push(`default: ${getFunctionCode(el.default)}`);
        }
        const options = propOpts.length ? `{ ${propOpts.join(', ')} }` : '';
        res += `@Prop(${options}) public ${el.name}${hadDefault}${varType};\n`;
    });
    return res ? res + '\n' : res;
}

function getConstructor(init, data) {
    if (!init.length) {
        return '';
    }
    let res = '';
    res += `constructor() {\nsuper();\n${init.join('\n')}\n`;
    data.forEach((el) => {
        const { name, value, lazy } = el;
        if (!lazy) {
            return;
        }
        res += `this.${name} = ${value};\n`;
    });
    res += '}\n\n';
    return res;
}

function getComputed(computed) {
    let res = '';
    Object.entries(computed).forEach(([name, define]) => {
        Object.entries(define).forEach(([method, func]) => {
            const code = getFunctionCode(func, name, true);
            res += `public ${method} ${code}\n`;
        });
    });
    return res;
}

function getWatchers(watchers, methods) {
    let res = [];

    Object.entries(watchers).forEach(([propName, value]) => {
        let count = 0;
        value.forEach(({ handler, handlerName, options }) => {
            let func = handler;
            if (handlerName) {
                func = methods.find(el => el.name === handlerName);
                if (!func) {
                    console.error(`Unknown watcher handler '${handlerName}' for '${propName}'`);
                    return;
                }
                func.isWatcher = true;
                func = func.handler;
            } else {
                handlerName = `${propName}WatchHandler${count || ''}`.replace(/[^\w\d_$]/g, '_');
                count += 1;
            }
            if (!func) {
                console.error(`Watcher ${propName}'s handler define was not found`);
                return;
            }
            let optStr = '';
            if (options) {
                const optArr = Object.entries(options)
                    .reduce((res, [k, v]) => {
                        v && res.push(k);
                        return res;
                    }, []);
                optArr.length && (optStr = `, { ${optArr.map(el => `${el}: true`).join(',')} }`);
            }
            const code = getFunctionCode(func, handlerName, true);
            res.push(`@Watch('${propName}'${optStr})\npublic ${code}\n`);
        });
    });

    return res.join('\n');
}

function getMethods(methods) {
    let res = [];
    methods.forEach(({ name, handler, value, isWatcher }) => {
        if (isWatcher) {
            return;
        }
        if (value) {
            res.push(`public ${name} = ${value};\n`);
        } else {
            const code = getFunctionCode(handler, name, true);
            if (handler.isArrow) {
                res.push(`public ${name} = ${code};\n`);
            } else {
                res.push(`public ${code}\n`);
            }
        }
    });

    return res.join('\n');
}

module.exports = function (className, struct, options = {}) {
    const {
        globals,
        imports,
        components,
        mixins,
        props,
        data,
        computed,
        watchers,
        filters,
        directives,
        methods,
        hooks,
        init
    } = struct;

    const {
        importMap = {},
    } = options;

    // confrim which decorator should be imported
    const decorators = ['Component'];
    const hasMixin = !!mixins.length;
    Object.entries({
        Prop: !!props.length,
        Watch: !!Object.keys(watchers).length,
        Mixin: hasMixin,
    }).forEach(([key, value]) => {
        if (value) {
            decorators.push(key);
        }
    });
    if (!hasMixin) {
        decorators.push('Vue');
    }

    const codeBlocks = [];

    // import
    codeBlocks.push(`import { ${decorators.join(', ')} } from 'vue-property-decorator';\n` + getImports(imports, importMap));

    // globals
    if (globals.length) {
        codeBlocks.push(globals.join('\n') + '\n');
    }

    // @Component({components, directives, filters})
    codeBlocks.push(getAtComponent(components, directives, filters));

    // mixins
    let extend = 'Vue';
    if (hasMixin) {
        extend = `Mixin(${mixins.join(', ')})`;
    }
    codeBlocks.push(`export default class ${className} extends ${extend} {`);

    // data
    if (data.length) {
        codeBlocks.push(getData(data));
    }

    // props
    if (props.length) {
        codeBlocks.push(getProps(props));
    }

    // init(constructor)
    if (init.length) {
        codeBlocks.push(getConstructor(init, data));
    }

    // computed
    const computedStr = getComputed(computed);
    computedStr && codeBlocks.push(computedStr);

    // hooks
    if (hooks.length) {
        codeBlocks.push(hooks.join('\n\n') + '\n');
    }

    // watchers
    const watcherStr = getWatchers(watchers, methods);
    watcherStr && codeBlocks.push(watcherStr);

    // methods
    if (methods.length) {
        codeBlocks.push(getMethods(methods));
    }

    codeBlocks.push('}\n');

    return codeBlocks.join('\n');
}
