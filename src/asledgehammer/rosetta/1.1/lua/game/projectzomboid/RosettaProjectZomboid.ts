import { JsonObject } from "../../../../../JsonSerializable";
import { RosettaGame } from "../../../../RosettaGame";
import { GAME_ADAPTERS } from "../../RosettaLua";

export class RosettaProjectZomboid implements RosettaGame<'lua', 'projectzomboid'> {

    readonly language: 'lua' = 'lua';
    readonly game: 'projectzomboid' = 'projectzomboid';

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

// Register the game to the lua game-adapters.
GAME_ADAPTERS['projectzomboid'] = (json: any): RosettaProjectZomboid => new RosettaProjectZomboid(json);
