import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaParameter } from "./RosettaJavaParameter";

export class RosettaJavaConstructor implements JsonSerializable {

    parameters?: RosettaJavaParameter[];
    modifiers?: string[];
    deprecated?: boolean;
    notes?: string;

    constructor(json: JsonObject) {

        // (String[]: Modifiers)
        if (json.modifiers) {

            if (!Array.isArray(json.modifiers)) {
                throw new Error(`JavaConstructor's property "modifiers" is not a string[]!`);
            }

            if (json.modifiers.length) {
                // (Force strings)
                this.modifiers = [...json.modifiers.map((a) => `${a}`)];
            }

        }

        // (Flag: Deprecated)
        if (json.deprecated !== undefined) {

            if (typeof (json.deprecated) !== 'boolean') {
                throw new Error(`JavaConstructor's property "deprecated" is not a boolean!`);
            }

            this.deprecated = json.deprecated;

        }

        // (Parameters)
        if (json.parameters) {

            if (!Array.isArray(json.parameters)) {
                throw new Error(`JavaConstructor's property "parameters" is not an array!`);
            }

            if (json.parameters.length) {
                this.parameters = [
                    ...json.parameters.map((param) => new RosettaJavaParameter(param))
                ];
            }
        }

        // (String: Notes)
        if (json.notes) {

            if (typeof (json.notes) !== 'string') {
                throw new Error(`JavaConstructor's property "notes" is not a string!`);
            }

            this.notes = json.notes;

        }
    }

    toJSON(): JsonObject {

        const {
            deprecated,
            modifiers,
            notes,
            parameters
        } = this;

        const json: JsonObject = {};

        // (Flag: Deprecated)
        if (deprecated) {
            json.deprecated = true;
        }

        // (String[]: Modifiers)
        if (modifiers && modifiers.length) {
            json.modifiers = [...modifiers];
        }

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        // (Parameters)
        if (parameters && parameters.length) {
            json.parameters = [...parameters.map((param) => param.toJSON())];
        }

        return json;
    }

}