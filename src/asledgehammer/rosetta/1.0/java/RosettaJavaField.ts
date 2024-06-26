import * as Assert from '../../../Assert';
import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaType } from './RosettaJavaType';
import { JavaVisibilityScope } from './Types';

/**
 * **RosettaJavaField**
 *
 * @author Jab
 */
export class RosettaJavaField extends RosettaEntity {

  readonly name: string;
  readonly modifiers: string[];
  readonly type: RosettaJavaType;
  readonly deprecated: boolean | undefined;

  notes: string | undefined;

  constructor(name: string, raw: { [key: string]: any }) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');
    Assert.assertNonNull(raw.type, 'raw.type');

    this.name = name;
    this.modifiers = this.readModifiers();
    this.type = new RosettaJavaType(raw.type);
    this.deprecated = this.readBoolean('deprecated') != null;
    this.notes = this.readNotes();
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
  }

  toJSON(patch: boolean = false): any {
    const { name, notes, modifiers, type, deprecated } = this;

    const json: any = {};

    /* (Properties) */
    json.name = name;
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;

    if (!patch) {
      if (modifiers.length) json.modifiers = modifiers;
      json.deprecated = deprecated;
      json.type = type.toJSON(patch);
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
}
