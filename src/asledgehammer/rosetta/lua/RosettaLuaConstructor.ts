import * as Assert from '../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { RosettaLuaParameter } from './RosettaLuaParameter';

import { RosettaLuaClass } from './RosettaLuaClass';

/**
 * **RosettaLuaConstructor**
 *
 * @author Jab
 */
export class RosettaLuaConstructor extends RosettaEntity {
  readonly parameters: RosettaLuaParameter[] = [];
  readonly clazz: RosettaLuaClass;
  notes: string | undefined;

  constructor(clazz: RosettaLuaClass, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonNull(clazz, 'clazz');

    /* (Properties) */
    this.clazz = clazz;
    this.notes = this.readNotes(raw);

    /* (Parameters) */
    if (raw.parameters !== undefined) {
      const rawParameters: { [key: string]: any }[] = raw.parameters;
      for (const rawParameter of rawParameters) {
        const parameter = new RosettaLuaParameter(rawParameter);
        this.parameters.push(parameter);
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);

    /* (Parameters) */
    if (raw.parameters !== undefined) {
      const rawParameters: { [key: string]: any }[] = raw.parameters;

      /*
       * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
       *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
       */
      if (this.parameters.length !== rawParameters.length) {
        throw new Error(
          `The class ${this.clazz.name}'s constructor's parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`,
        );
      }

      for (let index = 0; index < rawParameters.length; index++) {
        this.parameters[index].parse(rawParameters[index]);
      }
    }
  }

  /**
   * Adds a parameter to the constructor.
   *
   * @param name The name of the parameter to display.
   * @param type (Optional) The type of parameter to provide. (Default: `any`)
   * @param notes (Optional) Notes on the parameter. (Default: ``)
   * @returns The new parameter.
   */
  addParameter(name: string, type: string = 'any', notes: string = ''): RosettaLuaParameter {
    const parameter = new RosettaLuaParameter({ name, type, notes });
    this.parameters.push(parameter);
    return parameter;
  }

  toJSON(patch: boolean = false): any {
    const { notes, parameters } = this;

    const json: any = {};

    /* (Properties) */
    json.notes = notes !== undefined && notes !== '' ? notes : undefined;

    /* (Parameters) */
    if (parameters.length) {
      json.parameters = [];
      for (const parameter of parameters) json.parameters.push(parameter.toJSON(patch));
    }

    return json;
  }
}
