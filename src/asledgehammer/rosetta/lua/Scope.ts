import * as ast from 'luaparse';
import { isFunctionDeclaration, isWhileStatement, server } from 'typescript';
// @ts-ignore
const luaparse: luaparse = ast.default;

export type MethodReferenceType = 'void'
    | 'nil'
    | 'boolean'
    | 'number'
    | 'string'
    | 'table'
    ;

const knownMethodTypes: { [path: string]: string[] } = {
    'math.min': ['number'],
    'math.max': ['number'],
    'math.floor': ['number'],
    'math.ceil': ['number'],
    'math.round': ['number']
};

export type ScopeType = 'class' | 'table' | 'function' | 'field' | 'value' | 'block';

export interface ScopePath {
    raw: string;
    name: string;
    parent?: ScopePath;
    children?: ScopePath[];
    valueType: ScopeType;
}

export interface Base<TType extends string> {
    type: TType;
}

export interface ScopeBase<TType extends string> extends Base<TType> {
    scope: ScopePath;
}

/**
 * *ScopeReference* stores indirect value assignments for fields, values, and local variables. This is used to 
 * chain-assign types when types are discovered for the end-target of the chain.
 */
export interface ScopeReference extends ScopeBase<'ScopeReference'> {
    value: ScopeReferenceable;
}

export interface ScopeVariable extends ScopeBase<'ScopeVariable'> {

    /** The name of the variable in Lua code. */
    name: string;

    /** All type(s) discovered for the variable. */
    types: string[];

    /** The luaparse AST object. */
    init?: ast.Statement;

    /** Any direct references to assignments so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };
}

export interface ScopeReturn extends Base<'ScopeReturn'> {
    types: string[];
}

export interface ScopeBlock<TType extends string> extends ScopeBase<TType> {
    values: { [name: string]: ScopeVariable };
}

export interface ScopeForGenericBlock extends ScopeBlock<'ScopeForGenericBlock'> {
    init: ast.ForGenericStatement;
}

export interface ScopeForNumericBlock extends ScopeBlock<'ScopeForNumericBlock'> {
    init: ast.ForNumericStatement;
}

export interface ScopeWhileBlock extends ScopeBlock<'ScopeWhileBlock'> {
    init: ast.WhileStatement;
}

export interface ScopeDoBlock extends ScopeBlock<'ScopeDoBlock'> {
    init: ast.DoStatement;
}

export interface ScopeIfBlock extends ScopeBlock<'ScopeIfBlock'> {
    init: ast.IfStatement;
}

export interface ScopeIfClauseBlock extends ScopeBlock<'ScopeIfClauseBlock'> {
    init: ast.IfClause | ast.ElseifClause | ast.ElseClause;
}

export interface ScopeRepeatBlock extends ScopeBlock<'ScopeRepeatBlock'> {
    init: ast.RepeatStatement;
}

export interface ScopeFunction extends ScopeBase<'ScopeFunction'> {
    values: { [name: string]: ScopeVariable };
    params: ScopeVariable[];
    returns: ScopeReturn;

    /** The luaparse AST object. */
    init: ast.FunctionDeclaration;

    /** Any direct references to assignments so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };
};

export interface ScopeConstructor extends ScopeBase<'ScopeConstructor'> {
    values: { [name: string]: ScopeVariable };
    params: ScopeVariable[];

    /** The luaparse AST object. */
    init?: ast.FunctionDeclaration;

    /** This is the aliased table object that is returned as 'self' when constructing a class. */
    selfAlias: string;

    /** Any direct references to assignments so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };
};

export interface ScopeTable extends ScopeBase<'ScopeTable'> {
    values: { [name: string]: ScopeVariable };
    funcs: { [name: string]: ScopeFunction };

    /** Any direct references to assignments so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };
};

export interface ScopeClass extends ScopeBase<'ScopeClass'> {
    name: string;
    extendz?: ScopeClass | string;
    conztructor: ScopeConstructor;
    values: { [name: string]: ScopeVariable };
    fields: { [name: string]: ScopeVariable };
    funcs: { [name: string]: ScopeFunction };
    methods: { [name: string]: ScopeFunction };

    /** Any direct references to assignments so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };
};

export interface ScopeGlobal extends ScopeBase<'ScopeGlobal'> {
    map: { [name: string]: ScopeElement },
    values: { [name: string]: ScopeVariable };
    funcs: { [name: string]: ScopeFunction };
    tables: { [name: string]: ScopeTable };
    classes: { [name: string]: ScopeClass };
}

export type ScopeElement = ScopeVariable
    | ScopeFunction
    | ScopeForGenericBlock
    | ScopeForNumericBlock
    | ScopeDoBlock
    | ScopeWhileBlock
    | ScopeRepeatBlock
    | ScopeIfBlock
    | ScopeIfClauseBlock
    | ScopeTable
    | ScopeClass
    | ScopeConstructor;

export type ScopeReferenceable = ScopeVariable
    | ScopeFunction
    | ScopeConstructor
    | ScopeTable
    | ScopeClass;

export interface RenderOptions {
    indent: number;
};

function indent(options: RenderOptions): RenderOptions {
    return { ...options, indent: options.indent + 1 };
}

function literalToString(literal: ast.BooleanLiteral | ast.NumericLiteral | ast.NilLiteral | ast.StringLiteral | ast.VarargLiteral, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${literal.raw}`;
}

function identifierToString(identifier: ast.Identifier, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${identifier.name}`;
}

function indexExpressionToString(expression: ast.IndexExpression, options: RenderOptions = { indent: 0 }): string {
    return `${expressionToString(expression.base)}[${expressionToString(expression.index)}]`;
}

function logicalExpressionToString(expression: ast.LogicalExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
}

function unaryExpressionToString(expression: ast.UnaryExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expression.operator}${expressionToString(expression.argument)}`;
}

function stringCallExpressionToString(expression: ast.StringCallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    console.log(expression);
    throw new Error('Not implemented.');
}

function tableCallExpressionToString(expression: ast.TableCallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    console.log(expression);
    throw new Error('Not implemented.');
}

function binaryExpressionToString(expression: ast.BinaryExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
}

function argsToString(args2: ast.Expression[], options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of args2) args.push(expressionToString(arg));
    return `${i}${args.join(', ')}`;
}

function memberExpressionToString(expression: ast.MemberExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${expressionToString(expression.base)}${expression.indexer}${expression.identifier.name}`;
}

function callExpressionToString(expression: ast.CallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${expressionToString(expression.base)}(${argsToString(expression.arguments)})`;
}

function returnStatementToString(statement: ast.ReturnStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of statement.arguments) args.push(expressionToString(arg));
    return `${i}return ${args.join(', ')}`;
}

function gotoStatementToString(statement: ast.GotoStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}goto $${statement.label}`;
}

function labelStatementToString(statement: ast.LabelStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}::${statement.label}::`;
}

function breakStatementToString(statement: ast.BreakStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}break`;
}

function localStatementToString(statement: ast.LocalStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    // The local name(s).
    const vars: string[] = [];
    for (const _var_ of statement.variables) vars.push(_var_.name);

    // The value(s) to set.
    const inits: string[] = [];
    for (const i of statement.init) inits.push(expressionToString(i, options));

    return `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
}

function varargLiteralToString(param: ast.VarargLiteral, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${param.raw}`;
}

function parametersToString(params: (ast.Identifier | ast.VarargLiteral)[], options: RenderOptions = { indent: 0 }): string {
    const ps: string[] = [];
    for (const param of params) {
        switch (param.type) {
            case 'Identifier': {
                ps.push(identifierToString(param, options));
                break;
            }
            case 'VarargLiteral': {
                ps.push(varargLiteralToString(param, options));
                break;
            }
        }
    }
    return ps.join(', ');
}

function bodyToString(body: ast.Statement[], options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    let s = '';
    for (const statement of body) s += `${i}${statementToString(statement, options)}\n`;
    if (s.length) s = s.substring(0, s.length - 1); // Remove the last newline. (If present)
    return s;
}

function functionDeclarationToString(func: ast.FunctionDeclaration, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);

    let s = `${i}function (${parametersToString(func.parameters)})\n`;
    s += `${bodyToString(func.body, options2)}\n`;
    s += `${i}}`;

    return s;
}

function ifClauseToString(clause: ast.IfClause, isLastClause: boolean, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}if ${expressionToString(clause.condition)} then\n`;
    s += `${bodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

function elseIfClauseToString(clause: ast.ElseifClause, isLastClause: boolean, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}elseif ${expressionToString(clause.condition)} then\n`;
    s += `${bodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

function elseClauseToString(clause: ast.ElseClause, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}else\n`;
    for (const statement of clause.body) s += `${statementToString(statement, options2)};`;
    s += `${i}end`;
    return s;
}

function whileStatementToString(statement: ast.WhileStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}while ${statement.condition} do\n`;
    s += `${bodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

function doStatementToString(statement: ast.DoStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}do\n`;
    s += `${bodyToString(statement.body), options2}\n`;
    s += `${i}end`;
    return s;
}

function repeatStatementToString(statement: ast.RepeatStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}repeat\n`;
    s += `${bodyToString(statement.body, options2)}\n`;
    s += `${i}until ${statement.condition};`;
    return s;
}

function forNumericStatementToString(statement: ast.ForNumericStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}for ${expressionToString(statement.start)}, ${expressionToString(statement.end)}`;
    if (statement.step) s += `, ${expressionToString(statement.step)}`; // (Optional 3rd step argument)
    s += `\n${bodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

function forGenericStatementToString(statement: ast.ForGenericStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    const vars: string[] = [];
    for (const variable of statement.variables) vars.push(variable.name);
    const iterate: string[] = [];
    for (const iterator of statement.iterators) iterate.push(expressionToString(iterator));
    let s = `${i}for ${vars.join(', ')} in ${iterate.join(', ')} do\n`;
    s += `${bodyToString(statement.body, options2)}\n`;
    s += 'end';
    return s;
}

function ifStatementToString(statement: ast.IfStatement, options: RenderOptions = { indent: 0 }): string {
    let s = '';
    for (let index = 0; index < statement.clauses.length; index++) {
        const isLastClause = index < statement.clauses.length - 1;
        const clause = statement.clauses[index];
        switch (clause.type) {
            case 'IfClause': {
                s += `${ifClauseToString(clause, isLastClause, options)}\n`;
                break;
            }
            case 'ElseifClause': {
                s += `${elseIfClauseToString(clause, isLastClause, options)}\n`;
                break;
            }
            case 'ElseClause': {
                s += `${elseClauseToString(clause, options)}`
                break;
            }
        }
    }
    return ';';
}

function tableConstructorExpressionToString(expression: ast.TableConstructorExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    // Empty table.
    if (!expression.fields.length) return `${i}{}`;

    const entries: string[] = [];
    for (const field of expression.fields) {
        switch (field.type) {
            case 'TableKey': {
                entries.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                break;
            }
            case 'TableKeyString': {
                entries.push(`"${field.key.name}" = ${expressionToString(field.value)}`);
                break;
            }
            case 'TableValue': {
                entries.push(expressionToString(field.value));
                break;
            }
        }
    }
    return `${i}{ ${entries.join(', ')} }`;
}

function assignmentStatementToString(statement: ast.AssignmentStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    // The local name(s).
    const vars: string[] = [];
    for (const _var_ of statement.variables) {
        switch (_var_.type) {
            case 'Identifier': {
                vars.push(identifierToString(_var_));
                break;
            }
            case 'IndexExpression': {
                vars.push(indexExpressionToString(_var_));
                break;
            }
            case 'MemberExpression': {
                vars.push(memberExpressionToString(_var_));
                break;
            }
        }
    }

    // The value(s) to set.
    const inits: string[] = [];
    for (const init of statement.init) inits.push(expressionToString(init));

    return `${i}${vars.join(', ')} = ${inits.join(', ')}`;
}

function callStatementToString(statement: ast.CallStatement, options: RenderOptions): string {
    switch (statement.expression.type) {
        case 'CallExpression': return callExpressionToString(statement.expression, options);
        case 'StringCallExpression': return stringCallExpressionToString(statement.expression, options);
        case 'TableCallExpression': return tableCallExpressionToString(statement.expression, options);
    }
}

function expressionToString(arg: ast.Expression, options: RenderOptions = { indent: 0 }): string {
    switch (arg.type) {
        case 'BooleanLiteral': return literalToString(arg, options);
        case 'NumericLiteral': return literalToString(arg, options);
        case 'NilLiteral': return literalToString(arg, options);
        case 'StringLiteral': return literalToString(arg, options);
        case 'VarargLiteral': return literalToString(arg, options);
        case 'Identifier': return identifierToString(arg, options);
        case 'BinaryExpression': return binaryExpressionToString(arg, options);
        case 'CallExpression': return callExpressionToString(arg, options);
        case 'MemberExpression': return memberExpressionToString(arg);
        case 'FunctionDeclaration': return functionDeclarationToString(arg, options);
        case 'IndexExpression': return indexExpressionToString(arg);
        case 'TableConstructorExpression': return tableConstructorExpressionToString(arg);
        case 'LogicalExpression': return logicalExpressionToString(arg);
        case 'UnaryExpression': return unaryExpressionToString(arg);
        case 'StringCallExpression': return stringCallExpressionToString(arg);
        case 'TableCallExpression': return tableCallExpressionToString(arg);
    }
}

function statementToString(statement: ast.Statement, options: RenderOptions): string {
    switch (statement.type) {
        case 'LabelStatement': return labelStatementToString(statement);
        case 'BreakStatement': return breakStatementToString(statement);
        case 'GotoStatement': return gotoStatementToString(statement);
        case 'ReturnStatement': return returnStatementToString(statement);
        case 'IfStatement': return ifStatementToString(statement, options);
        case 'WhileStatement': return whileStatementToString(statement, options);
        case 'DoStatement': return doStatementToString(statement, options);
        case 'RepeatStatement': return repeatStatementToString(statement, options);
        case 'LocalStatement': return localStatementToString(statement, options);
        case 'AssignmentStatement': return assignmentStatementToString(statement);
        case 'CallStatement': return callStatementToString(statement, options);
        case 'FunctionDeclaration': return functionDeclarationToString(statement, options);
        case 'ForNumericStatement': return forNumericStatementToString(statement, options);
        case 'ForGenericStatement': return forGenericStatementToString(statement, options);
    }
}

function newGlobalScope(): ScopeGlobal {
    return {
        scope: {
            name: '__G',
            raw: '__G',
            valueType: 'table'
        },
        type: 'ScopeGlobal',
        map: {},
        values: {},
        funcs: {},
        tables: {},
        classes: {}
    };
}

/**
 * Attempts to find an object from a given scope to the global scope.
 * 
 * @param __G The global context.
 * @param baseName The name of the object to find.
 * @param scope The most specific scope the lookup is for.
 * @returns any | undefined
 */
const find = (__G: ScopeGlobal, baseName: string, scope: ScopePath): ScopeReferenceable | undefined => {

    let found: ScopeReferenceable | undefined = undefined;

    // Go through the current scope to the outer-most-scope to find the object reference.
    let scopeCurrent: ScopePath | undefined = scope;
    while (scopeCurrent !== undefined) {

        // Put together the scope and the object's name. If this resolves we've found the most
        // specific object referenced from the scope.
        const pathRaw = `${scopeCurrent.raw}.${baseName}`;
        const f = __G.map[pathRaw];

        // console.log(`find: ${pathRaw}: ${f}`);
        if (f && (f as any).references) {
            found = f as ScopeReferenceable;
            break;
        }

        // We didn't find the object. Go to the next outer-scope.
        scopeCurrent = scopeCurrent.parent;
    }

    return found;
};

const getScope = (__G: ScopeGlobal, raw: string, name: string, parent: ScopePath | undefined, valueType: ScopeType): ScopePath => {
    if (__G.map[raw]) return __G.map[raw].scope;
    return {
        name,
        raw,
        parent,
        children: [],
        valueType
    };
}

const discoverInClass = (__G: ScopeGlobal, clazz: ScopeClass, statements: ast.Statement[], parentScope: ScopePath, selfAlias: string = 'self', debug: boolean = false): number => {

    let changes = 0;
    let ifIndex = 0;
    let forGenericIndex = 0;
    let forNumericIndex = 0;
    let doIndex = 0;
    let whileIndex = 0;
    let repeatIndex = 0;

    for (const statement of statements) {
        switch (statement.type) {
            // local x = ..
            case 'LocalStatement': {

                if (debug) {
                    console.log(localStatementToString(statement));
                }

                // Tuple-support.
                for (let index = 0; index < statement.variables.length; index++) {

                    // Get variable name.
                    const variable = statement.variables[index];
                    if (variable.type !== 'Identifier') continue;
                    const varName = variable.name;

                    // 
                    const init = statement.init[index];
                    if (!init) continue;

                    switch (init.type) {

                        // local x = o(..);
                        case 'CallExpression': {
                            const base = init.base;

                            switch (base.type) {


                                // local x = p.o(..);
                                case 'MemberExpression': {
                                    const basebase = base.base;


                                    switch (basebase.type) {
                                        case 'Identifier': {
                                            const objName = basebase.name;
                                            const funcName = base.identifier.name === 'new' ? 'constructor' : base.identifier.name;
                                            const call = `${objName}${base.indexer}${funcName}`;
                                            const objScope = getScope(__G, `${parentScope.raw}.${varName}`, objName, parentScope, 'value');
                                            const found = find(__G, objName === 'self' ? funcName : `${objName}.${funcName}`, objScope);
                                            if (debug) {
                                                console.warn(`###!!! ${varName} = ${call}`);
                                                console.log(objScope);
                                                console.log(found);
                                                console.log('call: ' + call);
                                                console.log(' ');
                                            }
                                            break;
                                        }

                                        case 'CallExpression': {
                                            if (debug) {
                                                console.log('!!!!!!!!!!! ' + `(${basebase.type}) (local ${varName})`);
                                                console.log(statement);
                                                console.log(' ');
                                            }

                                            let args: string[] = [];
                                            for (const arg of basebase.arguments) {
                                                switch (arg.type) {
                                                    case 'Identifier': {
                                                        args.push(arg.name);
                                                        break;
                                                    }
                                                    case 'BooleanLiteral':
                                                    case 'NumericLiteral':
                                                    case 'NilLiteral':
                                                    case 'StringLiteral': {
                                                        args.push(arg.raw);
                                                        break;
                                                    }

                                                    case 'BinaryExpression': {
                                                        args.push(`${arg.left} ${arg.operator} ${arg.right}`);
                                                        break;
                                                    }
                                                    case 'CallExpression': {
                                                        const base = arg;
                                                        args.push()
                                                    }

                                                }
                                            }

                                            break;
                                        }

                                        default: {
                                            if (debug) {
                                                console.warn(`Please check into this init.base.base: (${basebase.type}) (local ${varName})`);
                                                console.log(statement);
                                                console.log(' ');
                                            }
                                            break;
                                        }
                                    }

                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                break;
            }
            case 'AssignmentStatement': {

                if (debug) {
                    console.log(assignmentStatementToString(statement));
                }

                /* (Support tuple declarations) */
                let index;
                for (index = 0; index < statement.variables.length; index++) {
                    const variable = statement.variables[index];
                    const init = statement.init[index];
                    switch (variable.type) {
                        case 'Identifier': {
                            const varName = variable.name;
                            if (debug) {
                                console.log("Please check this Identifier variable out: ");
                                console.log(statement);
                                console.log(variable);
                                console.log(init);
                            }

                            if (!init) continue;

                            switch (init.type) {

                                // local x = o.func(args);
                                case 'CallExpression': {
                                    const base = init.base;

                                    switch (base.type) {
                                        case 'MemberExpression': {
                                            const basebase = base.base;

                                            switch (basebase.type) {
                                                case 'Identifier': {
                                                    const variableScope = getScope(__G, `${parentScope.raw}.${varName}`, varName, parentScope, 'value');
                                                    const scopeVariable: ScopeVariable = {
                                                        type: 'ScopeVariable',
                                                        scope: variableScope,
                                                        name: varName,
                                                        types: [],
                                                        references: {},
                                                        init: statement
                                                    };

                                                    const objName = basebase.name;
                                                    const funcName = base.identifier.name === 'new' ? 'constructor' : base.identifier.name;

                                                    const call = `${objName}${base.indexer}${funcName}`;

                                                    // Check to see if this is a call to a known Lua core API or something else we've pre-defined.
                                                    if (knownMethodTypes[call]) {
                                                        const _types_ = knownMethodTypes[call];
                                                        for (const _type_ of _types_) {
                                                            if (scopeVariable.types.indexOf(_type_) === -1) {
                                                                scopeVariable.types.push(_type_);
                                                            }
                                                        }

                                                        __G.map[variableScope.raw] = scopeVariable;
                                                        break;
                                                    }

                                                    const objScope = getScope(__G, `${parentScope.raw}.${objName}`, objName, parentScope, 'value');
                                                    const found = find(__G, `${objName}.${funcName}`, objScope);

                                                    if (debug && found !== undefined) {
                                                        console.warn(`###!!! ${varName} = ${call}`);
                                                        console.log(objScope);
                                                        console.log(found);
                                                        console.log('call: ' + call);
                                                        console.log(' ');
                                                    }

                                                    __G.map[variableScope.raw] = scopeVariable;
                                                    break;
                                                }
                                                default: {
                                                    if (debug) {
                                                        console.warn('Please check into this init.base.base: ');
                                                        console.log(statement);
                                                        console.log(' ');
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                        case 'IndexExpression': {
                            if (debug) {
                                console.log("Please check this IndexExpression variable out: ");
                                console.log(variable);
                            }
                            break;
                        }
                        case 'MemberExpression': {
                            switch (variable.base.type) {
                                case 'Identifier': {
                                    const baseName = variable.base.name;
                                    const identifier = variable.identifier.name;

                                    const types: string[] = [];

                                    if (!statement.init.length) {
                                        /* (Unknown type) */
                                        // if (types.indexOf('any') === -1) types.push('any');
                                    } else {
                                        const init0 = statement.init[0];
                                        switch (init0.type) {

                                            /* (Table definition) */
                                            case 'TableConstructorExpression': {
                                                if (types.indexOf('table') === -1) types.push('table');
                                                break;
                                            }
                                            case 'BooleanLiteral': {
                                                if (types.indexOf('boolean') === -1) types.push('boolean');
                                                break;
                                            }
                                            case 'NumericLiteral': {
                                                if (types.indexOf('number') === -1) types.push('number');
                                                break;
                                            }
                                            case 'StringLiteral': {
                                                if (types.indexOf('string') === -1) types.push('string');
                                                break;
                                            }
                                            case 'NilLiteral': {
                                                if (types.indexOf('nil') === -1) types.push('nil');
                                                break;
                                            }
                                            case 'VarargLiteral': {
                                                // TODO - Implement varargs.
                                                if (debug) console.warn(`VARARG LITERAL: ${baseName}${variable.indexer}${identifier}`);
                                                types.length = 0;
                                                // types.push('any');
                                            }
                                            case 'MemberExpression': {
                                                // Here, we simply want to construct a reference.
                                                // x = obj.y;

                                                const call = `${baseName}${variable.indexer}${identifier}`;
                                                const types = [];

                                                if (knownMethodTypes[call]) {
                                                    for (const type of knownMethodTypes[call]) {
                                                        types.push(type);
                                                    }
                                                }

                                                // If we're referencing a field in the class.
                                                if (baseName === 'self') {
                                                    const found = find(__G, `${clazz.name}.${identifier}`, parentScope);
                                                    if (debug) console.log(found);
                                                    break;
                                                }

                                                break;
                                            }
                                            /* (Unknown type) */
                                            default: {
                                                if (debug) {
                                                    console.warn(`Check out default in MemberExpression for var assignment: (${init0.type}) ${parentScope.raw}.${baseName}${variable.indexer}${identifier}`)
                                                    console.log(statement);
                                                }
                                                // if (types.indexOf('any') === -1) types.push('any');
                                                break;
                                            }
                                        }
                                    }

                                    if (baseName === 'self') { /* (Class Field) */

                                        const scopeField = getScope(__G, `${clazz.scope.raw}.${identifier}`, identifier, clazz.scope, 'field');

                                        let field: ScopeVariable = clazz.fields[identifier];
                                        if (!field) {
                                            field = {
                                                type: 'ScopeVariable',
                                                scope: scopeField,
                                                name: identifier,
                                                init: statement,
                                                types,
                                                references: {}
                                            };
                                            clazz.fields[identifier] = field;
                                            __G.map[scopeField.raw] = field;
                                        } else {
                                            // Add unadded types here for already-existing fields.
                                            for (const type of types) {
                                                if (field.types.indexOf(type) === -1) field.types.push(type);
                                            }
                                        }
                                    } else {

                                        const scopeBase = getScope(__G, `${parentScope.raw}.${baseName}`, `${baseName}`, parentScope, 'value');
                                        const scopeIdentifier = getScope(__G, `${parentScope.raw}.${baseName}.${identifier}`, `${baseName}.${identifier}`, scopeBase, 'value');

                                        // console.log(`identifier: ${identifier}, scope: ${scopeIdentifier.raw}`);

                                        /* (Identifier Variable in scope) */
                                        let varIdentifier: ScopeVariable = {
                                            type: 'ScopeVariable',
                                            scope: scopeIdentifier,
                                            name: identifier,
                                            init: statement,
                                            references: {},
                                            types
                                        };

                                        const baseObject: ScopeReferenceable | undefined = find(__G, baseName, scopeIdentifier);
                                        // console.log(baseObject);

                                        // TODO - Support for tuple assignments.
                                        const init0 = statement.init[0];

                                        if (init0.type === 'Identifier') {

                                            if (init0.name === 'self') { // This is a class reference.

                                                // Find the enclosing class of the parent scope. This is what we assign as the reference.
                                                let scopeCurrent: ScopePath | undefined = parentScope;
                                                while (scopeCurrent !== undefined) {
                                                    // console.log(scopeCurrent.raw);
                                                    if (scopeCurrent.valueType === 'class') {
                                                        const clazz = __G.map[scopeCurrent.raw] as ScopeClass;
                                                        const clazzReference: ScopeReference = {
                                                            type: 'ScopeReference',
                                                            scope: scopeCurrent!,
                                                            value: clazz!
                                                        }
                                                        varIdentifier.references[scopeCurrent.raw] = clazzReference;
                                                        break;
                                                    }
                                                    scopeCurrent = scopeCurrent.parent;
                                                }

                                            } else {
                                                const baseObject: ScopeReferenceable | undefined = find(__G, baseName, scopeIdentifier);

                                                if (debug) {
                                                    console.warn('Check below out please. (member-assign)');
                                                    console.log(init0);
                                                    console.log(statement);
                                                    console.log(scopeIdentifier);
                                                    console.log(baseObject);
                                                    console.log(varIdentifier);
                                                    console.log(' ');
                                                }
                                            }

                                            if (debug) {
                                                // if (baseName === 'otherElement') {
                                                console.warn(`BASE OBJECT FOUND: '${scopeIdentifier.raw}'`, varIdentifier);
                                                console.log(statement);
                                                console.log(init0);
                                                console.log(' ');
                                                // }
                                            }
                                        }

                                        // _values_[identifier] = varIdentifier;
                                        __G.map[scopeIdentifier.raw] = varIdentifier;
                                    }

                                    break;
                                }
                                default: {
                                    if (debug) {
                                        console.log("Please check this variable.base out: ");
                                        console.log(variable);
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                break;
            }
            case 'ForGenericStatement': {
                // Create the next unique name.
                const name = `forgeneric_${forGenericIndex++}`;
                const scopeForGeneric = getScope(__G, `${parentScope.raw}.${name}`, name, parentScope, 'block');
                // Check to see if the element exists already.
                let _for_ = __G.map[scopeForGeneric.raw];
                if (!_for_) {
                    // Create repeat not defined yet in passing.
                    _for_ = {
                        type: 'ScopeForGenericBlock',
                        scope: scopeForGeneric,
                        values: {},
                        init: statement
                    }
                    __G.map[scopeForGeneric.raw] = _for_;
                }

                discoverInClass(__G, clazz, statement.body, scopeForGeneric);
                break;
            }
            case 'ForNumericStatement': {
                // Create the next unique name.
                const name = `fornumeric_${forNumericIndex++}`;
                const scopeForNumeric = getScope(__G, `${parentScope.raw}.${name}`, name, parentScope, 'block');
                // Check to see if the element exists already.
                let _for_ = __G.map[scopeForNumeric.raw];
                if (!_for_) {
                    // Create repeat not defined yet in passing.
                    _for_ = {
                        type: 'ScopeForNumericBlock',
                        scope: scopeForNumeric,
                        values: {},
                        init: statement
                    }
                    __G.map[scopeForNumeric.raw] = _for_;
                }

                discoverInClass(__G, clazz, statement.body, scopeForNumeric);
                break;
            }
            case 'WhileStatement': {
                // Create the next unique name.
                const name = `while_${whileIndex++}`;
                const scopeWhile = getScope(__G, `${parentScope.raw}.${name}`, name, parentScope, 'block');
                // Check to see if the element exists already.
                let _while_ = __G.map[scopeWhile.raw];
                if (!_while_) {
                    // Create repeat not defined yet in passing.
                    _while_ = {
                        type: 'ScopeWhileBlock',
                        scope: scopeWhile,
                        values: {},
                        init: statement
                    }
                    __G.map[scopeWhile.raw] = _while_;
                }

                discoverInClass(__G, clazz, statement.body, scopeWhile);
                break;
            }
            case 'DoStatement': {
                // Create the next unique name.
                const name = `do_${doIndex++}`;
                const scopeDo = getScope(__G, `${parentScope.raw}.${name}`, name, parentScope, 'block');
                // Check to see if the element exists already.
                let _do_ = __G.map[scopeDo.raw];
                if (!_do_) {
                    // Create repeat not defined yet in passing.
                    _do_ = {
                        type: 'ScopeDoBlock',
                        scope: scopeDo,
                        values: {},
                        init: statement
                    }
                    __G.map[scopeDo.raw] = _do_;
                }

                discoverInClass(__G, clazz, statement.body, scopeDo);
                break;
            }
            case 'RepeatStatement': {
                // Create the next unique name.
                const name = `repeat_${repeatIndex++}`;
                const scopeRepeat = getScope(__G, `${parentScope.raw}.${name}`, name, parentScope, 'block');
                // Check to see if the element exists already.
                let _repeat_ = __G.map[scopeRepeat.raw];
                if (!_repeat_) {
                    // Create repeat not defined yet in passing.
                    _repeat_ = {
                        type: 'ScopeRepeatBlock',
                        scope: scopeRepeat,
                        values: {},
                        init: statement
                    }
                    __G.map[scopeRepeat.raw] = _repeat_;
                }

                discoverInClass(__G, clazz, statement.body, scopeRepeat);
                break;
            }
            case 'IfStatement': {
                // Create the next unique name.
                const ifName = `if_${ifIndex++}`;
                const scopeIf = getScope(__G, `${parentScope.raw}.${ifName}`, ifName, parentScope, 'block');
                // Check to see if the element exists already.
                let ifElement = __G.map[scopeIf.raw];
                if (!ifElement) {
                    // Create if not defined yet in passing.
                    ifElement = {
                        type: 'ScopeIfBlock',
                        init: statement,
                        scope: scopeIf,
                        values: {}
                    };
                    __G.map[scopeIf.raw] = ifElement;
                }

                for (let index = 0; index < statement.clauses.length; index++) {
                    const clauseName = `clause_${index}`;
                    const clause = statement.clauses[index];
                    if (__G.map[`${scopeIf.raw}.${clauseName}`]) continue;
                    const scopeClause = getScope(__G, `${scopeIf.raw}.${clauseName}`, clauseName, parentScope, 'block');
                    let _clause_ = __G.map[scopeClause.raw];
                    if (!_clause_) {
                        _clause_ = {
                            type: 'ScopeIfClauseBlock',
                            scope: scopeClause,
                            values: {},
                            init: clause,
                        };
                        __G.map[scopeClause.raw] = _clause_;
                    }
                    discoverInClass(__G, clazz, clause.body, scopeClause);
                }
                break;
            }
            case 'ReturnStatement': {
                if (debug) {
                    console.log(`${returnStatementToString(statement)};`);
                }
                break;
            }
            case 'BreakStatement': {
                break;
            }
            case 'CallStatement': {
                break;
            }
            case 'GotoStatement': {
                break;
            }
            case 'LabelStatement': {
                break;
            }
            case 'FunctionDeclaration': {
                break;
            }
        }
    }

    return changes;
}

function passField(clazz: ScopeClass, __G: ScopeGlobal): number {

    let changes = 0;

    for (const methodName of Object.keys(clazz.methods)) {
        const method = clazz.methods[methodName];
        changes += discoverInClass(__G, clazz, method.init.body, method.scope);
    }

    return changes;
}

function passFunction(body: ast.Statement[], clazz: ScopeClass, __G: ScopeGlobal): void {
    for (const statement of body) {

        if (statement.type !== 'FunctionDeclaration') continue;

        // Check if assigned as a member declaration.
        if (statement.identifier == null) continue;
        if (statement.identifier.type !== 'MemberExpression') continue;

        // Check if method or function.
        let type: 'method' | 'function' = 'function';
        if (statement.identifier.indexer === ':') type = 'method';

        // Verify that the base assignment table is the class.
        if (statement.identifier.base.type !== 'Identifier') continue;
        if (statement.identifier.base.name !== clazz.name) continue;

        // Grab the function / method name.
        if (statement.identifier.identifier.type !== 'Identifier') continue;
        const funcName = statement.identifier.identifier.name;

        // Ignore constructor declaration.
        if (funcName === 'new') continue;

        const scopeFunc = getScope(__G, `${clazz.scope.raw}.${funcName}`, funcName, clazz.scope, 'function');

        // Alert any duplicate entries.
        if (__G.map[scopeFunc.raw]) {
            console.warn(`Global map already contains function: ${scopeFunc.raw} (Overriding with lower definition...)`);
        }

        const params: ScopeVariable[] = [];
        const returns: ScopeReturn = {
            type: 'ScopeReturn',
            types: []
        };
        const func: ScopeFunction = {
            type: 'ScopeFunction',
            scope: scopeFunc,
            params,
            values: {},
            returns,
            init: statement,
            references: {}
        };

        // Grab parameter names.
        for (const param of statement.parameters) {
            if (param.type !== 'Identifier') continue;
            const scopeParam = getScope(__G, `${scopeFunc.raw}.${param.name}`, param.name, scopeFunc, 'value');
            const p: ScopeVariable = {
                type: 'ScopeVariable',
                scope: scopeParam,
                name: param.name,
                types: [],
                references: {},
            };
            params.push(p);
            __G.map[scopeParam.raw] = p;
        }

        if (type === 'function') {
            clazz.funcs[funcName] = func;
        } else {
            clazz.methods[funcName] = func;
        }

        __G.map[scopeFunc.raw] = func;
    }
}

function passConstructor(body: ast.Statement[], clazz: ScopeClass, __G: ScopeGlobal): number {

    let changes = 0;

    let conzstructor: ast.FunctionDeclaration | undefined = undefined;
    const params: ScopeVariable[] = [];

    const conzstructorScope = getScope(__G, `${clazz.scope.raw}.constructor`, 'constructor', clazz.scope, 'function');

    // Alert any duplicate entries.
    if (__G.map[conzstructorScope.raw]) {
        console.warn(`Global map already contains constructor: ${conzstructorScope.raw} (Overriding with lower definition...)`);
    }

    let _statement: ast.FunctionDeclaration | undefined = undefined;

    for (const statement of body) {
        if (statement.type !== 'FunctionDeclaration') continue;
        // Check if assigned as a member declaration.
        if (statement.identifier == null) return changes;
        if (statement.identifier.type !== 'MemberExpression') return changes;

        // Verify that the base assignment table is the class.
        if (statement.identifier.base.type !== 'Identifier') return changes;
        if (statement.identifier.base.name !== clazz.name) return changes;

        // Grab the function / method name.
        if (statement.identifier.identifier.type !== 'Identifier') return changes;
        const funcName = statement.identifier.identifier.name;

        // Make sure that this is a constructor.
        if (funcName !== 'new') {
            continue;
        }

        _statement = statement;

        // Grab parameter names.
        for (const param of statement.parameters) {

            if (param.type !== 'Identifier') continue;

            const scopeParam = getScope(__G, `${conzstructorScope.raw}.${param.name}`, param.name, conzstructorScope, 'value');

            const _param_: ScopeVariable = {
                type: 'ScopeVariable',
                scope: scopeParam,
                name: param.name,
                types: [],
                references: {}
            };

            params.push(_param_);
            __G.map[scopeParam.raw] = _param_;
        }

        conzstructor = statement;
        break;
    }

    if (!conzstructor) return changes;

    let selfAlias = '';
    for (let index = conzstructor.body.length - 1; index >= 0; index--) {
        const statement = conzstructor.body[index];
        if (statement.type !== 'ReturnStatement') continue;

        const arg0 = statement.arguments[0];
        if (arg0.type !== 'Identifier') continue;

        selfAlias = arg0.name;
        break;
    }

    if (selfAlias === '') {
        console.warn('No known alias for "self" in constructor. Skipping reading its content(s)..');
        return changes;
    }

    let _constructor_ = __G.map[conzstructorScope.raw];
    if (!_constructor_) {
        _constructor_ = {
            type: 'ScopeConstructor',
            scope: conzstructorScope,
            params,
            init: _statement!,
            values: {},
            references: {},
            selfAlias
        };
        __G.map[conzstructorScope.raw] = _constructor_;
        clazz.conztructor = _constructor_;
        changes++;
    }

    for (const statement of conzstructor.body) {
        if (statement.type === 'AssignmentStatement') {
            const var0 = statement.variables[0];

            // Make sure the assignment is towards a member. (The class)
            if (var0.type !== 'MemberExpression') continue;
            if (var0.base.type !== 'Identifier') continue;

            // Proxies the className in constructor definitions.
            if (var0.base.name !== selfAlias) continue;

            const varName = var0.identifier.name;
            let varType: string = '';
            let defaultValue: any = undefined;

            if (!statement.init.length) continue;
            const init0 = statement.init[0];

            switch (init0.type) {
                case 'NumericLiteral': {
                    varType = 'number';
                    defaultValue = init0.value;
                    break;
                }
                case 'BooleanLiteral': {
                    varType = 'boolean';
                    defaultValue = init0.value;
                    break;
                }
                case 'StringLiteral': {
                    varType = 'string';
                    defaultValue = init0.value;
                    break;
                }
                case 'VarargLiteral': {
                    console.log('#################');
                    console.log('THIS IS A VARARG.');
                    console.log(init0);
                    console.log('#################');
                    varType = '';
                    defaultValue = init0.value;
                    break;
                }
                case 'NilLiteral': {
                    varType = 'nil';
                    defaultValue = init0.value;
                    break;
                }
            }

            // Check for possible duplicate.
            if (clazz!.fields[varName]) {
                console.warn(`Field already exists: ${clazz.name}.${varName}. Overriding with lower-most definition..`);
                delete clazz!.fields[varName];
            }

            const scopeField = getScope(__G, `${clazz.scope.raw}.${varName}`, varName, clazz.scope, 'field');

            // Alert any duplicate entries.
            if (__G.map[scopeField.raw]) {
                console.warn(`Global map already contains field: ${scopeField.raw} (Overriding with lower definition...)`);
            }

            if (!clazz.scope.children) clazz.scope.children = [];
            clazz.scope.children.push(scopeField);

            const field: ScopeVariable = {
                type: 'ScopeVariable',
                scope: scopeField,
                name: varName,
                init: statement,
                types: [],
                references: {}
            };

            if (varType.length) field.types.push(varType);

            clazz.fields[varName] = field;
            __G.map[scopeField.raw] = field;
        }
    }
    return changes;
}

function passClass(body: ast.Statement[], __G: ScopeGlobal): number {
    let changes = 0;
    for (const statement of body) {
        switch (statement.type) {
            case 'AssignmentStatement': {

                // Check for ISBaseObject (or subclass), and derive call signature.
                const init0 = statement.init[0];
                if (init0.type !== 'CallExpression') continue;
                if (init0.base.type !== 'MemberExpression') continue;
                if (init0.base.indexer !== ':') continue;
                if (init0.base.base.type !== 'Identifier') continue;
                if (init0.base.identifier.type !== 'Identifier') continue;
                if (init0.base.identifier.name !== 'derive') continue;

                // Check for class name here.
                const vars0 = statement.variables[0];
                if (vars0.type !== 'Identifier') continue;

                const className = vars0.name;
                const superClassName = init0.base.base.name;

                const classScope = getScope(__G, `__G.${className}`, className, __G.scope, 'class');

                // Alert any duplicate entries.
                // TODO - This might break things unintentionally but honestly this would be bad Lua code.
                if (__G.map[classScope.raw]) {
                    console.warn(`Global map already contains class: ${classScope.raw} (Overriding with lower definition...)`);
                }

                const scopeClass: ScopeClass = {
                    type: 'ScopeClass',
                    scope: classScope,
                    name: className,
                    conztructor: {
                        scope: getScope(__G, `__G.${className}.constructor`, 'constructor', classScope, 'function'),
                        type: 'ScopeConstructor',
                        values: {},
                        params: [],
                        references: {},
                        selfAlias: 'self'
                    },
                    fields: {},
                    values: {},
                    funcs: {},
                    methods: {},
                    references: {}
                };

                if (superClassName !== 'ISBaseObject') scopeClass.extendz = superClassName;

                changes += passConstructor(body, scopeClass, __G);
                passFunction(body, scopeClass, __G);
                passField(scopeClass, __G);

                __G.classes[className] = scopeClass;

                break;
            }
        }
    }

    return changes;
}

function pass(body: ast.Statement[], __G: ScopeGlobal): number {
    let changes = 0;

    for (const clazz of Object.values(__G.classes)) {
        changes += discoverInClass(__G, clazz, clazz.conztructor.init!.body, clazz.conztructor.scope, clazz.conztructor.selfAlias, true);

        for (const func of Object.values(clazz.funcs)) {
            changes += discoverInClass(__G, clazz, func.init.body, func.scope);
        }

        for (const method of Object.values(clazz.methods)) {
            changes += discoverInClass(__G, clazz, method.init.body, method.scope);
        }
    }

    return changes;
}

export function discover(body: ast.Statement[], __G: ScopeGlobal = newGlobalScope()): ScopeGlobal {

    /* (Initial Pass) */
    passClass(body, __G);
    for (const clazz of Object.values(__G.classes)) {
        passField(clazz, __G);
    }

    let changes = 0;
    let passes = 0;
    do {
        passes++;
        changes = pass(body, __G);
        console.log(`Pass ${passes}: ${changes} discoveries.`);
    } while (passes < 2 || changes !== 0);

    console.log(`__G.map.length = ${Object.keys(__G.map).length}`)

    console.log(__G.classes['ISUIElement'].conztructor.init);

    return __G;
}
