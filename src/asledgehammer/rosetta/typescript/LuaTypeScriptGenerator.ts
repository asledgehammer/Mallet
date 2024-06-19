import { RosettaLuaClass } from "../lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../lua/RosettaLuaConstructor";
import { RosettaLuaField } from "../lua/RosettaLuaField";
import { RosettaLuaFunction } from "../lua/RosettaLuaFunction";
import { RosettaLuaTable } from "../lua/RosettaLuaTable";
import { RosettaLuaTableField } from "../lua/RosettaLuaTableField";
import { applyTSDocumentation, paginateNotes, wrapAsTSFile } from "./TSUtils";

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
    s += `${field.name}: ${tsType(field.type, field.nullable)};`;

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
        for (const param of con.parameters) {
            ps += `${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    let fs = `${i}constructor${ps};`;
    if (fs.length > notesLength) {
        fs = `${i}constructor(\n`;
        for (const param of con.parameters) {
            fs += `${i}    ${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, \n`;
        }
        fs += `${i});`;
    }

    return applyTSDocumentation(ds, '', indent) + fs + '\n';


    // let s = applyTSDocumentation(ds, '', indent);
    // s += `${i}`;
    // s += `constructor${ps};`;

    // // Format documented variables as spaced for better legability.
    // if (ds.length) s += '\n';

    // return s;
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
        for (const param of method.parameters) {
            ps += `${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    const rs = tsType(method.returns.type, method.returns.nullable);

    let mName = method.name;
    if(mName === '__toString__') mName = 'toString';

    let fs = `${i}${mName}${ps}: ${rs};`;
    if (fs.length > notesLength) {
        fs = `${i}${mName}(\n`;
        for (const param of method.parameters) {
            fs += `${i}    ${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, \n`;
        }
        fs += `${i}): ${rs};`;
    }

    return applyTSDocumentation(ds, '', indent) + fs + '\n';
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
        const cluster = clazz.methods[methodName];
        for(const method of cluster.functions) {
            methods.push(method);
        }
    }

    /* (FUNCTIONS) */
    for (const funcName of funcNames) {
        const cluster = clazz.functions[funcName];
        for(const func of cluster.functions) {
            funcs.push(func);
        }
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

    if (clazz.constructors) {
        if (is.length) is += '\n';
        is += `${i}/* ------------------------------------ */\n`;
        is += `${i}/* ----------- CONSTRUCTORS ----------- */\n`;
        is += `${i}/* ------------------------------------ */\n`;
        is += '\n';
        for(const cons of clazz.constructors) {
            is += `${luaConstructorToTS(cons, 1, notesLength)}\n`;
        }
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

export function luaTableToTS(
    table: RosettaLuaTable,
    wrapFile: boolean = false
): string {
    let s = '';

    const fieldNames = Object.keys(table.fields);
    fieldNames.sort((a, b) => a.localeCompare(b));

    const funcNames = Object.keys(table.functions);
    funcNames.sort((a, b) => a.localeCompare(b));

    const fields: RosettaLuaField | RosettaLuaTableField[] = [];
    const funcs: RosettaLuaFunction[] = [];

    /* (FIELDS) */
    for (const fieldName of fieldNames) {
        const field = table.fields[fieldName];
        fields.push(field);
    }

    /* (FUNCTIONS) */
    for (const funcName of funcNames) {
        const func = table.functions[funcName];
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
    ds.push(`Lua Table: ${table.name}`);
    if (table.notes && table.notes.length) {
        ds.push('');
        const lines = paginateNotes(table.notes, notesLength);
        for (const line of lines) ds.push(line);
    }
    s = applyTSDocumentation(ds, s, 0);

    s += `export class ${table.name} `;
    let i = '    ';
    let is = '';

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

    if (is.length) {
        s += `{\n\n${is}}`;
    } else {
        s += `{}\n`;
    }

    if (wrapFile) return wrapAsTSFile(s);
    return s;
}

export function tsType(type: string, nullable: boolean): string {

    if (type === '') {
        return nullable ? 'null' : '';
    }

    const wrapped = type[0] === '(' && type[type.length - 1] === ')';

    if (wrapped) {
        type = type.substring(1, type.length - 2);
    }

    let result = type;
    if (type == 'nil') {
        result = 'null';
    } else if (type.startsWith('table<')) {
        result = luaTableToTSDict(type);
    } else if (type.startsWith('table')) {
        result = 'any';
    } else if (type.startsWith('fun(')) {
        result = luaFuncToTSFunc(type);
    }

    if (nullable) {
        result = result + ' | null';
    }

    return wrapped ? `(${result})` : result;
}

export function luaTableToTSDict(raw: string): string {
    if (!raw.startsWith('table<')) {
        throw new Error('The table is invalid: ' + raw);
    }
    let result = '';

    if (raw.indexOf('<') === -1 || raw.indexOf('>') === -1) {
        result = 'any';
    } else {
        let temp = raw.substring(raw.indexOf('<'));
        temp = temp.substring(1, temp.indexOf('>'));
        if (temp.indexOf(',') === -1) {
            result = 'any';
        } else {
            const split = temp.split(',').map((s) => s.trim());
            if (split.length !== 2) {
                result = 'any';
            } else {
                if (split[0] !== 'number' && split[0] !== 'string') {
                    result = 'any';
                } else {
                    result = `{[key: ${split[0]}]: ${tsType(split[1], false)}}`;
                }
            }
        }
    }

    return result;
}

export function luaFuncToTSFunc(raw: string): string {
    if (!raw.startsWith('fun(')) {
        throw new Error('The function is invalid: ' + raw);
    }

    let lastRetIndex = raw.length - 1;
    while (raw[lastRetIndex] !== ':') {
        lastRetIndex--;
        if (lastRetIndex <= 0) {
            throw new Error('The function is invalid: ' + raw);
        }
    }

    const rType = tsType(raw.substring(lastRetIndex + 1).trim(), false);

    let lastParamIndex = raw.length - 1;
    while (raw[lastParamIndex] !== ')') {
        lastParamIndex--;
        if (lastParamIndex <= 0) {
            throw new Error('The function is invalid: ' + raw);
        }
    }

    let inner = raw.substring(4, lastParamIndex);
    let params: string[] = [];
    if (inner !== '') {
        params = [];
        const _params = inner.indexOf(',') !== -1 ? inner.split(',').map((s) => s.trim()) : [inner.trim()];
        for (let param of _params) {
            let [name, type] = param.split(':').map((s) => s.trim());
            type = tsType(type, false);
            params.push(`${name}: ${type}`);
        }
    }

    return `(${params.join(', ')}) => ${rType}`;
}