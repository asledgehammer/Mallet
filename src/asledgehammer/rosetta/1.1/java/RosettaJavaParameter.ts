import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaParameter implements JsonSerializable {

    name: string = '';
    notes?: string;
    type: RosettaJavaType = new RosettaJavaType({ basic: 'Object', nullable: true });

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject): void {

        // (String: Name)
        this.name = json.name;

        // (String: Notes)
        if (json.notes && json.notes.length) {
            this.notes = json.notes;
        }

        // (Type)
        if (!json.type) {
            throw new Error('Type must be defined for RosettaJavaParameters!');
        }

        this.type = new RosettaJavaType(json.type);

    }

    toJSON(): JsonObject {

        const { name, notes, type } = this;

        const json: JsonObject = {};

        // (String: Name)
        json.name = name;

        // (String: Notes)
        if (notes && notes.length) {
            json.notes = notes;
        }

        // (Type)
        if (type === undefined) {
            throw new Error('Type must be defined for RosettaJavaParameters!');
        }

        json.type = type?.toJSON();

        return json;
        
    }
}