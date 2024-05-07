
import * as ast from 'luaparse';
import { Scope } from './Scope';
import { expressionToString, statementToString } from './String';
import { discoverType } from './Discover';
// @ts-ignore
const luaparse: luaparse = ast.default;

export interface ScopeRenderOptions {
    indent: number;

    scope: Scope;

    /** For literals, we may need to render the alternative to the raw value. */
    raw?: boolean;
};

export function indent(options: ScopeRenderOptions): ScopeRenderOptions {
    return { ...options, indent: options.indent + 1 };
}

export function indent0(options: ScopeRenderOptions): ScopeRenderOptions {
    return { ...options, indent: 0 };
}

/**
 * TODO - Implement key -> value table type(s).
 * 
 * @param ex 
 * @param options 
 * 
 * @returns The proper lua annotation type for the table constructor. 
 */
export function getTableConstructorType(ex: ast.TableConstructorExpression, options: ScopeRenderOptions): string {
    console.warn(ex);

    // Empty table constructor.
    if (!ex.fields.length) return 'table';


    let isArray = true;

    // Check to see if all fields are TableValue entries. If so, this is an array.
    for (const field of ex.fields) {
        if (field.type !== 'TableValue') {
            isArray = false;
            break;
        }
    }

    if (isArray) {
        // Discover & compile any discovered types in the array.
        const types: string[] = [];
        for (const field of ex.fields) {
            let type = discoverType(field.value, options.scope)?.type;
            if (!type) type = 'any';
            if (types.indexOf(type) === -1) types.push(type);
        }
        if (types.length > 1) { // E.G: (string|number)[]
            return `(${types.join('|')})[]`;
        } else {                // E.G: string[]
            return `${types[0]}[]`;
        }
    }

    return 'table';
}

export function scopeLiteralToString(literal: ast.BooleanLiteral | ast.NumericLiteral | ast.NilLiteral | ast.StringLiteral | ast.VarargLiteral, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    switch (literal.type) {
        // Simple raw-calls.
        case 'BooleanLiteral':
        case 'NumericLiteral':
        case 'NilLiteral': return `${i}${literal.raw}`;

        case 'StringLiteral': return (options.raw) ? `${i}${literal.value}` : `${i}${literal.raw}`;
        case 'VarargLiteral': {
            // TODO: Check validity.
            console.warn('VarargLiteral: ', literal);
            return `${i}${literal.raw}`;
        }
    }
}

export function scopeIdentifierToString(identifier: ast.Identifier, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${identifier.name}`;
}

export function scopeIndexExpressionToString(expression: ast.IndexExpression, options: ScopeRenderOptions): string {
    return `${scopeExpressionToString(expression.base, indent0(options))}[${scopeExpressionToString(expression.index, indent0(options))}]`;
}

export function scopeLogicalExpressionToString(expression: ast.LogicalExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${scopeExpressionToString(expression.left, indent0(options))} ${expression.operator} ${scopeExpressionToString(expression.right, indent0(options))}`;
}

export function scopeUnaryExpressionToString(expression: ast.UnaryExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expression.operator} ${scopeExpressionToString(expression.argument, indent0(options))}`;
}

export function scopeStringCallExpressionToString(expression: ast.StringCallExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const base = scopeExpressionToString(expression.base, indent0(options));
    const arg = scopeExpressionToString(expression.argument, indent0(options));
    console.log(expression);
    return `${i}${base} ${arg}`;
}

export function scopeTableCallExpressionToString(expression: ast.TableCallExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    console.log(expression);
    throw new Error('Not implemented.');
}

export function scopeBinaryExpressionToString(expression: ast.BinaryExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${scopeExpressionToString(expression.left, indent0(options))} ${expression.operator} ${scopeExpressionToString(expression.right, indent0(options))}`;
}

export function scopeArgsToString(args2: ast.Expression[], options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of args2) args.push(scopeExpressionToString(arg, indent0(options)));
    return `${i}${args.join(', ')}`;
}

export function scopeMemberExpressionToString(expression: ast.MemberExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${scopeExpressionToString(expression.base, indent0(options))}${expression.indexer}${expression.identifier.name}`;
}

export function scopeCallExpressionToString(expression: ast.CallExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${scopeExpressionToString(expression.base, indent0(options))}(${scopeArgsToString(expression.arguments, indent0(options))})`;
}

export function scopeReturnStatementToString(statement: ast.ReturnStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of statement.arguments) args.push(scopeExpressionToString(arg, indent0(options)));
    return `${i}return${args.length ? ` ${args.join(', ')}` : ''}`;
}

export function scopeGotoStatementToString(statement: ast.GotoStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}goto $${statement.label}`;
}

export function scopeLabelStatementToString(statement: ast.LabelStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}::${statement.label}::`;
}

export function scopeBreakStatementToString(statement: ast.BreakStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}break`;
}

export function scopeLocalStatementToString(statement: ast.LocalStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    // The local name(s).
    const vars: string[] = [];
    for (const _var_ of statement.variables) vars.push(_var_.name);

    // The value(s) to set.
    const inits: string[] = [];
    for (const i of statement.init) inits.push(expressionToString(i));

    let s = '';

    // Grab scopes.
    const scopes: (Scope | undefined)[] = [];
    for (let index = 0; index < inits.length; index++) {
        const varName = vars[index];
        const scopeVar = options.scope.resolve(varName);
        scopes.push(scopeVar);
    }

    s += `${i}--- @type `;
    for (let index = 0; index < scopes.length; index++) {
        const scopeInit = scopes[index];
        console.log(scopeInit);
        if (scopeInit) {
            if (scopeInit.types.length) {

                if (scopeInit.types.length === 1 && scopeInit.types[index] === 'table' && statement.init[index].type === 'TableConstructorExpression') {
                    s += `${getTableConstructorType(statement.init[index] as ast.TableConstructorExpression, indent0(options))}, `;
                } else {
                    s += `${scopeInit.types.join('|')}, `;
                }

            } else {
                s += 'any, ';
            }
        } else {
            s += 'any, ';
        }
    }
    if (s[s.length - 2] === ',' && s[s.length - 1] === ' ') s = s.substring(0, s.length - 2);
    s += '\n';

    // Main line.
    s += `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
    console.warn(s);
    return s;
}

export function scopeVarargLiteralToString(param: ast.VarargLiteral, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${param.raw}`;
}

export function scopeParametersToString(params: (ast.Identifier | ast.VarargLiteral)[], options: ScopeRenderOptions): string {
    const ps: string[] = [];
    for (const param of params) {
        switch (param.type) {
            case 'Identifier': {
                ps.push(scopeIdentifierToString(param, options));
                break;
            }
            case 'VarargLiteral': {
                ps.push(scopeVarargLiteralToString(param, options));
                break;
            }
        }
    }
    return ps.join(', ');
}

export function scopeBodyToString(body: ast.Statement[], options: ScopeRenderOptions): string {
    let s = '';

    for (let index = 0; index < body.length; index++) {
        const prevStatement = body[index - 1];
        const currStatement = body[index];
        const nextStatement = body[index + 1];
        // For cleaner separation of code.
        let endingSemicolon = true;
        let leadingNewline = false;
        let endingNewline = false;

        switch (currStatement.type) {
            case 'FunctionDeclaration': {
                endingSemicolon = false;
                // No blank spaces for the first line of a body.
                if (prevStatement) leadingNewline = true;
                // No blank spaces at the end of a body.
                if (nextStatement) endingNewline = true;
            }
            case 'IfStatement':
            case 'ForGenericStatement':
            case 'ForNumericStatement':
            case 'WhileStatement':
            case 'DoStatement':
            case 'RepeatStatement': {
                endingSemicolon = false;
                // No blank spaces at the end of a body.
                if (nextStatement) endingNewline = true;
                break;
            }
            case 'BreakStatement':
            case 'LabelStatement': {
                endingSemicolon = false;
                break;
            }
        }
        s += `${leadingNewline ? '\n' : ''}${scopeStatementToString(currStatement, options)}${endingSemicolon ? ';' : ''}\n${endingNewline ? '\n' : ''}`;
    }

    // Remove the last newline. (If present)
    if (s.length) s = s.substring(0, s.length - 1);

    return s;
}

/**
 * Renders a Lua function declaration as a string.
 * 
 * @param func The function to render.
 * @param options Passed options on indenting the code.
 * @returns The function rendered as a string.
 */
export function scopeFunctionDeclarationToString(func: ast.FunctionDeclaration, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);

    /* (If exists, generate the name of the function) */
    let name = '';
    if (func.identifier) {
        switch (func.identifier!.type) {
            case 'Identifier': {
                name = func.identifier.name;
                break;
            }
            case 'MemberExpression': {
                name = scopeMemberExpressionToString(func.identifier, indent0(options));
                break;
            }
        }
    }

    const scopeFunc = options.scope.resolve(name);
    let s = '';

    if (scopeFunc) {
        options2.scope = scopeFunc;
        const elemFunc: ast.FunctionDeclaration = scopeFunc.element as any;
        if (elemFunc) {
            s += '';

            // Generate params documentation.
            if (func.parameters.length) {
                if (s.length) s += `${i}---\n`;

                for (const param of func.parameters) {
                    let paramName: string = '';
                    switch (param.type) {
                        case 'Identifier': {
                            paramName = param.name;
                            break;
                        }
                        case 'VarargLiteral': {
                            paramName = param.value;
                            break;
                        }
                    }

                    const scopeParam = scopeFunc.resolve(paramName);
                    if (scopeParam) {
                        s += `${i}--- @param ${paramName} ${scopeParam.types.length ? scopeParam.types.join('|') : 'any'}\n`;
                    } else {
                        s += `${i}--- @param ${paramName} any\n`;
                    }
                }
            }

            // Generate returns documentation.
            if (scopeFunc.types.length) {
                if (s.length) s += `${i}---\n`;
                s += `${i}--- @return ${scopeFunc.types.join('|')}\n`;
            }
        }
    }

    /* (Build the function's declaration) */
    s += `${i}${func.isLocal ? 'local ' : ''}function${name && name.length ? ` ${name}` : ''}(${scopeParametersToString(func.parameters, indent0(options))})`;

    // Only render multi-line functions if its body is populated.
    if (func.body.length) {
        s += '\n';
        s += `${scopeBodyToString(func.body, options2)}\n`;
        s += `${i}end`;
    } else {
        s += ' end';
    }

    return s;
}

export function scopeWhileStatementToString(statement: ast.WhileStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}while ${scopeExpressionToString(statement.condition, indent0(options))} do\n`;
    s += `${scopeBodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function scopeDoStatementToString(statement: ast.DoStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}do\n`;
    s += `${scopeBodyToString(statement.body, indent0(options)), options2}\n`;
    s += `${i}end`;
    return s;
}

export function scopeRepeatStatementToString(statement: ast.RepeatStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}repeat\n`;
    s += `${scopeBodyToString(statement.body, options2)}\n`;
    s += `${i}until ${statement.condition};`;
    return s;
}

export function scopeForNumericStatementToString(statement: ast.ForNumericStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);

    // the numeric value can be a integer or float value, so use the type 'number'. 
    let s = `${i}--- @type number\n${i}for ${scopeIdentifierToString(statement.variable, indent0(options))} = ${scopeExpressionToString(statement.start, indent0(options))}, ${scopeExpressionToString(statement.end, indent0(options))}`;
    if (statement.step) s += `, ${scopeExpressionToString(statement.step, indent0(options))}`; // (Optional 3rd step argument)
    s += ` do\n${scopeBodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function scopeForGenericStatementToString(statement: ast.ForGenericStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    const vars: string[] = [];
    for (const variable of statement.variables) vars.push(variable.name);
    const iterate: string[] = [];
    for (const iterator of statement.iterators) iterate.push(scopeExpressionToString(iterator, indent0(options)));
    let s = `${i}for ${vars.join(', ')} in ${iterate.join(', ')} do\n`;
    s += `${scopeBodyToString(statement.body, options2)}\n`;
    s += 'end';
    return s;
}

export function scopeIfClauseToString(clause: ast.IfClause, isLastClause: boolean, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}if ${scopeExpressionToString(clause.condition, indent0(options))} then\n`;
    s += `${scopeBodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

export function scopeElseIfClauseToString(clause: ast.ElseifClause, isLastClause: boolean, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}elseif ${scopeExpressionToString(clause.condition, indent0(options))} then\n`;
    s += `${scopeBodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

export function scopeElseClauseToString(clause: ast.ElseClause, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}else\n`;
    s += `${scopeBodyToString(clause.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function scopeIfStatementToString(statement: ast.IfStatement, options: ScopeRenderOptions): string {
    let s = '';
    for (let index = 0; index < statement.clauses.length; index++) {
        const isLastClause = index === statement.clauses.length - 1;
        const clause = statement.clauses[index];
        switch (clause.type) {
            case 'IfClause': {
                s += `${scopeIfClauseToString(clause, isLastClause, options)}`;
                break;
            }
            case 'ElseifClause': {
                s += `${scopeElseIfClauseToString(clause, isLastClause, options)}`;
                break;
            }
            case 'ElseClause': {
                s += `${scopeElseClauseToString(clause, options)}`
                break;
            }
        }
    }
    return s;
}

export function scopeTableConstructorExpressionToString(expression: ast.TableConstructorExpression, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    // Empty table.
    if (!expression.fields.length) return `${i}{}`;

    const entries: string[] = [];
    for (const field of expression.fields) {
        switch (field.type) {
            case 'TableKey': {
                entries.push(`${scopeExpressionToString(field.key, indent0(options))} = ${scopeExpressionToString(field.value, indent0(options))}`);
                break;
            }
            case 'TableKeyString': {
                entries.push(`${field.key.name} = ${scopeExpressionToString(field.value, indent0(options))}`);
                break;
            }
            case 'TableValue': {
                entries.push(scopeExpressionToString(field.value, indent0(options)));
                break;
            }
        }
    }
    return `${i}{ ${entries.join(', ')} }`;
}

export function scopeAssignmentStatementToString(statement: ast.AssignmentStatement, options: ScopeRenderOptions): string {
    const i = ' '.repeat(options.indent * 4);

    // The local name(s).
    const vars: string[] = [];
    for (const _var_ of statement.variables) {
        switch (_var_.type) {
            case 'Identifier': {
                vars.push(scopeIdentifierToString(_var_, indent0(options)));
                break;
            }
            case 'IndexExpression': {
                vars.push(scopeIndexExpressionToString(_var_, indent0(options)));
                break;
            }
            case 'MemberExpression': {
                vars.push(scopeMemberExpressionToString(_var_, indent0(options)));
                break;
            }
        }
    }

    // The value(s) to set.
    const inits: string[] = [];
    for (const init of statement.init) inits.push(scopeExpressionToString(init, indent0(options)));

    return `${i}${vars.join(', ')} = ${inits.join(', ')}`;
}

export function scopeCallStatementToString(statement: ast.CallStatement, options: ScopeRenderOptions): string {
    console.log(statement);
    switch (statement.expression.type) {
        case 'CallExpression': return scopeCallExpressionToString(statement.expression, options);
        case 'StringCallExpression': return scopeStringCallExpressionToString(statement.expression, options);
        case 'TableCallExpression': return scopeTableCallExpressionToString(statement.expression, options);
    }
}

export function scopeExpressionToString(arg: ast.Expression, options: ScopeRenderOptions): string {
    switch (arg.type) {
        case 'BooleanLiteral': return scopeLiteralToString(arg, options);
        case 'NumericLiteral': return scopeLiteralToString(arg, options);
        case 'NilLiteral': return scopeLiteralToString(arg, options);
        case 'StringLiteral': return scopeLiteralToString(arg, options);
        case 'VarargLiteral': return scopeLiteralToString(arg, options);
        case 'Identifier': return scopeIdentifierToString(arg, options);
        case 'BinaryExpression': return scopeBinaryExpressionToString(arg, options);
        case 'CallExpression': return scopeCallExpressionToString(arg, options);
        case 'FunctionDeclaration': return scopeFunctionDeclarationToString(arg, options);
        // We.. might need to push 'options' instead. Not sure yet..
        case 'MemberExpression': return scopeMemberExpressionToString(arg, indent0(options));
        case 'IndexExpression': return scopeIndexExpressionToString(arg, indent0(options));
        case 'TableConstructorExpression': return scopeTableConstructorExpressionToString(arg, indent0(options));
        case 'LogicalExpression': return scopeLogicalExpressionToString(arg, indent0(options));
        case 'UnaryExpression': return scopeUnaryExpressionToString(arg, indent0(options));
        case 'StringCallExpression': return scopeStringCallExpressionToString(arg, indent0(options));
        case 'TableCallExpression': return scopeTableCallExpressionToString(arg, indent0(options));
    }
}

export function scopeStatementToString(statement: ast.Statement, options: ScopeRenderOptions): string {
    switch (statement.type) {
        case 'LocalStatement': return scopeLocalStatementToString(statement, options);
        case 'CallStatement': return scopeCallStatementToString(statement, options);
        case 'AssignmentStatement': return scopeAssignmentStatementToString(statement, options);
        case 'FunctionDeclaration': return scopeFunctionDeclarationToString(statement, options);
        case 'ReturnStatement': return scopeReturnStatementToString(statement, options);
        case 'IfStatement': return scopeIfStatementToString(statement, options);
        case 'ForNumericStatement': return scopeForNumericStatementToString(statement, options);
        case 'ForGenericStatement': return scopeForGenericStatementToString(statement, options);
        case 'BreakStatement': return scopeBreakStatementToString(statement, options);
        case 'WhileStatement': return scopeWhileStatementToString(statement, options);
        case 'RepeatStatement': return scopeRepeatStatementToString(statement, options);
        case 'DoStatement': return scopeDoStatementToString(statement, options);
        case 'LabelStatement': return scopeLabelStatementToString(statement, options);
        case 'GotoStatement': return scopeGotoStatementToString(statement, options);
    }
}

export function scopeChunkToString(chunk: ast.Chunk, options: ScopeRenderOptions): string {
    let s = '';

    console.log({ chunk });

    for (let index = 0; index < chunk.body.length; index++) {
        const currStatement = chunk.body[index + 0];
        const nextStatement = chunk.body[index + 1];

        switch (currStatement.type) {
            case 'LocalStatement': {
                s += `${scopeLocalStatementToString(currStatement, options)};\n`;
                break;
            }
            case 'FunctionDeclaration': {
                s += `\n${scopeStatementToString(currStatement, options)}\n\n`;
                break;
            }

            case 'AssignmentStatement': {
                s += `${scopeAssignmentStatementToString(currStatement, options)};\n`;
                break;
            }

            case 'LabelStatement':
            case 'BreakStatement':
            case 'GotoStatement':
            case 'ReturnStatement': {
                s += `${scopeStatementToString(currStatement, options)};\n`;
                break;
            }

            case 'IfStatement':
            case 'WhileStatement':
            case 'DoStatement':
            case 'ForNumericStatement':
            case 'ForGenericStatement':
            case 'RepeatStatement': {
                s += `${scopeStatementToString(currStatement, options)};\n\n`;
                break;
            }

            case 'CallStatement': {
                const callStatement = currStatement as ast.CallStatement;
                s += `${scopeStatementToString(callStatement, options)};\n`;
                break;
            }
            default: {
                s += `${statementToString(currStatement, options)};\n`;
                break;
            }
        }
    }

    return s;
}