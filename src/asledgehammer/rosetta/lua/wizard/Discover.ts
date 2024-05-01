import * as ast from 'luaparse';
import { Scope } from './Scope';
import { PZGlobalInfo } from './PZ';
import { ScopeConstructor, ScopeFunction, ScopeReturn, ScopeVariable, knownMethodTypes } from './LuaWizard';
import { expressionToString, memberExpressionToString } from './String';

export function discoverVarargLiteral(globalInfo: PZGlobalInfo, expression: ast.VarargLiteral, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverTableConstructorExpression(globalInfo: PZGlobalInfo, expression: ast.TableConstructorExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverBinaryExpression(globalInfo: PZGlobalInfo, expression: ast.BinaryExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverLogicalExpression(globalInfo: PZGlobalInfo, expression: ast.LogicalExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverUnaryExpression(globalInfo: PZGlobalInfo, expression: ast.UnaryExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverMemberExpression(globalInfo: PZGlobalInfo, expression: ast.MemberExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverIndexExpression(globalInfo: PZGlobalInfo, expression: ast.IndexExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverCallExpression(globalInfo: PZGlobalInfo, expression: ast.CallExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverTableCallExpression(globalInfo: PZGlobalInfo, expression: ast.TableCallExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

/**
 * TODO: Implement Lua Modules references.
 *
 *       E.G: 
 *            ```lua
 *            --- \@type MyModule
 *            local my_module = require '../my_module.lua';
 *            ```
 */
export function discoverStringCallExpression(globalInfo: PZGlobalInfo, expression: ast.StringCallExpression, scope: Scope): number {
    const { scope: __G } = globalInfo;
    let changes = 0;



    return changes;
}

export function discoverExpression(globalInfo: PZGlobalInfo, expression: ast.Expression, scope: Scope): number {
    switch (expression.type) {
        case 'Identifier': return 0;
        case 'StringLiteral': return scope.addType('string');
        case 'NumericLiteral': return scope.addType('number');
        case 'BooleanLiteral': return scope.addType('boolean');
        case 'NilLiteral': return scope.addType('nil');
        case 'FunctionDeclaration': return discoverFunctionDeclaration(globalInfo, expression, scope);
        case 'VarargLiteral': return discoverVarargLiteral(globalInfo, expression, scope);
        case 'TableConstructorExpression': return discoverTableConstructorExpression(globalInfo, expression, scope);
        case 'BinaryExpression': return discoverBinaryExpression(globalInfo, expression, scope);
        case 'LogicalExpression': return discoverLogicalExpression(globalInfo, expression, scope);
        case 'UnaryExpression': return discoverUnaryExpression(globalInfo, expression, scope);
        case 'MemberExpression': return discoverMemberExpression(globalInfo, expression, scope);
        case 'IndexExpression': return discoverIndexExpression(globalInfo, expression, scope);
        case 'CallExpression': return discoverCallExpression(globalInfo, expression, scope);
        case 'TableCallExpression': return discoverTableCallExpression(globalInfo, expression, scope);
        case 'StringCallExpression': return discoverStringCallExpression(globalInfo, expression, scope);
    }
}

export function discoverFunctionDeclaration(globalInfo: PZGlobalInfo, expression: ast.FunctionDeclaration, scope: Scope): number {

    // console.log(`func-dec: `, expression);

    const { scope: __G } = globalInfo;
    const changes = 0;

    let scopeToAssign: Scope = scope;

    let name: string = '';
    let scopeFunc;
    if (expression.identifier) {
        switch (expression.identifier.type) {
            case 'Identifier': {
                name = expression.identifier.name;
                scopeToAssign = scope;
                break;
            }
            case 'MemberExpression': {

                name = memberExpressionToString(expression.identifier);
                while (name.indexOf(':') !== -1) name = name.replace(':', '.');
                // We need to locate the actual scope of the member reference here.
                let scope2 = scope.resolve(name);
                if (!scope2) {
                    scope2 = scope.resolveAbsolute(name);
                }
                if (scope2) {
                    scopeToAssign = scope2;
                } else {
                    console.warn(`couldn't resolve scope: ${name} (Parent scope: ${scope.path})`)
                }

                break;
            }
        }
    } else {
        console.warn(scope, expression);
        throw new Error('A function declaration here wouldn\'t make sense.');
    }

    scopeFunc = scope.resolve(name);
    if (!scopeFunc) scopeFunc = scope.resolveAbsolute(name);
    if (!scopeFunc) {

        const params: ScopeVariable[] = [];
        for (const param of expression.parameters) {
            switch (param.type) {
                case 'Identifier': {
                    params.push({
                        type: 'ScopeVariable',
                        name: param.name,
                        types: [],
                        init: param,
                        index: 0,
                        references: {},
                        assignments: {},
                    });
                    break;
                }
                case 'VarargLiteral': {
                    params.push({
                        type: 'ScopeVariable',
                        name: param.raw,
                        types: [],
                        init: param,
                        index: 0,
                        references: {},
                        assignments: {},
                    });
                    break;
                }
            }
        }

        name = name.indexOf('.') !== -1 ? name.split('.').pop()! : name;
        console.log('name: ' + name)
        let selfAlias = 'self';

        let type: 'function' | 'constructor' = 'function';
        if (name === 'new') {
            type = 'constructor';
            selfAlias = '';
        }

        let func: ScopeConstructor | ScopeFunction;
        if (type === 'constructor') {
            func = {
                type: 'ScopeConstructor',
                init: expression,
                params: [],
                values: {},
                selfAlias,
                references: {},
                assignments: {},
            };
        } else {
            const returns: ScopeReturn = {
                type: 'ScopeReturn',
                types: []
            };
            func = {
                type: 'ScopeFunction',
                init: expression,
                name,
                params: [],
                values: {},
                selfAlias,
                returns,
                references: {},
                assignments: {},
            };
        }


        scopeFunc = new Scope(func, scopeToAssign);
    }

    if (name === 'new') {
        console.log('new: ', scopeFunc);
    }

    // Handle body statements.
    for (const statement of expression.body) {
        discoverStatement(globalInfo, statement, scopeFunc);
    }

    // Handle return statements.

    return changes;
}

export function discoverLabelStatement(globalInfo: PZGlobalInfo, expression: ast.LabelStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverBreakStatement(globalInfo: PZGlobalInfo, expression: ast.BreakStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverGotoStatement(globalInfo: PZGlobalInfo, expression: ast.GotoStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverReturnStatement(globalInfo: PZGlobalInfo, expression: ast.ReturnStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverIfStatement(globalInfo: PZGlobalInfo, expression: ast.IfStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverWhileStatement(globalInfo: PZGlobalInfo, expression: ast.WhileStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverDoStatement(globalInfo: PZGlobalInfo, expression: ast.DoStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverRepeatStatement(globalInfo: PZGlobalInfo, expression: ast.RepeatStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverLocalStatement(globalInfo: PZGlobalInfo, statement: ast.LocalStatement, scope: Scope): number {

    //console.log(`local: `, statement);

    const { scope: __G } = globalInfo;
    let changes = 0;

    // (Support for tuples)
    for (let index = 0; index < statement.variables.length; index++) {

        const name = statement.variables[index].name;

        // We already defined this local.
        if (scope.children[name]) {
            // console.warn(`Local statement already exists: ${scope.children[name].path}`);
            continue;
        }
        const types: string[] = [];

        const init = statement.init[index];

        const variable: ScopeVariable = {
            type: 'ScopeVariable',
            name,
            types,
            init: statement,
            index,
            references: {},
            assignments: {},
        };

        switch (init.type) {

            // Not a thing.
            case 'Identifier': break;

            case 'FunctionDeclaration':
                // TODO - Implement.
                variable.types.push('fun');
                break;
            case 'StringLiteral': {
                variable.types.push('string');
                variable.defaultValue = `${init.value}`;
                break;
            }
            case 'NumericLiteral': {
                variable.types.push('number');
                variable.defaultValue = `${init.value}`;
                break;
            }
            case 'BooleanLiteral': {
                variable.types.push('boolean');
                variable.defaultValue = `${init.value}`;
                break;
            }
            case 'NilLiteral': {
                variable.types.push('nil');
                variable.defaultValue = 'nil';
                break;
            }

            case 'VarargLiteral': {
                // TODO - Implement.
                variable.types.push(`<${init.value}>`);
                break;
            }

            case 'TableConstructorExpression':
                // TODO - Implement.
                variable.types.push('table');

                // let s: string[] = [];
                // for (const field of init.fields) {
                //     switch (field.type) {
                //         case 'TableKey': {
                //             s.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                //             break;
                //         }
                //         case 'TableKeyString': {
                //             s.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                //             break;
                //         }
                //         case 'TableValue': {
                //             s.push(expressionToString(field.value));
                //             break;
                //         }
                //     }
                // }
                // if(s.length) {
                // } else {
                // }

                break;

            case 'BinaryExpression': {
                types.push('number');
                break;
            }
            case 'LogicalExpression': {
                types.push('boolean');
                break;
            }
            case 'UnaryExpression': {
                switch (init.operator) {
                    case '~':
                    case 'not': {
                        types.push('boolean');
                        break;
                    }
                    case '-':
                    case '#': {
                        types.push('number');
                        break;
                    }
                }
            }
            case 'MemberExpression': {
                // TODO - Build reference link.
                break;
            }
            case 'IndexExpression': {
                // TODO - Build reference link.
                break;
            }
            case 'CallExpression': {
                // TODO - Build reference link.
                break;
            }
            case 'TableCallExpression': {
                // TODO - Build reference link.
                break;
            }
            case 'StringCallExpression': {
                // TODO - Build reference link.
                break;
            }
        }

        // Lastly check for known API for types.
        if (!types.length) {
            const str = expressionToString(init);
            console.log(str);
            const kTypes = knownMethodTypes[expressionToString(init)];
            console.log(kTypes);
            if (kTypes) {
                for (const kType of kTypes) {
                    if (types.indexOf(kType) === -1) types.push(kType);
                }
            }
        }

        // (Self-assigning)
        const lScope = new Scope(variable, scope);
        console.log(scope);

        changes++;
    }

    return changes;
}

export function discoverAssignmentStatement(globalInfo: PZGlobalInfo, expression: ast.AssignmentStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverCallStatement(globalInfo: PZGlobalInfo, expression: ast.CallStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverForNumericStatement(globalInfo: PZGlobalInfo, expression: ast.ForNumericStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverForGenericStatement(globalInfo: PZGlobalInfo, expression: ast.ForGenericStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



    return changes;
}

export function discoverStatement(globalInfo: PZGlobalInfo, statement: ast.Statement, scope: Scope): number {
    switch (statement.type) {
        case 'FunctionDeclaration': return discoverFunctionDeclaration(globalInfo, statement, scope);
        case 'LabelStatement': return discoverLabelStatement(globalInfo, statement, scope);
        case 'BreakStatement': return discoverBreakStatement(globalInfo, statement, scope);
        case 'GotoStatement': return discoverGotoStatement(globalInfo, statement, scope);
        case 'ReturnStatement': return discoverReturnStatement(globalInfo, statement, scope);
        case 'IfStatement': return discoverIfStatement(globalInfo, statement, scope);
        case 'WhileStatement': return discoverWhileStatement(globalInfo, statement, scope);
        case 'DoStatement': return discoverDoStatement(globalInfo, statement, scope);
        case 'RepeatStatement': return discoverRepeatStatement(globalInfo, statement, scope);
        case 'LocalStatement': return discoverLocalStatement(globalInfo, statement, scope);
        case 'AssignmentStatement': return discoverAssignmentStatement(globalInfo, statement, scope);
        case 'CallStatement': return discoverCallStatement(globalInfo, statement, scope);
        case 'ForNumericStatement': return discoverForNumericStatement(globalInfo, statement, scope);
        case 'ForGenericStatement': return discoverForGenericStatement(globalInfo, statement, scope);
    }
}

export function discoverFile(globalInfo: PZGlobalInfo, statements: ast.Statement[]) {
    for (const statement of statements) {
        discoverStatement(globalInfo, statement, globalInfo.scope);
    }
}