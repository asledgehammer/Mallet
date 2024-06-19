import * as Assert from '../../Assert';

import { RosettaLuaFunction } from './RosettaLuaFunction';

/**
 * **RosettaLuaFunctionCluster**
 *
 * @author Jab
 */
export class RosettaLuaFunctionCluster {
  readonly functions: RosettaLuaFunction[] = [];
  readonly name: string;

  constructor(name: string) {
    Assert.assertNonEmptyString(name, 'name');
    this.name = name;
  }

  add(method: RosettaLuaFunction) {
    const indexOf = this.functions.indexOf(method);
    if (indexOf !== -1) {
      this.functions[indexOf].parse(method.raw);
      return;
    }
    this.functions.push(method);
  }

  getWithParameters(...parameterNames: string[]): RosettaLuaFunction | undefined {
    for (const method of this.functions) {
      const parameters = method.parameters;
      if (parameterNames.length === parameters.length) {
        if (parameterNames.length === 0) return method;
        let invalid = false;
        for (let i = 0; i < parameters.length; i++) {
          if (parameters[i].type !== parameterNames[i]) {
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
