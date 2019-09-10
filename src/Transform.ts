import SfcStruct, {
    FunctionDefine, ImportType
} from './SfcStruct';

export interface ImportMap {
    [key: string]: {
        newPath: string;
        oldPath?: string;
        oldPathReg?: string;
    }
}

export interface TransformOptions {
    importMap?: ImportMap;
}

export class Transform {
    public className = '';
    public importMap: ImportMap = {};
    private code: string[] = [];

    constructor(className: string, public struct: SfcStruct, options: TransformOptions = {}) {
        if (/^[0-9]/.test(className)) {
            className = `_${className}`;
        }
        this.className = className;
        this.importMap = options.importMap || {};
    }

    public exec() {
        const {
            isVueComponent,
            globals,
            mixins,
            props,
            watchers,
            hooks,
        } = this.struct;

        // confrim which decorator should be imported
        const decorators = ['Component'];
        const hasMixin = !!mixins.length;
        Object.entries({
            Prop: !!props.length,
            Watch: !!Object.keys(watchers).length,
            Mixins: hasMixin,
        }).forEach(([key, value]) => {
            if (value) {
                decorators.push(key);
            }
        });
        if (!hasMixin) {
            decorators.push('Vue');
        }

        // import
        const imports = this.getImports();
        if (isVueComponent) {
            this.addCode(`import { ${decorators.join(', ')} } from 'vue-property-decorator';\n` + imports);
        } else {
            this.addCode(imports);
        }

        // globals
        this.addCode(globals.join('\n'), true);
        if (!isVueComponent) {
            return this.code.join('\n');
        }

        // @Component({components, directives, filters})
        this.addCode(this.getAtComponent());

        // mixins
        let extend = 'Vue';
        if (hasMixin) {
            extend = `Mixins(${mixins.join(', ')})`;
        }
        this.addCode(`export default class ${this.className} extends ${extend} {`);

        // data
        this.addCode(this.getData());

        // props
        this.addCode(this.getProps(), true);

        // init(constructor)
        this.addCode(this.getConstructor());

        // computed
        this.addCode(this.getComputed());

        // hooks
        this.addCode(hooks.join('\n\n'), true);

        // watchers
        this.addCode(this.getWatchers());

        // methods
        this.addCode(this.getMethods());

        this.addCode('}\n');

        return this.code.join('\n');
    }

    private addCode(code: string, moreLine = false) {
        if (!code) {
            return;
        }
        if (moreLine) {
            code += '\n';
        }
        this.code.push(code);
    }

    private getFunctionCode(func: FunctionDefine, name: string = '', shorthand: boolean = false) {
        const { params, body, isArrow, async, generator } = func;
        const paramsStr = `(${params.join(', ')})`;
        const generatorStr = generator ? '*' : '', asyncStr = async ? 'async ' : '';
        if (isArrow) {
            return `${asyncStr}${generatorStr}${paramsStr} => ${body}`;
        }
        const code = `${asyncStr}${generatorStr}${name || ''}${paramsStr} ${body}`;
        return shorthand ? code : `private ${code}`;
    }
    
    private getImports() {
        const { imports, directImport } = this.struct;
        let res = '';
    
        const reference: {
            [key: string]: {
                name: string,
                type: ImportType,
                sourceName?: string
            }[]
        } = {};
    
        Object.keys(imports).forEach((key: string) => {
            const { source, type, sourceName } = imports[key];
            if (!reference[source]) {
                reference[source] = [];
            }
            const m = this.importMap[key];
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
            const tmp: string[] = [], exports: string[] = [];
            modules.forEach(({ name, type, sourceName }) => {
                switch (type) {
                    case ImportType.Default:
                        tmp.unshift(name);
                        break;
                    case ImportType.Namespace:
                        tmp.push(`* as ${name}`);
                        break;
                    case ImportType.Specifier:
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
        res += directImport.map(el => `import '${el}';\n`).join('');
    
        return res;
    }
    
    private getAtComponent() {
        const { components, directives, filters } = this.struct;
        let res = '@Component'
        let componentOpts = [];
        if (components.length) {
            componentOpts.push(`component: { ${components.join(',')} }`);
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
    
    private getData() {
        let res = '';
        this.struct.data.forEach((el) => {
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
    
    private getProps() {
        let res = '';
        this.struct.props.forEach((el) => {
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
                if (typeof el.default === 'object') {
                    hadDefault = '!';
                    // force to use arrow private
                    el.default.isArrow = true;
                    propOpts.push(`default: ${this.getFunctionCode(el.default)}`);
                } else {
                    propOpts.push(`default: ${el.default}`);
                }
            }
            const options = propOpts.length ? `{ ${propOpts.join(', ')} }` : '';
            res += `@Prop(${options}) public ${el.name}${hadDefault}${varType};\n`;
        });
        return res;
    }
    
    private getConstructor() {
        const { init, data } = this.struct;
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
    
    private getComputed() {
        let res = '';
        Object.entries(this.struct.computed).forEach(([name, define]) => {
            const { get, set } = define;
            get && (res += `public get ${this.getFunctionCode(get, name, true)}\n`);
            set && (res += `public set ${this.getFunctionCode(set, name, true)}\n`);
        });
        return res;
    }
    
    private getWatchers() {
        const { watchers, methods } = this.struct;
        let res: string[] = [];
    
        Object.entries(watchers).forEach(([propName, value]) => {
            let count = 0;
            value.forEach(({ handler, handlerName, options }) => {
                let func;
                if (handlerName) {
                    func = methods.find(el => el.name === handlerName);
                    if (!func) {
                        console.error(`Unknown watcher handler '${handlerName}' for '${propName}'`);
                        return;
                    }
                    func.isWatcher = true;
                    func = func.handler;
                } else {
                    func = handler;
                    handlerName = `${propName}WatchHandler${count || ''}`.replace(/[^a-zA-Z0-9_$]/g, '_');
                    count += 1;
                }
                if (!func) {
                    console.error(`Watcher ${propName}'s handler define was not found`);
                    return;
                }
                if (/^[0-9]/.test(handlerName)) {
                    handlerName = '_' + handlerName;
                }
                let optStr = '';
                if (options) {
                    const optArr = Object.entries(options)
                        .reduce((res, [k, v]) => {
                            v && res.push(k);
                            return res;
                        }, [] as string[]);
                    optArr.length && (optStr = `, { ${optArr.map(el => `${el}: true`).join(',')} }`);
                }
                const code = this.getFunctionCode(func, handlerName, true);
                res.push(`@Watch('${propName}'${optStr})\npublic ${code}\n`);
            });
        });
    
        return res.join('\n');
    }
    
    private getMethods() {
        let res: string[] = [];
        this.struct.methods.forEach(({ name, handler, value, isWatcher }) => {
            if (isWatcher) {
                return;
            }
            if (value) {
                res.push(`public ${name} = ${value};\n`);
            } else if (handler) {
                const code = this.getFunctionCode(handler, name, true);
                if (handler.isArrow) {
                    res.push(`public ${name} = ${code};\n`);
                } else {
                    res.push(`public ${code}\n`);
                }
            }
        });
    
        return res.join('\n');
    }
}

export default function(className: string, struct: SfcStruct, options: TransformOptions) {
    const trans = new Transform(className, struct, options);
    return trans.exec();
}
