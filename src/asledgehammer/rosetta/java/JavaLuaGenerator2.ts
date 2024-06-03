import { applyLuaDocumentation, paginateNotes } from "../lua/LuaLuaGenerator";
import { RosettaJavaClass } from "./RosettaJavaClass";
import { RosettaJavaConstructor } from "./RosettaJavaConstructor";
import { RosettaJavaField } from "./RosettaJavaField";
import { RosettaJavaMethod } from "./RosettaJavaMethod";

export function generateJavaField(field: RosettaJavaField): string {
    if (field.getVisibilityScope() !== 'public') return '';
    const notes = field.notes && field.notes.length ? field.notes.replace(/\n/g, '<br>') : '';
    return `@field ${field.name} ${luaType(field.type.basic)} ${notes}`;
}

export function generateJavaConstructor(className: string, con: RosettaJavaConstructor): string {
    const ds: string[] = [];
    const cs: string[] = [];

    // Notes.
    if (con.notes && con.notes.trim().length) {
        const notes = paginateNotes(con.notes.trim(), 96);
        for (const line of notes) ds.push(line);
    }

    // Parameter(s).
    if (con.parameters && con.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of con.parameters) {
            let line = `@param ${param.name} ${luaType(param.type.basic)}`;
            if (param.notes && param.notes.trim().length) {
                const notes = paginateNotes(line + ' ' + param.notes.trim(), 96);
                for (const line of notes) ds.push(line);
            } else {
                ds.push(line);
            }
        }
    }

    // Returns.
    if (ds.length) ds.push('');
    ds.push(`@return ${className}`);

    // Constructor-Body.
    let line = `function ${className}.new(`;
    if (con.parameters && con.parameters.length) {
        for (const param of con.parameters) {
            line += param.name + ', ';
        }
        line = line.substring(0, line.length - 2);
    }
    line += ') end';

    // If too long, render as slinky.
    if (line.length > 100) {
        cs.push(`function ${className}.new(`);
        if (con.parameters && con.parameters.length) {
            for (const param of con.parameters) {
                cs.push(`    ${param.name},`);
            }
            cs[cs.length - 1] = cs[cs.length - 1].substring(0, cs[cs.length - 1].length - 1);
        }
        cs.push(') end');
    } else {
        cs.push(line);
    }

    return applyLuaDocumentation(ds, 0) + cs.join('\n');
}

export function generateJavaMethod(className: string, operator: ':' | '.', method: RosettaJavaMethod): string {
    const ds: string[] = [];
    const cs: string[] = [];

    // Notes.
    if (method.notes && method.notes.trim().length) {
        const notes = paginateNotes(method.notes.trim(), 96);
        for (const line of notes) ds.push(line);
    }

    // Parameter(s).
    if (method.parameters && method.parameters.length) {
        if (ds.length) ds.push('');
        for (const param of method.parameters) {
            let line = `@param ${param.name} ${luaType(param.type.basic)}`;
            if (param.notes && param.notes.trim().length) {
                const notes = paginateNotes(line + ' ' + param.notes.trim(), 96);
                for (const line of notes) ds.push(line);
            } else {
                ds.push(line);
            }
        }
    }

    // Returns.
    if (method.returns) {
        if (ds.length) ds.push('');
        let line = `@return ${luaType(method.returns.type.basic)}`;
        if (method.returns.notes && method.returns.notes.trim().length) {
            const notes = paginateNotes(line + ' result ' + method.returns.notes.trim(), 96);
            for (const line of notes) ds.push(line);
        } else {
            ds.push(line);
        }
    }

    // Constructor-Body.
    let line = `function ${className}${operator}${method.name}(`;
    if (method.parameters && method.parameters.length) {
        for (const param of method.parameters) {
            line += param.name + ', ';
        }
        line = line.substring(0, line.length - 2);
    }
    line += ') end';

    // If too long, render as slinky.
    if (line.length > 100) {
        cs.push(`function ${className}${operator}${method.name}(`);
        if (method.parameters && method.parameters.length) {
            for (const param of method.parameters) {
                cs.push(`    ${param.name},`);
            }
            cs[cs.length - 1] = cs[cs.length - 1].substring(0, cs[cs.length - 1].length - 1);
        }
        cs.push(') end');
    } else {
        cs.push(line);
    }

    return applyLuaDocumentation(ds, 0) + cs.join('\n');
}

export function generateJavaClass(clazz: RosettaJavaClass): string {
    const ds: string[] = [];
    const cs: string[] = [];

    // Class-notes.
    if (clazz.notes && clazz.notes.trim().length) {
        const notes = paginateNotes(clazz.notes.trim(), 96);
        for (const line of notes) ds.push(line);
    }

    // Class definition line.
    ds.push(`@class ${clazz.name}`);
    if (clazz.extendz && clazz.extendz.length && clazz.extendz !== 'Object') {
        ds[ds.length - 1] = ds[ds.length - 1] + `: ${clazz.extendz}`;
    }

    // Method(s) & Functtion(s).
    const staticMethods: RosettaJavaMethod[] = [];
    const methods: RosettaJavaMethod[] = [];
    const methodClusterNames = Object.keys(clazz.methods);
    if (methodClusterNames.length) {
        methodClusterNames.sort((a, b) => a.localeCompare(b));
        for (const clusterName of methodClusterNames) {
            const cluster = clazz.methods[clusterName];
            for (const method of cluster.methods) {
                if (method.isStatic()) staticMethods.push(method);
                else methods.push(method);
            }
        }
    }

    // Field(s).
    const fieldNames = Object.keys(clazz.fields);
    if (fieldNames.length) {
        fieldNames.sort((a, b) => a.localeCompare(b));
        for (const fieldName of fieldNames) {
            const field = clazz.fields[fieldName];
            if (field.getVisibilityScope() !== 'public') continue;
            if (!field.isStatic()) continue;
            if (!field.isFinal()) continue;
            ds.push(generateJavaField(field));
        }
    }

    // Constructor(s).
    const constructors: RosettaJavaConstructor[] = [];
    for (const con of clazz.constructors) {
        if (con.getVisibilityScope() !== 'public') continue;
        constructors.push(con);
    }

    cs.push(`${clazz.name} = {};`);

    // If nothing is defined for the class, render it empty.
    if (!methods.length
        && !staticMethods.length
        && !constructors.length) {
        return applyLuaDocumentation(ds, 0) + cs.join('\n');
    }

    // Constructor(s).
    if (constructors.length) {
        cs.push('');
        cs.push(`------------------------------------`);
        cs.push(`----------- CONSTRUCTORS -----------`);
        cs.push(`------------------------------------`);
        for (const con of constructors) {
            cs.push('');
            cs.push(generateJavaConstructor(clazz.name, con));
        }
    }

    // Instance Method(s).
    if (methods.length) {
        cs.push('');
        cs.push('------------------------------------');
        cs.push('------------- METHODS --------------');
        cs.push('------------------------------------');
        for (const method of methods) {
            cs.push('');
            cs.push(generateJavaMethod(clazz.name, ':', method));
        }
    }

    // Static Method(s).
    if (staticMethods.length) {
        cs.push('');
        cs.push('------------------------------------');
        cs.push('---------- STATIC METHODS ----------');
        cs.push('------------------------------------');
        for (const method of staticMethods) {
            cs.push('');
            cs.push(generateJavaMethod(clazz.name, '.', method));
        }
    }

    return applyLuaDocumentation(ds, 0) + cs.join('\n');
}

export function luaType(type: string): string {
    switch (type) {
        case 'String': return 'string'; // Internal Strings are transformed to Lua's 'string' type.
        case 'KahluaTable': return 'any'; // Internal reference to tables.
        default: return type;
    }
}