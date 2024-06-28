import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaGenerics implements JsonSerializable {

    items: RosettaJavaType[] = [];

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject) {

        const { items } = this;

        // (Items)
        if (json.items) {
            for (const item of json.items) {
                items.push(new RosettaJavaType(item));
            }
        }

    }

    toJSON(): JsonObject {

        const { items } = this;

        const json: JsonObject = {};

        // (Items)
        if (items && items.length) {

            json.items = [];

            // (Write items)
            for (const item of items) {
                json.items.push(item);
            }

        }

        return json;

    }

}