import * as Assert from '../../Assert';

import { formatName } from '../RosettaUtils';
import { RosettaEntity } from '../RosettaEntity';
import { RosettaLuaFunction } from './RosettaLuaFunction';
import { RosettaLuaField } from './RosettaLuaField';
import { RosettaLuaConstructor } from './RosettaLuaConstructor';

/**
 * **RosettaLuaClass**
 *
 * @author Jab
 */
export class RosettaLuaClass extends RosettaEntity {
  readonly extendz: string | undefined;
  readonly name: string;

  readonly functions: { [name: string]: RosettaLuaFunction } = {};
  readonly methods: { [name: string]: RosettaLuaFunction } = {};
  readonly fields: { [name: string]: RosettaLuaField } = {};
  readonly values: { [name: string]: RosettaLuaField } = {};
  conztructor: RosettaLuaConstructor;
  deprecated: boolean = false;
  notes: string | undefined;

  constructor(name: string, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');

    this.name = formatName(name);
    this.extendz = this.readString('extends');

    this.notes = this.readNotes();
    this.deprecated = this.readBoolean('deprecated') === true;

    /* (Constructor) */
    if (raw.constructor !== undefined) {
      const rawConstructor = raw.constructor;
      this.conztructor = new RosettaLuaConstructor(this, rawConstructor);
    } else {
      this.conztructor = new RosettaLuaConstructor(this);
    }

    /* (Methods) */
    if (raw.methods !== undefined) {
      const rawMethods: { [key: string]: any } = raw.methods;
      for (const name2 of Object.keys(rawMethods)) {
        const rawMethod = rawMethods[name2];
        const method = new RosettaLuaFunction(name2, rawMethod);
        this.methods[name2] = this.methods[method.name] = method;
      }
    }

    /* (Functions) */
    if (raw.functions !== undefined) {
      const rawFunctions: { [key: string]: any } = raw.functions;
      for (const name2 of Object.keys(rawFunctions)) {
        const rawFunction = rawFunctions[name2];
        const func = new RosettaLuaFunction(name2, rawFunction);
        this.functions[name2] = this.functions[func.name] = func;
      }
    }

    /* (Fields) */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const name2 of Object.keys(rawFields)) {
        const rawField = rawFields[name2];
        const field = new RosettaLuaField(name2, rawField);
        this.fields[name2] = this.fields[field.name] = field;
      }
    }

    /* (Static Fields) */
    if (raw.values !== undefined) {
      const rawValues: { [key: string]: any } = raw.values;
      for (const name2 of Object.keys(rawValues)) {
        const rawValue = rawValues[name2];
        const value = new RosettaLuaField(name2, rawValue);
        this.values[name2] = this.values[value.name] = value;
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
    this.deprecated = this.readBoolean('deprecated', raw) === true;

    /* (Constructor) */
    if (raw.constructor !== undefined) {
      const rawConstructor = raw.constructor;
      this.conztructor = new RosettaLuaConstructor(this, rawConstructor);
    }

    /* (Methods) */
    if (raw.methods !== undefined) {
      const rawMethods: { [key: string]: any } = raw.methods;
      for (const name of Object.keys(rawMethods)) {
        const rawMethod = rawMethods[name];
        let method = this.methods[name];
        if (method == null) {
          method = new RosettaLuaFunction(name, rawMethod);
          this.methods[name] = this.methods[method.name] = method;
        } else {
          method.parse(rawMethod);
        }
      }
    }

    /* (Functions) */
    if (raw.functions !== undefined) {
      const rawFunctions: { [key: string]: any } = raw.functions;
      for (const name of Object.keys(rawFunctions)) {
        const rawFunction = rawFunctions[name];
        let func = this.functions[name];
        if (func == null) {
          func = new RosettaLuaFunction(name, rawFunction);
          this.functions[name] = this.functions[func.name] = func;
        } else {
          func.parse(rawFunction);
        }
      }
    }

    /* (Fields) */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const name of Object.keys(rawFields)) {
        const rawField = rawFields[name];
        let field = this.fields[name];
        if (field == null) {
          field = new RosettaLuaField(name, rawField);
          this.fields[name] = this.fields[field.name] = field;
        } else {
          field.parse(rawField);
        }
      }
    }

    /* (Static Fields) */
    if (raw.values !== undefined) {
      const rawValues: { [key: string]: any } = raw.values;
      for (const name of Object.keys(rawValues)) {
        const rawValue = rawValues[name];
        let value = this.fields[name];
        if (value == null) {
          value = new RosettaLuaField(name, rawValue);
          this.values[name] = this.values[value.name] = value;
        } else {
          value.parse(rawValue);
        }
      }
    }
  }

  /**
   * Creates a field in the Lua class.
   *
   * @param name The name of the new field.
   * @returns The new field.
   *
   * @throws Error Thrown if:
   * - A field already exists with the same name in the Lua class.
   */
  createField(name: string): RosettaLuaField {
    const field = new RosettaLuaField(name);

    // (Only check for the file instance)
    if (this.fields[field.name]) {
      throw new Error(`A field already exists: ${field.name}`);
    }

    this.fields[field.name] = field;

    return field;
  }

  /**
   * Creates a static field (value), in the Lua class.
   *
   * @param name The name of the new static field.
   * @returns The new static field.
   *
   * @throws Error Thrown if:
   * - A static field already exists with the same name in the Lua class.
   */
  createValue(name: string): RosettaLuaField {
    const value = new RosettaLuaField(name);

    // (Only check for the file instance)
    if (this.values[value.name]) {
      throw new Error(`A static field (value), already exists: ${value.name}`);
    }

    this.values[value.name] = value;

    return value;
  }

  /**
   * Creates a method in the Lua class.
   *
   * @param name The name of the new method.
   * @returns The new method.
   *
   * @throws Error Thrown if:
   * - A method already exists with the same name in the Lua class.
   */
  createMethod(name: string): RosettaLuaFunction {
    const method = new RosettaLuaFunction(name);

    // (Only check for the file instance)
    if (this.methods[method.name]) {
      throw new Error(`A method already exists: ${method.name}`);
    }

    this.methods[method.name] = method;

    return method;
  }

  /**
   * Creates a function in the Lua class.
   *
   * @param name The name of the new function.
   * @returns The new function.
   *
   * @throws Error Thrown if:
   * - A method already exists with the same name in the Lua class.
   */
  createFunction(name: string): RosettaLuaFunction {
    const func = new RosettaLuaFunction(name);

    // (Only check for the file instance)
    if (this.functions[func.name]) {
      throw new Error(`A function already exists: ${func.name}`);
    }

    this.functions[func.name] = func;

    return func;
  }

  toJSON(patch: boolean = false): any {
    const { fields, functions, methods, values } = this;

    const json: any = {};

    /* (Properties) */
    json.extends = this.extendz !== undefined && this.extendz !== '' ? this.extendz : undefined;
    json.notes = this.notes !== undefined && this.notes !== '' ? this.notes : undefined;
    json.deprecated = this.deprecated ? true : undefined;

    /* (Static Fields) */
    let keys = Object.keys(values);
    if (keys.length) {
      json.values = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.values[key] = values[key].toJSON(patch);
    }

    /* (Fields) */
    keys = Object.keys(fields);
    if (keys.length) {
      json.fields = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.fields[key] = fields[key].toJSON(patch);
    }

    /* (Constructor) */
    if (this.conztructor !== undefined) {
      json.constructor = this.conztructor !== undefined ? this.conztructor?.toJSON(patch) : undefined;
    }

    /* (Methods) */
    keys = Object.keys(methods);
    if (keys.length) {
      json.methods = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.methods[key] = methods[key].toJSON(patch);
    }

    /* (Functions) */
    keys = Object.keys(functions);
    if (keys.length) {
      json.functions = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.functions[key] = functions[key].toJSON(patch);
    }

    return json;
  }
}
