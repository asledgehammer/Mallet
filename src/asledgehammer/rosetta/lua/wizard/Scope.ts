import * as ast from 'luaparse';
import { ScopeElement } from './LuaWizard';
import { expressionToString, indexExpressionToString, localStatementToString } from './String';

/**
 * **Scope** is a class that stores scope-based information about Lua elements and their relationshop to other elements.
 * Data is used in this class to determine stronger types to assign to fields, returns, parameters, among other elements.
 * 
 * @author asledgehammer
 */
export class Scope {

    /** The element container. */
    readonly element: ScopeElement | undefined;

    /** The parent scope. If it doesn't exist, this scope is considered the root. */
    readonly parent?: Scope;

    /** Any child scopes. This is helpful with {@link Scope.resolve resolving scopes}. */
    readonly children: { [path: string]: Scope } = {};

    /** All discovered scopes that directly call or assign this scope. */
    readonly references: Scope[] = [];

    readonly types: string[] = [];

    /** For statements with multiple variables, this index helps with the initialization of Scopes. */
    readonly index: number = 0;

    /** Generated or identified when constructing Scopes. */
    readonly name: string = '';

    /** The full path of the scope. */
    readonly path: string;

    readonly map: { [path: string]: Scope };

    /////////////////////////////
    // These are for children. //
    /////////////////////////////

    private _nextMemberExpressionID: number = 0;
    private _nextBreakID: number = 0;
    private _nextGotoID: number = 0;
    private _nextReturnID: number = 0;
    private _nextIfID: number = 0;
    private _nextIfClauseID: number = 0;
    private _nextElseIfClauseID: number = 0;
    private _nextElseClauseID: number = 0;
    private _nextForNumericID: number = 0;
    private _nextForGenericID: number = 0;
    private _nextWhileID: number = 0;
    private _nextDoID: number = 0;
    private _nextRepeatID: number = 0;
    private _nextAnonFuncID: number = 0;
    private _nextCallID: number = 0;

    /////////////////////////////

    /**
     * @param element The element container.
     * @param parent The parent scope. (Set to null if root. E.G: __G is global root)
     * @param index For statements with multiple variables, this index helps target the right one.
     */
    constructor(element: ScopeElement | undefined = undefined, parent: Scope | undefined = undefined, index: number = 0, name: string | undefined = undefined) {
        this.element = element;
        this.parent = parent;

        if (name) {
            this.name = name;
        } else {
            this.name = this.generateName();
        }

        this.path = `${parent ? `${parent.path}.` : ''}${this.name}`;

        if (this.path === '__G.addChild') {
            // throw new Error();
        }

        this.index = index;

        // Assign the parent this new child.
        if (parent) {
            parent.addChild(this);
            this.addToRootMap(this);
        }

        // Forward any types.
        if(element && (element as any).types) {
            for(const type of (element as any).types) {
                this.types.push(type);
            }
        }

        this.map = {};
    }

    addChild(child: Scope) {

        // Add child to parent Scope.
        this.children[child.name] = child;
    }

    private addToRootMap(child: Scope) {
        // Add child to root Scope's map.
        let currScope: Scope | undefined = this;
        while (currScope.parent !== undefined) {
            currScope = currScope.parent;
        }
        currScope.map[child.path] = child;
    }

    /**
     * Resolves a scope from the top-level Scope.
     * 
     * @param path The absolute path to resolve.
     * @returns 
     */
    resolveAbsolute(path: string): Scope | undefined {

        // Replace the signifier for top-level Lua scope lookup.
        if (path.indexOf('__G.')) path = path.replace('__G.', '');

        // Get to the root Scope.
        let currScope: Scope = this;
        while (currScope.parent) currScope = currScope.parent;
        // Look inward like a relative Scope.
        return currScope.resolveInto(path);
    }

    resolve(path: string): Scope | undefined {
        if (!path.length) return undefined;

        const { parent } = this;

        // If __G is the start of the path, immediately go to the top and search down.
        // This is an absolute path, not a relative path.
        if (path.startsWith('__G.')) {
            path = path.replace('__G.', '');
            return this.resolveAbsolute(path);
        }

        // Check into the scope first. If something resolves, we're in the most immediate scope that contains the reference which is consistent with the
        // Lua language in scope-discovery when accessing a referenced variable in the most immediate scope.
        let child = this.resolveInto(path);
        if (child) return child;

        // Try to resolve in the next outer-scope. If one doesn't exist, the path does not resolve.
        return parent?.resolve(path);
    }

    /**
     * Search into the scope, going out-to-in.
     * 
     * @param path The path to traverse.
     * 
     * @returns Scope if found. undefined if not. 
     */
    private resolveInto(path: string): Scope | undefined {
        if (!path.length) return undefined;

        const { children } = this;

        let pathSub: string = '';
        let firstScope: string;

        // The path is made of multiple scopes.
        if (path.indexOf('.') !== -1) {
            // We grab the first node here and produce the sub-path following that node.
            let split: string[] = path.split('.');
            split = split.reverse();
            firstScope = split.pop()!;
            pathSub = split.reverse().join();
        } else {
            // We have one scope. The path is the scope.
            return children[path];
        }

        const child = children[firstScope];

        // The child doesn't exist.
        if (!child) return undefined;

        // We still have scope to traverse. Go to the child and then repeat the process until traversed.
        if (pathSub.length) return child.resolveInto(pathSub);

        // We've reached the last scope in the path and located the child. 
        return child;
    }

    private generateName(): string {
        const { element: e, parent } = this;
        if (!e) return '__G';
        if (!parent) throw new Error('A parent is required!');
        switch (e.type) {
            case 'ScopeVariable': {
                switch (e.init.type) {
                    case 'LocalStatement': {
                        return e.init.variables[this.index].name;
                    }
                    case 'AssignmentStatement': {
                        const variable = e.init.variables[this.index];
                        switch (variable.type) {
                            case 'Identifier': {
                                return variable.name;
                            }
                            case 'IndexExpression': {
                                return indexExpressionToString(variable);
                            }
                            case 'MemberExpression': {
                                const baseName = expressionToString(variable.base);
                                if (this.parent) {
                                    if (this.parent.element) {
                                        switch (this.parent.element.type) {
                                            case 'ScopeFunction': {
                                                if (this.parent.element.selfAlias === baseName) {
                                                    return `${this.parent.parent!.name}.${variable.identifier.name}`;
                                                }
                                                break;
                                            }
                                            case 'ScopeConstructor': {
                                                if (this.parent.element.selfAlias === baseName) {
                                                    return `${this.parent.parent!.name}.${variable.identifier.name}`;
                                                }
                                                break;
                                            }
                                            default: {
                                                break;
                                            }
                                        }
                                    }
                                }
                                return `${baseName}${variable.indexer}${variable.identifier.name}`;
                            }
                        }
                    }
                    default: {
                        console.warn(e);
                        throw new Error(`Unsupported statement for ScopeVariable name: ${e.init.type} `);
                    }
                }
            }
            case 'ScopeFunction': {
                // Named functions / methods.
                if (e.init.identifier) {
                    switch (e.init.identifier.type) {
                        case 'Identifier':
                            return e.init.identifier.name;
                        case 'MemberExpression':
                            return e.init.identifier.identifier.name;
                    }
                }
                // Anonymous functions.
                return parent?.nextAnonymousFunctionID();
            }
            case 'ScopeForGenericBlock': return parent.nextForGenericID();
            case 'ScopeForNumericBlock': return parent.nextForNumericID();
            case 'ScopeDoBlock': return parent.nextDoID();
            case 'ScopeWhileBlock': return parent.nextWhileID();
            case 'ScopeRepeatBlock': return parent.nextRepeatID();
            case 'ScopeIfBlock': return parent.nextIfID();
            case 'ScopeIfClauseBlock': return parent.nextIfClauseID();
            case 'ScopeTable': return e.name;
            case 'ScopeClass': return e.name;
            case 'ScopeConstructor': return 'new';
        }
    }

    private getStatementName(statement: ast.Statement): string {
        const { parent } = this;
        if (!parent) throw new Error('A parent is required!');
        switch (statement.type) {
            case 'LabelStatement': return statement.label.name;
            case 'BreakStatement': return parent.nextBreakID();
            case 'GotoStatement': return parent.nextGotoID();
            case 'ReturnStatement': return parent.nextReturnID();
            case 'IfStatement': return parent.nextIfID();
            case 'WhileStatement': return parent.nextWhileID();
            case 'DoStatement': return parent.nextDoID();
            case 'RepeatStatement': return parent.nextRepeatID();
            case 'LocalStatement': return statement.variables[this.index].name;
            case 'AssignmentStatement': return this.getExpressionName(statement.variables[this.index]);
            case 'CallStatement': return parent.nextCallID();
            case 'FunctionDeclaration': return parent.nextAnonymousFunctionID();
            case 'ForNumericStatement': return parent.nextForNumericID();
            case 'ForGenericStatement': return parent.nextForGenericID();
        }
    }

    private getExpressionName(expression: ast.Expression): string {
        if (expression.type === 'Identifier') return expression.name;
        switch (expression.type) {
            case 'IndexExpression': return this.getExpressionName(expression.base);
            case 'MemberExpression': return `${this.getExpressionName(expression.base)}${expression.indexer}${expression.identifier.name} `;
            default: {
                console.log(expression);
                throw new Error(`Unimplemented expression in 'Scope.getExpressionName(${expression.type}). (scope path: '${this.path} ') Check the line above for more info on the expression.`);
            }
        }
    }

    resetIDs() {
        this._nextMemberExpressionID = 0;
        this._nextCallID = 0;
        this._nextBreakID = 0;
        this._nextGotoID = 0;
        this._nextReturnID = 0;
        this._nextIfID = 0;
        this._nextIfClauseID = 0;
        this._nextElseIfClauseID = 0;
        this._nextElseClauseID = 0;
        this._nextForNumericID = 0;
        this._nextForGenericID = 0;
        this._nextWhileID = 0;
        this._nextDoID = 0;
        this._nextRepeatID = 0;
        this._nextAnonFuncID = 0;
    }

    addType(...types: string[]): number {
        let changes = 0;
        for (const type of types) {
            if (!this.hasType(type)) {
                this.types.push(type);
                changes++;
            }
        }
        return changes;
    }

    sortTypes(): void {
        this.types.sort((a, b) => a.localeCompare(b));
    }

    hasType(type: string): boolean {
        return this.types.indexOf(type) !== -1;
    }

    /** NOTE: Must be called from sub-scope! */
    nextMemberExpressionID(): string {
        return `___member_expression___${this._nextMemberExpressionID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextBreakID(): string {
        return `___break___${this._nextBreakID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextGotoID(): string {
        return `___goto___${this._nextGotoID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextReturnID(): string {
        return `___return___${this._nextReturnID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextIfID(): string {
        return `___if___${this._nextIfID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextIfClauseID(): string {
        return `___clause_if___${this._nextIfClauseID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextElseIfClauseID(): string {
        return `___clause_elseif___${this._nextElseIfClauseID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextElseClauseID(): string {
        return `___clause_else___${this._nextElseClauseID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextForNumericID(): string {
        return `___for_numeric___${this._nextForNumericID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextForGenericID(): string {
        return `___for_generic___${this._nextForGenericID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextWhileID(): string {
        return `___while___${this._nextWhileID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextDoID(): string {
        return `___do___${this._nextDoID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextRepeatID(): string {
        return `___repeat___${this._nextRepeatID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextAnonymousFunctionID(): string {
        return `___anonymous_function___${this._nextAnonFuncID++}`;
    }

    /** NOTE: Must be called from sub-scope! */
    nextCallID(): string {
        return `___call___${this._nextCallID++}`;
    }
}
