import { RosettaJavaClass } from "../java/RosettaJavaClass";
import { RosettaJavaConstructor } from "../java/RosettaJavaConstructor";
import { RosettaJavaField } from "../java/RosettaJavaField";
import { RosettaJavaMethod } from "../java/RosettaJavaMethod";
import { RosettaJavaMethodCluster } from "../java/RosettaJavaMethodCluster";
import { applyTSDocumentation, paginateNotes, wrapAsTSFile, wrapAsTSNamespace } from "./TSUtils";

export function javaFieldToTS(
    field: RosettaJavaField,
    indent: number = 0,
    notesLength: number
): string {

    if (field.getVisibilityScope() !== 'public') return '';

    const i = ' '.repeat(indent * 4);
    let s = '';

    /* Documentation */
    let ds: string[] = [];
    if (field.deprecated) ds.push('@deprecated');
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
    if (field.isStatic()) s += 'static ';
    if (field.isFinal()) s += 'readonly ';
    s += `${field.name}: ${tsType(field.type.basic)};`;

    // Format documented variables as spaced for better legability.
    if (ds.length) s += '\n';

    return s;
}

export function javaConstructorToTS(
    con: RosettaJavaConstructor,
    indent: number,
    notesLength: number
): string {

    if (con.getVisibilityScope() !== 'public') return '';

    const i = ' '.repeat(indent * 4);
    const ds: string[] = javaConstructorDocumentation(con, notesLength);

    let ps = '';
    if (con.parameters && con.parameters.length) {
        ps += '(';
        for (const parameter of con.parameters) {
            ps += `${parameter.name}: ${tsType(parameter.type.basic)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    let fs = `${i}constructor${ps};`;
    if(fs.length > notesLength) {
        fs = `${i}`;
        fs += `constructor(\n`;
        for (const parameter of con.parameters) {
            fs += `${i}    ${parameter.name}: ${tsType(parameter.type.basic)}, \n`;
        }
        fs += `${i});`;
    }
    
    return applyTSDocumentation(ds, '', indent) + fs + '\n';
}

export function javaConstructorsToTS(
    constructors: RosettaJavaConstructor[],
    indent: number,
    notesLength: number
): string {
    const i = ' '.repeat(indent * 4);
    let s = '';

    const cons = [];
    for (const c of constructors) {
        if (c.getVisibilityScope() !== 'public') continue;
        cons.push(c);
    }

    if (cons.length) {

        cons.sort((a, b) => {

            // Smaller param count = first.
            const apl = a.parameters ? a.parameters.length : 0;
            const bpl = b.parameters ? b.parameters.length : 0;
            let compare = apl - bpl;

            // If same count, compare type strings. a < b.
            if (compare === 0) {
                for (let index = 0; index < apl; index++) {
                    const ap = a.parameters[index];
                    const bp = b.parameters[index];
                    compare = ap.type.basic.localeCompare(bp.type.basic);
                    if (compare !== 0) break;
                }
            }

            return compare;
        });

        for (const con of cons) {
            if (con.getVisibilityScope() !== 'public') continue;
            s += javaConstructorToTS(con, indent, notesLength) + '\n\n';
        }

        // Remove trailing new-line.
        s = s.substring(0, s.length - 3);
    }

    return s;
}

export function javaMethodClusterToTS(
    cluster: RosettaJavaMethodCluster,
    indent: number = 0,
    notesLength: number
): string {

    if (cluster.methods.length === 1) {
        return javaMethodToTS(cluster.methods[0], indent, notesLength);
    }

    let s = '';

    const methods = [];
    for (const m of cluster.methods) {
        if (m.getVisibilityScope() !== 'public') continue;
        methods.push(m);
    }

    if (methods.length) {
        methods.sort((a, b) => {

            // Smaller param count = first.
            const apl = a.parameters ? a.parameters.length : 0;
            const bpl = b.parameters ? b.parameters.length : 0;
            let compare = apl - bpl;

            // If same count, compare type strings. a < b.
            if (compare === 0) {
                for (let index = 0; index < apl; index++) {
                    const ap = a.parameters[index];
                    const bp = b.parameters[index];
                    compare = ap.type.basic.localeCompare(bp.type.basic);
                    if (compare !== 0) break;
                }
            }

            return compare;
        });

        for (const method of cluster.methods) {
            if (method.getVisibilityScope() !== 'public') continue;
            s += javaMethodToTS(method, indent, notesLength) + '\n';
        }

        // Remove trailing new-line.
        s = s.substring(0, s.length - 1);
    }

    return s;
}

export function javaConstructorDocumentation(
    con: RosettaJavaConstructor,
    notesLength: number,
): string[] {
    const ds: string[] = [];

    /* (Annotations) */
    if (con.deprecated) ds.push('@deprecated');

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

export function javaMethodDocumentation(
    method: RosettaJavaMethod,
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

export function javaMethodToTS(
    method: RosettaJavaMethod,
    indent: number = 0,
    notesLength: number
): string {

    if (method.getVisibilityScope() !== 'public') return '';

    const i = ' '.repeat(indent * 4);
    const ds: string[] = javaMethodDocumentation(method, notesLength, false);

    let ps = '';
    if (method.parameters && method.parameters.length) {
        ps += '(';
        for (const parameter of method.parameters) {
            ps += `${parameter.name}: ${tsType(parameter.type.basic)}, `;
        }
        ps = ps.substring(0, ps.length - 2) + ')';
    } else {
        ps = '()';
    }

    const rs = tsType(method.returns.type.basic);

    let fs = `${i}`;
    if (method.isStatic()) fs += 'static ';
    if (method.isFinal()) fs += 'readonly ';
    fs += `${method.name}${ps}: ${rs};\n`;
    if (fs.length > notesLength) {
        fs = `${i}`;
        if (method.isStatic()) fs += 'static ';
        if (method.isFinal()) fs += 'readonly ';
        fs += `${method.name}(\n`;
        for (const parameter of method.parameters) {
            fs += `${i}    ${parameter.name}: ${tsType(parameter.type.basic)}, \n`;
        }
        fs += `${i}): ${rs}\n`;
    }

    return applyTSDocumentation(ds, '', indent) + fs;
}

export function javaClassToTS(
    clazz: RosettaJavaClass,
    wrapNamespace: boolean = false,
    wrapFile: boolean = false
): string {
    let s = '';

    const fieldNames = Object.keys(clazz.fields);
    fieldNames.sort((a, b) => a.localeCompare(b));

    const methodNames = Object.keys(clazz.methods);
    methodNames.sort((a, b) => a.localeCompare(b));

    const staticFields: RosettaJavaField[] = [];
    const fields: RosettaJavaField[] = [];
    const staticMethods: RosettaJavaMethodCluster[] = [];
    const methods: RosettaJavaMethodCluster[] = [];

    /* (STATIC FIELDS) */
    for (const fieldName of fieldNames) {
        const field = clazz.fields[fieldName];
        if (field.getVisibilityScope() !== 'public') continue;
        if (field.isStatic()) staticFields.push(field);
        else fields.push(field);
    }

    /* (INSTANCE METHODS) */
    for (const methodName of methodNames) {
        const cluster = clazz.methods[methodName];
        if (!cluster.methods.length) continue; // (Sanity-Check)
        if (!cluster.methods[0].isStatic()) staticMethods.push(cluster);
        else methods.push(cluster);
    }

    /** 100 - 4 (module indent) - 4 (namespace indent) - 3 (' * ') */
    let notesLength = 96;
    if (wrapFile) notesLength -= 4;
    if (wrapNamespace) notesLength -= 4;

    /* (Class Documentation) */
    const ds: string[] = [];
    ds.push(`@customConstructor ${clazz.name}.new`);
    ds.push('');
    ds.push(`Class: ${clazz.namespace.name}.${clazz.name}`);
    if (clazz.notes && clazz.notes.length) {
        ds.push('');
        const lines = paginateNotes(clazz.notes, notesLength);
        for (const line of lines) ds.push(line);
    }
    s = applyTSDocumentation(ds, s, 0);

    s += `export class ${clazz.name} `;
    let i = '    ';
    let is = '';
    let temp = '';
    if (staticFields.length) {
        temp = '';
        for (const field of staticFields) {
            if (field.getVisibilityScope() !== 'public') continue;
            else if (!field.isFinal()) continue;
            temp += `${javaFieldToTS(field, 1, notesLength)}\n`;
        }
        if (temp.length) {
            is += `${i}/* ------------------------------------ */\n`;
            is += `${i}/* ---------- STATIC FIELDS ----------- */\n`;
            is += `${i}/* ------------------------------------ */\n`;
            is += '\n';
            is += temp;
        }
    }

    // if (fields.length) {
    //     temp = '';
    //     for (const field of fields) {
    //         temp += `${javaFieldToTS(field, 1, notesLength)}\n`;
    //     }
    //     if (temp.length) {
    //         if (is.length) is += '\n';
    //         is += `${i}/* ------------------------------------ */\n`;
    //         is += `${i}/* ------------- FIELDS --------------- */\n`;
    //         is += `${i}/* ------------------------------------ */\n`;
    //         is += '\n';
    //         is += temp;
    //     }
    // }

    if (clazz.constructors && clazz.constructors.length) {
        temp = `${javaConstructorsToTS(clazz.constructors, 1, notesLength)}\n`;
        if (temp.length) {
            if (is.length) is += '\n';
            is += `${i}/* ------------------------------------ */\n`;
            is += `${i}/* ----------- CONSTRUCTOR ------------ */\n`;
            is += `${i}/* ------------------------------------ */\n`;
            is += '\n';
            is += temp;
        }
    }

    if (methods.length) {
        temp = '';
        for (const cluster of methods) {
            temp += `${javaMethodClusterToTS(cluster, 1, notesLength)}\n`;
        }
        if (temp.length) {
            if (is.length) is += '\n';
            is += `${i}/* ------------------------------------ */\n`;
            is += `${i}/* ------------- METHODS -------------- */\n`;
            is += `${i}/* ------------------------------------ */\n`;
            is += '\n';
            is += temp;
        }
    }

    if (staticMethods.length) {
        temp = '';
        for (const cluster of staticMethods) {
            temp += `${javaMethodClusterToTS(cluster, 1, notesLength)}\n`;
        }
        if (temp.length) {
            if (is.length) is += '\n';
            is += `${i}/* ------------------------------------ */\n`;
            is += `${i}/* ---------- STATIC METHODS ---------- */\n`;
            is += `${i}/* ------------------------------------ */\n`;
            is += '\n';
            is += temp;
        }
    }

    if (is.length) {
        s += `{\n\n${is}}`;
    } else {
        s += `{}\n`;
    }

    if (wrapNamespace) s = wrapAsTSNamespace(clazz.namespace.name, s);
    if (wrapFile) return wrapAsTSFile(s);
    return s;
}

export function tsType(type: string): string {
    switch (type) {
        case 'String': return 'string';
        case 'KahluaTable': return 'any';
        default: return type;
    }
}
