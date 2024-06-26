import * as Assert from '../../../Assert';

import { RosettaEntity } from '../RosettaEntity';

import { RosettaLuaFunction } from './RosettaLuaFunction';
import { RosettaLuaFunctionCluster } from './RosettaLuaFunctionCluster';
import { RosettaLuaTableField } from './RosettaLuaTableField';

/**
 * **RosettaLuaTable**
 *
 * @author Jab
 */
export class RosettaLuaTable extends RosettaEntity {
  readonly fields: { [id: string]: RosettaLuaTableField } = {};
  readonly tables: { [id: string]: RosettaLuaTable } = {};
  readonly functions: { [id: string]: RosettaLuaFunctionCluster } = {};
  name: string;
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

    /* (Static Methods) */
    if (raw.functions !== undefined) {

      /* (Legacy Static Methods) */
      if (!Array.isArray(raw.functions)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua functions from singleton-object per name to clustered array..');

        const rawMethods: { [key: string]: any } = raw.functions;
        for (const name2 of Object.keys(rawMethods)) {
          const rawMethod = rawMethods[name2];
          const method = new RosettaLuaFunction(name2, rawMethod);
          this.functions[method.name] = new RosettaLuaFunctionCluster(method.name);
          this.functions[method.name].add(method);
        }

      }
      /* (Current Static Methods) */
      else {
        const rawMethods = raw.functions;
        for (const rawMethod of rawMethods) {
          const method = new RosettaLuaFunction(rawMethod.name, rawMethod);
          const { name: methodName } = method;
          let cluster: RosettaLuaFunctionCluster;
          if (this.functions[methodName] === undefined) {
            cluster = new RosettaLuaFunctionCluster(methodName);
            this.functions[methodName] = cluster;
          } else {
            cluster = this.functions[methodName];
          }
          cluster.add(method);
        }
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

    /* (Static Methods) */
    if (raw.functions !== undefined) {

      /* (Legacy Static Methods) */
      if (!Array.isArray(raw.functions)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua functions from singleton-object per name to clustered array..');

        const rawMethods: { [key: string]: any } = raw.functions;
        for (const name2 of Object.keys(rawMethods)) {
          const rawMethod = rawMethods[name2];
          const method = new RosettaLuaFunction(name2, rawMethod);
          this.functions[method.name] = new RosettaLuaFunctionCluster(method.name);
          this.functions[method.name].add(method);
        }

      }
      /* (Current Static Methods) */
      else {
        const rawMethods = raw.functions;
        for (const rawMethod of rawMethods) {
          const method = new RosettaLuaFunction(rawMethod.name, rawMethod);
          const { name: methodName } = method;
          let cluster: RosettaLuaFunctionCluster;
          if (this.functions[methodName] === undefined) {
            cluster = new RosettaLuaFunctionCluster(methodName);
            this.functions[methodName] = cluster;
          } else {
            cluster = this.functions[methodName];
          }
          cluster.add(method);
        }
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
    const { fields, tables, functions, notes } = this;

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

    /* (Static Methods) */
    keys = Object.keys(functions);
    keys.sort((a, b) => a.localeCompare(b));
    if (keys.length) {
      json.methods = [];
      /* (Flatten MethodClusters into JSON method bodies) */
      for (const key of keys) {
        for (const func of functions[key].functions) json.function.push(func.toJSON(patch));
      }
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
   * Creates a function in the Lua table.
   *
   * @param name The name of the new function.
   * @returns The new function.
   *
   * @throws Error Thrown if:
   * - A function already exists with the same name in the Lua table.
   */
  createFunction(name: string): RosettaLuaFunction {
    const func = new RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });

    let cluster = this.functions[func.name];
    if (!cluster) {
      cluster = this.functions[func.name] = new RosettaLuaFunctionCluster(name);
    }

    cluster.add(func);

    return func;
  }

  getFunction(...parameterTypes: string[]): RosettaLuaFunction | undefined {
    if (!this.functions.length) return undefined;
    for (const cluster of Object.values(this.functions)) {
      for (const method of cluster.functions) {
        if (method.parameters.length === parameterTypes.length) {
          let invalid = false;
          for (let index = 0; index < parameterTypes.length; index++) {
            if (parameterTypes[index] !== method.parameters[index].type) {
              invalid = true;
              break;
            }
          }
          if (invalid) continue;
          return method;
        }
      }
    }
    return;
  }
}
