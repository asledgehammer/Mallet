import { JsonObject, JsonSerializable } from "../../../JsonSerializable";

export class RosettaJavaMethod implements JsonSerializable {

    constructor(json: JsonObject) {
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

}