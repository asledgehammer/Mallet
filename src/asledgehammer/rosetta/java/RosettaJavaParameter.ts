import * as Assert from '../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaType } from './RosettaJavaType';
import { formatName } from '../RosettaUtils';

/**
 * **RosettaJavaParameter**
 *
 * @author Jab
 */
export class RosettaJavaParameter extends RosettaEntity {
  readonly type: RosettaJavaType;

  name: string;
  notes: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    Assert.assertNonNull(raw.type, 'raw.type');

    this.name = formatName(this.readRequiredString('name'));
    this.type = new RosettaJavaType(raw.type);
    this.parse(raw);
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
  }

  toJSON(patch: boolean = false): any {
    const { name, notes, type } = this;

    const json: any = {};

    /* (Properties) */
    if (!patch) json.types = type.toJSON(patch);
    json.name = name;
    json.notes = notes !== undefined && notes !== '' ? notes : undefined;

    return json;
  }
}
