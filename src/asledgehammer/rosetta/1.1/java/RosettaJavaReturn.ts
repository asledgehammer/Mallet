import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaReturn implements JsonSerializable {

    type: RosettaJavaType;
    
    notes?: string;

    constructor(json: JsonObject) {

        // (Type)
        if (!json.type) {
            throw new Error();
        }

        this.type = new RosettaJavaType(json.type);

        // (String: Notes)
        if (json.notes && json.notes.length) {
            this.notes = json.notes;
        }

    }

    toJSON(): JsonObject {

        const {
            notes,
            type
        } = this;

        const json: JsonObject = {};

        // (Type)
        json.type = type.toJSON();

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        return json;

    }

}