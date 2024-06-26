import * as Assert from '../../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { formatName } from '../RosettaUtils';

/**
 * **RosettaLuaTableField**
 *
 * @author Jab
 */
export class RosettaLuaTableField extends RosettaEntity {
  name: string;
  type: string;
  nullable: boolean = false;
  notes: string | undefined;
  defaultValue: string | undefined;

  constructor(name: string, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');
    this.name = formatName(name);

    if (raw.type !== undefined) {
      let type = this.readString('type');
      if (type === undefined) type = 'any';
      this.type = type;
    } else {
      this.type = 'any';
    }

    this.notes = this.readNotes();
    this.defaultValue = this.readString('defaultValue');
    this.nullable = this.readBoolean('nullable') || false;
  }

  parse(raw: { [key: string]: any }) {
    /* (Properties) */
    this.notes = this.readNotes(raw);
    if (raw.type !== undefined) {
      this.type = this.readRequiredString('type', raw);
    }
    this.defaultValue = this.readString('defaultValue', raw);
    this.nullable = this.readBoolean('nullable', raw) || false;
  }

  /**
   * @param patch If true, the exported JSON object will only contain Patch-specific information.
   *
   * @returns The JSON of the Rosetta entity.
   */
  toJSON(patch: boolean = false): any {
    const { type, notes, defaultValue, nullable } = this;

    const json: any = {};

    /* (Properties) */
    json.type = type;
    json.notes = notes !== undefined && notes !== '' ? notes : undefined;
    json.defaultValue = defaultValue !== undefined ? defaultValue : undefined;
    json.nullable = nullable !== undefined ? nullable : undefined;

    return json;
  }
}
