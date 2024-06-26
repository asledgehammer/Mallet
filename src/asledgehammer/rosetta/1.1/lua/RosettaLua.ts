import { RosettaGame } from "../../RosettaGame";
import { RosettaLanguage } from "../../RosettaLanguage";
import { LANGUAGE_ADAPTERS } from "../Rosetta";

export const GAME_ADAPTERS: { [id: string]: (json: any) => RosettaGame<string, string> } = {};

export class RosettaLua implements RosettaLanguage<'lua'> {

    readonly games: { [id: string]: RosettaGame<'lua', string> } = {};
    readonly language: 'lua' = 'lua';

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

// Register the language to the global adapters.
LANGUAGE_ADAPTERS['lua'] = (json: any): RosettaLua => new RosettaLua(json);
