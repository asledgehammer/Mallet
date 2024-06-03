import { RosettaJavaClass } from "./RosettaJavaClass";
import { RosettaJavaConstructor } from "./RosettaJavaConstructor";
import { RosettaJavaField } from "./RosettaJavaField";
import { RosettaJavaMethod } from "./RosettaJavaMethod";
import { RosettaJavaMethodCluster } from "./RosettaJavaMethodCluster";
import { RosettaJavaParameter } from "./RosettaJavaParameter";

/** @deprecated Use JavaLuaGenerator2. */
export function generateJavaField(field: RosettaJavaField): string {
    if (field.getVisibilityScope() !== 'public') return '';
    const notes = field.notes && field.notes.length ? field.notes.replace(/\n/g, '<br>') : '';
    return `--- @field ${field.name} ${field.type.basic} ${notes}`;
}

/** @deprecated Use JavaLuaGenerator2. */
export function generateJavaParameterBody(params: RosettaJavaParameter[]): string {
    let s = '';
    if (params.length) {
        for (const param of params) {
            s += `${param.name}, `;
        }
        s = s.substring(0, s.length - 2);
    }
    return `(${s})`;
}

/** @deprecated Use JavaLuaGenerator2. */
export function generateJavaConstructor(className: string, constructors: RosettaJavaConstructor[]): string {

    if (!constructors.length) return '';

    constructors = [...constructors].filter((a) => a.getVisibilityScope() === 'public');
    constructors.sort((a, b) => a.parameters.length - b.parameters.length);

    let s = '';

    // Parameter(s).

    let maxParams = 0;
    const _paramNames: string[] = [];
    const _paramTypes: string[] = [];
    const _overloads: string[] = [];
    for (const method of constructors) {
        const { parameters } = method;
        if (parameters.length > maxParams) {
            maxParams = parameters.length;
        }

        let _overload = `fun(`;
        let oParams = '';
        for (const param of method.parameters) {
            oParams += `${param.name}: ${param.type.basic}, `;
        }
        if (oParams.length) oParams = oParams.substring(0, oParams.length - 2);
        _overload += `${oParams}): ${className}`;
        _overloads.push(_overload);
    }

    const method0 = constructors[0];
    if (method0.parameters && method0.parameters.length) {
        for (const param of method0.parameters) {
            _paramNames.push(param.name);
            _paramTypes.push(param.type.basic);
        }
    }

    // Parameter(s).
    let ps = '';
    for (let index = 0; index < _paramNames.length; index++) {
        ps += `${_paramNames[index]}, `;
    }
    if (ps.length) {
        ps = ps.substring(0, ps.length - 2);
    }

    // Documentation.
    let ds = '--- @public\n';
    if (constructors.length > 1) {

        for (let index = 0; index < constructors.length; index++) {
            const method = constructors[index];
            let mds = '';
            if (method.notes) {
                mds += '--- ### Description:';
                mds += `\n--- ${method.notes.replace(/\n/g, '\n--- ')}`;
            }
            if (mds.length) mds += '\n';
            mds += '--- ### Parameter(s):';
            if (method.parameters.length) {
                for (let pIndex = 0; pIndex < method.parameters.length; pIndex++) {
                    const parameter = method.parameters[pIndex];
                    mds += `\n---   * **${parameter.type.basic}** *${parameter.name}*`;
                    if (parameter.notes) {
                        mds += ` - ${parameter.notes.replace(/\n/g, ' ')}`;
                    }
                }
            } else {
                mds += '\n--- * **(None)**';
            }
            if (mds.length) {
                mds += '\n--- ---\n';
                ds += mds;
            }
        }
        ds += `--- \n`;

        // Apply first method's notes.
        const method = constructors[0];
        if (method.notes) {
            ds += `--- ${constructors[0].notes!.replace(/\n/g, '\n--- ')}\n--- \n`;
        }

        // Apply parameter(s).
        for (let index = 0; index < _paramNames.length; index++) {
            ds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}\n`;
        }

        ds += `--- @return ${className}`;

        // Apply overload(s).
        if (_overloads.length > 1) {
            ds += '\n--- \n';
            for (let oIndex = 1; oIndex < constructors.length; oIndex++) {
                ds += `--- @overload ${_overloads[oIndex]}\n`;
            }
        }

    } else {
        let vds = '';
        const method = constructors[0];
        if (method.notes) {
            vds += `--- ${method.notes.replace(/\n/g, '\n--- ')}`;
        }

        for (let index = 0; index < _paramNames.length; index++) {
            vds += `\n--- @param ${_paramNames[index]} ${_paramTypes[index]}`;

            if (method.parameters[index].notes) {
                vds += ` ${method.parameters[index].notes!.replace(/\n/g, ' ')}`;
            }
        }

        vds += `\n--- @return ${className}\n`;
        ds += vds;
    }

    while (ds.indexOf('\n\n') !== -1) {
        ds = ds.replace('\n\n', '\n--- \n');
    }

    s += `${ds}function ${className}.new(${ps}) end`;

    return s;
}

/** @deprecated Use JavaLuaGenerator2. */
export function generateJavaMethods(className: string, cluster: RosettaJavaMethod[]): string {

    if (!cluster.length) return '';

    const methods = [...cluster].filter((a) => a.getVisibilityScope() === 'public');
    methods.sort((a, b) => a.parameters.length - b.parameters.length);
    const isStatic = methods[0].isStatic();

    let s = '';

    // Parameter(s).

    let maxParams = 0;
    const _returns: string[] = [];
    const _paramNames: string[] = [];
    const _paramTypes: string[] = [];
    const _overloads: string[] = [];
    for (const method of methods) {
        const { parameters, returns } = method;
        if (parameters.length > maxParams) {
            maxParams = parameters.length;
        }

        if (_returns.indexOf(returns.type.basic) === -1) {
            _returns.push(returns.type.basic);
        }

        let _overload = `fun(`;
        let oParams = '';
        for (const param of method.parameters) {
            oParams += `${param.name}: ${param.type.basic}, `;
        }
        if (oParams.length) oParams = oParams.substring(0, oParams.length - 2);
        _overload += `${oParams}): ${method.returns.type.basic}`;
        _overloads.push(_overload);
    }
    _returns.sort((a, b) => a.localeCompare(b));

    const method0 = methods[0];
    if (method0.parameters && method0.parameters.length) {
        for (const param of method0.parameters) {
            _paramNames.push(param.name);
            _paramTypes.push(param.type.basic);
        }
    }

    // Parameter(s).
    let ps = '';
    for (let index = 0; index < _paramNames.length; index++) {
        ps += `${_paramNames[index]}, `;
    }
    if (ps.length) {
        ps = ps.substring(0, ps.length - 2);
    }

    // Return Type(s).
    let rs = '';
    for (let index = 0; index < _returns.length; index++) {
        rs += `${_returns[index]} | `;
    }
    if (rs.length) rs = rs.substring(0, rs.length - 3);

    // Documentation.
    let ds = '--- @public\n';
    if (isStatic) ds += '--- @static\n';
    if (methods.length > 1) {

        for (let index = 0; index < methods.length; index++) {
            const method = methods[index];
            let mds = '';
            if (method.notes) {
                mds += '--- ### Description:';
                mds += `\n--- ${method.notes!.replace(/\n/g, '\n--- ')}`;
            }
            if (mds.length) mds += '\n';
            mds += '--- ### Parameter(s):';
            if (method.parameters.length) {
                for (let pIndex = 0; pIndex < method.parameters.length; pIndex++) {
                    const parameter = method.parameters[pIndex];
                    mds += `\n---   * **${parameter.type.basic}** *${parameter.name}*`;
                    if (parameter.notes) {
                        mds += ` - ${parameter.notes.replace(/\n/g, ' ')}`;
                    }
                }
            } else {
                mds += '\n--- * **(None)**';
            }
            mds += '\n--- ### Returns:';
            const returns = method.returns;
            mds += `\n---   * ${returns.type.basic}`;
            if (returns.notes) mds += ` ${returns.notes.replace(/\n/g, ' ')}`;
            if (mds.length) {
                mds += '\n--- ---\n';
                ds += mds;
            }
        }
        ds += `--- \n`;

        // Apply first method's notes.
        const method = methods[0];
        if (method.notes) {
            ds += `--- ${method.notes.replace(/\n/g, '\n--- ')}\n--- \n`;
        }

        // Apply parameter(s).
        for (let index = 0; index < _paramNames.length; index++) {
            ds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}\n`;
        }

        if (ds.length) ds += '--- \n';

        // Apply return.
        ds += `--- @return ${rs}\n--- \n`;

        // Apply overload(s).
        for (let oIndex = 1; oIndex < methods.length; oIndex++) {
            ds += `--- @overload ${_overloads[oIndex]}\n`;
        }

    } else {
        let vds = '';
        const method = methods[0];
        if (method.notes) {
            vds += `--- ${method.notes.replace(/\n/g, '\n--- ')}`;
        }

        for (let index = 0; index < _paramNames.length; index++) {
            vds += `\n--- @param ${_paramNames[index]} ${_paramTypes[index]}`;

            if (method.parameters[index].notes) {
                vds += ` ${method.parameters[index].notes!.replace(/\n/g, ' ')}`;
            }
        }

        vds += `\n--- @return ${rs}`;
        if (method.returns.notes) {
            vds += ` ${method.returns.notes.replace(/\n/g, ' ')}`;
        }
        if (!vds.endsWith('\n')) vds += '\n';
        ds += vds;
    }

    while (ds.indexOf('\n\n') !== -1) {
        ds = ds.replace('\n\n', '\n--- \n');
    }

    s += `${ds}function ${className}${isStatic ? '.' : ':'}${methods[0].name}(${ps}) end`;

    return s;
}

/** @deprecated Use JavaLuaGenerator2. */
export function generateJavaClass(clazz: RosettaJavaClass): string {
    let s = '';

    // If the class has a description.
    if (clazz.notes && clazz.notes.length > 0) {
        const notes = clazz.notes.split('\n').join('\n--- ');
        s += `--- ${notes}\n`;
        if (notes.endsWith('\n')) s += '--- \n';
    }

    s += `--- @class ${clazz.name}`;

    // Super-class.
    if (clazz.extendz && clazz.extendz.length && clazz.extendz !== 'Object') {
        s += `: ${clazz.extendz}`;
    }

    s += '\n';

    // Field(s)
    const fieldNames = Object.keys(clazz.fields);
    if (fieldNames.length) {
        fieldNames.sort((a, b) => a.localeCompare(b));
        // Static field(s) first.
        for (const fieldName of fieldNames) {
            const field = clazz.fields[fieldName];
            if (field.getVisibilityScope() !== 'public') continue;
            if (field.isStatic()) {
                s += generateJavaField(field) + '\n';
            }
        }
        // // Instance field(s) next.
        // for (const fieldName of fieldNames) {
        //     const field = clazz.fields[fieldName];
        //     if (!field.isStatic()) {
        //         s += generateJavaField(field) + '\n';
        //     }
        // }
    }

    const methodClusterNames = Object.keys(clazz.methods);
    methodClusterNames.sort((a, b) => a.localeCompare(b));

    s += `${clazz.name} = {};\n\n`;

    const staticMethods: RosettaJavaMethodCluster[] = [];
    const methods: RosettaJavaMethodCluster[] = [];

    for (const clusterName of methodClusterNames) {
        const cluster = clazz.methods[clusterName];
        if (cluster.methods[0].isStatic()) {
            staticMethods.push(cluster);
        } else {
            methods.push(cluster);
        }
    }

    let temp = '';

    if (staticMethods.length) {
        temp = '';
        for (const cluster of staticMethods) {
            temp += `${generateJavaMethods(clazz.name, cluster.methods)}\n\n`;
        }
        if (temp.length) {
            s += `------------------------------------\n`;
            s += `---------- STATIC METHODS ----------\n`;
            s += `------------------------------------\n`;
            s += '\n';
            s += temp;
        }
    }

    if (methods.length) {
        temp = '';
        for (const cluster of methods) {
            temp += `${generateJavaMethods(clazz.name, cluster.methods)}\n\n`;
        }
        if (temp.length) {
            s += '------------------------------------\n';
            s += '------------- METHODS --------------\n';
            s += '------------------------------------\n';
            s += '\n';
            s += temp;
        }
    }

    if (clazz.constructors && clazz.constructors.length) {
        temp = `${generateJavaConstructor(clazz.name, clazz.constructors)}\n`;
        if (temp.length) {
            s += `------------------------------------\n`;
            s += `----------- CONSTRUCTOR ------------\n`;
            s += `------------------------------------\n`;
            s += '\n';
            s += temp;
        }
    }

    return s;
}
