import { RosettaSerializable } from "./1.1/RosettaSerializable";
import { RosettaGame } from "./RosettaGame";

export interface RosettaLanguage<L extends string> extends RosettaSerializable {
    readonly language: L;
    readonly games: { [id: string]: RosettaGame<L, string> };
}
