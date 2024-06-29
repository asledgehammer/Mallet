import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaField implements JsonSerializable {

    type: RosettaJavaType;
    name: string;

    modifiers?: string[];
    notes?: string;
    tags?: string[];
    deprecated?: boolean;
    defaultValue?: string;

    constructor(json: JsonObject) {

        // (String: Name)
        if (!json.name || !json.name.length) {
            throw new Error(`JavaField doesn't have a defined name!`);
        } else if (typeof (json.name) !== 'string') {
            throw new Error(`JavaField's property "name" isn't a string!`);
        }

        this.name = json.name;

        // (Flag: Deprecated)
        if (json.deprecated !== undefined) {

            if (typeof (json.deprecated) !== 'boolean') {
                throw new Error(`JavaField "${this.name}"'s property "deprecated" is not a boolean!`);
            }

            this.deprecated = json.deprecated;

        }

        // (String[]: Modifiers)
        if (json.modifiers) {

            if (!Array.isArray(json.modifiers)) {
                throw new Error(`JavaField "${this.name}"'s property "modifiers" is not a string[]!`);
            }

            if (json.modifiers.length) {
                // (Force strings)
                this.modifiers = [...json.modifiers.map((a) => `${a}`)];
            }

        }

        // (String: defaultValue)
        if (json.defaultValue) {
            if (typeof (json.defaultValue) !== 'string') {
                throw new Error(`JavaField "${this.name}"'s property "defaultValue" is not a string!`);
            }
            this.defaultValue = json.defaultValue;
        }

        // (String[]: Tags)
        if (json.tags) {

            if (!Array.isArray(json.tags)) {
                throw new Error(`JavaField "${this.name}"'s property "tags" is not a string[]!`);
            }

            // (Force strings)
            this.tags = [...json.tags.map((a) => `${a}`)];

        }

        // (String: Notes)
        if (json.notes) {

            if (typeof (json.notes) !== 'string') {
                throw new Error(`JavaField "${this.name}"'s property "notes" is not a string!`);
            }

            this.notes = json.notes;

        }

        // (Type)
        if (!json.type) {
            throw new Error(`JavaField "${this.name}" doesn't have a defined type!`);
        }
        this.type = new RosettaJavaType(json.type);

    }

    toJSON(): JsonObject {

        const {
            deprecated,
            defaultValue,
            modifiers,
            name,
            notes,
            tags,
            type
        } = this;

        const json: JsonObject = {};

        // (String: Name)
        json.name = name;

        // (Type)
        json.type = type.toJSON();

        // (Flag: Deprecated)
        if (deprecated) {
            json.deprecated = true;
        }

        // (String: DefaultValue)
        if (defaultValue) {
            json.defaultValue = defaultValue;
        }

        // (String[]: Modifiers)
        if (modifiers && modifiers.length) {
            json.modifiers = [...modifiers];
        }

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        // (String[]: Tags)
        if (tags && tags.length) {
            json.tags = [...tags];
        }

        return json;
    }

}