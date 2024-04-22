import { RosettaLuaClass } from "./RosettaLuaClass"
import { RosettaLuaConstructor } from "./RosettaLuaConstructor";
import { RosettaLuaField } from "./RosettaLuaField";
import { RosettaLuaFunction } from "./RosettaLuaFunction";
import { RosettaLuaParameter } from "./RosettaLuaParameter";


export const generateLuaField = (field: RosettaLuaField): string => {

    let s = '';

    // Function Description
    if (field.notes && field.notes.length) {
        const notes = field.notes.split('\n').join(' ');
        s += `--- ${notes}\n--- \n`;
    }

    if (s.endsWith('\n')) s = s.substring(0, s.length - 1);

    return `--- @field ${field.name} ${field.type} ${s}`;
};

export const generateLuaValue = (containerName: string, field: RosettaLuaField): string => {

    let s = '';

    // Function Description
    if (field.notes && field.notes.length) {
        const notes = field.notes.split('\n').join('\n--- ');
        s += `--- ${notes}\n`;
    }

    return `${s}${containerName}.${field.name} = ${field.defaultValue != null ? field.defaultValue : 'nil'};`;
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

export const generateLuaFunction = (className: string, func: RosettaLuaFunction): string => {

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
    s += `function ${className}.${func.name}${generateLuaParameterBody(func.parameters)} end`;
    return s;
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

export const generateLuaConstructor = (className: string, conzstructor: RosettaLuaConstructor): string => {

    let s = '';

    // Function Description
    if (conzstructor.notes && conzstructor.notes.length) {
        const notes = conzstructor.notes.split('\n').join('\n--- ');
        s += `--- ${notes}\n--- \n`;
    }

    // Parameter Documentation
    if (conzstructor.parameters && conzstructor.parameters.length) {
        for (const param of conzstructor.parameters) {
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

    if (conzstructor.parameters && conzstructor.parameters.length) {
        s += '--- \n';
    }

    // Class Returns Documentation
    s += `--- @return ${className}`;

    if (s.length) s += '\n';
    s += `function ${className}:new${generateLuaParameterBody(conzstructor.parameters)} end`;
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

    // Generate any value-comments in the class here.
    const valueNames = Object.keys(clazz.values);
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const value = clazz.values[valueName];
            s += generateLuaField(value) + '\n';
        }
    }

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

    s += `${clazz.name} = ISBaseObject:derive("${clazz.name}");\n\n`;

    // Generate any values in the class here.
    if (valueNames.length) {
        valueNames.sort((a, b) => a.localeCompare(b));
        for (const valueName of valueNames) {
            const value = clazz.values[valueName];
            s += generateLuaValue(clazz.name, value) + '\n';
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
            s += generateLuaMethod(clazz.name, method) + '\n\n';
        }
    }

    // Generate any functions in the class here.
    const functionNames = Object.keys(clazz.functions);
    if (functionNames.length) {
        functionNames.sort((a, b) => a.localeCompare(b));
        for (const functionName of functionNames) {
            const func = clazz.functions[functionName];
            s += generateLuaFunction(clazz.name, func) + '\n\n';
        }
    }

    return s;
}