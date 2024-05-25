import { RosettaEntity } from '../RosettaEntity';

/**
 * **RosettaJavaType**
 *
 * @author Jab
 */
export class RosettaJavaType extends RosettaEntity {
  readonly rawBasic: string;
  readonly basic: string;
  readonly full: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    const basic = this.readRequiredString('basic');
    this.rawBasic = basic;

    if (basic.indexOf('.') !== -1) {
      const split = basic.split('.');
      this.basic = split[split.length - 1];
    } else {
      this.basic = basic;
    }

    this.full = this.readString('full');
  }

  toJSON(patch: boolean = false): any {
    const { rawBasic: basic, full } = this;

    const json: any = {};

    if (!patch) {
      json.basic = basic;
      json.full = full;
    }

    return json;
  }
}
