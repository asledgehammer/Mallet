import { JsonSerializable } from "../JsonSerializable";

export interface RosettaGame<L extends string, G extends string> extends JsonSerializable {
    readonly language: L;
    readonly game: G;
}
