import * as Assert from '../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaType } from './RosettaJavaType';

/**
 * **RosettaJavaReturns**
 *
 * @author Jab
 */
export class RosettaJavaReturns extends RosettaEntity {
  readonly type: RosettaJavaType;
  notes: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    Assert.assertNonNull(raw.type, 'raw.type');

    this.type = new RosettaJavaType(raw.type);
    this.parse(raw);
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
  }

  toJSON(patch: boolean = false): any {
    const { type, notes } = this;

    const json: any = {};

    /* (Properties) */
    if (!patch) json.type = type;
    json.notes = notes !== undefined && notes !== '' ? notes : undefined;

    return json;
  }
}
