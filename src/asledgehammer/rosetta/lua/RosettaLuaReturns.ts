import { RosettaEntity } from '../RosettaEntity';

/**
 * **RosettaLuaReturns**
 *
 * @author Jab
 */
export class RosettaLuaReturns extends RosettaEntity {
  type: string;
  optional: boolean = false;
  notes: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    if (raw.type !== undefined) {
      let type = this.readString('type');
      if (type === undefined) type = 'any';
      this.type = type;
    } else {
      this.type = 'any';
    }
    this.notes = this.readNotes();
    this.optional = this.readBoolean('optional') || false;
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
    if (raw.type !== undefined) {
      this.type = this.readRequiredString('type', raw);
    }
    this.optional = this.readBoolean('optional', raw) || false;
  }

  toJSON(patch: boolean = false): any {
    const { type, notes, optional } = this;

    const json: any = {};

    /* (Properties) */
    json.type = type;
    json.notes = notes !== undefined && this.writeNotes(notes) !== '' ? notes : undefined;
    json.optional = optional !== undefined ? optional : undefined;

    return json;
  }
}
