import { JsonSerializable } from "../JsonSerializable";
import { RosettaGame } from "./RosettaGame";

export interface RosettaLanguage<L extends string> extends JsonSerializable {
    readonly language: L;
    readonly games: { [id: string]: RosettaGame<L, string> };
}
