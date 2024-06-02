import * as Assert from '../Assert';

/**
 * **RosettaEntity**
 *
 * @author Jab
 */
export abstract class RosettaEntity {
  readonly raw: { [key: string]: any };
  readonly readOnly: boolean;

  constructor(raw: { [key: string]: any }, readonly: boolean = false) {
    Assert.assertNonNull(raw, 'raw');
    this.raw = raw;
    this.readOnly = readonly;
  }

  readModifiers(raw = this.raw): string[] {
    if (!raw.modifiers) return [];
    return [...raw.modifiers];
  }

  readString(id: string, raw = this.raw): string | undefined {
    if (raw[id] != null) return `${raw[id]}`;
    return;
  }

  writeNotes(notes: string | undefined): string | undefined {
    if (!notes || !notes.length) return undefined;
    return notes.replace(/\n/g, '\\n');
  }

  readNotes(raw = this.raw): string | undefined {
    const notes = this.readString('notes', raw);
    if (notes != null) return notes.replace(/\\n/g, '\n');
    return;
  }

  readRequiredString(id: string, raw = this.raw): string {
    if (raw[id] === undefined) {
      throw new Error(`The string with the id '${id}' doesn't exist.`);
    }
    return `${raw[id]}`;
  }

  readBoolean(id: string, raw = this.raw): boolean | undefined {
    const value = raw[id];
    if (value != null) return !!value;
    return;
  }

  readRequiredBoolean(id: string, raw = this.raw): boolean {
    if (raw[id] === undefined) {
      throw new Error(`The boolean with the id '${id}' doesn't exist.`);
    }
    return !!raw[id];
  }

  protected checkReadOnly() {
    if (this.readOnly) {
      throw new Error(`The Object '${this.constructor.name}' is read-only.`);
    }
  }

  /**
   * @param patch If true, the exported JSON object will only contain Patch-specific information.
   *
   * @returns The JSON of the Rosetta entity.
   */
  abstract toJSON(patch: boolean): any;
}
