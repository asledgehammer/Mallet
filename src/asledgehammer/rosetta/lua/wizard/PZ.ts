import * as ast from 'luaparse';
import { identifierToString, varargLiteralToString } from './String';

export interface PZClassInfo {
    name: string;
    extendz: string;
}

export interface PZConstructorInfo {
    clazz: string;
    params: string[];
}

export interface PZMethodInfo {
    clazz: string;
    type: string;
    name: string;
    params: string[];
}

export function getPZClass(statement: ast.AssignmentStatement): PZClassInfo | undefined {
    // Check for ISBaseObject (or subclass), and derive call signature.
    const init0 = statement.init[0];
    if (init0.type !== 'CallExpression') return undefined;
    // Check the assignment for a "SuperClass:derive('PurClassName')"...
    if (init0.base.type !== 'MemberExpression') return undefined;
    if (init0.base.indexer !== ':') return undefined;
    if (init0.base.base.type !== 'Identifier') return undefined;
    if (init0.base.identifier.type !== 'Identifier') return undefined;
    if (init0.base.identifier.name !== 'derive') return undefined;
    // Check for class name here.
    const vars0 = statement.variables[0];
    if (vars0.type !== 'Identifier') return undefined;
    return { name: vars0.name, extendz: init0.base.base.type };
}

export function getPZConstructor(clazz: string, statement: ast.FunctionDeclaration): PZConstructorInfo | undefined {
    // Check if assigned as a member declaration.
    if (statement.identifier == null) return undefined;
    if (statement.identifier.type !== 'MemberExpression') return undefined;
    // Verify that the base assignment table is the class.
    if (statement.identifier.base.type !== 'Identifier') return undefined;
    if (statement.identifier.base.name !== clazz) return undefined;
    // Grab the function / method name.
    if (statement.identifier.identifier.type !== 'Identifier') return undefined;
    // Make sure that this is a constructor.
    if (statement.identifier.identifier.name !== 'new') return undefined;
    // Build params.
    const params: string[] = [];
    for (const param of statement.parameters) {
        switch (param.type) {
            case 'Identifier': {
                params.push(identifierToString(param));
                break;
            }
            case 'VarargLiteral': {
                params.push(varargLiteralToString(param));
                break;
            }
        }
    }
    return { clazz, params };
}

export function getPZMethod(clazz: string, statement: ast.FunctionDeclaration): PZMethodInfo | undefined {
    // Check if assigned as a member declaration.
    if (statement.identifier == null) return undefined;
    if (statement.identifier.type !== 'MemberExpression') return undefined;
    // Verify that the base assignment table is the class.
    if (statement.identifier.base.type !== 'Identifier') return undefined;
    if (statement.identifier.base.name !== clazz) return undefined;
    // Grab the function / method name.
    if (statement.identifier.identifier.type !== 'Identifier') return undefined;
    // Ignore constructor declaration.
    const name = statement.identifier.identifier.name;
    if (name === 'new') return undefined;
    // Get type.
    let type: 'method' | 'function' = 'function';
    if (statement.identifier.indexer === ':') type = 'method';
    // Build params.
    const params: string[] = [];
    for (const param of statement.parameters) {
        switch (param.type) {
            case 'Identifier': {
                params.push(identifierToString(param));
                break;
            }
            case 'VarargLiteral': {
                params.push(varargLiteralToString(param));
                break;
            }
        }
    }
    // Return result information.
    return { clazz, type, name, params };
}
