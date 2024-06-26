import { RosettaSerializable } from "../RosettaSerializable";

export class RosettaLuaMethod implements RosettaSerializable {

    constructor(json: any) {
        this.fromJSON(json);
    }

    fromJSON(json: any): void {
        throw new Error("Method not implemented.");
    }

    toJSON() {
        throw new Error("Method not implemented.");
    }
    
}