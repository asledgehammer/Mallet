import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaNamedCollection } from "../RosettaNamedCollection";
import { RosettaJavaConstructor } from "./RosettaJavaConstructor";
import { RosettaJavaField } from "./RosettaJavaField";
import { RosettaJavaGenerics } from "./RosettaJavaGenerics";
import { RosettaJavaMethod } from "./RosettaJavaMethod";

export class RosettaJavaClass implements JsonSerializable {

    staticFields: { [id: string]: RosettaJavaField } = {};
    staticMethods: { [id: string]: RosettaNamedCollection<RosettaJavaMethod> } = {};
    methods: { [id: string]: RosettaNamedCollection<RosettaJavaMethod> } = {};
    constructors: RosettaJavaConstructor[] = [];

    generics?: RosettaJavaGenerics;
    deprecated?: boolean;
    extends?: string;
    notes?: string;
    tags?: string[];

    constructor(json: JsonObject) {

        let keys: string[];

        // (Flag: Deprecated)
        if (json.deprecated !== undefined) {

            if (typeof (json.deprecated) !== 'boolean') {
                throw new Error();
            }

            this.deprecated = json.deprecated;
        }

        // (String: Extends)
        if (json.extends !== undefined) {

            if (typeof (json.extends) !== 'string') {
                throw new Error();
            }

            this.extends = json.extends;
        }

        // (String: Notes)
        if (json.notes !== undefined) {

            if (typeof (json.notes) !== 'boolean') {
                throw new Error();
            }

            this.notes = '' + json.notes;
        }

        // (String[]: Tags)
        if (json.tags !== undefined) {

            if (!Array.isArray(json.tags)) {
                throw new Error();
            }

            if (json.tags.length) {
                // (Force strings)
                this.tags = [...json.tags.map((a) => `${a}`)];
            }

        }

        // (Generics)
        if (json.generics && json.generics.length) {
            this.generics = new RosettaJavaGenerics(json.generics);
        }

        // (Static Fields)
        if (json.staticFields) {

            keys = Object.keys(json.staticFields);
            keys.sort((a, b) => a.localeCompare(b));

            for (const key of keys) {
                this.staticFields[key] = new RosettaJavaField(json.staticFields[key]);
            }

        }

        // (Constructors)
        if (json.constructors) {
            for (const cons of json.constructors) {
                this.constructors.push(new RosettaJavaConstructor(cons));
            }
        }

        // (Methods)
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

        // (Static Methods)
        if (json.staticMethods) {

            for (const jsonMethod of json.staticMethods) {

                const name = jsonMethod.name;

                let cluster = this.methods[name];
                if (!cluster) {
                    cluster = new RosettaNamedCollection<RosettaJavaMethod>(name);
                    this.methods[name] = cluster;
                }

                cluster.elements.push(new RosettaJavaMethod(json.staticMethods[name]));
            }

        }

    }

    toJSON(): JsonObject {

        const {
            constructors,
            deprecated,
            extends: extendz,
            generics,
            methods,
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

        // (Generics)
        if (generics) {
            json.generics = generics.toJSON();
        }

        // (Flag: Deprecated)
        if (deprecated) {
            json.deprecated = true;
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