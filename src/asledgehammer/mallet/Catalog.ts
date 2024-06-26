import { App } from "../../app";
import { generateGlobalJavaMethod, generateJavaClass } from "../rosetta/1.0/java/JavaLuaGenerator2";
import { RosettaJavaClass, RosettaJavaNamespace } from "../rosetta/1.0/java/RosettaJavaClass";
import { RosettaJavaMethod } from "../rosetta/1.0/java/RosettaJavaMethod";
import { RosettaJavaMethodCluster } from "../rosetta/1.0/java/RosettaJavaMethodCluster";
import { generateGlobalLuaField, generateGlobalLuaFunction, generateLuaClass, generateLuaTable } from "../rosetta/1.0/lua/LuaLuaGenerator";
import { RosettaLuaClass } from "../rosetta/1.0/lua/RosettaLuaClass";
import { RosettaLuaField } from "../rosetta/1.0/lua/RosettaLuaField";
import { RosettaLuaFunction } from "../rosetta/1.0/lua/RosettaLuaFunction";
import { RosettaLuaFunctionCluster } from "../rosetta/1.0/lua/RosettaLuaFunctionCluster";
import { RosettaLuaTable } from "../rosetta/1.0/lua/RosettaLuaTable";
import { RosettaLuaTableField } from "../rosetta/1.0/lua/RosettaLuaTableField";
import { javaClassToTS, javaMethodClusterToTS } from "../rosetta/1.0/typescript/JavaTypeScriptGenerator";
import { luaClassToTS, luaFieldToTS, luaFunctionToTS, luaTableToTS } from "../rosetta/1.0/typescript/LuaTypeScriptGenerator";
import { wrapAsTSFile } from "../rosetta/1.0/typescript/TSUtils";
import { JavaClassCard } from "./component/java/JavaClassCard";
import { LuaClassCard } from "./component/lua/LuaClassCard";
import { LuaTableCard } from "./component/lua/LuaTableCard";

export class Catalog {

    readonly app: App;

    readonly luaClasses: { [name: string]: RosettaLuaClass } = {};
    readonly luaTables: { [name: string]: RosettaLuaTable } = {};
    readonly javaClasses: { [name: string]: RosettaJavaClass } = {};

    readonly methods: { [key: string]: RosettaJavaMethodCluster } = {};
    readonly fields: { [id: string]: RosettaLuaTableField } = {};
    readonly functions: { [id: string]: RosettaLuaFunctionCluster } = {};

    selected:
        RosettaLuaClass
        | RosettaLuaTable
        | RosettaJavaClass
        | undefined = undefined;

    selectedCard:
        LuaClassCard
        | LuaTableCard
        | JavaClassCard
        | undefined = undefined;

    constructor(app: App) {
        this.app = app;
    }

    reset() {

        // Wipe all content from the dictionaries.
        for (const name of Object.keys(this.luaClasses)) {
            delete this.luaClasses[name];
        }
        for (const name of Object.keys(this.luaTables)) {
            delete this.luaTables[name];
        }
        for (const name of Object.keys(this.javaClasses)) {
            delete this.javaClasses[name];
        }
        for (const name of Object.keys(this.fields)) {
            delete this.fields[name];
        }
        for (const name of Object.keys(this.functions)) {
            delete this.functions[name];
        }
        for (const name of Object.keys(this.methods)) {
            delete this.methods[name];
        }

        // Wipe active selections.
        this.selected = undefined;
        this.selectedCard = undefined;

        // Clear the screen container.
        this.app.$screenContent.empty();
    }

    toTypeScript(): string {
        let keys: string[];
        let s = '';

        /* Java Classes */
        keys = Object.keys(this.javaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const javaClass = this.javaClasses[name];
                // s += `// Java Class: ${javaClass.namespace.name}.${javaClass.name} \n\n`;
                s += javaClassToTS(javaClass, false, false);
            }
        }

        /* Lua Classes */
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const luaClass = this.luaClasses[name];
                // s += `// Lua Class: ${luaClass.name} \n\n`;
                s += luaClassToTS(luaClass, false);
            }
        }

        /* Lua Tables */
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const luaTable = this.luaTables[name];
                // s += `// Lua Table: ${luaTable.name} \n\n`;
                s += luaTableToTS(luaTable, false);
            }
        }

        /* Global Lua Fields */
        keys = Object.keys(this.fields);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const field = this.fields[name];
                // s += `// Global Lua Field: ${field.name} \n\n`;
                s += luaFieldToTS(field, 0, 100) + '\n';
            }
        }

        /* Global Lua Functions */
        keys = Object.keys(this.functions);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const cluster = this.functions[name];
                for (const func of cluster.functions) {
                    // s += `// Global Lua Function: ${func.name} \n\n`;
                    s += luaFunctionToTS(func, 0, 100) + '\n';
                }
            }
        }

        /* Global Java Methods */
        keys = Object.keys(this.methods);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const cluster = this.methods[name];
                // s += `// Global Java Method(s): ${cluster.name} \n\n`;
                s += javaMethodClusterToTS(cluster, 0, 100) + '\n';
            }
        }

        return wrapAsTSFile(s);
    }

    toLuaTypings(): string {
        let keys: string[];
        let s = '--- @meta\n\n';

        /* Java Classes */
        keys = Object.keys(this.javaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const javaClass = this.javaClasses[name];
                // s += `-- Java Class: ${javaClass.namespace.name}.${javaClass.name} --\n\n`;
                s += generateJavaClass(javaClass) + '\n\n';
            }
        }

        /* Lua Classes */
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const luaClass = this.luaClasses[name];
                // s += `-- Lua Class: ${luaClass.name} --\n\n`;
                s += generateLuaClass(luaClass) + '\n\n';
            }
        }

        /* Lua Tables */
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const luaTable = this.luaTables[name];
                // s += `-- Lua Table: ${luaTable.name} --\n\n`;
                s += generateLuaTable(luaTable) + '\n\n';
            }
        }

        /* Global Lua Fields */
        keys = Object.keys(this.fields);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const field = this.fields[name];
                // s += `-- Global Lua Field: ${name} --\n\n`;
                s += generateGlobalLuaField(field) + '\n\n';
            }
        }

        /* Global Lua Functions */
        keys = Object.keys(this.functions);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of keys) {
                const cluster = this.functions[name];
                for (const func of cluster.functions) {
                    // s += `-- Global Lua Function: ${name} --\n\n`;
                    s += generateGlobalLuaFunction(func) + '\n\n';
                }
            }
        }

        /* Global Java Methods */
        const staticMethods: RosettaJavaMethod[] = [];
        const methodClusterNames = Object.keys(this.methods);
        if (methodClusterNames.length) {
            methodClusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of methodClusterNames) {
                for (const method of this.methods[clusterName].methods) {
                    staticMethods.push(method);
                }
            }
        }

        keys = Object.keys(staticMethods);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const method of staticMethods) {
                // s += `-- Global Java Method: ${method.name} --\n\n`;
                s += generateGlobalJavaMethod(method) + '\n\n';
            }
        }

        return s;
    }

    fromJSON(json: any) {
        this.reset();

        if (json.luaClasses) {
            for (const name of Object.keys(json.luaClasses)) {
                const entity = new RosettaLuaClass(name, json.luaClasses[name]);
                this.luaClasses[name] = entity;
            }
        }

        if (json.tables) {
            for (const name of Object.keys(json.tables)) {
                const entity = new RosettaLuaTable(name, json.tables[name]);
                this.luaTables[name] = entity;
            }
        }

        if (json.namespaces) {
            for (const name of Object.keys(json.namespaces)) {
                const namespace = new RosettaJavaNamespace(name, json.namespaces[name]);
                for (const className of Object.keys(namespace.classes)) {
                    this.javaClasses[className] = namespace.classes[className];
                }
            }
        }

        /* (Fields) */
        if (json.fields) {
            const rawFields: { [key: string]: any } = json.fields;
            for (const name of Object.keys(rawFields)) {
                const rawField = rawFields[name];
                const field = new RosettaLuaField(name, rawField);
                this.fields[name] = this.fields[field.name] = field;
            }
        }

        /* (Global Functions) */
        if (json.functions !== undefined) {
            /* (Legacy) */
            if (!Array.isArray(json.functions)) {
                console.log('PZ-Rosetta: Upgrading legacy Global Lua functions from singleton-object per name to clustered array..');

                const rawMethods: { [key: string]: any } = json.functions;
                for (const name2 of Object.keys(rawMethods)) {
                    const rawMethod = rawMethods[name2];
                    const method = new RosettaLuaFunction(name2, rawMethod);
                    this.functions[method.name] = new RosettaLuaFunctionCluster(method.name);
                    this.functions[method.name].add(method);
                }

            }
            /* (Current) */
            else {
                const rawMethods = json.functions;
                for (const rawMethod of rawMethods) {
                    const method = new RosettaLuaFunction(rawMethod.name, rawMethod);
                    const { name: methodName } = method;
                    let cluster: RosettaLuaFunctionCluster;
                    if (this.functions[methodName] === undefined) {
                        cluster = new RosettaLuaFunctionCluster(methodName);
                        this.functions[methodName] = cluster;
                    } else {
                        cluster = this.functions[methodName];
                    }
                    cluster.add(method);
                }
            }
        }

        /* METHODS */
        if (json.methods) {
            const rawMethods = json.methods;
            for (const rawMethod of rawMethods) {
                const method = new RosettaJavaMethod(rawMethod);
                const { name: methodName } = method;
                let cluster: RosettaJavaMethodCluster;
                if (this.methods[methodName] === undefined) {
                    cluster = new RosettaJavaMethodCluster(methodName);
                    this.methods[methodName] = cluster;
                } else {
                    cluster = this.methods[methodName];
                }
                cluster.add(method);
            }
        }

        this.app.sidebar.populateTrees();
    }

    toJSON(): any {

        let keys: string[];

        // Lua Classes
        let luaClasses: any = undefined;
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            luaClasses = {};
            for (const name of keys) {
                luaClasses[name] = this.luaClasses[name].toJSON();
            }
        }

        // Lua Tables
        let tables: any = undefined;
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            tables = {};
            for (const name of keys) {
                tables[name] = this.luaTables[name].toJSON();
            }
        }

        // Java Classes
        let namespaces: any = undefined;
        keys = Object.keys(this.javaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            namespaces = {};
            for (const name of keys) {
                const javaClass = this.javaClasses[name];
                const namespace = javaClass.namespace;
                if (!namespaces[namespace.name]) {
                    namespaces[namespace.name] = {};
                }
                namespaces[namespace.name][name] = this.javaClasses[name].toJSON();
            }
        }

        // Global Lua Fields
        let fields: any = undefined;
        keys = Object.keys(this.fields);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            fields = {};
            for (const name of keys) {
                fields[name] = this.fields[name].toJSON();
            }
        }

        // Global Lua Functions
        let functions: any = undefined;
        keys = Object.keys(this.functions);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            functions = [];
            for (const name of keys) {
                const cluster = this.functions[name];
                for (const func of cluster.functions) {
                    functions.push(func.toJSON());
                }
            }
        }

        /* (Methods) */
        let methods: any = undefined;
        keys = Object.keys(this.methods);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            methods = [];
            /* (Flatten MethodClusters into JSON method bodies) */
            for (const key of keys) {
                for (const method of this.methods[key].methods) methods.push(method.toJSON());
            }
        }

        return {
            $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
            luaClasses,
            tables,
            namespaces,
            fields,
            functions,
            methods
        };
    }
}
