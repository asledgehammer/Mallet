import { JsonObject, JsonSerializable } from "../../../JsonSerializable";

export class RosettaLuaConstructor implements JsonSerializable {

    constructor(json: JsonObject) {
        this.fromJSON(json);
    }

    fromJSON(json: JsonObject) {
        throw new Error("Method not implemented.");
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

}