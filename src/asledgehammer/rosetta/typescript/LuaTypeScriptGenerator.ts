import { RosettaLuaClass } from "../lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../lua/RosettaLuaConstructor";
import { RosettaLuaField } from "../lua/RosettaLuaField";
import { RosettaLuaFunction } from "../lua/RosettaLuaFunction";

export function wrapAsTSFile(text: string): string {
    let s = '';
    s += `/** @noSelfInFile */\n`;
    s += `declare module '@asledgehammer/pipewrench'`;
    if (text.length) {
        return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
    }
    return `${s} {}\n`;
}

export function wrapAsTSNamespace(namespace: string, text: string): string {
    const s = `export namespace ${namespace}`;
    if (text.length) {
        return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
    }
    return `${s} {}\n`;
}

export function luaFieldToTS(
    field: RosettaLuaField,
    indent: number = 0,
    notesLength: number
): string {
    const i = ' '.repeat(indent * 4);
    let s = '';

    /* Documentation */
    let ds: string[] = [];
    // if (field.deprecated) ds.push('@deprecated');
    if (field.notes) {
        const notes: string[] = paginateNotes(field.notes, notesLength);
        if (ds.length) ds.push('');
        for (const line of notes) {
            ds.push(line);
        }
    }

    s = applyTSDocumentation(ds, s, indent);
    s += i;

    /* Definition-line */
    s += `${field.name}: ${tsType(field.type)};`;

    // Format documented variables as spaced for better legability.
    if (ds.length) s += '\n';

    return s;
}

export function luaConstructorToTS(
    con: RosettaLuaConstructor,
    indent: number,
    notesLength: number
): string {
    const i = ' '.repeat(indent * 4);
    const ds: string[] = luaConstructorDocumentation(con, notesLength);

    let ps = '';
    if (con.parameters && con.parameters.length) {
        ps += '(';
        for (const parameter of con.parameters) {
            ps += `${parameter.name}: ${tsType(parameter.type)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    let s = applyTSDocumentation(ds, '', indent);
    s += `${i}`;
    s += `constructor${ps};`;

    // Format documented variables as spaced for better legability.
    if (ds.length) s += '\n';

    return s;
}

export function luaConstructorDocumentation(
    con: RosettaLuaConstructor,
    notesLength: number,
): string[] {
    const ds: string[] = [];

    /* (Annotations) */
    // if (con.deprecated) ds.push('@deprecated');

    /* (Notes) */
    if (con.notes && con.notes.length) {
        if (ds.length) ds.push('');
        const notes: string[] = paginateNotes(con.notes, notesLength);
        for (const line of notes) ds.push(line);
    }

    /* (Parameters) */
    if (con.parameters && con.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of con.parameters) {
            if (param.notes && param.notes.length) {
                const notes: string[]
                    = paginateNotes(`@param ${param.name} ${param.notes}`, notesLength);
                for (const line of notes) ds.push(line);
            } else {
                ds.push(`@param ${param.name}`);
            }
        }
    }

    return ds;
}

export function luaMethodDocumentation(
    method: RosettaLuaFunction,
    notesLength: number,
    overload: boolean = false
): string[] {
    const ds: string[] = [];

    /* (Annotations) */
    if (overload) ds.push('@overload');
    if (method.deprecated) ds.push('@deprecated');

    /* (Notes) */
    if (method.notes && method.notes.length) {
        if (ds.length) ds.push('');
        const notes: string[] = paginateNotes(method.notes, notesLength);
        for (const line of notes) ds.push(line);
    }

    /* (Parameters) */
    if (method.parameters && method.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of method.parameters) {
            if (param.notes && param.notes.length) {
                const notes: string[]
                    = paginateNotes(`@param ${param.name} ${param.notes}`, notesLength);
                for (const line of notes) ds.push(line);
            } else {
                ds.push(`@param ${param.name}`);
            }
        }
    }

    /* (Returns) */
    if (method.returns && method.returns.notes && method.returns.notes.length) {
        if (ds.length) ds.push('');
        const notes: string[] = paginateNotes(`@returns ${method.returns.notes}`, notesLength);
        for (const line of notes) ds.push(line);
    }

    return ds;
}

export function luaFunctionToTS(
    method: RosettaLuaFunction,
    indent: number = 0,
    notesLength: number
): string {
    const i = ' '.repeat(indent * 4);
    const ds: string[] = luaMethodDocumentation(method, notesLength, false);

    let ps = '';
    if (method.parameters && method.parameters.length) {
        ps += '(';
        for (const parameter of method.parameters) {
            ps += `${parameter.name}: ${tsType(parameter.type)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    let s = applyTSDocumentation(ds, '', indent);
    s += `${i}`;
    s += `${method.name}${ps}: ${tsType(method.returns.type)};`;
    s += '\n';
    return s;
}

export function luaClassToTS(
    clazz: RosettaLuaClass,
    wrapFile: boolean = false
): string {
    let s = '';

    const valueNames = Object.keys(clazz.values);
    valueNames.sort((a, b) => a.localeCompare(b));

    const fieldNames = Object.keys(clazz.fields);
    fieldNames.sort((a, b) => a.localeCompare(b));

    const methodNames = Object.keys(clazz.methods);
    methodNames.sort((a, b) => a.localeCompare(b));

    const funcNames = Object.keys(clazz.functions);
    funcNames.sort((a, b) => a.localeCompare(b));

    const values: RosettaLuaField[] = [];
    const fields: RosettaLuaField[] = [];
    const funcs: RosettaLuaFunction[] = [];
    const methods: RosettaLuaFunction[] = [];

    /* (VALUES) */
    for (const valueName of valueNames) {
        const value = clazz.values[valueName];
        values.push(value);
    }

    /* (FIELDS) */
    for (const fieldName of fieldNames) {
        const field = clazz.fields[fieldName];
        fields.push(field);
    }

    /* (METHODS) */
    for (const methodName of methodNames) {
        const method = clazz.methods[methodName];
        methods.push(method);
    }

    /* (FUNCTIONS) */
    for (const funcName of funcNames) {
        const func = clazz.functions[funcName];
        funcs.push(func);
    }

    /** 100 
     * * -4 (module indent)
     * * -3 (' * ')
     */
    let notesLength = 96;
    if (wrapFile) notesLength -= 4;

    /* (Class Documentation) */
    const ds: string[] = [];
    ds.push(`@customConstructor ${clazz.name}:new`);
    ds.push('');
    ds.push(`Lua Class: ${clazz.name}`);
    if (clazz.notes && clazz.notes.length) {
        ds.push('');
        const lines = paginateNotes(clazz.notes, notesLength);
        for (const line of lines) ds.push(line);
    }
    s = applyTSDocumentation(ds, s, 0);

    s += `export class ${clazz.name} `;
    let i = '    ';
    let is = '';
    if (values.length) {
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* -------------- VALUES -------------- */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        for (const value of values) {
            is += `${luaFieldToTS(value, 1, notesLength)}\n`;
        }
        is = is.substring(0, is.length - 1);
    }

    if (fields.length) {
        if (is.length) is += '\n';
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* ------------- FIELDS --------------- */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        for (const field of fields) {
            is += `${luaFieldToTS(field, 1, notesLength)}\n`;
        }
        is = is.substring(0, is.length - 1);
    }

    if (methods.length) {
        if (is.length) is += '\n';
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* ------------- METHODS -------------- */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        for (const method of methods) {
            is += `${luaFunctionToTS(method, 1, notesLength)}\n`;
        }
        is = is.substring(0, is.length - 1);
    }

    if (funcs.length) {
        if (is.length) is += '\n';
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* ------------ FUNCTIONS ------------- */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        for (const func of funcs) {
            is += `${luaFunctionToTS(func, 1, notesLength)}\n`;
        }
        is = is.substring(0, is.length - 1);
    }

    if (clazz.constructor) {
        if (is.length) is += '\n';
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* ----------- CONSTRUCTOR ------------ */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        is += `${luaConstructorToTS(clazz.conztructor, 1, notesLength)}\n`;
        is = is.substring(0, is.length - 1);
    }

    if (is.length) {
        s += `{\n\n${is}}`;
    } else {
        s += `{}\n`;
    }

    if (wrapFile) return wrapAsTSFile(s);
    return s;
}

export function paginateNotes(notes: string, length: number): string[] {
    const split = notes?.split(' ');
    const result: string[] = [];
    let s = split[0]
    for (let i = 1; i < split.length; i++) {
        let word = split[i];
        if (s.length + word.length + 1 <= length) s = s + ' ' + word;
        else {
            result.push(s);
            s = word;
        }
    }
    if (s.length) result.push(s);
    return result
}

export function applyTSDocumentation(ds: string[], s: string, indent: number): string {
    const i = ' '.repeat(indent * 4);
    if (ds.length) {
        if (ds.length === 1) {
            s += `${i}/** ${ds[0]} */\n`;
        } else {
            s += `${i}/**\n`;
            s += ds.map((a) => `${i} * ${a}`).join('\n');
            s += `\n${i} */\n`;
        }
    }
    return s;
}

export function tsType(type: string): string {
    if (type.startsWith('fun(')) {
        // FIXME: Nested function calls won't work here.
        let t = type.substring(3);
        t = t.replace('):', ')=>');
        return t.trim();
    }
    return type;
}