import { JsonObject } from "../../../JsonSerializable";

export class RosettaLuaFunction implements JsonObject {

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