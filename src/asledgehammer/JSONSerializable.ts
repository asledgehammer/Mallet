export interface JSONSerializable {
  toJSON(patch: boolean): any;
}
