import * as ast from 'luaparse';
import { Scope } from './Scope';
import { PZGlobalInfo } from './PZ';
import { ScopeIfClauseBlock, ScopeConstructor, ScopeFunction, ScopeReturn, ScopeVariable, ScopeWhileBlock, ScopeDoBlock, ScopeRepeatBlock, ScopeForNumericBlock, ScopeForGenericBlock, getKnownType, ScopeGoto, ScopeBreak, ScopeLabel, ScopeAssignment } from './LuaWizard';
import { expressionToString, memberExpressionToString } from './String';

export type DiscoveredType = {
    type: string | undefined;
    defaultValue: string | undefined;
};

export function discoverType(expression: ast.Expression, scope: Scope): DiscoveredType {
    let type: string | undefined = undefined;
    let defaultValue: string | undefined = undefined;

    switch (expression.type) {

        // Simple type-reference.
        case 'Identifier': {
            
            // const resolvedScope = scope.resolve(expression.name);

            // NOTE: We don't assign a type here. The reference-type is handled in a future pass.
            break;
        }

        case 'FunctionDeclaration':
            // TODO - Implement.
            type = 'fun';
            break;
        case 'StringLiteral': {
            type = 'string';
            defaultValue = `${expression.value}`;
            break;
        }
        case 'NumericLiteral': {
            type = 'number';
            defaultValue = `${expression.value}`;
            break;
        }
        case 'BooleanLiteral': {
            type = 'boolean';
            defaultValue = `${expression.value}`;
            break;
        }
        case 'NilLiteral': {
            type = 'nil';
            defaultValue = 'nil';
            break;
        }

        case 'VarargLiteral': {
            // TODO - Implement.
            type = `<${expression.value}>`;
            break;
        }

        case 'TableConstructorExpression':
            // TODO - Implement.
            type = 'table';

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
            type = 'number';
            break;
        }
        case 'LogicalExpression': {
            type = 'boolean';
            break;
        }
        case 'UnaryExpression': {
            switch (expression.operator) {
                case '~':
                case 'not': {
                    type = 'boolean';
                    break;
                }
                case '-':
                case '#': {
                    type = 'number';
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
    if (!type) {
        const str = expressionToString(expression);
        type = getKnownType(str);
    }

    return { type, defaultValue };
}

export function discoverBodyReturnTypes(body: ast.Statement[], scope: Scope): string[] {
    let returnTypes: string[] = [];

    const into = (body: ast.Statement[]) => {
        for (const x of body) {
            switch (x.type) {

                // Ignore functions. This is a separate return body.
                case 'FunctionDeclaration': {
                    break;
                }

                // Ignore simple statements which doesn't relate to returns directly.
                case 'LabelStatement':
                case 'BreakStatement':
                case 'LocalStatement':
                case 'AssignmentStatement':
                case 'CallStatement':
                case 'GotoStatement': {
                    break;
                }

                // What we're looking for.
                case 'ReturnStatement': {
                    // Discover any immediately identifiable types here and add to the 
                    // function's return types.
                    for (const arg of x.arguments) {
                        const discoveredArgType = discoverType(arg, scope);
                        const { type: argType } = discoveredArgType;
                        if (argType && returnTypes.indexOf(argType) === -1) {
                            returnTypes.push(argType);
                        }
                    }
                    break;
                }

                // Loops to look into.
                case 'WhileStatement':
                case 'DoStatement':
                case 'RepeatStatement':
                case 'ForNumericStatement':
                case 'ForGenericStatement': {
                    into(x.body);
                    break;
                }

                // If statements use clauses so same as above loops.
                case 'IfStatement': {
                    for (const clause of x.clauses) {
                        into(clause.body);
                    }
                    break;
                }
            }
        }
    };

    into(body);
    return returnTypes;
}

export function discoverReturnType(statement: ast.ReturnStatement, scope: Scope): string[] {
    const returnTypes: string[] = [];

    // Discover any immediately identifiable types here and add to the 
    // function's return types.
    for (const arg of statement.arguments) {
        const discoveredArgType = discoverType(arg, scope);
        const { type: argType } = discoveredArgType;
        if (argType && returnTypes.indexOf(argType) === -1) {
            returnTypes.push(argType);
        }
    }

    return returnTypes;
}

export function discoverFunctionDeclaration(globalInfo: PZGlobalInfo, expression: ast.FunctionDeclaration, scope: Scope): number {

    const { scope: __G } = globalInfo;

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

    // Handle body statements.
    for (const statement of expression.body) {
        discoverStatement(globalInfo, statement, scopeFunc);
    }

    // Handle return statements.
    const func = scopeFunc.element as ScopeFunction | ScopeConstructor;
    if (func.type === 'ScopeFunction') {
        const returnTypes = func.returns.types;
        for (const child of Object.values(scopeFunc.children)) {
            if (child.name.startsWith('___return')) {
                if (child.types.length) {
                    for (const childType of child.types) {
                        if (returnTypes.indexOf(childType) === -1) returnTypes.push(childType);
                    }
                }
            }
        }
    }

    return 0;
}

export function discoverLabelStatement(globalInfo: PZGlobalInfo, statement: ast.LabelStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const labelBlock: ScopeLabel = {
        type: 'ScopeLabel',
        init: statement,
        name: statement.label.name,
    };

    new Scope(labelBlock, scope);

    return changes;
}

export function discoverBreakStatement(globalInfo: PZGlobalInfo, statement: ast.BreakStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const breakBlock: ScopeBreak = {
        type: 'ScopeBreak',
        init: statement,
    };

    new Scope(breakBlock, scope);

    return changes;
}

export function discoverGotoStatement(globalInfo: PZGlobalInfo, statement: ast.GotoStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const gotoBlock: ScopeGoto = {
        type: 'ScopeGoto',
        init: statement,
        label: statement.label.name,
    };

    new Scope(gotoBlock, scope);

    return changes;
}

export function discoverReturnStatement(globalInfo: PZGlobalInfo, statement: ast.ReturnStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    let bodyScope: Scope | undefined = scope.getBodyScope();
    // TODO - Implement ScopeFile and use this instead of global scope.
    const bodyScope2: Scope = bodyScope ? bodyScope : __G;

    const returnBlock: ScopeReturn = {
        type: 'ScopeReturn',
        init: statement,
        types: discoverReturnType(statement, bodyScope2),
    }

    new Scope(returnBlock, scope);

    return changes;
}

export function discoverLocalStatement(globalInfo: PZGlobalInfo, statement: ast.LocalStatement, scope: Scope): number {

    const { scope: __G } = globalInfo;
    let changes = 0;

    // (Support for tuples)
    for (let index = 0; index < statement.variables.length; index++) {

        const name = statement.variables[index].name;

        // We already defined this local.
        if (scope.children[name]) {
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

        // Attempt to get the type for the next initialized variable.
        const initTypes = discoverType(init, scope);
        if (initTypes.type && types.indexOf(initTypes.type) === -1) {
            types.push(initTypes.type);
        }

        // Lastly check for known API for types.
        if (!types.length) {
            const str = expressionToString(init);
            const kType = getKnownType(expressionToString(init));
            if (kType) if (types.indexOf(kType) === -1) types.push(kType);
        }

        // (Self-assigning)
        const lScope = new Scope(variable, scope);

        changes++;
    }

    return changes;
}

export function discoverAssignmentStatement(globalInfo: PZGlobalInfo, statement: ast.AssignmentStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const assignmentBlock: ScopeAssignment = {
        type: 'ScopeAssignment',
        init: statement,
    }

    new Scope(assignmentBlock, scope);

    return changes;
}

export function discoverCallStatement(globalInfo: PZGlobalInfo, statement: ast.CallStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    // We do nothing here for now.
    //
    // What we can do in the future is take the parameters and try to match up literals or operations using references 
    // to build references to spread types. Otherwise this call is useless for our needs.

    return changes;
}

export function discoverIfStatement(globalInfo: PZGlobalInfo, statement: ast.IfStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    // All content is in the clauses of the if block.
    for (const clause of statement.clauses) {
        const ifClause: ScopeIfClauseBlock = {
            type: 'ScopeIfClauseBlock',
            init: clause,
            values: {}
        }
        const scopeIf = new Scope(ifClause, scope);

        // Go through body of clause.
        for (const next of clause.body) {
            discoverStatement(globalInfo, next, scopeIf);
        }
    }

    return changes;
}

export function discoverWhileStatement(globalInfo: PZGlobalInfo, statement: ast.WhileStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const whileBlock: ScopeWhileBlock = {
        type: 'ScopeWhileBlock',
        init: statement,
        values: {}
    }
    const scopeIf = new Scope(whileBlock, scope);

    // Go through body.
    for (const next of statement.body) {
        discoverStatement(globalInfo, next, scopeIf);
    }

    return changes;
}

export function discoverDoStatement(globalInfo: PZGlobalInfo, statement: ast.DoStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const doBlock: ScopeDoBlock = {
        type: 'ScopeDoBlock',
        init: statement,
        values: {}
    }
    const scopeIf = new Scope(doBlock, scope);

    // Go through body.
    for (const next of statement.body) {
        discoverStatement(globalInfo, next, scopeIf);
    }

    return changes;
}

export function discoverRepeatStatement(globalInfo: PZGlobalInfo, statement: ast.RepeatStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const doBlock: ScopeRepeatBlock = {
        type: 'ScopeRepeatBlock',
        init: statement,
        values: {}
    }
    const scopeIf = new Scope(doBlock, scope);

    // Go through body.
    for (const next of statement.body) {
        discoverStatement(globalInfo, next, scopeIf);
    }

    return changes;
}

export function discoverForNumericStatement(globalInfo: PZGlobalInfo, statement: ast.ForNumericStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const doBlock: ScopeForNumericBlock = {
        type: 'ScopeForNumericBlock',
        init: statement,
        values: {}
    }
    const scopeIf = new Scope(doBlock, scope);

    // Go through body.
    for (const next of statement.body) {
        discoverStatement(globalInfo, next, scopeIf);
    }

    return changes;
}

export function discoverForGenericStatement(globalInfo: PZGlobalInfo, statement: ast.ForGenericStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;

    const doBlock: ScopeForGenericBlock = {
        type: 'ScopeForGenericBlock',
        init: statement,
        values: {}
    }
    const scopeIf = new Scope(doBlock, scope);

    // Go through body.
    for (const next of statement.body) {
        discoverStatement(globalInfo, next, scopeIf);
    }

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