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
  nullable: boolean = true;

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

    this.nullable = this.readBoolean('nullable') || true;
    this.checkNullableFlag();

    this.full = this.readString('full');
  }

  toJSON(patch: boolean = false): any {
    const { rawBasic: basic, full, nullable } = this;

    this.checkNullableFlag();

    const json: any = {};
    json.basic = basic;
    json.full = full;
    json.nullable = nullable != null ? nullable : undefined;

    return json;
  }

  private checkNullableFlag() {
    if(this.nullable && !this.isNullPossible()) {
      this.nullable = false;
    }
  }

  isNullPossible(): boolean {
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
        return false;
      }
    }
    return true;
  }
}
