import * as ast from 'luaparse';
import { expressionToString, identifierToString, varargLiteralToString } from './String';
import { Scope } from './Scope';
import { ScopeClass, ScopeFunction, ScopeReturn, ScopeVariable } from './LuaWizard';

export type PZPropertyType = 'field' | 'value';
export type PZExecutableType = 'function' | 'method' | 'constructor';

export interface PZGlobalInfo {
    classes: { [name: string]: PZClassInfo };
    tables: { [name: string]: PZTableInfo };
    values: { [name: string]: PZPropertyInfo<'value'> };
    funcs: { [name: string]: PZExecutableInfo<'function'> };
    scope: Scope;
}

export interface PZTableInfo {
    name?: string;

    values: { [name: string]: PZPropertyInfo<'value'> };
    funcs: { [name: string]: PZExecutableInfo<'function'> };

    scope: Scope;
}

export interface PZClassInfo {
    /** The name of the class. */
    name: string;

    /** The name of the super-class the class extends. */
    extendz: string;

    fields: { [name: string]: PZPropertyInfo<'field'> };
    values: { [name: string]: PZPropertyInfo<'value'> };
    methods: { [name: string]: PZExecutableInfo<'method'> };
    funcs: { [name: string]: PZExecutableInfo<'function'> };
    conztructor?: PZExecutableInfo<'constructor'>;
    scope: Scope;
}

export interface PZExecutableInfo<TType extends PZExecutableType> {

    /** The name of the class that the executable belongs. */
    clazz: string;

    /** The name of the executable. */
    name: string;

    /** The type of executable. */
    type: TType;

    /** The names of the parameters used for calling the executable. */
    params: string[];

    /** The class 'self' alias. (This is the last `return var;` in constructors) */
    selfAlias: string;

    scope: Scope;
}

export interface PZPropertyInfo<TType extends PZPropertyType> {

    /** The class that the property belongs. */
    clazz: string;

    /** The name of the property. */
    name: string;

    /** The type of property. */
    type: TType;

    /** Immediate types discovered when discovering the property for the first time. */
    types: string[];

    defaultValue?: string;

    scope: Scope;
}

/**
 * @param statement The statement to process.
 *  
 * @returns 
 */
export function getPZClass(global: Scope, statement: ast.AssignmentStatement): PZClassInfo | undefined {
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

    const scopeClass: ScopeClass = {
        type: 'ScopeClass',
        name: vars0.name,
        values: {},
        fields: {},
        funcs: {},
        methods: {},
        references: {},
        assignments: {}
    };

    const scope = new Scope(scopeClass, global);

    return {
        name: vars0.name,
        extendz: init0.base.base.name,
        fields: {},
        values: {},
        methods: {},
        funcs: {},
        conztructor: undefined,
        scope
    };
}

/**
 * @param clazz The name of the class.
 * @param statement The statement to process.
 *  
 * @returns 
 */
export function getPZExecutable(global: Scope, clazz: string, statement: ast.FunctionDeclaration): PZExecutableInfo<'constructor' | 'function' | 'method'> | undefined {
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

    const returns: ScopeReturn = {
        type: 'ScopeReturn',
        types: []
    };

    const scopeFunc: ScopeFunction = {
        type: 'ScopeFunction',
        init: statement,
        name,
        params: [],
        values: {},
        returns,
        references: {},
        assignments: {},
    };

    const scope = new Scope(scopeFunc, global);

    // Return result information.
    return { clazz, type, name, params, selfAlias, scope };
}

/**
 * @param clazz The name of the class.
 * @param statement The statement to process.
 * @param selfAlias The alias used for field-declarations inside of executables within a instanced class context. (Default: 'self')
 */
export function getPZProperty(scopeParent: Scope, clazz: string, statement: ast.AssignmentStatement, selfAlias: string = 'self'): PZPropertyInfo<'value' | 'field'> | undefined {

    // Sanity-check
    if (!statement.variables.length) {
        return undefined;
    }

    const var0 = statement.variables[0];

    // Make sure the assignment is towards a member. (The class)
    if (var0.type !== 'MemberExpression') {
        return undefined;
    }
    if (var0.base.type !== 'Identifier') {
        return undefined;
    }
    // Sanity-check
    if (!statement.init.length) {
        console.warn('no init length.');
        console.warn(statement)
        return undefined;
    }

    // Check what type of property it is.
    let type: PZPropertyType = 'value';
    if (var0.base.name === clazz) {
        type = 'value';
    } else if (var0.base.name === selfAlias) {
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
        case 'TableConstructorExpression': {
            // TODO - Figure out how to assign table-like key-values as type-assigned.
            types.push('table');
            break;
        }
        default: {
            // console.log('unhandled type / default value handle: ');
            // console.log({ statement, init: init0 });
            break;
        }
    }

    const property: ScopeVariable = {
        type: 'ScopeVariable',
        name,
        types: [],
        init: statement,
        references: {},
        assignments: {}
    };

    const scope = new Scope(property, scopeParent);
    console.log(`property ${name}: `, scope);

    return { clazz, name, type, types, defaultValue, scope };
}

export function getPZClasses(globalInfo: PZGlobalInfo, statements: ast.Statement[]): { [name: string]: PZClassInfo } {

    const classes: { [name: string]: PZClassInfo } = {};

    // Find classes.
    for (const statement of statements) {
        if (statement.type !== 'AssignmentStatement') continue;

        const clazzInfo = getPZClass(globalInfo.scope, statement);
        if (clazzInfo) classes[clazzInfo.name] = globalInfo.classes[clazzInfo.name] = clazzInfo;
    }

    // Go through all classes, even outside of the file because other Lua files can define class functions.
    //
    //     FIXME: This can cause weird situations if the `require '<file>'` isn't followed. We could find issues of load-order.
    //            Look here if this is an issue later on.
    //
    for (const clazzName of Object.keys(globalInfo.classes)) {
        const clazz = globalInfo.classes[clazzName];
        const clazzScope = clazz.scope;

        function processExecutable(funcDec: ast.FunctionDeclaration, executable: PZExecutableInfo<'constructor' | 'function' | 'method'>) {
            for (const statement of funcDec.body) {
                
                if (statement.type !== 'AssignmentStatement') continue;

                const propertyInfo = getPZProperty(clazzScope, clazz.name, statement, executable.selfAlias);
                if (propertyInfo && propertyInfo.type === 'field') {
                    
                    // Only add the result propertyInfo if not found already.
                    if (clazz.fields[propertyInfo.name]) {
                        const other = clazz.fields[propertyInfo.name];

                        // Apply back the old scope and object.
                        clazzScope.children[other.scope.name] = other.scope;

                        // Merge any unassigned types.
                        if (propertyInfo.types.length) {
                            for (const type of propertyInfo.types) {
                                if (other.types.indexOf(type) === -1) other.types.push(type);
                            }
                        }

                        continue;
                    }

                    // Add the discovery.
                    clazz.fields[propertyInfo.name] = propertyInfo as PZPropertyInfo<'field'>;
                }
            }
        }

        for (const statement of statements) {

            // Look for class value(s) defined above class-level bodies here..
            if (statement.type === 'AssignmentStatement') {
                const propertyInfo = getPZProperty(clazzScope, clazzName, statement, clazzName);
                if (propertyInfo) {
                    if (propertyInfo.type === 'value') {
                        clazz.values[propertyInfo.name] = propertyInfo as PZPropertyInfo<'value'>;
                    }
                }
            }

            // Go through all functions in the chunk. These can either be: 
            //    - Class Constructors
            //    - Class Functions
            //    - Class Methods
            else if (statement.type === 'FunctionDeclaration') {

                // The potential Class Executable.
                const executableInfo = getPZExecutable(clazzScope, clazzName, statement);
                if (executableInfo) {
                    if (executableInfo.type === 'constructor') {
                        if (clazz.conztructor) {
                            console.warn(`Class ${clazzName} already has a constructor. Overriding with bottom-most definition..`);
                        }
                        clazz.conztructor = executableInfo as PZExecutableInfo<'constructor'>;
                    } else if (executableInfo.type === 'function') {
                        if (clazz.funcs[executableInfo.name]) {
                            console.warn(`Class ${clazzName} already has the function ${executableInfo.name}. Overriding with bottom-most definition..`);
                        }
                        clazz.funcs[executableInfo.name] = executableInfo as PZExecutableInfo<'function'>;
                    } else if (executableInfo.type === 'method') {
                        if (clazz.methods[executableInfo.name]) {
                            console.warn(`Class ${clazzName} already has the method ${executableInfo.name}. Overriding with bottom-most definition..`);
                        }
                        clazz.methods[executableInfo.name] = executableInfo as PZExecutableInfo<'method'>;
                    }

                    // Discover field(s) here.
                    processExecutable(statement, executableInfo);
                }
            }
        }
    }

    return classes;
}

export function scanFile(global: PZGlobalInfo, statements: ast.Statement[]): void {
    getPZClasses(global, statements);
}

function scanInto(scope: Scope, statements: ast.Statement[]): void {

}