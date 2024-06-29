import { JsonObject, JsonSerializable } from "../../../JsonSerializable";
import { RosettaJavaType } from "./RosettaJavaType";

export class RosettaJavaGenerics implements JsonSerializable {

    items: RosettaJavaType[];

    constructor(json: JsonObject) {

        // (Items)
        if (!json.items) {
            throw new Error();
        } else if (!Array.isArray(json.items)) {
            throw new Error();
        }

        this.items = [...json.items.map((item) => new RosettaJavaType(item))];
    }

    toJSON(): JsonObject {

        const { items } = this;

        const json: JsonObject = {};

        // (Items)
        json.items = [...items.map((item) => item.toJSON())];

        return json;

    }

}