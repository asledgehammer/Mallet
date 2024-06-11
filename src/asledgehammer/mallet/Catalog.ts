import { App } from "../../app";
import { generateJavaClass } from "../rosetta/java/JavaLuaGenerator2";
import { RosettaJavaClass, RosettaJavaNamespace } from "../rosetta/java/RosettaJavaClass";
import { generateLuaClass, generateLuaTable } from "../rosetta/lua/LuaLuaGenerator";
import { RosettaLuaClass } from "../rosetta/lua/RosettaLuaClass";
import { RosettaLuaTable } from "../rosetta/lua/RosettaLuaTable";
import { javaClassToTS } from "../rosetta/typescript/JavaTypeScriptGenerator";
import { luaClassToTS, luaTableToTS } from "../rosetta/typescript/LuaTypeScriptGenerator";
import { wrapAsTSFile } from "../rosetta/typescript/TSUtils";
import { JavaClassCard } from "./component/java/JavaClassCard";
import { LuaClassCard } from "./component/lua/LuaClassCard";
import { LuaTableCard } from "./component/lua/LuaTableCard";

export class Catalog {

    readonly app: App;

    readonly luaClasses: { [name: string]: RosettaLuaClass } = {};
    readonly luaTables: { [name: string]: RosettaLuaTable } = {};
    readonly javaClasses: { [name: string]: RosettaJavaClass } = {};

    selected: RosettaLuaClass | RosettaLuaTable | RosettaJavaClass | undefined = undefined;
    selectedCard: LuaClassCard | LuaTableCard | JavaClassCard | undefined = undefined;

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
            for (const name of Object.keys(this.javaClasses)) {
                const javaClass = this.javaClasses[name];
                s += `// Java Class: ${javaClass.namespace.name}.${javaClass.name} \n\n`;
                s += javaClassToTS(javaClass, false, false) + '\n\n';
            }
        }

        /* Lua Classes */
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of Object.keys(this.luaClasses)) {
                const luaClass = this.luaClasses[name];
                s += `// Lua Class: ${luaClass.name} \n\n`;
                s += luaClassToTS(luaClass, false) + '\n\n';
            }
        }

        /* Lua Tables */
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of Object.keys(this.luaTables)) {
                const luaTable = this.luaTables[name];
                s += `// Lua Table: ${luaTable.name} \n\n`;
                s += luaTableToTS(luaTable, false) + '\n\n';
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
            for (const name of Object.keys(this.javaClasses)) {
                const javaClass = this.javaClasses[name];
                s += `-- Java Class: ${javaClass.namespace.name}.${javaClass.name} --\n\n`;
                s += generateJavaClass(javaClass) + '\n';
            }
        }

        /* Lua Classes */
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of Object.keys(this.luaClasses)) {
                const luaClass = this.luaClasses[name];
                s += `-- Lua Class: ${luaClass.name} --\n\n`;
                s += generateLuaClass(luaClass) + '\n';
            }
        }

        /* Lua Tables */
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            keys.sort((a, b) => a.localeCompare(b));
            for (const name of Object.keys(this.luaTables)) {
                const luaTable = this.luaTables[name];
                s += `-- Lua Table: ${luaTable.name} --\n\n`;
                s += generateLuaTable(luaTable) + '\n';
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

        this.app.sidebar.populateTrees();
    }

    toJSON(): any {
        let keys: string[];

        // Lua Classes
        let luaClasses: any = undefined;
        keys = Object.keys(this.luaClasses);
        if (keys.length) {
            luaClasses = {};
            for (const name of keys) {
                luaClasses[name] = this.luaClasses[name].toJSON();
            }
        }

        // Lua Tables
        let tables: any = undefined;
        keys = Object.keys(this.luaTables);
        if (keys.length) {
            tables = {};
            for (const name of keys) {
                tables[name] = this.luaTables[name].toJSON();
            }
        }

        // Java Classes
        let namespaces: any = undefined;
        keys = Object.keys(this.javaClasses);
        if (keys.length) {
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

        return {
            $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
            luaClasses,
            tables,
            namespaces
        };
    }
}
