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
    "jsPathReg": "mixin",
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

`cssType` is used to specify the css language, default is `css`;

`jsPathReg` is used to set which path the js file will be transform;

`importMap` is used to change moudules import path, the `oldPath` property has high priority then `oldPathReg`;

## TODO

* provide/inject support;
* replace `substring`;
* generate code from AST;
