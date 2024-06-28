import { JsonObject, JsonSerializable } from "../../../JsonSerializable";

export class RosettaJavaMethod implements JsonSerializable {

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject): void {
        throw new Error("Method not implemented.");
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

}