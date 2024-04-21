import { RosettaLuaClass } from "./RosettaLuaClass"
import { RosettaLuaField } from "./RosettaLuaField";
import { RosettaLuaFunction } from "./RosettaLuaFunction";
import { RosettaLuaParameter } from "./RosettaLuaParameter";


export const generateLuaField = (field: RosettaLuaField): string => {
    return `--- @field ${field.name} ${field.type} ${field.notes ? field.notes : ''}`;
};

export const generateLuaValue = (containerName: string, field: RosettaLuaField): string => {
    return `${containerName}.${field.name} = ${field.defaultValue != null ? field.defaultValue : 'nil'};`;
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

export const generateLuaMethod = (className: string, func: RosettaLuaFunction): string => {

    let s = '';

    // Function Description
    if (func.notes && func.notes.length) {
        const notes = func.notes.split('\n').join('\n--- ');
        s += `--- ${notes}\n--- \n`;
    }

    // Parameter Documentation
    if (func.parameters && func.parameters.length) {
        for (const param of func.parameters) {
            s += `--- @param ${param.name}`;

            if (param.type && param.type.trim().length) {
                s += ` ${param.type}`;
            }

            if (param.notes && param.notes.trim().length) {
                s += ` ${param.notes}`;
            }

            s += `\n`;
        }
    }

    if (func.parameters && func.parameters.length && func.returns) {
        s += '--- \n';
    }

    // Returns Documentation
    if (func.returns) {
        s += `--- @return ${func.returns.type}`;
        if (func.returns.notes && func.returns.notes.length) {
            s += ` ${func.returns.notes.split('\n').join(' ')}\n`;
        }
    }

    if (s.length) s += '\n';
    s += `function ${className}:${func.name}${generateLuaParameterBody(func.parameters)} end`;
    return s;
};

export const generateLuaClass = (clazz: RosettaLuaClass): string => {
    let s = '--- @meta\n\n';

    // If the class has a description.
    if (clazz.notes && clazz.notes.length) {
        const notes = clazz.notes.split('\n').join('\n--- ');
        s += `--- ${notes}\n--- \n`;
    }

    s += `--- @class ${clazz.name}\n`;

    // Generate any fields in the class here.
    const fieldNames = Object.keys(clazz.fields);
    if (fieldNames.length) {
        fieldNames.sort((a, b) => a.localeCompare(b));
        for (const fieldName of fieldNames) {
            const field = clazz.fields[fieldName];
            s += generateLuaField(field) + '\n';
        }
    }

    // NOTE: This is to keep flexability in Lua for adding custom properties to existing classes.
    s += '--- @field [any] any\n';

    s += `${clazz.name} = ISBaseObject:derive("${clazz.name}");\n`;

    // Generate any fields in the class here.
    const methodNames = Object.keys(clazz.methods);
    if (methodNames.length) {
        s += '\n';
        methodNames.sort((a, b) => a.localeCompare(b));
        for (const methodName of methodNames) {
            const method = clazz.methods[methodName];
            s += generateLuaMethod(clazz.name, method) + '\n\n';
        }
    }

    return s;
}