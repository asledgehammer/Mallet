import * as Assert from '../../Assert';

import { RosettaEntity } from '../RosettaEntity';

import { RosettaLuaFunction } from './RosettaLuaFunction';
import { RosettaLuaTableField } from './RosettaLuaTableField';

/**
 * **RosettaLuaTable**
 *
 * @author Jab
 */
export class RosettaLuaTable extends RosettaEntity {
  readonly fields: { [id: string]: RosettaLuaTableField } = {};
  readonly tables: { [id: string]: RosettaLuaTable } = {};
  readonly functions: { [id: string]: RosettaLuaFunction } = {};
  readonly name: string;
  mutable: boolean = false;
  notes: string | undefined;

  constructor(name: string, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');

    this.name = name;
    this.notes = this.readNotes();

    /* (Tables) */
    if (raw.tables !== undefined) {
      const rawTables: { [key: string]: any } = raw.tables;
      for (const name2 of Object.keys(rawTables)) {
        const rawTable = rawTables[name2];
        const table = new RosettaLuaTable(name2, rawTable);
        this.tables[table.name] = this.tables[name2] = table;
      }
    }

    /* (Functions) */
    if (raw.functions !== undefined) {
      const rawFunctions: { [key: string]: any } = raw.functions;
      for (const name2 of Object.keys(rawFunctions)) {
        const rawFunction = rawFunctions[name2];
        const func = new RosettaLuaFunction(name2, rawFunction);
        this.functions[func.name] = this.functions[name2] = func;
      }
    }

    /* (Fields) */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const name2 of Object.keys(rawFields)) {
        const rawField = rawFields[name2];
        const field = new RosettaLuaTableField(name2, rawField);
        this.fields[field.name] = this.fields[name2] = field;
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);

    /* (Tables) */
    if (raw.tables !== undefined) {
      const rawTables: { [key: string]: any } = raw.tables;
      for (const name of Object.keys(rawTables)) {
        const rawTable = rawTables[name];
        let table = this.tables[name];
        if (table === undefined) {
          table = new RosettaLuaTable(name, rawTable);
        } else {
          table.parse(rawTable);
        }
        this.tables[table.name] = this.tables[name] = table;
      }
    }

    /* (Functions) */
    if (raw.functions !== undefined) {
      const rawFunctions: { [key: string]: any } = raw.functions;
      for (const name of Object.keys(rawFunctions)) {
        const rawFunction = rawFunctions[name];
        let func = this.functions[name];
        if (func === undefined) {
          func = new RosettaLuaFunction(name, rawFunction);
        } else {
          func.parse(rawFunction);
        }
        this.functions[func.name] = this.functions[name] = func;
      }
    }

    /* (Fields) */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const name of Object.keys(rawFields)) {
        const rawField = rawFields[name];
        let field = this.fields[name];
        if (field === undefined) {
          field = new RosettaLuaTableField(name, rawField);
        } else {
          field.parse(rawField);
        }
        this.fields[field.name] = this.fields[name] = field;
      }
    }
  }

  toJSON(patch: boolean = false): any {
    const { fields, tables, functions, name, notes } = this;

    const json: any = {};

    /* (Properties) */
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;

    /* (Fields) */
    let keys = Object.keys(fields);
    if (keys.length) {
      json.fields = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.fields[key] = fields[key].toJSON(patch);
    }

    /* (Functions) */
    keys = Object.keys(functions);
    if (keys.length) {
      json.functions = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.functions[key] = functions[key].toJSON(patch);
    }

    /* (Tables) */
    keys = Object.keys(tables);
    if (keys.length) {
      json.tables = {};
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json.tables[key] = tables[key].toJSON(patch);
    }

    return json;
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
  createField(name: string): RosettaLuaTableField {
    const field = new RosettaLuaTableField(name);

    // (Only check for the file instance)
    if (this.fields[field.name]) {
      throw new Error(`A field already exists: ${field.name}`);
    }

    this.fields[field.name] = field;

    return field;
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
    const func = new RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });

    // (Only check for the file instance)
    if (this.functions[func.name]) {
      throw new Error(`A function already exists: ${func.name}`);
    }

    this.functions[func.name] = func;

    return func;
  }
}
