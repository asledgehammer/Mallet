import { RosettaEntity } from '../RosettaEntity';

/**
 * **RosettaLuaReturns**
 *
 * @author Jab
 */
export class RosettaLuaReturns extends RosettaEntity {
  type: string;
  nullable: boolean = false;
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
    this.nullable = this.readBoolean('nullable') || false;
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
    if (raw.type !== undefined) {
      this.type = this.readRequiredString('type', raw);
    }
    this.nullable = this.readBoolean('nullable', raw) || false;
  }

  toJSON(patch: boolean = false): any {
    const { type, notes, nullable } = this;

    const json: any = {};

    /* (Properties) */
    json.type = type;
    json.notes = notes !== undefined && this.writeNotes(notes) !== '' ? notes : undefined;
    json.nullable = nullable !== undefined ? nullable : undefined;

    return json;
  }
}
