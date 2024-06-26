import { RosettaSerializable } from "./1.1/RosettaSerializable";

export interface RosettaGame<L extends string, G extends string> extends RosettaSerializable {
    readonly language: L;
    readonly game: G;
}
