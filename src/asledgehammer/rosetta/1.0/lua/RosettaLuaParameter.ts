import * as Assert from '../../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { formatName } from '../RosettaUtils';

/**
 * **RosettaLuaParameter**
 *
 * @author Jab
 */
export class RosettaLuaParameter extends RosettaEntity {
  name: string;
  type: string;
  optional: boolean = false;
  nullable: boolean = false;
  notes: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    Assert.assertNonNull(raw.type, 'raw.type');

    this.name = formatName(this.readRequiredString('name'));
    if (raw.type !== undefined) {
      let type = this.readString('type');
      if (type === undefined) type = 'any';
      this.type = type;
    } else {
      this.type = 'any';
    }
    this.notes = this.readNotes();
    this.optional = this.readBoolean('optional') || false;
    this.nullable = this.readBoolean('nullable') || false;
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
    if (raw.type !== undefined) {
      this.type = this.readRequiredString('type', raw);
    }
    this.optional = this.readBoolean('optional', raw) || false;
    this.nullable = this.readBoolean('nullable', raw) || false;
  }

  toJSON(patch: boolean = false): any {
    const { name, type, notes, nullable, optional } = this;

    const json: any = {};

    /* (Properties) */
    json.name = name;
    json.type = type;
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
    json.optional = optional !== undefined ? optional : undefined;
    json.nullable = nullable !== undefined ? nullable : undefined;

    return json;
  }
}
