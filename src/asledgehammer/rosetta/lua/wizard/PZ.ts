import * as ast from 'luaparse';
import { expressionToString, identifierToString, varargLiteralToString } from './String';

export type PZPropertyType = 'field' | 'value';
export type PZExecutableType = 'function' | 'method' | 'constructor';

export interface PZClassInfo {
    /** The name of the class. */
    name: string;

    /** The name of the super-class the class extends. */
    extendz: string;
}

export interface PZExecutableInfo {

    /** The name of the class that the executable belongs. */
    clazz: string;

    /** The name of the executable. */
    name: string;

    /** The type of executable. */
    type: PZExecutableType;

    /** The names of the parameters used for calling the executable. */
    params: string[];

    /** The class 'self' alias. (This is the last `return var;` in constructors) */
    selfAlias: string;
}

export interface PZPropertyInfo {

    /** The class that the property belongs. */
    clazz: string;

    /** The name of the property. */
    name: string;

    /** The type of property. */
    type: PZPropertyType;

    /** Immediate types discovered when discovering the property for the first time. */
    types: string[];

    defaultValue?: string;
}

/**
 * @param statement The statement to process.
 *  
 * @returns 
 */
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

/**
 * @param clazz The name of the class.
 * @param statement The statement to process.
 *  
 * @returns 
 */
export function getPZExecutable(clazz: string, statement: ast.FunctionDeclaration): PZExecutableInfo | undefined {
    // Check if assigned as a member declaration.
    if (statement.identifier == null) return undefined;
    if (statement.identifier.type !== 'MemberExpression') return undefined;
    // Verify that the base assignment table is the class.
    if (statement.identifier.base.type !== 'Identifier') return undefined;
    if (statement.identifier.base.name !== clazz) return undefined;
    // Grab the function / method name.
    if (statement.identifier.identifier.type !== 'Identifier') return undefined;
    const name = statement.identifier.identifier.name;
    let selfAlias = 'self';
    // Get type.
    let type: PZExecutableType = 'function';
    if (name === 'new') {
        type = 'constructor';
        // Grab the alias used to return in the constructor.
        selfAlias = '';
        for (let index = statement.body.length - 1; index >= 0; index--) {
            const next = statement.body[index];
            if (next.type !== 'ReturnStatement') continue;

            // Sanity check for bad Lua code.
            if (!next.arguments.length) {
                throw new Error(`class Constructor ${clazz}:new() has invalid return!`);
            }

            // Assign the constructor-alias for 'self'.
            const arg0 = next.arguments[0];
            selfAlias = expressionToString(arg0);

            break;
        }

        // Sanity check for bad Lua code.
        if (!selfAlias.length) {
            throw new Error(`Class constructor ${clazz}:new() has no alias for 'self'.`);
        }
    } else if (statement.identifier.indexer === ':') {
        type = 'method';
    }

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
    return { clazz, type, name, params, selfAlias };
}

/**
 * @param clazz The name of the class.
 * @param statement The statement to process.
 * @param selfAlias The alias used for field-declarations inside of executables within a instanced class context. (Default: 'self')
 */
export function getPZProperty(clazz: string, statement: ast.AssignmentStatement, selfAlias: string = 'self'): PZPropertyInfo | undefined {

    // Sanity-check
    if (!statement.variables.length) return undefined;

    const var0 = statement.variables[0];

    // Make sure the assignment is towards a member. (The class)
    if (var0.type !== 'MemberExpression') return undefined;
    if (var0.base.type !== 'Identifier') return undefined;

    // Sanity-check
    if (!statement.init.length) return undefined;

    // Check what type of property it is.
    let type: PZPropertyType = 'value';
    if (var0.base.type === clazz) {
        type = 'value';
    } else if (var0.base.type === selfAlias) {
        type = 'field';
    } else {
        // This belongs to something else.
        return undefined;
    }

    // The name of the property.
    const name = var0.identifier.name;

    // If the assignment is a literal expression then we know what the initial type is. Grab it.
    // We then conveniently know the default value of the property. Grab that too..
    let types: string[] = [];
    let defaultValue: string | undefined = undefined;
    const init0 = statement.init[0];
    switch (init0.type) {
        case 'NumericLiteral': {
            types.push('number');
            defaultValue = init0.raw;
            break;
        }
        case 'BooleanLiteral': {
            types.push('boolean');
            defaultValue = init0.raw;
            break;
        }
        case 'StringLiteral': {
            types.push('string');
            defaultValue = init0.value;
            break;
        }
        case 'NilLiteral': {
            types.push('nil');
            defaultValue = 'nil';
            break;
        }
        case 'VarargLiteral': {
            // TODO - Figure this out once we run into this case.
            console.log('#################');
            console.log('THIS IS A VARARG.');
            console.log(init0);
            console.log('#################');
            defaultValue = init0.value;
            break;
        }
    }

    return { clazz, name, type, types, defaultValue };
}
