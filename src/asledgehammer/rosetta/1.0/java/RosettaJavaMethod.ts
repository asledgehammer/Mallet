import { formatName } from '../RosettaUtils';
import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaParameter } from './RosettaJavaParameter';
import { RosettaJavaReturns } from './RosettaJavaReturns';
import { JavaVisibilityScope } from './Types';

/**
 * **RosettaJavaMethod**
 *
 * @author Jab
 */
export class RosettaJavaMethod extends RosettaEntity {

  readonly parameters: RosettaJavaParameter[] = [];
  readonly returns: RosettaJavaReturns;

  readonly name: string;
  readonly deprecated: boolean;
  readonly modifiers: string[];

  notes: string | undefined;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    /* PROPERTIES */
    this.name = formatName(this.readRequiredString('name'));
    this.deprecated = this.readBoolean('deprecated') != null;
    this.modifiers = this.readModifiers();

    /* PARAMETERS */
    if (raw.parameters !== undefined) {
      const rawParameters: { [key: string]: any }[] = raw.parameters;
      for (const rawParameter of rawParameters) {
        this.parameters.push(new RosettaJavaParameter(rawParameter));
      }
    }

    /* RETURNS */
    if (raw.returns === undefined) {
      throw new Error(`Method does not have returns definition: ${this.name}`);
    }
    this.returns = new RosettaJavaReturns(raw.returns);

    this.notes = this.readNotes();
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);

    /* PARAMETERS */
    if (raw.parameters !== undefined) {
      const rawParameters: { [key: string]: any }[] = raw.parameters;

      /*
       * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
       *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
       */
      if (this.parameters.length !== rawParameters.length) {
        throw new Error(
          `The method ${this.name}'s parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`,
        );
      }

      for (let index = 0; index < rawParameters.length; index++) {
        this.parameters[index].parse(rawParameters[index]);
      }
    }

    /* RETURNS */
    if (raw.returns !== undefined) {
      this.returns.parse(raw.returns);
    }
  }

  toJSON(patch: boolean = false): any {
    const { name, deprecated, modifiers, notes, parameters, returns } = this;

    const json: any = {};

    /* (Properties) */
    if (!patch) {
      json.deprecated = deprecated;
      if (modifiers.length) json.modifiers = modifiers;
    }
    json.name = name;
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;

    /* (Parameters) */
    if (parameters.length) {
      json.parameters = [];
      for (const parameter of parameters) json.parameters.push(parameter.toJSON(patch));
    }

    /* (Returns) */
    json.returns = returns.toJSON(patch);

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
    let signature = `${this.name}`;
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
