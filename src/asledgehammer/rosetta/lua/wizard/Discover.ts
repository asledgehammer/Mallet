import * as ast from 'luaparse';
import { Scope } from './Scope';
import { PZGlobalInfo } from './PZ';

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
    const { scope: __G } = globalInfo;
    const changes = 0;



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

export function discoverLocalStatement(globalInfo: PZGlobalInfo, expression: ast.LocalStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;



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

export function discoverFile(globalInfo: PZGlobalInfo, __G: Scope, chunk: ast.Chunk) {
    for (const statement of chunk.body) {
        discoverStatement(globalInfo, statement, __G);
    }
}