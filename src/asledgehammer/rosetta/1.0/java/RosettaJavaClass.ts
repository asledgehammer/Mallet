import * as Assert from '../../../Assert';

import { formatName } from '../RosettaUtils';
import { RosettaEntity } from '../RosettaEntity';

import { RosettaJavaConstructor } from './RosettaJavaConstructor';
import { RosettaJavaMethodCluster } from './RosettaJavaMethodCluster';
import { RosettaJavaMethod } from './RosettaJavaMethod';
import { RosettaJavaField } from './RosettaJavaField';

/**
 * **RosettaJavaNamespace**
 *
 * @author Jab
 */
export class RosettaJavaNamespace extends RosettaEntity {
  readonly classes: { [id: string]: RosettaJavaClass } = {};
  readonly name: string;

  constructor(name: string, raw: { [key: string]: any } = {}) {
    super(raw);

    Assert.assertNonEmptyString(name, 'name');
    this.name = name;

    /* (Classes) */
    if (Object.keys(raw).length) {
      for (const clazzName of Object.keys(raw)) {
        const rawClazz = raw[clazzName];
        let clazz = this.classes[clazzName];
        if (clazz === undefined) {
          clazz = new RosettaJavaClass(clazzName, this, rawClazz);
        } else {
          clazz.parse(rawClazz);
        }

        /* (Formatted Class Name) */
        this.classes[clazz.name] = this.classes[clazzName] = clazz;
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    /* (Classes) */
    for (const clazzName of Object.keys(raw)) {
      const rawClazz = raw[clazzName];
      let clazz = this.classes[clazzName];
      if (clazz === undefined) {
        clazz = new RosettaJavaClass(clazzName, this, rawClazz);
      } else {
        clazz.parse(rawClazz);
      }

      /* (If the class exists, parse the additional data as a patch) */
      if (this.classes[clazzName] !== undefined) {
        this.classes[clazzName].parse(rawClazz);
        continue;
      }

      /* (Formatted Class Name) */
      this.classes[clazz.name] = this.classes[clazzName] = clazz;
    }
  }

  toJSON(patch: boolean = false): any {
    const { name, classes } = this;

    const json: any = {};

    /* (Properties) */
    json.name = name;

    /* (Classes) */
    const keys = Object.keys(classes);
    if (keys.length) {
      keys.sort((a, b) => a.localeCompare(b));
      for (const key of keys) json[key] = classes[key].toJSON(patch);
    }

    return json;
  }
}

/**
 * **RosettaJavaClass**
 *
 * @author Jab
 */
export class RosettaJavaClass extends RosettaEntity {
  readonly fields: { [name: string]: RosettaJavaField } = {};
  readonly methods: { [name: string]: RosettaJavaMethodCluster } = {};
  readonly constructors: RosettaJavaConstructor[] = [];

  readonly extendz: string | undefined;
  readonly name: string;
  readonly modifiers: string[];
  readonly deprecated: boolean;
  readonly javaType: string;

  readonly namespace: RosettaJavaNamespace;

  notes: string | undefined;

  constructor(name: string, namespace: RosettaJavaNamespace, raw: { [key: string]: any }) {
    super(raw);


    Assert.assertNonEmptyString(name, 'name');
    Assert.assertNonNull(namespace, 'namsepace');

    this.namespace = namespace;
    this.name = formatName(name);
    this.extendz = this.readString('extends');
    this.modifiers = this.readModifiers();
    this.deprecated = this.readBoolean('deprecated') != null;
    this.javaType = this.readRequiredString('javaType');

    this.notes = this.readNotes();

    /* FIELDS */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const fieldName of Object.keys(rawFields)) {
        const rawField = rawFields[fieldName];
        const field = new RosettaJavaField(fieldName, rawField);
        this.fields[field.name] = this.fields[fieldName] = field;
      }
    }

    /* METHODS */
    if (raw.methods !== undefined) {
      const rawMethods = raw.methods;
      for (const rawMethod of rawMethods) {
        const method = new RosettaJavaMethod(rawMethod);
        const { name: methodName } = method;
        let cluster: RosettaJavaMethodCluster;
        if (this.methods[methodName] === undefined) {
          cluster = new RosettaJavaMethodCluster(methodName);
          this.methods[methodName] = cluster;
        } else {
          cluster = this.methods[methodName];
        }
        cluster.add(method);
      }
    }

    /* CONSTRUCTORS */
    if (raw.constructors !== undefined) {
      const rawConstructors = raw.constructors;
      for (const rawConstructor of rawConstructors) {
        this.constructors.push(new RosettaJavaConstructor(this, rawConstructor));
      }
    }
  }

  parse(raw: { [key: string]: any }) {
    /* (Properties) */
    this.notes = this.readNotes(raw);

    /* (Fields) */
    if (raw.fields !== undefined) {
      const rawFields: { [key: string]: any } = raw.fields;
      for (const fieldName of Object.keys(rawFields)) {
        const rawField = rawFields[fieldName];
        const field = this.fields[fieldName];
        if (field === undefined) {
          throw new Error(`Cannot find field in class: ${this.name}.${fieldName}`);
        }
        field.parse(rawField);
      }
    }

    /* (Methods) */
    if (raw.methods !== undefined) {
      const rawMethods = raw.methods;
      for (const rawMethod of rawMethods) {
        const method = new RosettaJavaMethod(rawMethod);
        const { name: methodName } = method;
        const cluster: RosettaJavaMethodCluster = this.methods[methodName];
        if (this.methods[methodName] === undefined) {
          throw new Error(`Cannot find method in class: ${this.name}.${methodName}`);
        }
        cluster.add(method);
      }
    }

    /* (Constructors) */
    if (raw.constructors !== undefined) {
      const rawConstructors = raw.constructors;
      for (const rawConstructor of rawConstructors) {
        const rawParameterCount = rawConstructor.parameters !== undefined ? rawConstructor.parameters.length : 0;
        let foundConstructor: RosettaJavaConstructor | undefined;
        for (const nextConstructor of this.constructors) {
          const nextParameterCount = nextConstructor.parameters.length;
          if (rawParameterCount === nextParameterCount) {
            foundConstructor = nextConstructor;
            break;
          }
        }
        if (foundConstructor === undefined) {
          throw new Error(`Class Constructor ${this.name} not found with param count: ${rawParameterCount}`);
        }
        foundConstructor.parse(rawConstructor);
      }
    }
  }

  getField(id: string): RosettaJavaField | undefined {
    return this.fields[id];
  }

  getConstructor(...parameterTypes: string[]): RosettaJavaConstructor | undefined {
    if (!this.constructors.length) return undefined;
    for (const conztructor of this.constructors) {
      if (conztructor.parameters.length === parameterTypes.length) {
        let invalid = false;
        for (let index = 0; index < parameterTypes.length; index++) {
          if (parameterTypes[index] !== conztructor.parameters[index].type.basic) {
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

  getMethod(...parameterTypes: string[]): RosettaJavaMethod | undefined {
    if (!this.methods.length) return undefined;
    for (const cluster of Object.values(this.methods)) {
      for (const method of cluster.methods) {
        if (method.parameters.length === parameterTypes.length) {
          let invalid = false;
          for (let index = 0; index < parameterTypes.length; index++) {
            if (parameterTypes[index] !== method.parameters[index].type.basic) {
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

    const {
      extendz,
      modifiers,
      javaType,
      deprecated,
      notes,
      fields,
      constructors,
      methods
    } = this;

    const json: any = {};

    /* (Properties) */
    json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
    if (!patch) {
      if (extendz !== undefined) json.extends = extendz;
      if (modifiers !== undefined) json.modifiers = modifiers;
      json.deprecated = deprecated;
      json.javaType = javaType;
    }

    /* (Fields) */
    let keys = Object.keys(fields);
    keys.sort((a, b) => a.localeCompare(b));
    if (keys.length) {
      json.fields = {};
      for (const key of keys) {
        json.fields[key] = fields[key].toJSON(patch);
      }
    }

    /* (Constructors) */
    if (constructors.length) {
      json.constructors = [];
      for (const conztructor of constructors) json.constructors.push(conztructor.toJSON(patch));
    }

    /* (Methods) */
    keys = Object.keys(methods);
    keys.sort((a, b) => a.localeCompare(b));
    if (keys.length) {
      json.methods = [];
      /* (Flatten MethodClusters into JSON method bodies) */
      for (const key of keys) {
        for (const method of methods[key].methods) json.methods.push(method.toJSON(patch));
      }
    }

    return json;
  }
}
