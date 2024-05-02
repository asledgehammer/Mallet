import * as ast from 'luaparse';

export type MethodReferenceType = 'void'
    | 'nil'
    | 'boolean'
    | 'number'
    | 'string'
    | 'table';

export const knownTypes: { [path: string]: string } = {
    'math.min()': 'number',
    'math.max()': 'number',
    'math.floor()': 'number',
    'math.ceil()': 'number',
    'math.round()': 'number',

    /* PZ Java API */
    'getCore():getScreenWidth()': 'number',
    'getCore():getScreenHeight()': 'number',
    'getNumActivePlayers()': 'number',
    'getPlayerScreenLeft()': 'number',
    'getPlayerScreenTop()': 'number',
    'getPlayerScreenWidth()': 'number',
    'getPlayerScreenHeight()': 'number',
};

export function getKnownType(known: string): string | undefined {
    if (!known.length) return undefined;

    let strippedKnown = known;

    // If this is a call-expression, strip every parameter out.
    if (known.indexOf('(') !== -1) {

        ///////////////
        // Sanity-check
        ///////////////

        let openings = 0;
        let closings = 0;
        for (const c of known) {
            if (c === '(') openings++;
            else if (c === ')') closings++;
        }
        if (openings !== closings) {
            throw new Error(`The known string has an uneven amount of '(' and ')'. (known: ${known})`);
        }

        ///////////////

        // Remove any parameters from the top-level down to match the string name.
        strippedKnown = '';
        // Keeps track of the depth of parameters we're in.
        let inParam = 0;
        for (let index = 0; index < known.length; index++) {
            let c0 = known[index + 0];
            if (inParam > 0) {
                if (c0 === ')') {
                    inParam--;
                    if (inParam === 0) strippedKnown += ')';
                } else if (c0 === '(') inParam++;
                continue;
            } else if (c0 === '(') {
                inParam++;
                if (inParam === 1) strippedKnown += '(';
            }
            strippedKnown += c0;
        }
    }

    return knownTypes[strippedKnown];
}

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

export interface ScopeVariable extends Base<'ScopeVariable'> {

    /** The name of the variable in Lua code. */
    name: string;

    /** All type(s) discovered for the variable. */
    types: string[];

    /** The luaparse AST object. */
    init: ast.Statement | ast.Expression;

    /** For tuples. Otherwise, 0. */
    index: number;

    /** Any references to this variable so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this variable to a variable or table. */
    assignments: { [path: string]: ScopeReference };

    defaultValue?: string;
}

export interface ScopeAssignment extends Base<'ScopeAssignment'> {

    /** The luaparse AST object. */
    init: ast.AssignmentStatement;
}

export interface ScopeReturn extends Base<'ScopeReturn'> {
    types: string[];

    /** The luaparse AST object. */
    init?: ast.ReturnStatement;
}

export interface ScopeGoto extends Base<'ScopeGoto'> {
    label: string;

    /** The luaparse AST object. */
    init?: ast.GotoStatement;
}

export interface ScopeLabel extends Base<'ScopeLabel'> {
    name: string;

    /** The luaparse AST object. */
    init?: ast.LabelStatement;
}

export interface ScopeBreak extends Base<'ScopeBreak'> {
    /** The luaparse AST object. */
    init?: ast.BreakStatement;
}

export interface ScopeBlock<TType extends string> extends Base<TType> {
    values: { [name: string]: ScopeVariable };
}

export interface ScopeForGenericBlock extends ScopeBlock<'ScopeForGenericBlock'> {
    /** The luaparse AST object. */
    init: ast.ForGenericStatement;
}

export interface ScopeForNumericBlock extends ScopeBlock<'ScopeForNumericBlock'> {
    /** The luaparse AST object. */
    init: ast.ForNumericStatement;
}

export interface ScopeWhileBlock extends ScopeBlock<'ScopeWhileBlock'> {
    /** The luaparse AST object. */
    init: ast.WhileStatement;
}

export interface ScopeDoBlock extends ScopeBlock<'ScopeDoBlock'> {
    /** The luaparse AST object. */
    init: ast.DoStatement;
}

export interface ScopeIfBlock extends ScopeBlock<'ScopeIfBlock'> {
    /** The luaparse AST object. */
    init: ast.IfStatement;
}

export interface ScopeIfClauseBlock extends ScopeBlock<'ScopeIfClauseBlock'> {
    /** The luaparse AST object. */
    init: ast.IfClause | ast.ElseifClause | ast.ElseClause;
}

export interface ScopeRepeatBlock extends ScopeBlock<'ScopeRepeatBlock'> {
    /** The luaparse AST object. */
    init: ast.RepeatStatement;
}

export interface ScopeFunction extends Base<'ScopeFunction'> {

    name?: string;

    values: { [name: string]: ScopeVariable };
    params: ScopeVariable[];
    returns: ScopeReturn;

    /** The luaparse AST object. */
    init: ast.FunctionDeclaration;

    /** Any references to this function so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this function to a variable or table. */
    assignments: { [path: string]: ScopeReference };

    selfAlias: string;
};

export interface ScopeConstructor extends Base<'ScopeConstructor'> {
    values: { [name: string]: ScopeVariable };
    params: ScopeVariable[];

    /** The luaparse AST object. */
    init: ast.FunctionDeclaration;

    /** This is the aliased table object that is returned as 'self' when constructing a class. */
    selfAlias: string;

    /** Any references to this constructor so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this constructor to a variable or table. */
    assignments: { [path: string]: ScopeReference };
};

export interface ScopeTable extends ScopeBase<'ScopeTable'> {
    name: string;
    values: { [name: string]: ScopeVariable };
    funcs: { [name: string]: ScopeFunction };

    /** Any references to this table so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this table to a variable or table. */
    assignments: { [path: string]: ScopeReference };
};

export interface ScopeClass extends Base<'ScopeClass'> {
    name: string;
    extendz?: ScopeClass | string;
    conztructor?: ScopeConstructor;
    values: { [name: string]: ScopeVariable };
    fields: { [name: string]: ScopeVariable };
    funcs: { [name: string]: ScopeFunction };
    methods: { [name: string]: ScopeFunction };

    /** Any references to this class so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this class to a variable or table. */
    assignments: { [path: string]: ScopeReference };
};

export type ScopeElement =
    ScopeVariable
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
    | ScopeConstructor
    | ScopeReturn
    | ScopeGoto
    | ScopeLabel
    | ScopeBreak
    | ScopeAssignment
    ;

export type ScopeReferenceable = ScopeVariable
    | ScopeFunction
    | ScopeConstructor
    | ScopeTable
    | ScopeClass;
