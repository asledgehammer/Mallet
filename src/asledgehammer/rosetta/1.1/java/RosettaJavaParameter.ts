import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaParameter implements JsonSerializable {

    name: string = '';
    type: RosettaJavaType = new RosettaJavaType({ basic: 'Object', nullable: true });
    
    notes?: string;

    constructor(json: JsonObject) {

        // (String: Name)
        if (!json.name || !json.name.length) {
            throw new Error(`JavaParameter doesn't have a defined name!`);
        } else if (typeof (json.name) !== 'string') {
            throw new Error(`JavaParameter's property "name" isn't a string!`);
        }

        this.name = json.name;

        // (String: Notes)
        if (json.notes) {

            if (typeof (json.notes) !== 'string') {
                throw new Error(`JavaParameter "${this.name}"'s property "notes" is not a string!`);
            }

            this.notes = json.notes;

        }

        // (Type)
        if (!json.type) {
            throw new Error(`JavaParameter "${this.name}" doesn't have a defined type!`);
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