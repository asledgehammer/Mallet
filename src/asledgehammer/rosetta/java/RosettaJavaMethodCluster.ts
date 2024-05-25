import * as Assert from '../../Assert';

import { RosettaJavaMethod } from './RosettaJavaMethod';

/**
 * **RosettaJavaMethodCluster**
 *
 * @author Jab
 */
export class RosettaJavaMethodCluster {
  readonly methods: RosettaJavaMethod[] = [];
  readonly name: string;

  constructor(name: string) {
    Assert.assertNonEmptyString(name, 'name');
    this.name = name;
  }

  add(method: RosettaJavaMethod) {
    const indexOf = this.methods.indexOf(method);
    if (indexOf !== -1) {
      this.methods[indexOf].parse(method.raw);
      return;
    }
    this.methods.push(method);
  }

  getWithParameters(...parameterNames: string[]): RosettaJavaMethod | undefined {
    for (const method of this.methods) {
      const parameters = method.parameters;
      if (parameterNames.length === parameters.length) {
        if (parameterNames.length === 0) return method;
        let invalid = false;
        for (let i = 0; i < parameters.length; i++) {
          if (parameters[i].type.basic !== parameterNames[i]) {
            invalid = true;
            break;
          }
        }
        if (invalid) continue;
        return method;
      }
    }
    return;
  }
}
