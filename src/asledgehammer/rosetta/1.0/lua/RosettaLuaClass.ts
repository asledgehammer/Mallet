import * as Assert from '../../../Assert';

import { formatName } from '../RosettaUtils';
import { RosettaEntity } from '../RosettaEntity';
import { RosettaLuaFunction } from './RosettaLuaFunction';
import { RosettaLuaField } from './RosettaLuaField';
import { RosettaLuaConstructor } from './RosettaLuaConstructor';
import { RosettaLuaFunctionCluster } from './RosettaLuaFunctionCluster';

/**
 * **RosettaLuaClass**
 *
 * @author Jab
 */
export class RosettaLuaClass extends RosettaEntity {
  extendz: string | undefined;
  name: string;

  readonly functions: { [name: string]: RosettaLuaFunctionCluster } = {};
  readonly methods: { [name: string]: RosettaLuaFunctionCluster } = {};
  readonly fields: { [name: string]: RosettaLuaField } = {};
  readonly values: { [name: string]: RosettaLuaField } = {};
  readonly constructors: RosettaLuaConstructor[] = [];
  deprecated: boolean = false;
  notes: string | undefined;

  /** (Default: off) */
  mutable: boolean = false;

  constructor(name: string, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');

    this.name = formatName(name);
    this.extendz = this.readString('extends');

    this.notes = this.readNotes();
    this.deprecated = this.readBoolean('deprecated') === true;

    /* (Current Constructor) */
    if (raw.constructors !== undefined) {
      for (const cons of raw.constructors) {
        this.constructors.push(new RosettaLuaConstructor(this, cons));
      }
    }
    /* (Legacy Constructors) */
    else if (raw.constructor) {
      console.log(raw.constructor);
      console.log('PZ-Rosetta: Upgrading constructor from singleton to array..');
      const rawConstructor = raw.constructor;
      this.constructors.push(new RosettaLuaConstructor(this, rawConstructor));
    }

    /* (Methods) */
    if (raw.methods !== undefined) {

      /* (Legacy Methods) */
      if (!Array.isArray(raw.methods)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua methods from singleton-object per name to clustered array..');

        const rawMethods: { [key: string]: any } = raw.methods;
        for (const name2 of Object.keys(rawMethods)) {
          const rawMethod = rawMethods[name2];
          const method = new RosettaLuaFunction(name2, rawMethod);
          this.methods[method.name] = new RosettaLuaFunctionCluster(method.name);
          this.methods[method.name].add(method);
        }

      }
      /* (Current Methods) */
      else {
        const rawMethods = raw.methods;
        for (const rawMethod of rawMethods) {
          const method = new RosettaLuaFunction(rawMethod.name, rawMethod);
          const { name: methodName } = method;
          let cluster: RosettaLuaFunctionCluster;
          if (this.methods[methodName] === undefined) {
            cluster = new RosettaLuaFunctionCluster(methodName);
            this.methods[methodName] = cluster;
          } else {
            cluster = this.methods[methodName];
          }
          cluster.add(method);
        }
      }
    }

    /* (Static Methods) */
    if (raw.functions !== undefined) {

      /* (Legacy Static Methods) */
      if (!Array.isArray(raw.functions)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua static methods from singleton-object per name to clustered array..');

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

    /* (Mutable Flag) */
    if (raw.mutable !== undefined) {
      this.mutable = !!raw.mutable;
    }
  }

  parse(raw: { [key: string]: any }) {
    this.notes = this.readNotes(raw);
    this.deprecated = this.readBoolean('deprecated', raw) === true;

    /* (Current Constructor) */
    if (raw.constructors !== undefined) {
      for (const cons of raw.constructors) {
        this.constructors.push(new RosettaLuaConstructor(this, cons));
      }
    }
    /* (Legacy Constructors) */
    else if (raw.constructor) {
      console.log('PZ-Rosetta: Upgrading constructor from singleton to array..');
      const rawConstructor = raw.constructor;
      this.constructors.push(new RosettaLuaConstructor(this, rawConstructor));
    }

    /* (Methods) */
    if (raw.methods !== undefined) {

      /* (Legacy Methods) */
      if (!Array.isArray(raw.methods)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua methods from singleton-object per name to clustered array..');

        const rawMethods: { [key: string]: any } = raw.methods;
        for (const name2 of Object.keys(rawMethods)) {
          const rawMethod = rawMethods[name2];
          const method = new RosettaLuaFunction(name2, rawMethod);
          this.methods[method.name] = new RosettaLuaFunctionCluster(method.name);
          this.methods[method.name].add(method);
        }

      }
      /* (Current Methods) */
      else {
        const rawMethods = raw.methods;
        for (const rawMethod of rawMethods) {
          const method = new RosettaLuaFunction(rawMethod.name, rawMethod);
          const { name: methodName } = method;
          let cluster: RosettaLuaFunctionCluster;
          if (this.methods[methodName] === undefined) {
            cluster = new RosettaLuaFunctionCluster(methodName);
            this.methods[methodName] = cluster;
          } else {
            cluster = this.methods[methodName];
          }
          cluster.add(method);
        }
      }
    }

    /* (Static Methods) */
    if (raw.functions !== undefined) {

      /* (Legacy Static Methods) */
      if (!Array.isArray(raw.functions)) {
        console.log('PZ-Rosetta: Upgrading legacy Lua static methods from singleton-object per name to clustered array..');

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

    /* (Mutable Flag) */
    if (raw.mutable !== undefined) {
      this.mutable = !!raw.mutable;
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
    const func = new RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });

    let cluster = this.methods[func.name];
    if (!cluster) {
      cluster = this.methods[func.name] = new RosettaLuaFunctionCluster(name);
    }

    cluster.add(func);

    return func;
  }

  /**
   * Creates a function in the Lua class.
   *
   * @param name The name of the new function.
   * @returns The new function.
   *
   * @throws Error Thrown if:
   * - A function already exists with the same name in the Lua class.
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

  getConstructor(...parameterTypes: string[]): RosettaLuaConstructor | undefined {
    if (!this.constructors.length) return undefined;
    for (const conztructor of this.constructors) {
      if (conztructor.parameters.length === parameterTypes.length) {
        let invalid = false;
        for (let index = 0; index < parameterTypes.length; index++) {
          if (parameterTypes[index] !== conztructor.parameters[index].type) {
            invalid = true;
            break;
          }
        }
        if (invalid) continue;
        return conztructor;
      }
    }
    return;
  }

  getMethod(...parameterTypes: string[]): RosettaLuaFunction | undefined {
    if (!this.methods.length) return undefined;
    for (const cluster of Object.values(this.methods)) {
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

  getStaticMethod(...parameterTypes: string[]): RosettaLuaFunction | undefined {
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

  toJSON(patch: boolean = false): any {
    const { constructors, fields, functions, methods, values } = this;

    const json: any = {};

    /* (Properties) */
    json.extends = this.extendz !== undefined && this.extendz !== '' ? this.extendz : undefined;
    json.notes = this.notes !== undefined && this.notes !== '' ? this.writeNotes(this.notes) : undefined;
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
    if (this.constructors.length !== 0) {
      json.constructors = [];
      for (const cons of constructors) {
        json.constructors.push(cons.toJSON(patch));
      }
    }

    /* (Methods) */
    keys = Object.keys(methods);
    keys.sort((a, b) => a.localeCompare(b));
    if (keys.length) {
      json.methods = [];
      /* (Flatten MethodClusters into JSON method bodies) */
      for (const key of keys) {
        for (const method of methods[key].functions) json.methods.push(method.toJSON(patch));
      }
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

    /* (Mutable Flag) */
    json.mutable = this.mutable;

    return json;
  }
}
