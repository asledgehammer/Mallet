import * as Assert from '../../../Assert';

import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaParameter } from './RosettaJavaParameter';

import { RosettaJavaClass } from './RosettaJavaClass';
import { JavaVisibilityScope } from './Types';

/**
 * **RosettaJavaConstructor**
 *
 * @author Jab
 */
export class RosettaJavaConstructor extends RosettaEntity {
  readonly parameters: RosettaJavaParameter[] = [];

  readonly clazz: RosettaJavaClass;
  readonly deprecated: boolean;
  readonly modifiers: string[];

  notes: string | undefined;

  constructor(clazz: RosettaJavaClass, raw: { [key: string]: any }) {
    super(raw);

    Assert.assertNonNull(clazz, 'clazz');

    this.clazz = clazz;

    /* (Properties) */
    this.deprecated = this.readBoolean('deprecated') != null;
    this.modifiers = this.readModifiers();
    this.notes = this.readNotes(raw);

    /* (Parameters) */
    if (raw.parameters !== undefined) {
      const rawParameters: { [key: string]: any }[] = raw.parameters;
      for (const rawParameter of rawParameters) {
        const parameter = new RosettaJavaParameter(rawParameter);
        this.parameters.push(parameter);
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    /* (Properties) */
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

  toJSON(patch: boolean = false): any {
    const { notes, deprecated, modifiers, parameters } = this;

    const json: any = {};
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;

    /* (Properties) */
    if (!patch) {
      json.deprecated = deprecated;
      if (modifiers.length) json.modifiers = modifiers;
    }

    /* (Properties) */
    if (parameters.length) {
      json.parameters = [];
      for (const parameter of parameters) json.parameters.push(parameter.toJSON(patch));
    }

    return json;
  }

  isStatic(): boolean {
    return this.hasModifier('static');
  }

  isFinal(): boolean {
    return this.hasModifier('final');
  }

  hasModifiers(): boolean {
    return this.modifiers && !!this.modifiers.length;
  }

  hasModifier(modifier: string): boolean {
    return this.hasModifiers() && this.modifiers.indexOf(modifier) !== -1;
  }

  getVisibilityScope(): JavaVisibilityScope {
    if (!this.modifiers.length) return 'package';
    if (this.hasModifier('public')) return 'public';
    else if (this.hasModifier('protected')) return 'protected';
    else if (this.hasModifier('private')) return 'private';
    else return 'package';
  }

  getSignature(): string {
    let signature = `constructor`;
    if (this.parameters && this.parameters.length) {
      signature += '_';
      for (const param of this.parameters) {
        signature += `${param.type.basic}-`;
      }
      signature = signature.substring(0, signature.length - 1);
    }
    return signature;
  }
}
