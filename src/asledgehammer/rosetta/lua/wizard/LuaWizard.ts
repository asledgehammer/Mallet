import * as ast from 'luaparse';

export type MethodReferenceType = 'void'
    | 'nil'
    | 'boolean'
    | 'number'
    | 'string'
    | 'table';

export const knownMethodTypes: { [path: string]: string[] } = {
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

export interface ScopeVariable extends Base<'ScopeVariable'> {

    /** The name of the variable in Lua code. */
    name: string;

    /** All type(s) discovered for the variable. */
    types: string[];

    /** The luaparse AST object. */
    init: ast.Statement;

    /** Any references to this variable so when the types are discovered they'll be linked to the same type(s). */
    references: { [scopeRaw: string]: ScopeReference };

    /** Any assignments of this variable to a variable or table. */
    assignments: { [path: string]: ScopeReference };
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
};

export interface ScopeConstructor extends ScopeBase<'ScopeConstructor'> {
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
    | ScopeConstructor;

export type ScopeReferenceable = ScopeVariable
    | ScopeFunction
    | ScopeConstructor
    | ScopeTable
    | ScopeClass;
