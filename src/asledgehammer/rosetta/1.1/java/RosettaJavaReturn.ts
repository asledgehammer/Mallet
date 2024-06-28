import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaReturn implements JsonSerializable {

    type?: RosettaJavaType;
    notes?: string;

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject) {

        // (Type)
        if (json.type) {
            this.type = new RosettaJavaType(json.type);
        }

        // (String: Notes)
        if (json.notes && json.notes.length) {
            this.notes = json.notes;
        }

    }

    toJSON(): JsonObject {

        const { notes, type } = this;

        const json: JsonObject = {};

        // (Type)
        if (type) {
            json.type = type.toJSON();
        }

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        return json;
    }

}