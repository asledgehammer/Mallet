import { JsonObject } from "../../../JsonSerializable";
import { RosettaGame } from "../../RosettaGame";
import { RosettaLanguage } from "../../RosettaLanguage";
import { LANGUAGE_ADAPTERS } from "../Rosetta";
import { RosettaNamedCollection } from "../RosettaNamedCollection";
import { RosettaJavaClass } from "./RosettaJavaClass";
import { RosettaJavaMethod } from "./RosettaJavaMethod";

export const GAME_ADAPTERS: { [id: string]: (json: any) => RosettaGame<'java', string> } = {};

export class RosettaJava implements RosettaLanguage<'java'> {

    readonly games: { [id: string]: RosettaGame<'java', string> } = {};
    readonly classes: { [id: string]: RosettaJavaClass } = {};
    readonly methods: { [id: string]: RosettaNamedCollection<RosettaJavaMethod> } = {};
    readonly language: 'java' = 'java';

    constructor(json: any) {

        let keys: string[];

        // (Java Classes)
        if (json.classes) {

            keys = Object.keys(json.classes);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.classes[key] = new RosettaJavaClass(json.classes[key]);
            }

        }

        // (Java Methods)
        if (json.methods) {

            for (const jsonMethod of json.methods) {

                const name = jsonMethod.name;

                let cluster = this.methods[name];
                if (!cluster) {
                    cluster = new RosettaNamedCollection<RosettaJavaMethod>(name);
                    this.methods[name] = cluster;
                }

                cluster.elements.push(new RosettaJavaMethod(json.methods[name]));

            }

        }

        // (Java Games)
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

    toJSON(): JsonObject {

        const { classes, methods, games } = this;

        const json: JsonObject = {};

        let keys: string[];

        // (Java Classes)
        keys = Object.keys(classes);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write classes)
            json.classses = {};
            for (const key of keys) {
                json.classes[key] = classes[key].toJSON();
            }

        }

        // (Java Methods)
        keys = Object.keys(methods);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write methods)
            json.methods = [];
            for (const key of keys) {
                for (const method of methods[key].elements) {
                    json.methods.push(method.toJSON());
                }
            }

        }

        // (Java Games)
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
LANGUAGE_ADAPTERS['java'] = (json: any): RosettaJava => new RosettaJava(json);
