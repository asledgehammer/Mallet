import * as ast from 'luaparse';
import { Scope } from './Scope';
import { ScopeGlobal } from './LuaWizard';

export function getRelativeScope(expression: ast.Expression): string | undefined {

    switch (expression.type) {
        case 'Identifier': {
            return expression.name;
        }

        case 'FunctionDeclaration': {
            // This function has no name.
            if (!expression.identifier) return undefined;

            switch (expression.identifier?.type) {
                case 'Identifier': {
                    return expression.identifier.name;
                }
            }
        }
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
        case 'NilLiteral':
        case 'VarargLiteral':
        case 'TableConstructorExpression':
        case 'BinaryExpression':
        case 'LogicalExpression':
        case 'UnaryExpression':
        case 'MemberExpression':
        case 'IndexExpression':
        case 'CallExpression':
        case 'TableCallExpression':
        case 'StringCallExpression':
    }

    return undefined;
}

export function discoverFunctionDeclaration(__G: ScopeGlobal, expression: ast.FunctionDeclaration, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverVarargLiteral(__G: ScopeGlobal, expression: ast.VarargLiteral, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverTableConstructorExpression(__G: ScopeGlobal, expression: ast.TableConstructorExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverBinaryExpression(__G: ScopeGlobal, expression: ast.BinaryExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverLogicalExpression(__G: ScopeGlobal, expression: ast.LogicalExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverUnaryExpression(__G: ScopeGlobal, expression: ast.UnaryExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverMemberExpression(__G: ScopeGlobal, expression: ast.MemberExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverIndexExpression(__G: ScopeGlobal, expression: ast.IndexExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverCallExpression(__G: ScopeGlobal, expression: ast.CallExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverTableCallExpression(__G: ScopeGlobal, expression: ast.TableCallExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

/**
 * TODO: Implement Lua Modules references.
 *
 *       E.G: 
 *            ```lua
 *            --- #type MyModule
 *            local my_module = require '../my_module.lua';
 *            ```
 */
export function discoverStringCallExpression(__G: ScopeGlobal, expression: ast.StringCallExpression, scope: Scope): number {


    // No base to assign; no change to make;
    if (!expression.base) return 0;

    const basePath = `${scope.path}.${getRelativeScope(expression)}`;

    const o = __G.map[scope.path];

    // No object known; no changes made.
    if (!o) return 0;


    let changes = 0;

    switch (o.type) {
        case 'ScopeVariable':
        case 'ScopeFunction':
        case 'ScopeForGenericBlock':
        case 'ScopeForNumericBlock':
        case 'ScopeDoBlock':
        case 'ScopeWhileBlock':
        case 'ScopeRepeatBlock':
        case 'ScopeIfBlock':
        case 'ScopeIfClauseBlock':
        case 'ScopeTable':
        case 'ScopeClass':
        case 'ScopeConstructor':
    }


    return changes;
}

export function discoverExpression(__G: ScopeGlobal, expression: ast.Expression, scope: Scope): number {
    switch (expression.type) {
        case 'Identifier': return 0;
        case 'StringLiteral': return scope.addType('string');
        case 'NumericLiteral': return scope.addType('number');
        case 'BooleanLiteral': return scope.addType('boolean');
        case 'NilLiteral': return scope.addType('nil');
        case 'FunctionDeclaration': return discoverFunctionDeclaration(__G, expression, scope);
        case 'VarargLiteral': return discoverVarargLiteral(__G, expression, scope);
        case 'TableConstructorExpression': return discoverTableConstructorExpression(__G, expression, scope);
        case 'BinaryExpression': return discoverBinaryExpression(__G, expression, scope);
        case 'LogicalExpression': return discoverLogicalExpression(__G, expression, scope);
        case 'UnaryExpression': return discoverUnaryExpression(__G, expression, scope);
        case 'MemberExpression': return discoverMemberExpression(__G, expression, scope);
        case 'IndexExpression': return discoverIndexExpression(__G, expression, scope);
        case 'CallExpression': return discoverCallExpression(__G, expression, scope);
        case 'TableCallExpression': return discoverTableCallExpression(__G, expression, scope);
        case 'StringCallExpression': return discoverStringCallExpression(__G, expression, scope);
    }
}