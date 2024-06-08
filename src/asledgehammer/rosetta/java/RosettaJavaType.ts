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
  optional: boolean = true;

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

    this.optional = this.readBoolean('optional') || true;
    this.checkOptionalFlag();

    this.full = this.readString('full');
  }

  toJSON(patch: boolean = false): any {
    const { rawBasic: basic, full, optional } = this;
    const json: any = {};
    json.basic = basic;
    json.full = full;
    json.optional = optional != null ? optional : undefined;
    this.checkOptionalFlag();
    return json;
  }

  private checkOptionalFlag() {
    switch (this.basic) {
      case 'boolean':
      case 'byte':
      case 'short':
      case 'int':
      case 'float':
      case 'double':
      case 'long':
      case 'char':
      case 'null':
      case 'void': {
        this.optional = false;
        break;
      }
      default: {
        break;
      }
    }
  }
}
