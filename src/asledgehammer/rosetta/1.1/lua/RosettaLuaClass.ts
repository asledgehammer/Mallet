import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaNamedCollection } from "../RosettaNamedCollection";
import { RosettaLuaConstructor } from "./RosettaLuaConstructor";
import { RosettaLuaField } from "./RosettaLuaField";
import { RosettaLuaMethod } from "./RosettaLuaMethod";

export class RosettaLuaClass implements JsonSerializable {

    staticFields: { [id: string]: RosettaLuaField } = {};
    staticMethods: { [id: string]: RosettaNamedCollection<RosettaLuaMethod> } = {};
    fields: { [id: string]: RosettaLuaField } = {};
    methods: { [id: string]: RosettaNamedCollection<RosettaLuaMethod> } = {};
    constructors: RosettaLuaConstructor[] = [];
    deprecated: boolean = false;
    extends: string | undefined = undefined;
    mutable: boolean = false;
    notes: string | undefined = undefined;
    tags: string[] = [];

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject): void {

        let keys: string[];

        // (Flag: Deprecated)
        if (json.deprecated !== undefined) {
            this.deprecated = json.deprecated;
        }

        // (Flag: Mutable)
        if (json.mutable !== undefined) {
            this.mutable = json.mutable;
        }

        // (String: Extends)
        if (json.extends !== undefined) {
            this.extends = '' + json.extends;
        }

        // (String: Notes)
        if (json.notes !== undefined) {
            this.notes = '' + json.notes;
        }

        // (String[]: Tags)
        if (json.tags !== undefined) {
            for (const tag of json.tags) {
                this.tags.push('' + tag);
            }
        }

        // (Static Fields)
        if (json.staticFields) {

            keys = Object.keys(json.staticFields);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.staticFields[key] = new RosettaLuaField(json.staticFields[key]);
            }

        }

        // (Fields)
        if (json.fields) {

            keys = Object.keys(json.fields);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.fields[key] = new RosettaLuaField(json.fields[key]);
            }

        }

        // (Constructors)
        if (json.constructors) {
            for (const cons of json.constructors) {
                this.constructors.push(new RosettaLuaConstructor(cons));
            }
        }

        // (Methods)
        if (json.methods) {

            for (const jsonMethod of json.methods) {

                const name = jsonMethod.name;

                let cluster = this.methods[name];
                if (!cluster) {
                    cluster = new RosettaNamedCollection<RosettaLuaMethod>(name);
                    this.methods[name] = cluster;
                }

                cluster.elements.push(new RosettaLuaMethod(json.methods[name]));
            }

        }

        // (Static Methods)
        if (json.staticMethods) {

            for (const jsonMethod of json.staticMethods) {

                const name = jsonMethod.name;

                let cluster = this.methods[name];
                if (!cluster) {
                    cluster = new RosettaNamedCollection<RosettaLuaMethod>(name);
                    this.methods[name] = cluster;
                }

                cluster.elements.push(new RosettaLuaMethod(json.staticMethods[name]));
            }

        }

    }

    toJSON(): JsonObject {

        const {
            constructors,
            deprecated,
            extends: extendz,
            fields,
            methods,
            mutable,
            notes,
            staticFields,
            staticMethods,
            tags
        } = this;

        const json: JsonObject = {};

        let keys: string[];

        // (Constructors)
        if (constructors.length) {

            json.constructors = [];

            // (Write constructors)
            for (const cons of constructors) {
                json.constructors.push(cons.toJSON());
            }

        }

        // (Static Fields)
        keys = Object.keys(staticFields);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write fields)
            json.staticFields = {};
            for (const key of keys) {
                json.staticFields[key] = staticFields[key].toJSON();
            }

        }

        // (Fields)
        keys = Object.keys(fields);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write fields)
            json.fields = {};
            for (const key of keys) {
                json.fields[key] = fields[key].toJSON();
            }

        }

        // (Static Methods)
        keys = Object.keys(staticMethods);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write methods)
            json.staticMethods = [];
            for (const key of keys) {
                for (const method of staticMethods[key].elements) {
                    json.staticMethods.push(method.toJSON());
                }
            }

        }

        // (Methods)
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

        // (Flag: Deprecated)
        if (deprecated) {
            json.deprecated = true;
        }

        // (Flag: Mutable)
        if (mutable) {
            json.mutable = true;
        }

        // (String: Extends)
        if (extendz && extendz.length) {
            json.extends = extendz;
        }

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        // (String[]: Tags)
        if (tags && tags.length) {

            json.tags = [];

            // (Write tags)
            for (const tag of tags) {
                json.tags.push(tag);
            }

        }

        return json;
    }

}