## TypeVUE

Convert `*.vue` file from JavaScript object to TypeScript class;

## Use

```bash
$ yarn global add typevue
# or
$ npm i -g typevue
$ typevue -d <input_path> -o <output_path> -c <config_file>
```

### Config file format

Config file should be a `json` file or a `js` with `module.exports = { ... }`;

```json
// config schema
{
    "cssType": "css",
    "importMap": {
        "ListMixin": {
            "oldPathReg": "@/common(/index)?",
            "newPath": "rds-vue"
        },
        "SelectMixin": {
            "oldPathReg": "@/common(/index)?",
            "newPath": "rds-vue"
        },
        "SomeModule": {
            "oldPath": "~/global",
            "newPath": "global-path"
        }
    }
}
```

`cssType` use to specify the css language, default is `css`;

`importMap` use to change moudules import path, the `oldPath` property has high priority then `oldPathReg`;

## TODO

* rewrite with TypeScript;
* provide/inject support;
* replace `substring`;
* generate code from AST;
