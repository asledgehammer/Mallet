
import * as ast from 'luaparse';
// @ts-ignore
const luaparse: luaparse = ast.default;

export interface RenderOptions {
    indent: number;

    /** For literals, we may need to render the alternative to the raw value. */
    raw?: boolean;
};

export function indent(options: RenderOptions): RenderOptions {
    return { ...options, indent: options.indent + 1 };
}

export function literalToString(literal: ast.BooleanLiteral | ast.NumericLiteral | ast.NilLiteral | ast.StringLiteral | ast.VarargLiteral, options: RenderOptions = { indent: 0 }): string {
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

export function identifierToString(identifier: ast.Identifier, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${identifier.name}`;
}

export function indexExpressionToString(expression: ast.IndexExpression, options: RenderOptions = { indent: 0 }): string {
    return `${expressionToString(expression.base)}[${expressionToString(expression.index)}]`;
}

export function logicalExpressionToString(expression: ast.LogicalExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
}

export function unaryExpressionToString(expression: ast.UnaryExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expression.operator} ${expressionToString(expression.argument)}`;
}

export function stringCallExpressionToString(expression: ast.StringCallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const base = expressionToString(expression.base);
    const arg = expressionToString(expression.argument);
    console.log(expression);
    return `${i}${base} ${arg}`;
}

export function tableCallExpressionToString(expression: ast.TableCallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    console.log(expression);
    throw new Error('Not implemented.');
}

export function binaryExpressionToString(expression: ast.BinaryExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
}

export function argsToString(args2: ast.Expression[], options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of args2) args.push(expressionToString(arg));
    return `${i}${args.join(', ')}`;
}

export function memberExpressionToString(expression: ast.MemberExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${expressionToString(expression.base)}${expression.indexer}${expression.identifier.name}`;
}

export function callExpressionToString(expression: ast.CallExpression, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${expressionToString(expression.base)}(${argsToString(expression.arguments)})`;
}

export function returnStatementToString(statement: ast.ReturnStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const args: string[] = [];
    for (const arg of statement.arguments) args.push(expressionToString(arg));
    return `${i}return${args.length ? ` ${args.join(', ')}` : ''}`;
}

export function gotoStatementToString(statement: ast.GotoStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}goto $${statement.label}`;
}

export function labelStatementToString(statement: ast.LabelStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}::${statement.label}::`;
}

export function breakStatementToString(statement: ast.BreakStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}break`;
}

export function localStatementToString(statement: ast.LocalStatement, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);

    // The local name(s).
    const vars: string[] = [];
    for (const _var_ of statement.variables) vars.push(_var_.name);

    // The value(s) to set.
    const inits: string[] = [];
    for (const i of statement.init) inits.push(expressionToString(i));

    let s = '';

    // Main line.
    s += `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
    return s;
}

export function varargLiteralToString(param: ast.VarargLiteral, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    return `${i}${param.raw}`;
}

export function parametersToString(params: (ast.Identifier | ast.VarargLiteral)[], options: RenderOptions = { indent: 0 }): string {
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

export function bodyToString(body: ast.Statement[], options: RenderOptions = { indent: 0 }): string {
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
        s += `${leadingNewline ? '\n' : ''}${statementToString(currStatement, options)}${endingSemicolon ? ';' : ''}\n${endingNewline ? '\n' : ''}`;
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
export function functionDeclarationToString(func: ast.FunctionDeclaration, options: RenderOptions = { indent: 0 }): string {
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
                name = memberExpressionToString(func.identifier);
                break;
            }
        }
    }

    /* (Build the function's declaration) */
    let s = `${i}${func.isLocal ? 'local ' : ''}function${name && name.length ? ` ${name}` : ''}(${parametersToString(func.parameters)})`;

    // Only render multi-line functions if its body is populated.
    if (func.body.length) {
        s += '\n';
        s += `${bodyToString(func.body, options2)}\n`;
        s += `${i}end`;
    } else {
        s += ' end';
    }

    return s;
}

export function whileStatementToString(statement: ast.WhileStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}while ${expressionToString(statement.condition)} do\n`;
    s += `${bodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function doStatementToString(statement: ast.DoStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}do\n`;
    s += `${bodyToString(statement.body), options2}\n`;
    s += `${i}end`;
    return s;
}

export function repeatStatementToString(statement: ast.RepeatStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}repeat\n`;
    s += `${bodyToString(statement.body, options2)}\n`;
    s += `${i}until ${statement.condition};`;
    return s;
}

export function forNumericStatementToString(statement: ast.ForNumericStatement, options: RenderOptions): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}for ${expressionToString(statement.start)}, ${expressionToString(statement.end)}`;
    if (statement.step) s += `, ${expressionToString(statement.step)}`; // (Optional 3rd step argument)
    s += `\n${bodyToString(statement.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function forGenericStatementToString(statement: ast.ForGenericStatement, options: RenderOptions): string {
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

export function ifClauseToString(clause: ast.IfClause, isLastClause: boolean, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}if ${expressionToString(clause.condition)} then\n`;
    s += `${bodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

export function elseIfClauseToString(clause: ast.ElseifClause, isLastClause: boolean, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}elseif ${expressionToString(clause.condition)} then\n`;
    s += `${bodyToString(clause.body, options2)}\n`;
    if (isLastClause) s += `${i}end`;
    return s;
}

export function elseClauseToString(clause: ast.ElseClause, options: RenderOptions = { indent: 0 }): string {
    const i = ' '.repeat(options.indent * 4);
    const options2 = indent(options);
    let s = `${i}else\n`;
    s += `${bodyToString(clause.body, options2)}\n`;
    s += `${i}end`;
    return s;
}

export function ifStatementToString(statement: ast.IfStatement, options: RenderOptions = { indent: 0 }): string {
    let s = '';
    for (let index = 0; index < statement.clauses.length; index++) {
        const isLastClause = index === statement.clauses.length - 1;
        const clause = statement.clauses[index];
        switch (clause.type) {
            case 'IfClause': {
                s += `${ifClauseToString(clause, isLastClause, options)}`;
                break;
            }
            case 'ElseifClause': {
                s += `${elseIfClauseToString(clause, isLastClause, options)}`;
                break;
            }
            case 'ElseClause': {
                s += `${elseClauseToString(clause, options)}`
                break;
            }
        }
    }
    return s;
}

export function tableConstructorExpressionToString(expression: ast.TableConstructorExpression, options: RenderOptions = { indent: 0 }): string {
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
                entries.push(`${field.key.name} = ${expressionToString(field.value)}`);
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

export function assignmentStatementToString(statement: ast.AssignmentStatement, options: RenderOptions = { indent: 0 }): string {
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

export function callStatementToString(statement: ast.CallStatement, options: RenderOptions): string {
    switch (statement.expression.type) {
        case 'CallExpression': return callExpressionToString(statement.expression, options);
        case 'StringCallExpression': return stringCallExpressionToString(statement.expression, options);
        case 'TableCallExpression': return tableCallExpressionToString(statement.expression, options);
    }
}

export function expressionToString(arg: ast.Expression, options: RenderOptions = { indent: 0 }): string {
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

export function statementToString(statement: ast.Statement, options: RenderOptions = { indent: 0 }): string {
    switch (statement.type) {
        case 'LocalStatement': return localStatementToString(statement, options);
        case 'CallStatement': return callStatementToString(statement, options);
        case 'AssignmentStatement': return assignmentStatementToString(statement, options);
        case 'ReturnStatement': return returnStatementToString(statement, options);
        case 'IfStatement': return ifStatementToString(statement, options);
        case 'ForNumericStatement': return forNumericStatementToString(statement, options);
        case 'ForGenericStatement': return forGenericStatementToString(statement, options);
        case 'BreakStatement': return breakStatementToString(statement, options);
        case 'WhileStatement': return whileStatementToString(statement, options);
        case 'RepeatStatement': return repeatStatementToString(statement, options);
        case 'DoStatement': return doStatementToString(statement, options);
        case 'FunctionDeclaration': return functionDeclarationToString(statement, options);
        case 'LabelStatement': return labelStatementToString(statement, options);
        case 'GotoStatement': return gotoStatementToString(statement, options);
    }
}

export function chunkToString(chunk: ast.Chunk, options: RenderOptions = { indent: 0 }): string {
    let s = '';

    console.log({ chunk });

    for (let index = 0; index < chunk.body.length; index++) {
        const currStatement = chunk.body[index + 0];
        const nextStatement = chunk.body[index + 1];

        switch (currStatement.type) {
            case 'FunctionDeclaration': {
                s += `\n${statementToString(currStatement, options)}\n`;
                break;
            }
            case 'AssignmentStatement': {
                s += `${assignmentStatementToString(currStatement, options)};\n`;
                break;
            }
            case 'LabelStatement':
            case 'BreakStatement':
            case 'GotoStatement':
            case 'ReturnStatement':
            case 'IfStatement':
            case 'WhileStatement':
            case 'DoStatement':
            case 'RepeatStatement':
            case 'LocalStatement': {
                s += `${statementToString(currStatement, options)}\n`;
                break;
            }

            case 'CallStatement': {
                const callStatement = currStatement as ast.CallStatement;
                s += `${callStatementToString(callStatement, options)};\n`;

                // Clean seperation from `require` lines.
                if (nextStatement?.type !== 'CallStatement') {
                    s += '\n';
                }

                break;
            }
            case 'ForNumericStatement':
            case 'ForGenericStatement':
                s += `${statementToString(currStatement, options)}\n`;
                break;
        }
    }

    return s;
}