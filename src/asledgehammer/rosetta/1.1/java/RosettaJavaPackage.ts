import { JsonObject, JsonSerializable } from "../../../JsonSerializable";

export class RosettaJavaPackage implements JsonSerializable {

    constructor(json: JsonObject) {
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

}