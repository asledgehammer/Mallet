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

    /* (Values) */
    if (raw.values !== undefined) {
      const rawValues: { [key: string]: any } = raw.values;
      for (const name2 of Object.keys(rawValues)) {
        const rawValue = rawValues[name2];
        const value = new RosettaLuaTableField(name2, rawValue);
        this.fields[value.name] = this.fields[name2] = value;
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

    /* (Values) */
    if (raw.values !== undefined) {
      const rawValues: { [key: string]: any } = raw.values;
      for (const name of Object.keys(rawValues)) {
        const rawValue = rawValues[name];
        let value = this.fields[name];
        if (value === undefined) {
          value = new RosettaLuaTableField(name, rawValue);
        } else {
          value.parse(rawValue);
        }
        this.fields[value.name] = this.fields[name] = value;
      }
    }
  }

  toJSON(patch: boolean = false): any {
    const { fields, tables, functions, name, notes } = this;

    const json: any = {};

    /* (Properties) */
    json.notes = notes !== undefined && notes !== '' ? notes : undefined;

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
}
