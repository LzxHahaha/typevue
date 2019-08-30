const commander = require('commander');
const path = require('path');
const fs = require('fs');
const prettier = require('prettier');

const sfcReader = require('./sfcReader');
const resolver = require('./resolver');
const transform = require('./transform');

commander.version('0.0.1');
commander
    .option('-d, --dir <dir>', 'Specify input directory.')
    .option('-o, --output <dir>', 'Specify output directory.')
    .option('-c, --config <file>', 'Config file path.')
    // .option('--tslint <file>', 'Lint file path')
    // .option('--tsconfig <file>', 'Lint file path')
    ;

commander.parse(process.argv);

const { dir, output, config, lint } = commander;
if (!dir) {
    console.error('Need to specify input directory.');
    process.exit(0);
}
if (!output) {
    console.error('Need to specify output directory.');
    process.exit(0);
}

const cwd = process.cwd();
const inputPath = path.resolve(cwd, dir);
const outputPath = path.resolve(cwd, output);

let cliConfig = {};
if (config) {
    if (!/\.js(on)?$/.test(config)) {
        console.error('Config file should be a .js or .json file');
        process.exit(0);
    }
    cliConfig = require(path.resolve(cwd, config));
}

function mkdir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

if (!fs.existsSync(inputPath)) {
    console.error('Input directory not found.');
    process.exit(0);
}
mkdir(outputPath);

function formatter(code) {
    return prettier.format(code, {
        parser: 'typescript'
    });
}

const vueReg = /\.vue$/, fileNameReg = /^[^.]+/, mixinReg = /mixin/;
const { cssType = 'css' } = cliConfig;

let count = 0;
function convertDir(dirPath, outputPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            const newOutputPath = path.join(outputPath, file);
            mkdir(newOutputPath);
            convertDir(filePath, newOutputPath);
            continue;
        }
        
        count += 1;
        console.log('Processing: ', filePath);
        const isVue = vueReg.test(file), isMixin = mixinReg.test(filePath);
        if (!isVue && !isMixin) {
            fs.copyFileSync(filePath, path.join(outputPath, file));
            continue;
        }

        const fileName = file.match(fileNameReg)[0];
        const className = fileName[0].toUpperCase() + fileName.substring(1);
        if (isVue) {
            const { template, script, styles } = sfcReader(filePath, className, cliConfig);
            const tags = [template];

            if (script) {
                fs.writeFileSync(path.join(outputPath, `${fileName}.ts`), formatter(script));
                tags.push(`<script lang="ts" src="./${fileName}.ts"></script>`);
            }

            const styleTags = styles.map(({ code, isScoped }, index) => {
                const counter = index ? `.${index}` : '';
                const name = `${fileName}${counter}.${cssType}`;
                fs.writeFileSync(path.join(outputPath, name), code);
                const scoped = isScoped ? ' scoped' : '';
                return `<style${scoped} lang="${cssType}" src="./${name}"></style>`;
            });
            tags.push(...styleTags);

            fs.writeFileSync(path.join(outputPath, file), tags.join('\n') + '\n');
        } else {
            const code = fs.readFileSync(filePath).toString();
            const struct = resolver(code);
            const res = transform(`${className}Mixin`, struct, config);
            fs.writeFileSync(path.join(outputPath, `${fileName}.ts`), formatter(res));
        }
    }
}

convertDir(inputPath, outputPath);
console.log(`Done. ${count} file(s) be converted.`)
