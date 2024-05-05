import * as ast from 'luaparse';
import { Scope } from './Scope';
import { PZGlobalInfo } from './PZ';
import { ScopeIfClauseBlock, ScopeConstructor, ScopeFunction, ScopeReturn, ScopeVariable, ScopeWhileBlock, ScopeDoBlock, ScopeRepeatBlock, ScopeForNumericBlock, ScopeForGenericBlock, ScopeGoto, ScopeBreak, ScopeLabel, ScopeAssignment, stripCallParameters } from './LuaWizard';
import { callStatementToString, expressionToString, memberExpressionToString, statementToString } from './String';
import { getKnownType } from './KnownTypes';

export type DiscoveredType = {
    type: string | undefined;
    defaultValue: string | undefined;
};

export function discoverRelationships(expression: ast.Expression, scope: Scope, index: number = 0): void {
    switch (expression.type) {

        case 'Identifier': {
            // So if this is a direct reference, get the variable from the scope and
            // reference with the parameter variable slot and assignment.

            // console.log(`Identifier: ${expression.name}`);

            break;
        }

        case 'BinaryExpression':
        case 'UnaryExpression': {
            switch (expression.operator) {
                case '~':
                case 'not': {
                    break;
                }
                case '-':
                case '#': {
                    break;
                }
            }
            break;
        }
        case 'MemberExpression': {
            //console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
            // TODO - Build reference link.
            break;
        }
        case 'IndexExpression': {
            //console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
            // TODO - Build reference link.
            break;
        }
        case 'CallExpression': {

            const path = expressionToString(expression);
            let stripped = stripCallParameters(path);

            if (stripped.indexOf(':') !== -1) {
                while (stripped.indexOf(':') !== -1) stripped = stripped.replace(':', '.');
            }

            if (stripped.indexOf('()') !== -1) {
                while (stripped.indexOf('()') !== -1) stripped = stripped.replace('()', '');
            }

            let scope2, scope3;
            if (stripped.indexOf('.') !== -1 && stripped.indexOf('self.') === 0) {
                const classScope = scope.getClassScope();
                if (!classScope) {
                    console.error(`Cannot find class scope with self reference. (${stripped})`);
                    return;
                }

                const stripped2 = stripped.replace('self.', '');
                scope3 = classScope.resolve(stripped2);
                if (!scope3) {
                    console.error(`Cannot find class field or method with self reference. (${stripped2})`);
                    return;
                }

                if (scope3.assignments.indexOf(scope) === -1) scope3.assignments.push(scope);
                if (scope.references.indexOf(scope3) === -1) scope.references.push(scope3);

                // Spread types from scope2 to scope.
                if (scope3.types) for (const t of scope3.types) if (scope.types.indexOf(t) === -1) scope.types.push(t);
                // Spread types from scope to scope2.
                if (scope.types) for (const t of scope.types) if (scope3.types.indexOf(t) === -1) scope3.types.push(t);

                // console.warn(`discoverType(scope: ${scope.path}) => classScope: ${classScope.path} scope3: ${scope3.path}`);

            } else {
                scope2 = scope.resolve(stripped);
                if (!scope2) {
                    console.error(`Cannot find reference. (${stripped})`);
                    return;
                }

                if (scope2.assignments.indexOf(scope) === -1) scope2.assignments.push(scope);
                if (scope.references.indexOf(scope2) === -1) scope.references.push(scope2);

                // Spread types from scope2 to scope.
                if (scope2.types) for (const t of scope2.types) if (scope.types.indexOf(t) === -1) scope.types.push(t);
                // Spread types from scope to scope2.
                if (scope.types) for (const t of scope.types) if (scope2.types.indexOf(t) === -1) scope2.types.push(t);

                // console.warn(`discoverType() = (scope: ${scope.path}) => ${stripped}`);
            }

            // Handle param(s).
            for (const arg of expression.arguments) {
                discoverRelationships(arg, scope);
            }

            break;
        }
        case 'TableCallExpression': {
            //console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
            // TODO - Build reference link.
            break;
        }
        case 'StringCallExpression': {
            // console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
            // TODO - Build reference link.
            break;
        }

        case 'FunctionDeclaration': {
            // TODO - Implement.
            break;
        }

        case 'TableConstructorExpression': {

            // TODO - Look at each assignment, assign to a ScopeTable, and evaluate assignments or call statements 
            //        and reference-map.

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
        }
    }
}

export function discoverType(expression: ast.Expression, scope: Scope): DiscoveredType {
    let type: string | undefined = undefined;
    let defaultValue: string | undefined = undefined;

    switch (expression.type) {

        // Simple type-reference.
        case 'Identifier': {
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
            type = `vararg`;
            defaultValue = expression.value;
            break;
        }

        case 'TableConstructorExpression':
            // TODO - Implement.
            type = 'table';



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
                case 'CallStatement': {
                    break;
                }
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
    let func: ScopeConstructor | ScopeFunction;
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

        if (type === 'constructor') {
            func = {
                type: 'ScopeConstructor',
                init: expression,
                params,
                values: {},
                selfAlias,
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
                params,
                values: {},
                selfAlias,
                returns,
            };
        }

        scopeFunc = new Scope(func, scopeToAssign);

        // Add our params to the constructor's scope as variable children.
        for (const param of params) {
            new Scope(param, scopeFunc);
            func.values[param.name] = param;
        }
    }

    // Handle body statements.
    for (const statement of expression.body) {
        discoverStatement(globalInfo, statement, scopeFunc);
    }

    // Handle return statements.
    func = scopeFunc.element as ScopeFunction | ScopeConstructor;
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

        // Forward types to Scope.
        for (const type of returnTypes) {
            if (scopeFunc.types.indexOf(type) === -1) scopeFunc.types.push(type);
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
        };

        // (Self-assigning)
        const lScope = new Scope(variable, scope, index, name);

        // Identify & link scopes for any relationships.
        discoverRelationships(init, lScope, index);

        // Attempt to get the type for the next initialized variable.
        const initTypes = discoverType(init, lScope);
        if (initTypes.type && types.indexOf(initTypes.type) === -1) {
            types.push(initTypes.type);
        }

        // Lastly check for known API for types.
        if (!types.length) {
            const str = expressionToString(init);
            const kType = getKnownType(str);
            if (kType) if (types.indexOf(kType) === -1) types.push(kType);
        }

        // Push up to scope.
        for (const type of types) {
            if (lScope.types.indexOf(type) === -1) lScope.types.push(type);
        }

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

    for (let index = 0; index < statement.variables.length; index++) {
        const variable = statement.variables[index];
        const init = statement.init[index];


        console.log(`variable[${index}]: ${expressionToString(variable)} init: ${expressionToString(init)}`);

    }

    return changes;
}

export function discoverCallExpression(globalInfo: PZGlobalInfo, expression: ast.CallExpression, scope: Scope) {
    // This needs recursion.
    // For all expressions, use order proper.
    // If a sub-expression exists, use it. If unresolved type, discard it.
    // If reference to something, add reference.

    console.log(`Discovering relationships for CallExpression: ${expressionToString(expression)}`);
}

export function discoverCallStatement(globalInfo: PZGlobalInfo, statement: ast.CallStatement, scope: Scope): number {
    const { scope: __G } = globalInfo;
    const changes = 0;


    // What we can do in the future is take the parameters and try to match up literals or operations using references 
    // to build references to spread types. Otherwise this call is useless for our needs.

    console.log(`Discovering relationships for CallStatement: ${statementToString(statement)}`);

    discoverRelationships(statement.expression, scope);

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