import * as Assert from '../../Assert';
import { RosettaEntity } from '../RosettaEntity';
import { RosettaJavaClass } from './RosettaJavaClass';

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
          clazz = new RosettaJavaClass(clazzName, rawClazz);
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
        clazz = new RosettaJavaClass(clazzName, rawClazz);
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
