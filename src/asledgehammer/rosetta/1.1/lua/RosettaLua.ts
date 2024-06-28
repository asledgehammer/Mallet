import { LANGUAGE_ADAPTERS } from "../Rosetta";
import { RosettaNamedCollection } from "../RosettaNamedCollection";
import { RosettaLanguage } from "../../RosettaLanguage";
import { RosettaGame } from "../../RosettaGame";
import { RosettaLuaClass } from "./RosettaLuaClass";
import { RosettaLuaField } from "./RosettaLuaField";
import { RosettaLuaTable } from "./RosettaLuaTable";
import { RosettaLuaFunction } from "./RosettaLuaFunction";
import { JsonObject } from "../../../JsonSerializable";

export const GAME_ADAPTERS: { [id: string]: (json: any) => RosettaGame<'lua', string> } = {};

export class RosettaLua implements RosettaLanguage<'lua'> {

    readonly classes: { [id: string]: RosettaLuaClass } = {};
    readonly games: { [id: string]: RosettaGame<'lua', string> } = {};
    readonly functions: { [id: string]: RosettaNamedCollection<RosettaLuaFunction> } = {};
    readonly fields: { [id: string]: RosettaLuaField } = {};
    readonly tables: { [id: string]: RosettaLuaTable } = {};
    readonly language: 'lua' = 'lua';

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject) {

        let keys: string[];

        // (Lua Classes)
        if (json.classes) {

            keys = Object.keys(json.classes);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.classes[key] = new RosettaLuaClass(json.classes[key]);
            }

        }

        // (Lua Functions)
        if (json.functions) {

            for (const jsonFunction of json.functions) {

                const name = jsonFunction.name;

                let cluster = this.functions[name];
                if (!cluster) {
                    cluster = new RosettaNamedCollection<RosettaLuaFunction>(name);
                    this.functions[name] = cluster;
                }

                cluster.elements.push(new RosettaLuaFunction(json.functions[name]));

            }

        }

        // (Lua Fields)
        if (json.fields) {

            keys = Object.keys(json.fields);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.fields[key] = new RosettaLuaField(json.fields[key]);
            }

        }

        // (Lua Games)
        if (json.games) {

            keys = Object.keys(json.games);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {

                // (Grab registered adapter for game)
                const adapter = GAME_ADAPTERS[key];
                if (!adapter) {
                    console.warn(`Unknown adapter: ${key}`);
                    continue;
                }

                // (Load game JSON)
                this.games[key] = adapter(json.games[key]);

            }

        }
    }

    toJSON() {

        const { classes, fields, functions, games } = this;

        const json: JsonObject = {};

        let keys: string[];

        // (Lua Classes)
        keys = Object.keys(classes);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write classes)
            json.classses = {};
            for (const key of keys) {
                json.classes[key] = classes[key].toJSON();
            }

        }

        // (Lua Functions)
        keys = Object.keys(functions);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write functions)
            json.functions = [];
            for (const key of keys) {
                for (const func of functions[key].elements) {
                    json.methods.push(func.toJSON());
                }
            }

        }

        // (Lua Fields)
        keys = Object.keys(fields);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write fields)
            json.fields = {};
            for (const key of keys) {
                json.fields[key] = fields[key].toJSON();
            }

        }

        // (Lua Games)
        keys = Object.keys(games);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write games)
            json.games = {};
            for (const key of keys) {
                json.games[key] = games[key].toJSON();
            }

        }

        return json;
    }

}

// Register the language to the global adapters.
LANGUAGE_ADAPTERS['lua'] = (json: any): RosettaLua => new RosettaLua(json);
