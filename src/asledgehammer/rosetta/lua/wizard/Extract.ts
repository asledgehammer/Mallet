import * as ast from 'luaparse';
import { Scope } from './Scope';

export function extractReturnStatement(bag: Scope, statement: ast.ReturnStatement): number {
    let changes = 0;

    // Make sure we have something to return / discover.
    if (!statement.arguments.length) return changes;

    for (const arg of statement.arguments) {

    }

    return changes;
}

export function extractIfStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;

    

    return changes;
}

export function extractWhileStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractDoStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractRepeatStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractLocalStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractAssignmentStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractCallStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractFunctionDeclaration(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractForNumericStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractForGenericStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;



    return changes;
}

export function extractStatement(bag: Scope, statement: ast.Statement): number {
    let changes = 0;

    switch (statement.type) {

        // Nothing to discover.
        case 'LabelStatement':
        case 'BreakStatement':
        case 'GotoStatement':
            break;

        case 'ReturnStatement': {
            changes += extractReturnStatement(bag, statement);
            break;
        }
        case 'IfStatement': {
            changes += extractIfStatement(bag, statement);
            break;
        }
        case 'WhileStatement': {
            changes += extractWhileStatement(bag, statement);
            break;
        }
        case 'DoStatement': {
            changes += extractDoStatement(bag, statement);
            break;
        }
        case 'RepeatStatement': {
            changes += extractRepeatStatement(bag, statement);
            break;
        }
        case 'LocalStatement': {
            changes += extractLocalStatement(bag, statement);
            break;
        }
        case 'AssignmentStatement': {
            changes += extractAssignmentStatement(bag, statement);
            break;
        }
        case 'CallStatement': {
            changes += extractCallStatement(bag, statement);
            break;
        }
        case 'FunctionDeclaration': {
            changes += extractFunctionDeclaration(bag, statement);
            break;
        }
        case 'ForNumericStatement': {
            changes += extractForNumericStatement(bag, statement);
            break;
        }
        case 'ForGenericStatement': {
            changes += extractForGenericStatement(bag, statement);
            break;
        }
    }

    return changes;
}

export function extractChunk(bag: Scope, chunk: ast.Chunk): number {
    let changes = 0;

    for (let index = 0; index < chunk.body.length; index++) {
        const statement = chunk.body[index];
        changes += extractStatement(bag, statement);
    }

    return changes;
}
