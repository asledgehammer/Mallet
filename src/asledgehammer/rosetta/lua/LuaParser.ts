import * as ast from 'luaparse';
import { App } from '../../../app';
import { RosettaLuaClass } from './RosettaLuaClass';
import { RosettaLuaConstructor } from './RosettaLuaConstructor';
import { RosettaLuaFunction } from './RosettaLuaFunction';

// @ts-ignore
const luaparse: luaparse = ast.default;

export class LuaParser {

    readonly app: App;

    constructor(app: App) {
        this.app = app;
    }

    parse(chunk: ast.Chunk): RosettaLuaClass | undefined {

        let className = '';
        let clazz: RosettaLuaClass | undefined = undefined;
        let conzstructor: ast.FunctionDeclaration | null = null;

        const handleClassDec = (statement: ast.AssignmentStatement): boolean => {
            console.log(statement);
            // Check for ISBaseObject (or subclass), and derive call signature.
            const init0 = statement.init[0];
            if (init0.type !== 'CallExpression') return false;
            if (init0.base.type !== 'MemberExpression') return false;
            if (init0.base.indexer !== ':') return false;
            if (init0.base.base.type !== 'Identifier') return false;
            if (init0.base.identifier.type !== 'Identifier') return false;
            if (init0.base.identifier.name !== 'derive') return false;

            // Check for class name here.
            const vars0 = statement.variables[0];
            if (vars0.type !== 'Identifier') return false;


            className = vars0.name;
            const superClassName = init0.base.base.name;
            clazz = new RosettaLuaClass(className);
            clazz.extendz = superClassName;

            if (superClassName !== 'ISBaseObject') clazz.extendz = superClassName;

            // At this point we absolutely know that this is a pz-class declaration.
            console.log(`Class found: ${className} extends ${superClassName}`);
            return true;
        };

        const handleFuncDec = (statement: ast.FunctionDeclaration) => {
            // Check if assigned as a member declaration.
            if (statement.identifier == null) return;
            if (statement.identifier.type !== 'MemberExpression') return;

            // Check if method or function.
            let type: 'method' | 'function' = 'function';
            if (statement.identifier.indexer === ':') type = 'method';

            // Verify that the base assignment table is the class.
            if (statement.identifier.base.type !== 'Identifier') return;
            if (statement.identifier.base.name !== className) return;

            // Grab the function / method name.
            if (statement.identifier.identifier.type !== 'Identifier') return;
            const funcName = statement.identifier.identifier.name;

            const params: { name: string, type: string }[] = [];
            const returnType = funcName === 'new' ? className : 'any';

            for (const param of statement.parameters) {
                if (param.type !== 'Identifier') continue;
                params.push({ name: param.name, type: 'any' });
            }

            if (funcName === 'new') {
                console.log(statement);
                conzstructor = statement;
            }

            if (funcName === 'new') {
                clazz!.conztructor = new RosettaLuaConstructor(clazz!);
                for (const param of params) {
                    clazz!.conztructor.addParameter(param.name, param.type);
                }
            } else {
                let func: RosettaLuaFunction;
                if (type === 'function') {
                    if (clazz!.functions[funcName]) {
                        console.warn(`Function already exists: ${className}.${funcName}. Overriding with lower-most definition..`);
                        delete clazz!.functions[funcName];
                    }
                    func = clazz!.createFunction(funcName);
                } else {
                    if (clazz!.methods[funcName]) {
                        console.warn(`Method already exists: ${className}.${funcName}. Overriding with lower-most definition..`);
                        delete clazz!.methods[funcName];
                    }
                    func = clazz!.createMethod(funcName);
                }
                for (const param of params) {
                    clazz!.conztructor.addParameter(param.name, param.type);
                }
                func.returns.type = returnType;
            }

            // let paramsLog = [];
            // let { indexer } = statement.identifier;
            // for (const param of params) {
            //     paramsLog.push(`${param.name}: ${param.type}`);
            // }
            // if (funcName !== 'new') {
            //     console.log(`Found ${type}: ${className}${indexer}${funcName}(${paramsLog.join(', ')}): any;`);
            // } else {
            //     console.log(`Found constructor: ${className}:new(${paramsLog.join(', ')}): ${className};`);
            // }
        };

        const handleValueDec = (statement: ast.AssignmentStatement) => {
            if (!statement.variables.length) return;
            const var0 = statement.variables[0];

            // Make sure the assignment is towards a member. (The class)
            if (var0.type !== 'MemberExpression') return;
            if (var0.base.type !== 'Identifier') return;
            if (var0.base.name !== className) return;

            const { indexer } = var0;

            const varName = var0.identifier.name;
            const type: 'field' | 'value' = indexer === '.' ? 'value' : 'field';
            let varType: string = 'any';
            let defaultValue: any = undefined;

            if (!statement.init.length) return;
            const init0 = statement.init[0];

            switch (init0.type) {
                case 'NumericLiteral': {
                    varType = 'number';
                    defaultValue = init0.value;
                    break;
                }
                case 'BooleanLiteral': {
                    varType = 'boolean';
                    defaultValue = init0.value;
                    break;
                }
                case 'StringLiteral': {
                    varType = 'string';
                    defaultValue = init0.value;
                    break;
                }
                case 'VarargLiteral': {
                    console.log('#################');
                    console.log('THIS IS A VARARG.');
                    console.log(init0);
                    console.log('#################');
                    varType = 'any';
                    defaultValue = init0.value;
                    break;
                }
                case 'NilLiteral': {
                    varType = 'nil';
                    defaultValue = init0.value;
                    break;
                }
            }

            // Check for possible duplicate.
            if (clazz!.values[varName]) {
                console.warn(`Value already exists: ${className}.${varName}. Overriding with lower-most definition..`);
                delete clazz!.values[varName];
            }

            const value = clazz!.createValue(varName);
            value.type = varType;

            // console.log(`Found ${type}: ${className}.${varName}: ${varType};`);
            // console.log(statement);
        };

        for (const statement of chunk.body) {
            if (statement.type !== 'AssignmentStatement') continue;

            // We found the class declaration so we're good to go.
            if (handleClassDec(statement)) break;
        }

        // No class detected.
        if (className === '') return undefined;

        // Crawl for values.
        for (const statement of chunk.body) {
            if (statement.type !== 'AssignmentStatement') continue;
            handleValueDec(statement);
        }

        // Crawl for functions & methods.
        for (const statement of chunk.body) {

            // Only allow Function-Declarations here.
            if (statement.type !== 'FunctionDeclaration') continue;

            handleFuncDec(statement);
        }

        const handleConstructor = (conzstructor: ast.FunctionDeclaration) => {
            let selfAlias = '';
            for (let index = conzstructor.body.length - 1; index >= 0; index--) {
                const statement = conzstructor.body[index];
                if (statement.type !== 'ReturnStatement') continue;

                const arg0 = statement.arguments[0];
                if (arg0.type !== 'Identifier') continue;

                selfAlias = arg0.name;
                break;
            }

            if (selfAlias === '') {
                console.warn('No known alias for "self" in constructor. Skipping reading its content(s)..');
                return;
            }

            for (const statement of conzstructor.body) {
                if (statement.type === 'AssignmentStatement') {
                    const var0 = statement.variables[0];

                    // Make sure the assignment is towards a member. (The class)
                    if (var0.type !== 'MemberExpression') continue;
                    if (var0.base.type !== 'Identifier') continue;

                    // Proxies the className in constructor definitions.
                    if (var0.base.name !== selfAlias) continue;

                    const varName = var0.identifier.name;
                    let varType: string = 'any';
                    let defaultValue: any = undefined;

                    if (!statement.init.length) continue;
                    const init0 = statement.init[0];

                    switch (init0.type) {
                        case 'NumericLiteral': {
                            varType = 'number';
                            defaultValue = init0.value;
                            break;
                        }
                        case 'BooleanLiteral': {
                            varType = 'boolean';
                            defaultValue = init0.value;
                            break;
                        }
                        case 'StringLiteral': {
                            varType = 'string';
                            defaultValue = init0.value;
                            break;
                        }
                        case 'VarargLiteral': {
                            console.log('#################');
                            console.log('THIS IS A VARARG.');
                            console.log(init0);
                            console.log('#################');
                            varType = 'any';
                            defaultValue = init0.value;
                            break;
                        }
                        case 'NilLiteral': {
                            varType = 'nil';
                            defaultValue = init0.value;
                            break;
                        }
                    }

                    // Check for possible duplicate.
                    if (clazz!.fields[varName]) {
                        console.warn(`Field already exists: ${className}.${varName}. Overriding with lower-most definition..`);
                        delete clazz!.fields[varName];
                    }

                    const field = clazz!.createField(varName);
                    field.type = varType;

                    console.log(`Found field: ${className}.${varName}: ${varType};`);
                    if (field.type === 'any') {
                        console.log(statement);
                    }
                }
            }
        };

        console.log(`conztructor: `, conzstructor);

        if (conzstructor) {
            handleConstructor(conzstructor);
        }

        console.log(clazz);

        return clazz;
    }

    async parseFilePicker() {
        const { app } = this;
        const _this = this;
        const dFileLoad = document.getElementById('load-file') as any;
        const onchange = () => {
            try {
                const file = dFileLoad.files[0];
                var reader = new FileReader();
                reader.onload = function (e) {
                    const lua = reader.result as string;
                    const chunk: ast.Chunk = luaparse.parse(lua);
                    const clazz = _this.parse(chunk);
                    if (clazz) {
                        const card = app.showClass(clazz);
                        app.renderCode();
                        app.sidebar.itemTree.populate();
                        card.update();
                    }

                }
                reader.readAsText(file);
                app.toast.alert(`Loaded LuaClass.`, 'success');
            } catch (e) {
                app.toast.alert(`Failed to load LuaClass.`, 'error');
                console.error(e);
            }
        };
        dFileLoad.onchange = onchange;
        dFileLoad.click();
    }
}