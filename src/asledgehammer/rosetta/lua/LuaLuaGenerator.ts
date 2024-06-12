import { RosettaLuaClass } from "./RosettaLuaClass"
import { RosettaLuaConstructor } from "./RosettaLuaConstructor";
import { RosettaLuaField } from "./RosettaLuaField";
import { RosettaLuaFunction } from "./RosettaLuaFunction";
import { RosettaLuaParameter } from "./RosettaLuaParameter";
import { RosettaLuaTable } from "./RosettaLuaTable";
import { RosettaLuaTableField } from "./RosettaLuaTableField";

export function luaType(type: string, nullable: boolean): string {
    let result = type;
    if (nullable) {
        result += ' | nil';
    }
    return result;
}

export const generateLuaField = (field: RosettaLuaField | RosettaLuaTableField): string => {
    const notes = field.notes && field.notes.length ? field.notes.replace(/\n/g, '<br>') : '';
    return `--- @field ${field.name} ${luaType(field.type, field.nullable)} ${notes}`;
};

export const generateLuaValue = (containerName: string, field: RosettaLuaField | RosettaLuaTableField): string => {

    if (field.defaultValue) {
        let s = '';
        // Function Description
        if (field.notes && field.notes.length) {
            const notes = paginateNotes(field.notes, 100);
            for (const line of notes) {
                s += `--- ${line}\n`;
            }
        }
        let q = `${s}${containerName}.${field.name}`;
        let d = field.defaultValue;

        // Try parsing as a int.
        if (parseInt(d) == null && parseFloat(d) == null) {
            // String-wrapping with escaped double-quotes.
            d = `"${d.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
        }
        q += ` = ${d}`;
        return `${q};`;
    }

    return '';
};

export const generateLuaParameterBody = (params: RosettaLuaParameter[]): string => {
    let s = '';
    if (params.length) {
        for (const param of params) {
            s += `${param.name}, `;
        }
        s = s.substring(0, s.length - 2);
    }
    return `(${s})`;
};

export const generateLuaFunction = (className: string, operator: ':' | '.', func: RosettaLuaFunction): string => {

    let ds: string[] = [];

    // Function Description
    if (func.notes && func.notes.length) {
        const notes = paginateNotes(func.notes, 100);
        for (const line of notes) {
            ds.push(line);
        }
    }

    // Parameter Documentation
    if (func.parameters && func.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of func.parameters) {
            const pps = `@param ${param.name}${param.optional ? '?' : ''} ${luaType(param.type, param.nullable)}`;
            if (param.notes && param.notes.trim().length) {
                const notes = paginateNotes(pps + ' ' + param.notes.trim(), 100);
                for (const line of notes) {
                    ds.push(line);
                }
            } else {
                ds.push(pps);
            }
        }
    }

    // Returns Documentation
    if (func.returns) {
        if (ds.length) ds.push('');
        let rs = `@return ${luaType(func.returns.type, func.returns.nullable)}`;
        if (func.returns.notes && func.returns.notes.length) {
            rs += ' result';
            const notes = paginateNotes(rs + ' ' + func.returns.notes.trim(), 100);
            for (const line of notes) {
                ds.push(line);
            }
        } else {
            ds.push(rs);
        }
    }

    let fName = func.name;
    if(fName === '__toString__') fName = 'toString';


    let fs = `function ${className}${operator}${fName}${generateLuaParameterBody(func.parameters)} end`;
    if (fs.length > 100) {
        fs = `function ${className}${operator}${fName}(\n`;
        for (const parameter of func.parameters) {
            fs += `    ${parameter.name},\n`;
        }
        fs = fs.substring(0, fs.length - 2);
        fs += `\n) end`;
    }

    return `${applyLuaDocumentation(ds, 0)}${fs}`;
};

export const generateLuaConstructor = (className: string, con: RosettaLuaConstructor): string => {

    let ds: string[] = [];

    // Function Description
    if (con.notes && con.notes.length) {
        const notes = paginateNotes(con.notes, 100);
        for (const line of notes) {
            ds.push(line);
        }
    }

    // Parameter Documentation
    if (con.parameters && con.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of con.parameters) {
            const pps = `@param ${param.name}${param.optional ? '?' : ''}  ${luaType(param.type, param.nullable)}`;
            if (param.notes && param.notes.trim().length) {
                const notes = paginateNotes(pps + ' ' + param.notes.trim(), 100);
                for (const line of notes) {
                    ds.push(line);
                }
            } else {
                ds.push(pps);
            }
        }
    }

    let fs = `function ${className}:new${generateLuaParameterBody(con.parameters)} end`;
    if (fs.length > 100) {
        fs = `${className}:new(\n`;
        for (const parameter of con.parameters) {
            fs += `    ${parameter.name},\n`;
        }
        fs = fs.substring(0, fs.length - 2);
        fs += `\n) end`;
    }

    return `${applyLuaDocumentation(ds, 0)}${fs}`;
};

export const generateLuaClass = (clazz: RosettaLuaClass): string => {
    const ds: string[] = [];
    let s = '';

    // If the class has a description.
    if (clazz.notes && clazz.notes.length > 0) {
        const notes = paginateNotes(clazz.notes, 100);
        for (const line of notes) {
            ds.push(line);
        }
    }

    ds.push(`@class ${clazz.name}`);

    // Generate any value-comments in the class here.
    const valueNames = Object.keys(clazz.values);
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const value = clazz.values[valueName];
            ds.push(generateLuaField(value));
        }
    }

    // Generate any fields in the class here.
    const fieldNames = Object.keys(clazz.fields);
    if (fieldNames.length) {
        fieldNames.sort((a, b) => a.localeCompare(b));
        for (const fieldName of fieldNames) {
            const field = clazz.fields[fieldName];
            ds.push(generateLuaField(field));
        }
    }

    // NOTE: This is to keep flexability in Lua for adding custom properties to existing classes.
    if (clazz.mutable) {
        ds.push('@field [any] any');
    }

    s = applyLuaDocumentation(ds, 0);

    let sClass = 'ISBaseObject';
    if (clazz.extendz && clazz.extendz.length) {
        sClass = clazz.extendz.trim();
    }

    s += `${clazz.name} = ${sClass}:derive("${clazz.name}");\n\n`;

    // Generate any values in the class here.
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const value = clazz.values[valueName];
            const ss = generateLuaValue(clazz.name, value);
            if (ss.length) s += ss + '\n';
        }
        s += '\n';
    }

    s += generateLuaConstructor(clazz.name, clazz.conztructor) + '\n';

    // Generate any methods in the class here.
    const methodNames = Object.keys(clazz.methods);
    if (methodNames.length) {
        s += '\n';
        methodNames.sort((a, b) => a.localeCompare(b));
        for (const methodName of methodNames) {
            const method = clazz.methods[methodName];
            s += generateLuaFunction(clazz.name, ':', method) + '\n\n';
        }
    }

    // Generate any functions in the class here.
    const functionNames = Object.keys(clazz.functions);
    if (functionNames.length) {
        functionNames.sort((a, b) => a.localeCompare(b));
        for (const functionName of functionNames) {
            const func = clazz.functions[functionName];
            s += generateLuaFunction(clazz.name, '.', func) + '\n\n';
        }
    }

    return s;
}

export const generateLuaTable = (table: RosettaLuaTable): string => {
    const ds: string[] = [];
    let s = '';

    // If the class has a description.
    if (table.notes && table.notes.length > 0) {
        const notes = paginateNotes(table.notes, 100);
        for (const line of notes) {
            ds.push(line);
        }
    }

    ds.push(`@class ${table.name}: table<string, any>`);

    // Generate any value-comments in the class here.
    const valueNames = Object.keys(table.fields);
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const field = table.fields[valueName];
            ds.push(generateLuaField(field));
        }
    }

    // NOTE: This is to keep flexability in Lua for adding custom properties to existing classes.
    if (table.mutable) {
        ds.push('@field [any] any');
    }

    s = applyLuaDocumentation(ds, 0);

    s += `${table.name} = {};\n\n`;

    // Generate any values in the class here.
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const value = table.fields[valueName];
            const ss = generateLuaValue(table.name, value);
            if (ss.length) s += ss + '\n';
        }
        s += '\n';
    }

    // Generate any functions in the class here.
    const functionNames = Object.keys(table.functions);
    if (functionNames.length) {
        functionNames.sort((a, b) => a.localeCompare(b));
        for (const functionName of functionNames) {
            const func = table.functions[functionName];
            s += generateLuaFunction(table.name, '.', func) + '\n\n';
        }
    }

    return s;
};

export function paginateNotes(notes: string, length: number): string[] {

    function _line(line: string): string[] {
        const split = line?.trim().split(' ');
        const result: string[] = [];
        let s = split[0];
        for (let i = 1; i < split.length; i++) {
            let word = split[i];
            if (s.length + word.length + 1 <= length) {
                s = s + ' ' + word;
            } else {
                result.push(s);
                s = word;
            }
        }
        if (s.length) result.push(s);
        return result;
    }

    const res: string[] = [];
    const lines = notes.split('\n');
    for (const line of lines) {
        const subLines = _line(line);
        for (const subLine of subLines) {
            res.push(subLine);
        }
    }
    return res;
}

export function applyLuaDocumentation(ds: string[], indent: number): string {
    const i = ' '.repeat(indent * 4);
    let s = '';
    if (ds.length) {
        for (const next of ds) {
            if (!next.trim().startsWith('--- ')) s += `${i}--- `;
            s += `${next}\n`;
        }
    }
    return s;
}
