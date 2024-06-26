export interface RosettaSerializable {
    fromJSON(json: any): void;
    toJSON(): any;
}
