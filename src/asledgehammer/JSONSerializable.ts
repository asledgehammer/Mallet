export type JsonObject = { [id: string]: any };

export interface JsonSerializable {
  // fromJSON(json: JsonObject): void;
  toJSON(): JsonObject;
}
