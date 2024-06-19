import * as Assert from '../../Assert';

import { RosettaLuaFunction } from './RosettaLuaFunction';

/**
 * **RosettaLuaFunctionCluster**
 *
 * @author Jab
 */
export class RosettaLuaFunctionCluster {
  readonly funcs: RosettaLuaFunction[] = [];
  readonly name: string;

  constructor(name: string) {
    Assert.assertNonEmptyString(name, 'name');
    this.name = name;
  }

  add(method: RosettaLuaFunction) {
    const indexOf = this.funcs.indexOf(method);
    if (indexOf !== -1) {
      this.funcs[indexOf].parse(method.raw);
      return;
    }
    this.funcs.push(method);
  }

  getWithParameters(...parameterNames: string[]): RosettaLuaFunction | undefined {
    for (const method of this.funcs) {
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
