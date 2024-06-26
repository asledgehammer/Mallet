import * as Assert from '../../Assert';

import { JSON_PATCH_SCHEMA_URL, JSON_SCHEMA_URL } from './Rosetta';
import { RosettaEntity } from './RosettaEntity';

import { RosettaLuaFunction } from './lua/RosettaLuaFunction';
import { RosettaLuaTable } from './lua/RosettaLuaTable';
import { RosettaLuaTableField } from './lua/RosettaLuaTableField';
import { RosettaLuaClass } from './lua/RosettaLuaClass';
import { RosettaFileInfo } from './RosettaFileInfo';

/**
 * **RosettaFile**
 *
 * @author Jab
 */
export class RosettaFile extends RosettaEntity {

    /* (Lua) */
    readonly luaClasses: { [name: string]: RosettaLuaClass } = {};
    readonly tables: { [name: string]: RosettaLuaTable } = {};
    readonly functions: { [name: string]: RosettaLuaFunction } = {};
    readonly fields: { [name: string]: RosettaLuaTableField } = {};

    /** The internal file identifier in Rosetta. */
    readonly id: string;
    readonly fileInfo: RosettaFileInfo;

    constructor(fileInfo: RosettaFileInfo, raw: { [key: string]: any } = {}, readOnly: boolean) {
        super(raw, readOnly);

        this.fileInfo = fileInfo;
        this.id = RosettaFile.asFileID(fileInfo.uri);

        /* (Tables) */
        if (raw.tables !== undefined) {
            const rawTables = raw.tables;
            for (const name of Object.keys(rawTables)) {
                const rawTable = rawTables[name];
                const table = new RosettaLuaTable(name, rawTable);
                this.tables[table.name] = this.tables[name] = table;
            }
        }

        /* (Functions) */
        if (raw.functions !== undefined) {
            const rawFunctions = raw.functions;
            for (const name of Object.keys(rawFunctions)) {
                const rawFunction = rawFunctions[name];
                const func = new RosettaLuaFunction(name, rawFunction);
                this.functions[func.name] = this.functions[name] = func;
            }
        }

        /* (Values) */
        if (raw.values !== undefined) {
            const rawValues = raw.values;
            for (const name of Object.keys(rawValues)) {
                const rawValue = rawValues[name];
                const value = new RosettaLuaTableField(name, rawValue);
                this.fields[value.name] = this.fields[name] = value;
            }
        }

        /* (Lua Classes) */
        if (raw.luaClasses !== undefined) {
            const rawLuaClasses = raw.luaClasses;
            for (const name of Object.keys(rawLuaClasses)) {
                const rawLuaClass = rawLuaClasses[name];
                const luaClass = new RosettaLuaClass(name, rawLuaClass);
                this.luaClasses[luaClass.name] = this.luaClasses[name] = luaClass;
            }
        }
    }

    /**
     * Creates a new Lua class in the patch.
     *
     * @param name The name of the new Lua class.
     * @returns The new Lua class.
     *
     * @throws Error Thrown if:
     * - The object is in 'read-only' mode.
     * - A global Lua field already exists with the same name in the patch.
     */
    createLuaClass(name: string): RosettaLuaClass {
        /* (Make sure the object can be modified) */
        this.checkReadOnly();

        const luaClass = new RosettaLuaClass(name);

        // (Only check for the file instance)
        if (this.luaClasses[luaClass.name]) {
            throw new Error(`A global Lua Class already exists: ${luaClass.name}`);
        }

        this.luaClasses[luaClass.name] = luaClass;

        return luaClass;
    }

    /**
     * Creates a new Lua table in the patch.
     *
     * @param name The name of the new Lua table.
     * @returns The new Lua table.
     *
     * @throws Error Thrown if:
     * - The object is in 'read-only' mode.
     * - A global Lua field already exists with the same name in the patch.
     */
    createGlobalLuaTable(name: string): RosettaLuaTable {
        /* (Make sure the object can be modified) */
        this.checkReadOnly();

        const luaTable = new RosettaLuaTable(name);

        // (Only check for the file instance)
        if (this.tables[luaTable.name]) {
            throw new Error(`A global Lua Table already exists: ${luaTable.name}`);
        }

        this.tables[luaTable.name] = luaTable;

        return luaTable;
    }

    /**
     * Creates a new global Lua function in the patch.
     *
     * @param name The name of the new global Lua function.
     * @returns The new global Lua function.
     *
     * @throws Error Thrown if:
     * - The object is in 'read-only' mode.
     * - A global Lua field already exists with the same name in the patch.
     */
    createGlobalLuaFunction(name: string): RosettaLuaFunction {
        /* (Make sure the object can be modified) */
        this.checkReadOnly();

        const luaFunction = new RosettaLuaFunction(name);

        // (Only check for the file instance)
        if (this.functions[luaFunction.name]) {
            throw new Error(`A global Lua Function already exists: ${luaFunction.name}`);
        }

        this.functions[luaFunction.name] = luaFunction;

        return luaFunction;
    }

    /**
     * Creates a new global Lua field in the patch.
     *
     * @param name The name of the new global Lua field.
     * @returns The new global Lua field.
     *
     * @throws Error Thrown if:
     * - The object is in 'read-only' mode.
     * - A global Lua field already exists with the same name in the patch.
     */
    createGlobalLuaField(name: string): RosettaLuaTableField {
        /* (Make sure the object can be modified) */
        this.checkReadOnly();

        const luaField = new RosettaLuaTableField(name);

        // (Only check for the file instance)
        if (this.fields[luaField.name]) {
            throw new Error(`A global Lua Field already exists: ${luaField.name}`);
        }

        this.fields[luaField.name] = luaField;

        return luaField;
    }

    save(patch: boolean = false) {
        const json = this.toJSON(patch);
        return JSON.stringify({ $schema: JSON_PATCH_SCHEMA_URL, ...json }, null, 4);;
    }

    toJSON(patch: boolean = false) {
        const { luaClasses, functions, tables, fields } = this;

        const json: any = {};

        /* (Global Lua Classes) */
        let keys = Object.keys(luaClasses);
        if (keys.length) {
            json.luaClasses = {};
            keys.sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                json.luaClasses[key] = luaClasses[key].toJSON(patch);
            }
        }

        /* (Global Tables) */
        keys = Object.keys(tables);
        if (keys.length) {
            json.tables = {};
            keys.sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                json.tables[key] = tables[key].toJSON(patch);
            }
        }

        /* (Global Functions) */
        keys = Object.keys(functions);
        if (keys.length) {
            json.functions = {};
            keys.sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                json.functions[key] = functions[key].toJSON(patch);
            }
        }

        /* (Global Values) */
        keys = Object.keys(fields);
        if (keys.length) {
            json.fields = {};
            keys.sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                json.fields[key] = fields[key].toJSON(patch);
            }
        }

        return json;
    }

    /**
     * Transforms a raw path URI to a file identifier by:
     * - Forcing all lower-case lettering.
     * - Forces all directory delimiters to be `/`.
     * - Removes `/` at the beginning of the URI.
     * - Removes `json/` and `yml/` at the beginning of the URI.
     * - Removes '.ext' from the end of the URI.
     *
     * @param path The raw path URI to transform.
     * @returns The transformed path URI as a file identifier.
     */
    static asFileID(path: string): string {
        path = path.toLowerCase().trim();

        while (path.indexOf('\\') !== -1) path = path.replace('\\', '/');

        /* ('/' check at beginning of path) */
        if (path.indexOf('/') === 0) path = path.substring(1);

        /* ('json/' check at beginning of path) */
        if (path.indexOf('json/') === 0) path = path.substring('json/'.length);

        /* ('yml/' check at beginning of path) */
        if (path.indexOf('yml/') === 0) path = path.substring('yml/'.length);

        // (File extension check) */
        if (path.indexOf('.yml') !== -1) path = path.substring(0, path.length - '.yml'.length);
        if (path.indexOf('.yaml') !== -1) path = path.substring(0, path.length - '.yaml'.length);
        if (path.indexOf('.json') !== -1) path = path.substring(0, path.length - '.json'.length);
        if (path.indexOf('.jsonc') !== -1) path = path.substring(0, path.length - '.jsonc'.length);

        return path;
    }
}
