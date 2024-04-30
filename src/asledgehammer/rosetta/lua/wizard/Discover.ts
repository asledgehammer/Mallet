import * as ast from 'luaparse';
import { Scope } from './Scope';
import { PZGlobalInfo } from './PZ';

export function discoverFunctionDeclaration(__G: Scope, expression: ast.FunctionDeclaration, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverVarargLiteral(__G: Scope, expression: ast.VarargLiteral, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverTableConstructorExpression(__G: Scope, expression: ast.TableConstructorExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverBinaryExpression(__G: Scope, expression: ast.BinaryExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverLogicalExpression(__G: Scope, expression: ast.LogicalExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverUnaryExpression(__G: Scope, expression: ast.UnaryExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverMemberExpression(__G: Scope, expression: ast.MemberExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverIndexExpression(__G: Scope, expression: ast.IndexExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverCallExpression(__G: Scope, expression: ast.CallExpression, scope: Scope): number {
    const changes = 0;



    return changes;
}

export function discoverTableCallExpression(__G: Scope, expression: ast.TableCallExpression, scope: Scope): number {
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
export function discoverStringCallExpression(__G: Scope, expression: ast.StringCallExpression, scope: Scope): number {
    let changes = 0;



    return changes;
}

export function discoverExpression(__G: Scope, expression: ast.Expression, scope: Scope): number {
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

export function discoverStatement(globalInfo: PZGlobalInfo, scope: Scope, statement: ast.Statement) {
    switch (statement.type) {
        case 'LabelStatement': {
            break;
        }
        case 'BreakStatement': {
            break;
        }
        case 'GotoStatement': {
            break;
        }
        case 'ReturnStatement': {
            break;
        }
        case 'IfStatement': {
            break;
        }
        case 'WhileStatement': {
            break;
        }
        case 'DoStatement': {
            break;
        }
        case 'RepeatStatement': {
            break;
        }
        case 'LocalStatement': {
            break;
        }
        case 'AssignmentStatement': {
            break;
        }
        case 'CallStatement': {
            break;
        }
        case 'FunctionDeclaration': {
            
            break;
        }
        case 'ForNumericStatement': {
            break;
        }
        case 'ForGenericStatement': {
            break;
        }
    }
}

export function discoverFile(globalInfo: PZGlobalInfo, __G: Scope, chunk: ast.Chunk) {
    for (const statement of chunk.body) {
        discoverStatement(globalInfo, __G, statement);
    }
}