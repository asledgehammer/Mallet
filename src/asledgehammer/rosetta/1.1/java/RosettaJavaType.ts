import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaGenerics } from "./RosettaJavaGenerics";

export class RosettaJavaType implements JsonSerializable {

    basic: string;

    full?: string;
    generics?: RosettaJavaGenerics;
    /** Nullable defaults to true for all non-primitive cases. */
    nullable?: boolean;

    constructor(json: JsonObject) {

        // (String: Basic)
        if (!json.basic) {
            throw new Error();
        } else if (!json.basic.length) {
            throw new Error();
        }

        this.basic = json.basic;

        // (String: Full)
        if (json.full && json.full.length) {
            this.full = json.full;
        }

        // (Flag: Nullable)
        if (!this.isNullPossible()) {
            this.nullable = false;
        } else if (json.nullable !== undefined) {

            if (typeof (json.nullable) !== 'boolean') {
                throw new Error();
            }

            this.nullable = json.nullable;

        }

        // (Generics)
        if (json.generics && json.generics.length) {
            this.generics = new RosettaJavaGenerics(json.generics);
        }

    }

    toJSON(): JsonObject {

        const {
            basic,
            full,
            generics,
            nullable
        } = this;

        const json: JsonObject = {};

        // (Flag: Nullable)
        if (nullable !== undefined) {
            json.nullable = nullable;
        }

        // (String: Full)
        if (full && full.length) {
            json.full = full;
        }

        // (String: Basic)
        if (basic && basic.length) {
            json.basic = basic;
        }

        // (Generics)
        if (generics) {
            json.generics = generics.toJSON();
        }

        return json;

    }

    isNullPossible(): boolean {
        switch (this.basic) {
            case 'boolean':
            case 'byte':
            case 'short':
            case 'int':
            case 'float':
            case 'double':
            case 'long':
            case 'char':
            case 'null':
            case 'void': {
                return false;
            }
        }
        return true;
    }
}