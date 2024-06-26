define("src/asledgehammer/Assert", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertNonEmptyString = exports.assertEmptyString = exports.assertString = exports.assertNonNull = exports.assertNull = exports.AssertionError = void 0;
    class AssertionError extends Error {
        constructor(msg) {
            super(msg);
        }
    }
    exports.AssertionError = AssertionError;
    const assertNull = (value, name) => {
        if (value != null) {
            throw new AssertionError(`The value '${name}' is NOT null.`);
        }
    };
    exports.assertNull = assertNull;
    const assertNonNull = (value, name) => {
        if (value == null) {
            throw new AssertionError(`The value '${name}' is null.`);
        }
    };
    exports.assertNonNull = assertNonNull;
    const assertString = (value, name) => {
        (0, exports.assertNonNull)(value, name);
        if (typeof value !== 'string') {
            throw new AssertionError(`The value '${name}' is not a string. (type: ${typeof value})`);
        }
    };
    exports.assertString = assertString;
    const assertEmptyString = (value, name) => {
        (0, exports.assertString)(value, name);
        if (value.length !== 0) {
            throw new AssertionError(`The string '${name}' is NOT empty.`);
        }
    };
    exports.assertEmptyString = assertEmptyString;
    const assertNonEmptyString = (value, name) => {
        (0, exports.assertString)(value, name);
        if (value.length === 0) {
            throw new AssertionError(`The string '${name}' is empty.`);
        }
    };
    exports.assertNonEmptyString = assertNonEmptyString;
});
define("src/asledgehammer/rosetta/1.0/RosettaUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmptyObject = exports.formatName = exports.RESERVED_WORDS = exports.RESERVED_FUNCTION_NAMES = void 0;
    exports.RESERVED_FUNCTION_NAMES = ['toString', 'valueOf'];
    exports.RESERVED_WORDS = [
        'and',
        'break',
        'do',
        'else',
        'elseif',
        'end',
        'false',
        'for',
        'function',
        'if',
        'in',
        'local',
        'nil',
        'not',
        'or',
        'repeat',
        'return',
        'then',
        'true',
        'until',
        'while',
        // NOTE: This is a technical issue involving YAML interpreting
        //       this as a BOOLEAN not a STRING value.
        'on',
        'off',
        'yes',
        'no',
    ];
    const formatName = (name) => {
        for (const reservedWord of exports.RESERVED_WORDS) {
            if (name.toLowerCase() === reservedWord)
                return '__' + name + '__';
        }
        for (const reservedFunctionName of exports.RESERVED_FUNCTION_NAMES) {
            if (name === reservedFunctionName)
                return '__' + name + '__';
        }
        return name;
    };
    exports.formatName = formatName;
    const isEmptyObject = (object) => {
        return object === undefined || Object.keys(object).length <= 0;
    };
    exports.isEmptyObject = isEmptyObject;
});
define("src/asledgehammer/rosetta/1.0/RosettaEntity", ["require", "exports", "src/asledgehammer/Assert"], function (require, exports, Assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaEntity = void 0;
    /**
     * **RosettaEntity**
     *
     * @author Jab
     */
    class RosettaEntity {
        constructor(raw, readonly = false) {
            Assert.assertNonNull(raw, 'raw');
            this.raw = raw;
            this.readOnly = readonly;
        }
        readModifiers(raw = this.raw) {
            if (!raw.modifiers)
                return [];
            return [...raw.modifiers];
        }
        readString(id, raw = this.raw) {
            if (raw[id] != null)
                return `${raw[id]}`;
            return;
        }
        writeNotes(notes) {
            if (!notes || !notes.length)
                return undefined;
            return notes.replace(/\n/g, '\\n');
        }
        readNotes(raw = this.raw) {
            const notes = this.readString('notes', raw);
            if (notes != null)
                return notes.replace(/\\n/g, '\n');
            return;
        }
        readRequiredString(id, raw = this.raw) {
            if (raw[id] === undefined) {
                throw new Error(`The string with the id '${id}' doesn't exist.`);
            }
            return `${raw[id]}`;
        }
        readBoolean(id, raw = this.raw) {
            const value = raw[id];
            if (value != null)
                return !!value;
            return;
        }
        readRequiredBoolean(id, raw = this.raw) {
            if (raw[id] === undefined) {
                throw new Error(`The boolean with the id '${id}' doesn't exist.`);
            }
            return !!raw[id];
        }
        checkReadOnly() {
            if (this.readOnly) {
                throw new Error(`The Object '${this.constructor.name}' is read-only.`);
            }
        }
    }
    exports.RosettaEntity = RosettaEntity;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaParameter", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/RosettaUtils"], function (require, exports, Assert, RosettaEntity_1, RosettaUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaParameter = void 0;
    /**
     * **RosettaLuaParameter**
     *
     * @author Jab
     */
    class RosettaLuaParameter extends RosettaEntity_1.RosettaEntity {
        constructor(raw) {
            super(raw);
            this.optional = false;
            this.nullable = false;
            Assert.assertNonNull(raw.type, 'raw.type');
            this.name = (0, RosettaUtils_1.formatName)(this.readRequiredString('name'));
            if (raw.type !== undefined) {
                let type = this.readString('type');
                if (type === undefined)
                    type = 'any';
                this.type = type;
            }
            else {
                this.type = 'any';
            }
            this.notes = this.readNotes();
            this.optional = this.readBoolean('optional') || false;
            this.nullable = this.readBoolean('nullable') || false;
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
            this.optional = this.readBoolean('optional', raw) || false;
            this.nullable = this.readBoolean('nullable', raw) || false;
        }
        toJSON(patch = false) {
            const { name, type, notes, nullable, optional } = this;
            const json = {};
            /* (Properties) */
            json.name = name;
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            json.optional = optional !== undefined ? optional : undefined;
            json.nullable = nullable !== undefined ? nullable : undefined;
            return json;
        }
    }
    exports.RosettaLuaParameter = RosettaLuaParameter;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaReturns", ["require", "exports", "src/asledgehammer/rosetta/1.0/RosettaEntity"], function (require, exports, RosettaEntity_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaReturns = void 0;
    /**
     * **RosettaLuaReturns**
     *
     * @author Jab
     */
    class RosettaLuaReturns extends RosettaEntity_2.RosettaEntity {
        constructor(raw) {
            super(raw);
            this.nullable = false;
            if (raw.type !== undefined) {
                let type = this.readString('type');
                if (type === undefined)
                    type = 'any';
                this.type = type;
            }
            else {
                this.type = 'any';
            }
            this.notes = this.readNotes();
            this.nullable = this.readBoolean('nullable') || false;
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
            this.nullable = this.readBoolean('nullable', raw) || false;
        }
        toJSON(patch = false) {
            const { type, notes, nullable } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && this.writeNotes(notes) !== '' ? notes : undefined;
            json.nullable = nullable !== undefined ? nullable : undefined;
            return json;
        }
    }
    exports.RosettaLuaReturns = RosettaLuaReturns;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaUtils", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaParameter", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaReturns"], function (require, exports, Assert, RosettaUtils_2, RosettaEntity_3, RosettaLuaParameter_1, RosettaLuaReturns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaFunction = void 0;
    /**
     * **RosettaLuaFunction**
     *
     * @author Jab
     */
    class RosettaLuaFunction extends RosettaEntity_3.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.parameters = [];
            Assert.assertNonEmptyString(name, 'name');
            this.name = (0, RosettaUtils_2.formatName)(name);
            this.deprecated = this.readBoolean('deprecated') != null;
            /* (Properties) */
            this.notes = this.readNotes();
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                for (const rawParameter of rawParameters) {
                    const parameter = new RosettaLuaParameter_1.RosettaLuaParameter(rawParameter);
                    this.parameters.push(parameter);
                }
            }
            /* (Returns) */
            if (raw.returns === undefined) {
                throw new Error(`Method does not have returns definition: ${this.name}`);
            }
            this.returns = new RosettaLuaReturns_1.RosettaLuaReturns(raw.returns);
        }
        parse(raw) {
            /* (Properties) */
            this.notes = this.readNotes(raw);
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                /*
                 * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
                 *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
                 */
                if (this.parameters.length !== rawParameters.length) {
                    throw new Error(`The lua function ${this.name}'s parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`);
                }
                for (let index = 0; index < this.parameters.length; index++) {
                    this.parameters[index].parse(rawParameters[index]);
                }
            }
            /* (Returns) */
            if (raw.returns === undefined) {
                throw new Error(`Lua function does not have returns definition: ${this.name}`);
            }
            this.returns.parse(raw.returns);
        }
        /**
         * Adds a parameter to the function.
         *
         * @param name The name of the parameter to display.
         * @param type (Optional) The type of parameter to provide. (Default: `any`)
         * @param notes (Optional) Notes on the parameter. (Default: ``)
         * @returns The new parameter.
         */
        addParameter(name, type = 'any', notes = '') {
            const parameter = new RosettaLuaParameter_1.RosettaLuaParameter({ name, type, notes });
            this.parameters.push(parameter);
            return parameter;
        }
        toJSON(patch = false) {
            const { name, notes, parameters, returns } = this;
            const json = {};
            /* (Name) */
            json.name = name;
            /* (Properties) */
            json.deprecated = this.deprecated ? true : undefined;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            /* (Parameters) */
            if (parameters.length) {
                json.parameters = [];
                for (const parameter of parameters)
                    json.parameters.push(parameter.toJSON(patch));
            }
            /* (Returns) */
            json.returns = returns.toJSON(patch);
            return json;
        }
        getSignature() {
            let signature = `${this.name}`;
            if (this.parameters && this.parameters.length) {
                signature += '_';
                for (const param of this.parameters) {
                    signature += `${param.type}-`;
                }
                signature = signature.substring(0, signature.length - 1);
            }
            return signature;
        }
    }
    exports.RosettaLuaFunction = RosettaLuaFunction;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity"], function (require, exports, Assert, RosettaEntity_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaField = void 0;
    /**
     * **RosettaLuaField**
     *
     * @author Jab
     */
    class RosettaLuaField extends RosettaEntity_4.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.nullable = false;
            Assert.assertNonEmptyString(name, 'name');
            this.name = name;
            if (raw.type !== undefined) {
                let type = this.readString('type');
                if (type === undefined)
                    type = 'any';
                this.type = type;
            }
            else {
                this.type = 'any';
            }
            if (raw.defaultValue) {
                this.defaultValue = this.readString('defaultValue');
            }
            this.notes = this.readNotes();
            this.nullable = this.readBoolean('nullable') || false;
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
            if (raw.defaultValue !== undefined) {
                this.defaultValue = this.readRequiredString('defaultValue', raw);
            }
            this.nullable = this.readBoolean('nullable', raw) || false;
        }
        toJSON(patch = false) {
            const { defaultValue, type, notes, nullable } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            json.defaultValue = defaultValue !== undefined && defaultValue !== '' ? defaultValue : undefined;
            json.nullable = nullable !== undefined ? nullable : undefined;
            return json;
        }
    }
    exports.RosettaLuaField = RosettaLuaField;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaConstructor", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaParameter"], function (require, exports, Assert, RosettaEntity_5, RosettaLuaParameter_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaConstructor = void 0;
    /**
     * **RosettaLuaConstructor**
     *
     * @author Jab
     */
    class RosettaLuaConstructor extends RosettaEntity_5.RosettaEntity {
        constructor(clazz, raw = {}) {
            super(raw);
            this.parameters = [];
            Assert.assertNonNull(clazz, 'clazz');
            /* (Properties) */
            this.clazz = clazz;
            this.notes = this.readNotes(raw);
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                for (const rawParameter of rawParameters) {
                    const parameter = new RosettaLuaParameter_2.RosettaLuaParameter(rawParameter);
                    this.parameters.push(parameter);
                }
            }
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                /*
                 * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
                 *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
                 */
                if (this.parameters.length !== rawParameters.length) {
                    throw new Error(`The class ${this.clazz.name}'s constructor's parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`);
                }
                for (let index = 0; index < rawParameters.length; index++) {
                    this.parameters[index].parse(rawParameters[index]);
                }
            }
        }
        /**
         * Adds a parameter to the constructor.
         *
         * @param name The name of the parameter to display.
         * @param type (Optional) The type of parameter to provide. (Default: `any`)
         * @param notes (Optional) Notes on the parameter. (Default: ``)
         * @returns The new parameter.
         */
        addParameter(name, type = 'any', notes = '') {
            const parameter = new RosettaLuaParameter_2.RosettaLuaParameter({ name, type, notes });
            this.parameters.push(parameter);
            return parameter;
        }
        toJSON(patch = false) {
            const { notes, parameters } = this;
            const json = {};
            /* (Properties) */
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            /* (Parameters) */
            if (parameters.length) {
                json.parameters = [];
                for (const parameter of parameters)
                    json.parameters.push(parameter.toJSON(patch));
            }
            return json;
        }
        getSignature() {
            let signature = `constructor`;
            if (this.parameters && this.parameters.length) {
                signature += '_';
                for (const param of this.parameters) {
                    signature += `${param.type}-`;
                }
                signature = signature.substring(0, signature.length - 1);
            }
            return signature;
        }
    }
    exports.RosettaLuaConstructor = RosettaLuaConstructor;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunctionCluster", ["require", "exports", "src/asledgehammer/Assert"], function (require, exports, Assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaFunctionCluster = void 0;
    /**
     * **RosettaLuaFunctionCluster**
     *
     * @author Jab
     */
    class RosettaLuaFunctionCluster {
        constructor(name) {
            this.functions = [];
            Assert.assertNonEmptyString(name, 'name');
            this.name = name;
        }
        add(method) {
            const indexOf = this.functions.indexOf(method);
            if (indexOf !== -1) {
                this.functions[indexOf].parse(method.raw);
                return;
            }
            this.functions.push(method);
        }
        getWithParameters(...parameterNames) {
            for (const method of this.functions) {
                const parameters = method.parameters;
                if (parameterNames.length === parameters.length) {
                    if (parameterNames.length === 0)
                        return method;
                    let invalid = false;
                    for (let i = 0; i < parameters.length; i++) {
                        if (parameters[i].type !== parameterNames[i]) {
                            invalid = true;
                            break;
                        }
                    }
                    if (invalid)
                        continue;
                    return method;
                }
            }
            return;
        }
    }
    exports.RosettaLuaFunctionCluster = RosettaLuaFunctionCluster;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaUtils", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunctionCluster"], function (require, exports, Assert, RosettaUtils_3, RosettaEntity_6, RosettaLuaFunction_1, RosettaLuaField_1, RosettaLuaConstructor_1, RosettaLuaFunctionCluster_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaClass = void 0;
    /**
     * **RosettaLuaClass**
     *
     * @author Jab
     */
    class RosettaLuaClass extends RosettaEntity_6.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.functions = {};
            this.methods = {};
            this.fields = {};
            this.values = {};
            this.constructors = [];
            this.deprecated = false;
            /** (Default: off) */
            this.mutable = false;
            Assert.assertNonEmptyString(name, 'name');
            this.name = (0, RosettaUtils_3.formatName)(name);
            this.extendz = this.readString('extends');
            this.notes = this.readNotes();
            this.deprecated = this.readBoolean('deprecated') === true;
            /* (Current Constructor) */
            if (raw.constructors !== undefined) {
                for (const cons of raw.constructors) {
                    this.constructors.push(new RosettaLuaConstructor_1.RosettaLuaConstructor(this, cons));
                }
            }
            /* (Legacy Constructors) */
            else if (raw.constructor) {
                console.log(raw.constructor);
                console.log('PZ-Rosetta: Upgrading constructor from singleton to array..');
                const rawConstructor = raw.constructor;
                this.constructors.push(new RosettaLuaConstructor_1.RosettaLuaConstructor(this, rawConstructor));
            }
            /* (Methods) */
            if (raw.methods !== undefined) {
                /* (Legacy Methods) */
                if (!Array.isArray(raw.methods)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua methods from singleton-object per name to clustered array..');
                    const rawMethods = raw.methods;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawMethod);
                        this.methods[method.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(method.name);
                        this.methods[method.name].add(method);
                    }
                }
                /* (Current Methods) */
                else {
                    const rawMethods = raw.methods;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.methods[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(methodName);
                            this.methods[methodName] = cluster;
                        }
                        else {
                            cluster = this.methods[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Static Methods) */
            if (raw.functions !== undefined) {
                /* (Legacy Static Methods) */
                if (!Array.isArray(raw.functions)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua static methods from singleton-object per name to clustered array..');
                    const rawMethods = raw.functions;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawMethod);
                        this.functions[method.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(method.name);
                        this.functions[method.name].add(method);
                    }
                }
                /* (Current Static Methods) */
                else {
                    const rawMethods = raw.functions;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.functions[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(methodName);
                            this.functions[methodName] = cluster;
                        }
                        else {
                            cluster = this.functions[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Fields) */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const name2 of Object.keys(rawFields)) {
                    const rawField = rawFields[name2];
                    const field = new RosettaLuaField_1.RosettaLuaField(name2, rawField);
                    this.fields[name2] = this.fields[field.name] = field;
                }
            }
            /* (Static Fields) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name2 of Object.keys(rawValues)) {
                    const rawValue = rawValues[name2];
                    const value = new RosettaLuaField_1.RosettaLuaField(name2, rawValue);
                    this.values[name2] = this.values[value.name] = value;
                }
            }
            /* (Mutable Flag) */
            if (raw.mutable !== undefined) {
                this.mutable = !!raw.mutable;
            }
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            this.deprecated = this.readBoolean('deprecated', raw) === true;
            /* (Current Constructor) */
            if (raw.constructors !== undefined) {
                for (const cons of raw.constructors) {
                    this.constructors.push(new RosettaLuaConstructor_1.RosettaLuaConstructor(this, cons));
                }
            }
            /* (Legacy Constructors) */
            else if (raw.constructor) {
                console.log('PZ-Rosetta: Upgrading constructor from singleton to array..');
                const rawConstructor = raw.constructor;
                this.constructors.push(new RosettaLuaConstructor_1.RosettaLuaConstructor(this, rawConstructor));
            }
            /* (Methods) */
            if (raw.methods !== undefined) {
                /* (Legacy Methods) */
                if (!Array.isArray(raw.methods)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua methods from singleton-object per name to clustered array..');
                    const rawMethods = raw.methods;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawMethod);
                        this.methods[method.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(method.name);
                        this.methods[method.name].add(method);
                    }
                }
                /* (Current Methods) */
                else {
                    const rawMethods = raw.methods;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.methods[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(methodName);
                            this.methods[methodName] = cluster;
                        }
                        else {
                            cluster = this.methods[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Static Methods) */
            if (raw.functions !== undefined) {
                /* (Legacy Static Methods) */
                if (!Array.isArray(raw.functions)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua static methods from singleton-object per name to clustered array..');
                    const rawMethods = raw.functions;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawMethod);
                        this.functions[method.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(method.name);
                        this.functions[method.name].add(method);
                    }
                }
                /* (Current Static Methods) */
                else {
                    const rawMethods = raw.functions;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_1.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.functions[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(methodName);
                            this.functions[methodName] = cluster;
                        }
                        else {
                            cluster = this.functions[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Fields) */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const name of Object.keys(rawFields)) {
                    const rawField = rawFields[name];
                    let field = this.fields[name];
                    if (field == null) {
                        field = new RosettaLuaField_1.RosettaLuaField(name, rawField);
                        this.fields[name] = this.fields[field.name] = field;
                    }
                    else {
                        field.parse(rawField);
                    }
                }
            }
            /* (Static Fields) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name of Object.keys(rawValues)) {
                    const rawValue = rawValues[name];
                    let value = this.fields[name];
                    if (value == null) {
                        value = new RosettaLuaField_1.RosettaLuaField(name, rawValue);
                        this.values[name] = this.values[value.name] = value;
                    }
                    else {
                        value.parse(rawValue);
                    }
                }
            }
            /* (Mutable Flag) */
            if (raw.mutable !== undefined) {
                this.mutable = !!raw.mutable;
            }
        }
        /**
         * Creates a field in the Lua class.
         *
         * @param name The name of the new field.
         * @returns The new field.
         *
         * @throws Error Thrown if:
         * - A field already exists with the same name in the Lua class.
         */
        createField(name) {
            const field = new RosettaLuaField_1.RosettaLuaField(name);
            // (Only check for the file instance)
            if (this.fields[field.name]) {
                throw new Error(`A field already exists: ${field.name}`);
            }
            this.fields[field.name] = field;
            return field;
        }
        /**
         * Creates a static field (value), in the Lua class.
         *
         * @param name The name of the new static field.
         * @returns The new static field.
         *
         * @throws Error Thrown if:
         * - A static field already exists with the same name in the Lua class.
         */
        createValue(name) {
            const value = new RosettaLuaField_1.RosettaLuaField(name);
            // (Only check for the file instance)
            if (this.values[value.name]) {
                throw new Error(`A static field (value), already exists: ${value.name}`);
            }
            this.values[value.name] = value;
            return value;
        }
        /**
         * Creates a method in the Lua class.
         *
         * @param name The name of the new method.
         * @returns The new method.
         *
         * @throws Error Thrown if:
         * - A method already exists with the same name in the Lua class.
         */
        createMethod(name) {
            const func = new RosettaLuaFunction_1.RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });
            let cluster = this.methods[func.name];
            if (!cluster) {
                cluster = this.methods[func.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(name);
            }
            cluster.add(func);
            return func;
        }
        /**
         * Creates a function in the Lua class.
         *
         * @param name The name of the new function.
         * @returns The new function.
         *
         * @throws Error Thrown if:
         * - A function already exists with the same name in the Lua class.
         */
        createFunction(name) {
            const func = new RosettaLuaFunction_1.RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });
            let cluster = this.functions[func.name];
            if (!cluster) {
                cluster = this.functions[func.name] = new RosettaLuaFunctionCluster_1.RosettaLuaFunctionCluster(name);
            }
            cluster.add(func);
            return func;
        }
        getConstructor(...parameterTypes) {
            if (!this.constructors.length)
                return undefined;
            for (const conztructor of this.constructors) {
                if (conztructor.parameters.length === parameterTypes.length) {
                    let invalid = false;
                    for (let index = 0; index < parameterTypes.length; index++) {
                        if (parameterTypes[index] !== conztructor.parameters[index].type) {
                            invalid = true;
                            break;
                        }
                    }
                    if (invalid)
                        continue;
                    return conztructor;
                }
            }
            return;
        }
        getMethod(...parameterTypes) {
            if (!this.methods.length)
                return undefined;
            for (const cluster of Object.values(this.methods)) {
                for (const method of cluster.functions) {
                    if (method.parameters.length === parameterTypes.length) {
                        let invalid = false;
                        for (let index = 0; index < parameterTypes.length; index++) {
                            if (parameterTypes[index] !== method.parameters[index].type) {
                                invalid = true;
                                break;
                            }
                        }
                        if (invalid)
                            continue;
                        return method;
                    }
                }
            }
            return;
        }
        getStaticMethod(...parameterTypes) {
            if (!this.functions.length)
                return undefined;
            for (const cluster of Object.values(this.functions)) {
                for (const method of cluster.functions) {
                    if (method.parameters.length === parameterTypes.length) {
                        let invalid = false;
                        for (let index = 0; index < parameterTypes.length; index++) {
                            if (parameterTypes[index] !== method.parameters[index].type) {
                                invalid = true;
                                break;
                            }
                        }
                        if (invalid)
                            continue;
                        return method;
                    }
                }
            }
            return;
        }
        toJSON(patch = false) {
            const { constructors, fields, functions, methods, values } = this;
            const json = {};
            /* (Properties) */
            json.extends = this.extendz !== undefined && this.extendz !== '' ? this.extendz : undefined;
            json.notes = this.notes !== undefined && this.notes !== '' ? this.writeNotes(this.notes) : undefined;
            json.deprecated = this.deprecated ? true : undefined;
            /* (Static Fields) */
            let keys = Object.keys(values);
            if (keys.length) {
                json.values = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.values[key] = values[key].toJSON(patch);
            }
            /* (Fields) */
            keys = Object.keys(fields);
            if (keys.length) {
                json.fields = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.fields[key] = fields[key].toJSON(patch);
            }
            /* (Constructor) */
            if (this.constructors.length !== 0) {
                json.constructors = [];
                for (const cons of constructors) {
                    json.constructors.push(cons.toJSON(patch));
                }
            }
            /* (Methods) */
            keys = Object.keys(methods);
            keys.sort((a, b) => a.localeCompare(b));
            if (keys.length) {
                json.methods = [];
                /* (Flatten MethodClusters into JSON method bodies) */
                for (const key of keys) {
                    for (const method of methods[key].functions)
                        json.methods.push(method.toJSON(patch));
                }
            }
            /* (Static Methods) */
            keys = Object.keys(functions);
            keys.sort((a, b) => a.localeCompare(b));
            if (keys.length) {
                json.methods = [];
                /* (Flatten MethodClusters into JSON method bodies) */
                for (const key of keys) {
                    for (const func of functions[key].functions)
                        json.function.push(func.toJSON(patch));
                }
            }
            /* (Mutable Flag) */
            json.mutable = this.mutable;
            return json;
        }
    }
    exports.RosettaLuaClass = RosettaLuaClass;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaTableField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/RosettaUtils"], function (require, exports, Assert, RosettaEntity_7, RosettaUtils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaTableField = void 0;
    /**
     * **RosettaLuaTableField**
     *
     * @author Jab
     */
    class RosettaLuaTableField extends RosettaEntity_7.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.nullable = false;
            Assert.assertNonEmptyString(name, 'name');
            this.name = (0, RosettaUtils_4.formatName)(name);
            if (raw.type !== undefined) {
                let type = this.readString('type');
                if (type === undefined)
                    type = 'any';
                this.type = type;
            }
            else {
                this.type = 'any';
            }
            this.notes = this.readNotes();
            this.defaultValue = this.readString('defaultValue');
            this.nullable = this.readBoolean('nullable') || false;
        }
        parse(raw) {
            /* (Properties) */
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
            this.defaultValue = this.readString('defaultValue', raw);
            this.nullable = this.readBoolean('nullable', raw) || false;
        }
        /**
         * @param patch If true, the exported JSON object will only contain Patch-specific information.
         *
         * @returns The JSON of the Rosetta entity.
         */
        toJSON(patch = false) {
            const { type, notes, defaultValue, nullable } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            json.defaultValue = defaultValue !== undefined ? defaultValue : undefined;
            json.nullable = nullable !== undefined ? nullable : undefined;
            return json;
        }
    }
    exports.RosettaLuaTableField = RosettaLuaTableField;
});
define("src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunctionCluster", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTableField"], function (require, exports, Assert, RosettaEntity_8, RosettaLuaFunction_2, RosettaLuaFunctionCluster_2, RosettaLuaTableField_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaTable = void 0;
    /**
     * **RosettaLuaTable**
     *
     * @author Jab
     */
    class RosettaLuaTable extends RosettaEntity_8.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.fields = {};
            this.tables = {};
            this.functions = {};
            this.mutable = false;
            Assert.assertNonEmptyString(name, 'name');
            this.name = name;
            this.notes = this.readNotes();
            /* (Tables) */
            if (raw.tables !== undefined) {
                const rawTables = raw.tables;
                for (const name2 of Object.keys(rawTables)) {
                    const rawTable = rawTables[name2];
                    const table = new RosettaLuaTable(name2, rawTable);
                    this.tables[table.name] = this.tables[name2] = table;
                }
            }
            /* (Static Methods) */
            if (raw.functions !== undefined) {
                /* (Legacy Static Methods) */
                if (!Array.isArray(raw.functions)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua functions from singleton-object per name to clustered array..');
                    const rawMethods = raw.functions;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_2.RosettaLuaFunction(name2, rawMethod);
                        this.functions[method.name] = new RosettaLuaFunctionCluster_2.RosettaLuaFunctionCluster(method.name);
                        this.functions[method.name].add(method);
                    }
                }
                /* (Current Static Methods) */
                else {
                    const rawMethods = raw.functions;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_2.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.functions[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_2.RosettaLuaFunctionCluster(methodName);
                            this.functions[methodName] = cluster;
                        }
                        else {
                            cluster = this.functions[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Fields) */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const name2 of Object.keys(rawFields)) {
                    const rawField = rawFields[name2];
                    const field = new RosettaLuaTableField_1.RosettaLuaTableField(name2, rawField);
                    this.fields[field.name] = this.fields[name2] = field;
                }
            }
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            /* (Tables) */
            if (raw.tables !== undefined) {
                const rawTables = raw.tables;
                for (const name of Object.keys(rawTables)) {
                    const rawTable = rawTables[name];
                    let table = this.tables[name];
                    if (table === undefined) {
                        table = new RosettaLuaTable(name, rawTable);
                    }
                    else {
                        table.parse(rawTable);
                    }
                    this.tables[table.name] = this.tables[name] = table;
                }
            }
            /* (Static Methods) */
            if (raw.functions !== undefined) {
                /* (Legacy Static Methods) */
                if (!Array.isArray(raw.functions)) {
                    console.log('PZ-Rosetta: Upgrading legacy Lua functions from singleton-object per name to clustered array..');
                    const rawMethods = raw.functions;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_2.RosettaLuaFunction(name2, rawMethod);
                        this.functions[method.name] = new RosettaLuaFunctionCluster_2.RosettaLuaFunctionCluster(method.name);
                        this.functions[method.name].add(method);
                    }
                }
                /* (Current Static Methods) */
                else {
                    const rawMethods = raw.functions;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_2.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.functions[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_2.RosettaLuaFunctionCluster(methodName);
                            this.functions[methodName] = cluster;
                        }
                        else {
                            cluster = this.functions[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* (Fields) */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const name of Object.keys(rawFields)) {
                    const rawField = rawFields[name];
                    let field = this.fields[name];
                    if (field === undefined) {
                        field = new RosettaLuaTableField_1.RosettaLuaTableField(name, rawField);
                    }
                    else {
                        field.parse(rawField);
                    }
                    this.fields[field.name] = this.fields[name] = field;
                }
            }
        }
        toJSON(patch = false) {
            const { fields, tables, functions, notes } = this;
            const json = {};
            /* (Properties) */
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            /* (Fields) */
            let keys = Object.keys(fields);
            if (keys.length) {
                json.fields = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.fields[key] = fields[key].toJSON(patch);
            }
            /* (Static Methods) */
            keys = Object.keys(functions);
            keys.sort((a, b) => a.localeCompare(b));
            if (keys.length) {
                json.methods = [];
                /* (Flatten MethodClusters into JSON method bodies) */
                for (const key of keys) {
                    for (const func of functions[key].functions)
                        json.function.push(func.toJSON(patch));
                }
            }
            /* (Tables) */
            keys = Object.keys(tables);
            if (keys.length) {
                json.tables = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.tables[key] = tables[key].toJSON(patch);
            }
            return json;
        }
        /**
         * Creates a field in the Lua class.
         *
         * @param name The name of the new field.
         * @returns The new field.
         *
         * @throws Error Thrown if:
         * - A field already exists with the same name in the Lua class.
         */
        createField(name) {
            const field = new RosettaLuaTableField_1.RosettaLuaTableField(name);
            // (Only check for the file instance)
            if (this.fields[field.name]) {
                throw new Error(`A field already exists: ${field.name}`);
            }
            this.fields[field.name] = field;
            return field;
        }
        /**
         * Creates a function in the Lua table.
         *
         * @param name The name of the new function.
         * @returns The new function.
         *
         * @throws Error Thrown if:
         * - A function already exists with the same name in the Lua table.
         */
        createFunction(name) {
            const func = new RosettaLuaFunction_2.RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });
            let cluster = this.functions[func.name];
            if (!cluster) {
                cluster = this.functions[func.name] = new RosettaLuaFunctionCluster_2.RosettaLuaFunctionCluster(name);
            }
            cluster.add(func);
            return func;
        }
        getFunction(...parameterTypes) {
            if (!this.functions.length)
                return undefined;
            for (const cluster of Object.values(this.functions)) {
                for (const method of cluster.functions) {
                    if (method.parameters.length === parameterTypes.length) {
                        let invalid = false;
                        for (let index = 0; index < parameterTypes.length; index++) {
                            if (parameterTypes[index] !== method.parameters[index].type) {
                                invalid = true;
                                break;
                            }
                        }
                        if (invalid)
                            continue;
                        return method;
                    }
                }
            }
            return;
        }
    }
    exports.RosettaLuaTable = RosettaLuaTable;
});
define("src/asledgehammer/rosetta/1.0/typescript/TSUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrapAsTSNamespace = exports.wrapAsTSFile = exports.applyTSDocumentation = exports.paginateNotes = void 0;
    function paginateNotes(notes, length) {
        function _line(line) {
            const split = line === null || line === void 0 ? void 0 : line.trim().split(' ');
            const result = [];
            let s = split[0];
            for (let i = 1; i < split.length; i++) {
                let word = split[i];
                if (s.length + word.length + 1 <= length) {
                    s = s + ' ' + word;
                }
                else {
                    result.push(s);
                    s = word;
                }
            }
            if (s.length)
                result.push(s);
            return result;
        }
        const res = [];
        const lines = notes.split('\n');
        for (const line of lines) {
            const subLines = _line(line);
            for (const subLine of subLines) {
                res.push(subLine);
            }
        }
        return res;
    }
    exports.paginateNotes = paginateNotes;
    function applyTSDocumentation(ds, s, indent) {
        const i = ' '.repeat(indent * 4);
        if (ds.length) {
            if (ds.length === 1) {
                s += `${i}/** ${ds[0]} */\n`;
            }
            else {
                s += `${i}/**\n`;
                for (const next of ds) {
                    s += `${i} * ${next}\n`;
                }
                s = s.substring(0, s.length - 1);
                // s += ds.map((a) => `${i} * ${a}`).join('\n');
                s += `\n${i} */\n`;
            }
        }
        return s;
    }
    exports.applyTSDocumentation = applyTSDocumentation;
    function wrapAsTSFile(text) {
        let s = '';
        s += `/** @noSelfInFile */\n`;
        s += `declare module '@asledgehammer/pipewrench'`;
        if (text.length) {
            return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
        }
        return `${s} {}\n`;
    }
    exports.wrapAsTSFile = wrapAsTSFile;
    function wrapAsTSNamespace(namespace, text) {
        const s = `export namespace ${namespace}`;
        if (text.length) {
            return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
        }
        return `${s} {}\n`;
    }
    exports.wrapAsTSNamespace = wrapAsTSNamespace;
});
define("src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", ["require", "exports", "src/asledgehammer/rosetta/1.0/typescript/TSUtils"], function (require, exports, TSUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.luaFuncToTSFunc = exports.luaTableToTSDict = exports.tsType = exports.luaTableToTS = exports.luaClassToTS = exports.luaFunctionToTS = exports.luaMethodDocumentation = exports.luaConstructorDocumentation = exports.luaConstructorToTS = exports.luaFieldToTS = void 0;
    function luaFieldToTS(field, indent = 0, notesLength) {
        const i = ' '.repeat(indent * 4);
        let s = '';
        /* Documentation */
        let ds = [];
        // if (field.deprecated) ds.push('@deprecated');
        if (field.notes) {
            const notes = (0, TSUtils_1.paginateNotes)(field.notes, notesLength);
            if (ds.length)
                ds.push('');
            for (const line of notes) {
                ds.push(line);
            }
        }
        s = (0, TSUtils_1.applyTSDocumentation)(ds, s, indent);
        s += i;
        /* Definition-line */
        s += `${field.name}: ${tsType(field.type, field.nullable)};`;
        // Format documented variables as spaced for better legability.
        if (ds.length)
            s += '\n';
        return s;
    }
    exports.luaFieldToTS = luaFieldToTS;
    function luaConstructorToTS(con, indent, notesLength) {
        const i = ' '.repeat(indent * 4);
        const ds = luaConstructorDocumentation(con, notesLength);
        let ps = '';
        if (con.parameters && con.parameters.length) {
            ps += '(';
            for (const param of con.parameters) {
                ps += `${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, `;
            }
            ps = ps.substring(0, ps.length - 2) + ')';
        }
        else {
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
        return (0, TSUtils_1.applyTSDocumentation)(ds, '', indent) + fs + '\n';
        // let s = applyTSDocumentation(ds, '', indent);
        // s += `${i}`;
        // s += `constructor${ps};`;
        // // Format documented variables as spaced for better legability.
        // if (ds.length) s += '\n';
        // return s;
    }
    exports.luaConstructorToTS = luaConstructorToTS;
    function luaConstructorDocumentation(con, notesLength) {
        const ds = [];
        /* (Annotations) */
        // if (con.deprecated) ds.push('@deprecated');
        /* (Notes) */
        if (con.notes && con.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_1.paginateNotes)(con.notes, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        /* (Parameters) */
        if (con.parameters && con.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of con.parameters) {
                if (param.notes && param.notes.length) {
                    const notes = (0, TSUtils_1.paginateNotes)(`@param ${param.name} ${param.notes}`, notesLength);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(`@param ${param.name}`);
                }
            }
        }
        return ds;
    }
    exports.luaConstructorDocumentation = luaConstructorDocumentation;
    function luaMethodDocumentation(method, notesLength, overload = false) {
        const ds = [];
        /* (Annotations) */
        if (overload)
            ds.push('@overload');
        if (method.deprecated)
            ds.push('@deprecated');
        /* (Notes) */
        if (method.notes && method.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_1.paginateNotes)(method.notes, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        /* (Parameters) */
        if (method.parameters && method.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of method.parameters) {
                if (param.notes && param.notes.length) {
                    const notes = (0, TSUtils_1.paginateNotes)(`@param ${param.name} ${param.notes}`, notesLength);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(`@param ${param.name}`);
                }
            }
        }
        /* (Returns) */
        if (method.returns && method.returns.notes && method.returns.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_1.paginateNotes)(`@returns ${method.returns.notes}`, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        return ds;
    }
    exports.luaMethodDocumentation = luaMethodDocumentation;
    function luaFunctionToTS(method, indent = 0, notesLength) {
        const i = ' '.repeat(indent * 4);
        const ds = luaMethodDocumentation(method, notesLength, false);
        let ps = '';
        if (method.parameters && method.parameters.length) {
            ps += '(';
            for (const param of method.parameters) {
                ps += `${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, `;
            }
            ps = ps.substring(0, ps.length - 2) + ')';
        }
        else {
            ps = '()';
        }
        const rs = tsType(method.returns.type, method.returns.nullable);
        let mName = method.name;
        if (mName === '__toString__')
            mName = 'toString';
        let fs = `${i}${mName}${ps}: ${rs};`;
        if (fs.length > notesLength) {
            fs = `${i}${mName}(\n`;
            for (const param of method.parameters) {
                fs += `${i}    ${param.name}${param.optional ? '?' : ''}: ${tsType(param.type, param.nullable)}, \n`;
            }
            fs += `${i}): ${rs};`;
        }
        return (0, TSUtils_1.applyTSDocumentation)(ds, '', indent) + fs + '\n';
    }
    exports.luaFunctionToTS = luaFunctionToTS;
    function luaClassToTS(clazz, wrapFile = false) {
        let s = '';
        const valueNames = Object.keys(clazz.values);
        valueNames.sort((a, b) => a.localeCompare(b));
        const fieldNames = Object.keys(clazz.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const methodNames = Object.keys(clazz.methods);
        methodNames.sort((a, b) => a.localeCompare(b));
        const funcNames = Object.keys(clazz.functions);
        funcNames.sort((a, b) => a.localeCompare(b));
        const values = [];
        const fields = [];
        const funcs = [];
        const methods = [];
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
            for (const method of cluster.functions) {
                methods.push(method);
            }
        }
        /* (FUNCTIONS) */
        for (const funcName of funcNames) {
            const cluster = clazz.functions[funcName];
            for (const func of cluster.functions) {
                funcs.push(func);
            }
        }
        /** 100
         * * -4 (module indent)
         * * -3 (' * ')
         */
        let notesLength = 96;
        if (wrapFile)
            notesLength -= 4;
        /* (Class Documentation) */
        const ds = [];
        ds.push(`@customConstructor ${clazz.name}:new`);
        ds.push('');
        ds.push(`Lua Class: ${clazz.name}`);
        if (clazz.notes && clazz.notes.length) {
            ds.push('');
            const lines = (0, TSUtils_1.paginateNotes)(clazz.notes, notesLength);
            for (const line of lines)
                ds.push(line);
        }
        s = (0, TSUtils_1.applyTSDocumentation)(ds, s, 0);
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
            if (is.length)
                is += '\n';
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
            if (is.length)
                is += '\n';
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
            if (is.length)
                is += '\n';
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
            if (is.length)
                is += '\n';
            is += `${i}/* ------------------------------------ */\n`;
            is += `${i}/* ----------- CONSTRUCTORS ----------- */\n`;
            is += `${i}/* ------------------------------------ */\n`;
            is += '\n';
            for (const cons of clazz.constructors) {
                is += `${luaConstructorToTS(cons, 1, notesLength)}\n`;
            }
            is = is.substring(0, is.length - 1);
        }
        if (is.length) {
            s += `{\n\n${is}}`;
        }
        else {
            s += `{}\n`;
        }
        if (wrapFile)
            return (0, TSUtils_1.wrapAsTSFile)(s);
        return s;
    }
    exports.luaClassToTS = luaClassToTS;
    function luaTableToTS(table, wrapFile = false) {
        let s = '';
        const fieldNames = Object.keys(table.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const funcNames = Object.keys(table.functions);
        funcNames.sort((a, b) => a.localeCompare(b));
        const fields = [];
        const funcs = [];
        /* (FIELDS) */
        for (const fieldName of fieldNames) {
            const field = table.fields[fieldName];
            fields.push(field);
        }
        /* (FUNCTIONS) */
        for (const funcName of funcNames) {
            const cluster = table.functions[funcName];
            for (const func of cluster.functions) {
                funcs.push(func);
            }
        }
        /** 100
         * * -4 (module indent)
         * * -3 (' * ')
         */
        let notesLength = 96;
        if (wrapFile)
            notesLength -= 4;
        /* (Class Documentation) */
        const ds = [];
        ds.push(`Lua Table: ${table.name}`);
        if (table.notes && table.notes.length) {
            ds.push('');
            const lines = (0, TSUtils_1.paginateNotes)(table.notes, notesLength);
            for (const line of lines)
                ds.push(line);
        }
        s = (0, TSUtils_1.applyTSDocumentation)(ds, s, 0);
        s += `export class ${table.name} `;
        let i = '    ';
        let is = '';
        if (fields.length) {
            if (is.length)
                is += '\n';
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
            if (is.length)
                is += '\n';
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
        }
        else {
            s += `{}\n`;
        }
        if (wrapFile)
            return (0, TSUtils_1.wrapAsTSFile)(s);
        return s;
    }
    exports.luaTableToTS = luaTableToTS;
    function tsType(type, nullable) {
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
        }
        else if (type.startsWith('table<')) {
            result = luaTableToTSDict(type);
        }
        else if (type.startsWith('table')) {
            result = 'any';
        }
        else if (type.startsWith('fun(')) {
            result = luaFuncToTSFunc(type);
        }
        if (nullable) {
            result = result + ' | null';
        }
        return wrapped ? `(${result})` : result;
    }
    exports.tsType = tsType;
    function luaTableToTSDict(raw) {
        if (!raw.startsWith('table<')) {
            throw new Error('The table is invalid: ' + raw);
        }
        let result = '';
        if (raw.indexOf('<') === -1 || raw.indexOf('>') === -1) {
            result = 'any';
        }
        else {
            let temp = raw.substring(raw.indexOf('<'));
            temp = temp.substring(1, temp.indexOf('>'));
            if (temp.indexOf(',') === -1) {
                result = 'any';
            }
            else {
                const split = temp.split(',').map((s) => s.trim());
                if (split.length !== 2) {
                    result = 'any';
                }
                else {
                    if (split[0] !== 'number' && split[0] !== 'string') {
                        result = 'any';
                    }
                    else {
                        result = `{[key: ${split[0]}]: ${tsType(split[1], false)}}`;
                    }
                }
            }
        }
        return result;
    }
    exports.luaTableToTSDict = luaTableToTSDict;
    function luaFuncToTSFunc(raw) {
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
        let params = [];
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
    exports.luaFuncToTSFunc = luaFuncToTSFunc;
});
define("src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", ["require", "exports", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator"], function (require, exports, LuaTypeScriptGenerator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyLuaDocumentation = exports.paginateNotes = exports.generateLuaTable = exports.generateLuaClass = exports.generateLuaConstructor = exports.generateGlobalLuaFunction = exports.generateLuaFunction = exports.generateLuaParameterBody = exports.generateLuaValue = exports.generateGlobalLuaField = exports.generateLuaField = exports.luaType = void 0;
    function luaType(type, nullable) {
        let result = type;
        if (nullable) {
            result += ' | nil';
        }
        return result;
    }
    exports.luaType = luaType;
    const generateLuaField = (field) => {
        const notes = field.notes && field.notes.length ? field.notes.replace(/\n/g, '<br>') : '';
        return `--- @field ${field.name} ${luaType(field.type, field.nullable)} ${notes}`;
    };
    exports.generateLuaField = generateLuaField;
    function generateGlobalLuaField(field) {
        const ds = [];
        // (Field notes)
        if (field.notes && field.notes.length) {
            const notes = paginateNotes(field.notes, 96);
            for (const line of notes)
                ds.push(line);
        }
        // (Field type)
        ds.push(`@type ${(0, LuaTypeScriptGenerator_1.tsType)(field.type, field.nullable)}`);
        let s = `${field.name}`;
        if (field.defaultValue) {
            let value = field.defaultValue;
            // Try parsing as a int.
            if (parseInt(value) == null && parseFloat(value) == null) {
                // String-wrapping with escaped double-quotes.
                value = `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
            }
            s += ` = ${value}`;
        }
        return applyLuaDocumentation(ds, 0) + `\n${s};`;
    }
    exports.generateGlobalLuaField = generateGlobalLuaField;
    const generateLuaValue = (containerName, field) => {
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
    exports.generateLuaValue = generateLuaValue;
    const generateLuaParameterBody = (params) => {
        let s = '';
        if (params.length) {
            for (const param of params) {
                s += `${param.name}, `;
            }
            s = s.substring(0, s.length - 2);
        }
        return `(${s})`;
    };
    exports.generateLuaParameterBody = generateLuaParameterBody;
    const generateLuaFunction = (className, operator, func) => {
        let ds = [];
        // Function Description
        if (func.notes && func.notes.length) {
            const notes = paginateNotes(func.notes, 100);
            for (const line of notes) {
                ds.push(line);
            }
        }
        // Parameter Documentation
        if (func.parameters && func.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of func.parameters) {
                const pps = `@param ${param.name}${param.optional ? '?' : ''} ${luaType(param.type, param.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = paginateNotes(pps + ' ' + param.notes.trim(), 100);
                    for (const line of notes) {
                        ds.push(line);
                    }
                }
                else {
                    ds.push(pps);
                }
            }
        }
        // Returns Documentation
        if (func.returns) {
            if (ds.length)
                ds.push('');
            let rs = `@return ${luaType(func.returns.type, func.returns.nullable)}`;
            if (func.returns.notes && func.returns.notes.length) {
                rs += ' result';
                const notes = paginateNotes(rs + ' ' + func.returns.notes.trim(), 100);
                for (const line of notes) {
                    ds.push(line);
                }
            }
            else {
                ds.push(rs);
            }
        }
        let fName = func.name;
        if (fName === '__toString__')
            fName = 'toString';
        let fs = `function ${className}${operator}${fName}${(0, exports.generateLuaParameterBody)(func.parameters)} end`;
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
    exports.generateLuaFunction = generateLuaFunction;
    const generateGlobalLuaFunction = (func) => {
        let ds = [];
        // Function Description
        if (func.notes && func.notes.length) {
            const notes = paginateNotes(func.notes, 100);
            for (const line of notes) {
                ds.push(line);
            }
        }
        // Parameter Documentation
        if (func.parameters && func.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of func.parameters) {
                const pps = `@param ${param.name}${param.optional ? '?' : ''} ${luaType(param.type, param.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = paginateNotes(pps + ' ' + param.notes.trim(), 100);
                    for (const line of notes) {
                        ds.push(line);
                    }
                }
                else {
                    ds.push(pps);
                }
            }
        }
        // Returns Documentation
        if (func.returns) {
            if (ds.length)
                ds.push('');
            let rs = `@return ${luaType(func.returns.type, func.returns.nullable)}`;
            if (func.returns.notes && func.returns.notes.length) {
                rs += ' result';
                const notes = paginateNotes(rs + ' ' + func.returns.notes.trim(), 100);
                for (const line of notes) {
                    ds.push(line);
                }
            }
            else {
                ds.push(rs);
            }
        }
        let fName = func.name;
        if (fName === '__toString__')
            fName = 'toString';
        let fs = `function ${fName}${(0, exports.generateLuaParameterBody)(func.parameters)} end`;
        if (fs.length > 100) {
            fs = `function ${fName}(\n`;
            for (const parameter of func.parameters) {
                fs += `    ${parameter.name},\n`;
            }
            fs = fs.substring(0, fs.length - 2);
            fs += `\n) end`;
        }
        return `${applyLuaDocumentation(ds, 0)}${fs}`;
    };
    exports.generateGlobalLuaFunction = generateGlobalLuaFunction;
    const generateLuaConstructor = (className, con) => {
        let ds = [];
        // Function Description
        if (con.notes && con.notes.length) {
            const notes = paginateNotes(con.notes, 100);
            for (const line of notes) {
                ds.push(line);
            }
        }
        // Parameter Documentation
        if (con.parameters && con.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of con.parameters) {
                const pps = `@param ${param.name}${param.optional ? '?' : ''} ${luaType(param.type, param.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = paginateNotes(pps + ' ' + param.notes.trim(), 100);
                    for (const line of notes) {
                        ds.push(line);
                    }
                }
                else {
                    ds.push(pps);
                }
            }
        }
        ds.push('');
        ds.push(`@return ${className}`);
        let fs = `function ${className}:new${(0, exports.generateLuaParameterBody)(con.parameters)} end`;
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
    exports.generateLuaConstructor = generateLuaConstructor;
    const generateLuaClass = (clazz) => {
        const ds = [];
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
                ds.push((0, exports.generateLuaField)(value));
            }
        }
        // Generate any fields in the class here.
        const fieldNames = Object.keys(clazz.fields);
        if (fieldNames.length) {
            fieldNames.sort((a, b) => a.localeCompare(b));
            for (const fieldName of fieldNames) {
                const field = clazz.fields[fieldName];
                ds.push((0, exports.generateLuaField)(field));
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
                const ss = (0, exports.generateLuaValue)(clazz.name, value);
                if (ss.length)
                    s += ss + '\n';
            }
            s += '\n';
        }
        // Generate any constructors in the class here.
        for (const cons of clazz.constructors) {
            s += (0, exports.generateLuaConstructor)(clazz.name, cons) + '\n';
        }
        // Generate any methods in the class here.
        const methodNames = Object.keys(clazz.methods);
        if (methodNames.length) {
            s += '\n';
            methodNames.sort((a, b) => a.localeCompare(b));
            for (const methodName of methodNames) {
                const cluster = clazz.methods[methodName];
                for (const method of cluster.functions) {
                    s += (0, exports.generateLuaFunction)(clazz.name, ':', method) + '\n\n';
                }
            }
        }
        // Generate any functions in the class here.
        const functionNames = Object.keys(clazz.functions);
        if (functionNames.length) {
            functionNames.sort((a, b) => a.localeCompare(b));
            for (const functionName of functionNames) {
                const cluster = clazz.functions[functionName];
                for (const func of cluster.functions) {
                    s += (0, exports.generateLuaFunction)(clazz.name, '.', func) + '\n\n';
                }
            }
        }
        return s;
    };
    exports.generateLuaClass = generateLuaClass;
    const generateLuaTable = (table) => {
        const ds = [];
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
                ds.push((0, exports.generateLuaField)(field));
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
                const ss = (0, exports.generateLuaValue)(table.name, value);
                if (ss.length)
                    s += ss + '\n';
            }
            s += '\n';
        }
        // Generate any functions in the table here.
        const functionNames = Object.keys(table.functions);
        if (functionNames.length) {
            functionNames.sort((a, b) => a.localeCompare(b));
            for (const functionName of functionNames) {
                const cluster = table.functions[functionName];
                for (const func of cluster.functions) {
                    s += (0, exports.generateLuaFunction)(table.name, '.', func) + '\n\n';
                }
            }
        }
        return s;
    };
    exports.generateLuaTable = generateLuaTable;
    function paginateNotes(notes, length) {
        function _line(line) {
            const split = line === null || line === void 0 ? void 0 : line.trim().split(' ');
            const result = [];
            let s = split[0];
            for (let i = 1; i < split.length; i++) {
                let word = split[i];
                if (s.length + word.length + 1 <= length) {
                    s = s + ' ' + word;
                }
                else {
                    result.push(s);
                    s = word;
                }
            }
            if (s.length)
                result.push(s);
            return result;
        }
        const res = [];
        const lines = notes.split('\n');
        for (const line of lines) {
            const subLines = _line(line);
            for (const subLine of subLines) {
                res.push(subLine);
            }
        }
        return res;
    }
    exports.paginateNotes = paginateNotes;
    function applyLuaDocumentation(ds, indent) {
        const i = ' '.repeat(indent * 4);
        let s = '';
        if (ds.length) {
            for (const next of ds) {
                if (!next.trim().startsWith('--- '))
                    s += `${i}--- `;
                s += `${next}\n`;
            }
        }
        return s;
    }
    exports.applyLuaDocumentation = applyLuaDocumentation;
});
define("src/asledgehammer/rosetta/1.0/util", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isNameValid = exports.get = exports.$get = exports.validateLuaVariableName = exports.combine = exports.combineArrays = exports.randomString = exports.css = exports.html = void 0;
    const html = function (c, ...d) {
        let a = '';
        for (let b = 0; b < c.length - 1; b++)
            a += c[b] + d[b];
        return a + c[c.length - 1];
    };
    exports.html = html;
    const css = function (c, ...d) {
        let a = '';
        for (let b = 0; b < c.length - 1; b++)
            a += c[b] + d[b];
        return a + c[c.length - 1];
    };
    exports.css = css;
    const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const randomString = (length) => {
        if (length < 0) {
            throw new Error(`Length cannot be negative. (Given: ${length})`);
        }
        else if (length === 0) {
            return '';
        }
        let built = '';
        for (let index = 0; index < length; index++) {
            built += alphanumeric[Math.round(Math.random() * (alphanumeric.length - 1))];
        }
        return built;
    };
    exports.randomString = randomString;
    function combineArrays(options, ...args) {
        let a = [];
        for (let index = 0; index < args.length; index++) {
            for (const b of args[index]) {
                /* (Array Duplicate Policy Check) */
                if (a.indexOf(b) !== -1 && !options.allowArrayDuplicates)
                    continue;
                a.push(b);
            }
        }
        return a;
    }
    exports.combineArrays = combineArrays;
    function combine(options, ...args) {
        let obj = {};
        for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            if (!arg)
                continue;
            const keys = Object.keys(arg);
            for (const key of keys) {
                const value = arg[key];
                if (!obj[key]) {
                    obj[key] = value;
                    continue;
                }
                if (Array.isArray(obj[key])) {
                    obj[key] = combineArrays(options, [obj[key], value]);
                }
                else if (typeof obj[key] === 'object') {
                    obj[key] = combine(options, [obj[key], value]);
                }
                else {
                    obj[key] = value;
                }
            }
        }
        return obj;
    }
    exports.combine = combine;
    const validateLuaVariableName = (nameOriginal) => {
        nameOriginal = nameOriginal.trim();
        let name = '';
        for (const c of nameOriginal) {
            if (name === '') {
                if (c === ' ')
                    continue; // No leading spaces.
                else if (/[0-9]/.test(c))
                    continue; // No leading numbers.
            }
            if (!/'^(%a+_%a+)$'/.test(c))
                name += c; // Only valid lua characters.
        }
        return name;
    };
    exports.validateLuaVariableName = validateLuaVariableName;
    function $get(id) {
        return $(`#${id}`);
    }
    exports.$get = $get;
    ;
    function get(id) {
        return document.getElementById(id);
    }
    exports.get = get;
    function isNameValid(name) {
        const result = /[a-zA-z_]+[a-zA-z0-9]*/g.exec(name);
        if (!result || result.length !== 1 || result.index !== 0)
            return false;
        return result[0] === name;
    }
    exports.isNameValid = isNameValid;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaType", ["require", "exports", "src/asledgehammer/rosetta/1.0/RosettaEntity"], function (require, exports, RosettaEntity_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaType = void 0;
    /**
     * **RosettaJavaType**
     *
     * @author Jab
     */
    class RosettaJavaType extends RosettaEntity_9.RosettaEntity {
        constructor(raw) {
            super(raw);
            this.nullable = true;
            const basic = this.readRequiredString('basic');
            this.rawBasic = basic;
            if (basic.indexOf('.') !== -1) {
                const split = basic.split('.');
                this.basic = split[split.length - 1];
            }
            else {
                this.basic = basic;
            }
            this.nullable = this.readBoolean('nullable') || true;
            this.checkNullableFlag();
            this.full = this.readString('full');
        }
        toJSON(patch = false) {
            const { rawBasic: basic, full, nullable } = this;
            this.checkNullableFlag();
            const json = {};
            json.basic = basic;
            json.full = full;
            json.nullable = nullable != null ? nullable : undefined;
            return json;
        }
        checkNullableFlag() {
            if (this.nullable && !this.isNullPossible()) {
                this.nullable = false;
            }
        }
        isNullPossible() {
            switch (this.basic) {
                case 'boolean':
                case 'byte':
                case 'short':
                case 'int':
                case 'float':
                case 'double':
                case 'long':
                case 'char':
                case 'null':
                case 'void': {
                    return false;
                }
            }
            return true;
        }
    }
    exports.RosettaJavaType = RosettaJavaType;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaParameter", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaType", "src/asledgehammer/rosetta/1.0/RosettaUtils"], function (require, exports, Assert, RosettaEntity_10, RosettaJavaType_1, RosettaUtils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaParameter = void 0;
    /**
     * **RosettaJavaParameter**
     *
     * @author Jab
     */
    class RosettaJavaParameter extends RosettaEntity_10.RosettaEntity {
        constructor(raw) {
            super(raw);
            Assert.assertNonNull(raw.type, 'raw.type');
            this.name = (0, RosettaUtils_5.formatName)(this.readRequiredString('name'));
            this.type = new RosettaJavaType_1.RosettaJavaType(raw.type);
            this.parse(raw);
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
        }
        toJSON(patch = false) {
            const { name, notes, type } = this;
            const json = {};
            /* (Properties) */
            if (!patch)
                json.type = type.toJSON(patch);
            json.name = name;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            return json;
        }
    }
    exports.RosettaJavaParameter = RosettaJavaParameter;
});
define("src/asledgehammer/rosetta/1.0/java/Types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaConstructor", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaParameter"], function (require, exports, Assert, RosettaEntity_11, RosettaJavaParameter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaConstructor = void 0;
    /**
     * **RosettaJavaConstructor**
     *
     * @author Jab
     */
    class RosettaJavaConstructor extends RosettaEntity_11.RosettaEntity {
        constructor(clazz, raw) {
            super(raw);
            this.parameters = [];
            Assert.assertNonNull(clazz, 'clazz');
            this.clazz = clazz;
            /* (Properties) */
            this.deprecated = this.readBoolean('deprecated') != null;
            this.modifiers = this.readModifiers();
            this.notes = this.readNotes(raw);
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                for (const rawParameter of rawParameters) {
                    const parameter = new RosettaJavaParameter_1.RosettaJavaParameter(rawParameter);
                    this.parameters.push(parameter);
                }
            }
        }
        parse(raw) {
            /* (Properties) */
            this.notes = this.readNotes(raw);
            /* (Parameters) */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                /*
                 * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
                 *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
                 */
                if (this.parameters.length !== rawParameters.length) {
                    throw new Error(`The class ${this.clazz.name}'s constructor's parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`);
                }
                for (let index = 0; index < rawParameters.length; index++) {
                    this.parameters[index].parse(rawParameters[index]);
                }
            }
        }
        toJSON(patch = false) {
            const { notes, deprecated, modifiers, parameters } = this;
            const json = {};
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            /* (Properties) */
            if (!patch) {
                json.deprecated = deprecated;
                if (modifiers.length)
                    json.modifiers = modifiers;
            }
            /* (Properties) */
            if (parameters.length) {
                json.parameters = [];
                for (const parameter of parameters)
                    json.parameters.push(parameter.toJSON(patch));
            }
            return json;
        }
        isStatic() {
            return this.hasModifier('static');
        }
        isFinal() {
            return this.hasModifier('final');
        }
        hasModifiers() {
            return this.modifiers && !!this.modifiers.length;
        }
        hasModifier(modifier) {
            return this.hasModifiers() && this.modifiers.indexOf(modifier) !== -1;
        }
        getVisibilityScope() {
            if (!this.modifiers.length)
                return 'package';
            if (this.hasModifier('public'))
                return 'public';
            else if (this.hasModifier('protected'))
                return 'protected';
            else if (this.hasModifier('private'))
                return 'private';
            else
                return 'package';
        }
        getSignature() {
            let signature = `constructor`;
            if (this.parameters && this.parameters.length) {
                signature += '_';
                for (const param of this.parameters) {
                    signature += `${param.type.basic}-`;
                }
                signature = signature.substring(0, signature.length - 1);
            }
            return signature;
        }
    }
    exports.RosettaJavaConstructor = RosettaJavaConstructor;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaReturns", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaType"], function (require, exports, Assert, RosettaEntity_12, RosettaJavaType_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaReturns = void 0;
    /**
     * **RosettaJavaReturns**
     *
     * @author Jab
     */
    class RosettaJavaReturns extends RosettaEntity_12.RosettaEntity {
        constructor(raw) {
            super(raw);
            Assert.assertNonNull(raw.type, 'raw.type');
            this.type = new RosettaJavaType_2.RosettaJavaType(raw.type);
            this.parse(raw);
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
        }
        toJSON(patch = false) {
            const { type, notes } = this;
            const json = {};
            json.type = type.toJSON(patch);
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            return json;
        }
    }
    exports.RosettaJavaReturns = RosettaJavaReturns;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaMethod", ["require", "exports", "src/asledgehammer/rosetta/1.0/RosettaUtils", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaParameter", "src/asledgehammer/rosetta/1.0/java/RosettaJavaReturns"], function (require, exports, RosettaUtils_6, RosettaEntity_13, RosettaJavaParameter_2, RosettaJavaReturns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaMethod = void 0;
    /**
     * **RosettaJavaMethod**
     *
     * @author Jab
     */
    class RosettaJavaMethod extends RosettaEntity_13.RosettaEntity {
        constructor(raw) {
            super(raw);
            this.parameters = [];
            /* PROPERTIES */
            this.name = (0, RosettaUtils_6.formatName)(this.readRequiredString('name'));
            this.deprecated = this.readBoolean('deprecated') != null;
            this.modifiers = this.readModifiers();
            /* PARAMETERS */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                for (const rawParameter of rawParameters) {
                    this.parameters.push(new RosettaJavaParameter_2.RosettaJavaParameter(rawParameter));
                }
            }
            /* RETURNS */
            if (raw.returns === undefined) {
                throw new Error(`Method does not have returns definition: ${this.name}`);
            }
            this.returns = new RosettaJavaReturns_1.RosettaJavaReturns(raw.returns);
            this.notes = this.readNotes();
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            /* PARAMETERS */
            if (raw.parameters !== undefined) {
                const rawParameters = raw.parameters;
                /*
                 * (To prevent deep-logic issues, check to see if Rosetta's parameters match the length of
                 *  the overriding parameters. If not, this is the fault of the patch, not Rosetta)
                 */
                if (this.parameters.length !== rawParameters.length) {
                    throw new Error(`The method ${this.name}'s parameters does not match the parameters to override. (method: ${this.parameters.length}, given: ${rawParameters.length})`);
                }
                for (let index = 0; index < rawParameters.length; index++) {
                    this.parameters[index].parse(rawParameters[index]);
                }
            }
            /* RETURNS */
            if (raw.returns !== undefined) {
                this.returns.parse(raw.returns);
            }
        }
        toJSON(patch = false) {
            const { name, deprecated, modifiers, notes, parameters, returns } = this;
            const json = {};
            /* (Properties) */
            if (!patch) {
                json.deprecated = deprecated;
                if (modifiers.length)
                    json.modifiers = modifiers;
            }
            json.name = name;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            /* (Parameters) */
            if (parameters.length) {
                json.parameters = [];
                for (const parameter of parameters)
                    json.parameters.push(parameter.toJSON(patch));
            }
            /* (Returns) */
            json.returns = returns.toJSON(patch);
            return json;
        }
        isStatic() {
            return this.hasModifier('static');
        }
        isFinal() {
            return this.hasModifier('final');
        }
        hasModifiers() {
            return this.modifiers && !!this.modifiers.length;
        }
        hasModifier(modifier) {
            return this.hasModifiers() && this.modifiers.indexOf(modifier) !== -1;
        }
        getVisibilityScope() {
            if (!this.modifiers.length)
                return 'package';
            if (this.hasModifier('public'))
                return 'public';
            else if (this.hasModifier('protected'))
                return 'protected';
            else if (this.hasModifier('private'))
                return 'private';
            else
                return 'package';
        }
        getSignature() {
            let signature = `${this.name}`;
            if (this.parameters && this.parameters.length) {
                signature += '_';
                for (const param of this.parameters) {
                    signature += `${param.type.basic}-`;
                }
                signature = signature.substring(0, signature.length - 1);
            }
            return signature;
        }
    }
    exports.RosettaJavaMethod = RosettaJavaMethod;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaMethodCluster", ["require", "exports", "src/asledgehammer/Assert"], function (require, exports, Assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaMethodCluster = void 0;
    /**
     * **RosettaJavaMethodCluster**
     *
     * @author Jab
     */
    class RosettaJavaMethodCluster {
        constructor(name) {
            this.methods = [];
            Assert.assertNonEmptyString(name, 'name');
            this.name = name;
        }
        add(method) {
            const indexOf = this.methods.indexOf(method);
            if (indexOf !== -1) {
                this.methods[indexOf].parse(method.raw);
                return;
            }
            this.methods.push(method);
        }
        getWithParameters(...parameterNames) {
            for (const method of this.methods) {
                const parameters = method.parameters;
                if (parameterNames.length === parameters.length) {
                    if (parameterNames.length === 0)
                        return method;
                    let invalid = false;
                    for (let i = 0; i < parameters.length; i++) {
                        if (parameters[i].type.basic !== parameterNames[i]) {
                            invalid = true;
                            break;
                        }
                    }
                    if (invalid)
                        continue;
                    return method;
                }
            }
            return;
        }
    }
    exports.RosettaJavaMethodCluster = RosettaJavaMethodCluster;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaType"], function (require, exports, Assert, RosettaEntity_14, RosettaJavaType_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaField = void 0;
    /**
     * **RosettaJavaField**
     *
     * @author Jab
     */
    class RosettaJavaField extends RosettaEntity_14.RosettaEntity {
        constructor(name, raw) {
            super(raw);
            Assert.assertNonEmptyString(name, 'name');
            Assert.assertNonNull(raw.type, 'raw.type');
            this.name = name;
            this.modifiers = this.readModifiers();
            this.type = new RosettaJavaType_3.RosettaJavaType(raw.type);
            this.deprecated = this.readBoolean('deprecated') != null;
            this.notes = this.readNotes();
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
        }
        toJSON(patch = false) {
            const { name, notes, modifiers, type, deprecated } = this;
            const json = {};
            /* (Properties) */
            json.name = name;
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            if (!patch) {
                if (modifiers.length)
                    json.modifiers = modifiers;
                json.deprecated = deprecated;
                json.type = type.toJSON(patch);
            }
            return json;
        }
        isStatic() {
            return this.hasModifier('static');
        }
        isFinal() {
            return this.hasModifier('final');
        }
        hasModifiers() {
            return this.modifiers && !!this.modifiers.length;
        }
        hasModifier(modifier) {
            return this.hasModifiers() && this.modifiers.indexOf(modifier) !== -1;
        }
        getVisibilityScope() {
            if (!this.modifiers.length)
                return 'package';
            if (this.hasModifier('public'))
                return 'public';
            else if (this.hasModifier('protected'))
                return 'protected';
            else if (this.hasModifier('private'))
                return 'private';
            else
                return 'package';
        }
    }
    exports.RosettaJavaField = RosettaJavaField;
});
define("src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/1.0/RosettaUtils", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/java/RosettaJavaConstructor", "src/asledgehammer/rosetta/1.0/java/RosettaJavaMethodCluster", "src/asledgehammer/rosetta/1.0/java/RosettaJavaMethod", "src/asledgehammer/rosetta/1.0/java/RosettaJavaField"], function (require, exports, Assert, RosettaUtils_7, RosettaEntity_15, RosettaJavaConstructor_1, RosettaJavaMethodCluster_1, RosettaJavaMethod_1, RosettaJavaField_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaClass = exports.RosettaJavaNamespace = void 0;
    /**
     * **RosettaJavaNamespace**
     *
     * @author Jab
     */
    class RosettaJavaNamespace extends RosettaEntity_15.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            this.classes = {};
            Assert.assertNonEmptyString(name, 'name');
            this.name = name;
            /* (Classes) */
            if (Object.keys(raw).length) {
                for (const clazzName of Object.keys(raw)) {
                    const rawClazz = raw[clazzName];
                    let clazz = this.classes[clazzName];
                    if (clazz === undefined) {
                        clazz = new RosettaJavaClass(clazzName, this, rawClazz);
                    }
                    else {
                        clazz.parse(rawClazz);
                    }
                    /* (Formatted Class Name) */
                    this.classes[clazz.name] = this.classes[clazzName] = clazz;
                }
            }
        }
        parse(raw) {
            /* (Classes) */
            for (const clazzName of Object.keys(raw)) {
                const rawClazz = raw[clazzName];
                let clazz = this.classes[clazzName];
                if (clazz === undefined) {
                    clazz = new RosettaJavaClass(clazzName, this, rawClazz);
                }
                else {
                    clazz.parse(rawClazz);
                }
                /* (If the class exists, parse the additional data as a patch) */
                if (this.classes[clazzName] !== undefined) {
                    this.classes[clazzName].parse(rawClazz);
                    continue;
                }
                /* (Formatted Class Name) */
                this.classes[clazz.name] = this.classes[clazzName] = clazz;
            }
        }
        toJSON(patch = false) {
            const { name, classes } = this;
            const json = {};
            /* (Properties) */
            json.name = name;
            /* (Classes) */
            const keys = Object.keys(classes);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json[key] = classes[key].toJSON(patch);
            }
            return json;
        }
    }
    exports.RosettaJavaNamespace = RosettaJavaNamespace;
    /**
     * **RosettaJavaClass**
     *
     * @author Jab
     */
    class RosettaJavaClass extends RosettaEntity_15.RosettaEntity {
        constructor(name, namespace, raw) {
            super(raw);
            this.fields = {};
            this.methods = {};
            this.constructors = [];
            Assert.assertNonEmptyString(name, 'name');
            Assert.assertNonNull(namespace, 'namsepace');
            this.namespace = namespace;
            this.name = (0, RosettaUtils_7.formatName)(name);
            this.extendz = this.readString('extends');
            this.modifiers = this.readModifiers();
            this.deprecated = this.readBoolean('deprecated') != null;
            this.javaType = this.readRequiredString('javaType');
            this.notes = this.readNotes();
            /* FIELDS */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const fieldName of Object.keys(rawFields)) {
                    const rawField = rawFields[fieldName];
                    const field = new RosettaJavaField_1.RosettaJavaField(fieldName, rawField);
                    this.fields[field.name] = this.fields[fieldName] = field;
                }
            }
            /* METHODS */
            if (raw.methods !== undefined) {
                const rawMethods = raw.methods;
                for (const rawMethod of rawMethods) {
                    const method = new RosettaJavaMethod_1.RosettaJavaMethod(rawMethod);
                    const { name: methodName } = method;
                    let cluster;
                    if (this.methods[methodName] === undefined) {
                        cluster = new RosettaJavaMethodCluster_1.RosettaJavaMethodCluster(methodName);
                        this.methods[methodName] = cluster;
                    }
                    else {
                        cluster = this.methods[methodName];
                    }
                    cluster.add(method);
                }
            }
            /* CONSTRUCTORS */
            if (raw.constructors !== undefined) {
                const rawConstructors = raw.constructors;
                for (const rawConstructor of rawConstructors) {
                    this.constructors.push(new RosettaJavaConstructor_1.RosettaJavaConstructor(this, rawConstructor));
                }
            }
        }
        parse(raw) {
            /* (Properties) */
            this.notes = this.readNotes(raw);
            /* (Fields) */
            if (raw.fields !== undefined) {
                const rawFields = raw.fields;
                for (const fieldName of Object.keys(rawFields)) {
                    const rawField = rawFields[fieldName];
                    const field = this.fields[fieldName];
                    if (field === undefined) {
                        throw new Error(`Cannot find field in class: ${this.name}.${fieldName}`);
                    }
                    field.parse(rawField);
                }
            }
            /* (Methods) */
            if (raw.methods !== undefined) {
                const rawMethods = raw.methods;
                for (const rawMethod of rawMethods) {
                    const method = new RosettaJavaMethod_1.RosettaJavaMethod(rawMethod);
                    const { name: methodName } = method;
                    const cluster = this.methods[methodName];
                    if (this.methods[methodName] === undefined) {
                        throw new Error(`Cannot find method in class: ${this.name}.${methodName}`);
                    }
                    cluster.add(method);
                }
            }
            /* (Constructors) */
            if (raw.constructors !== undefined) {
                const rawConstructors = raw.constructors;
                for (const rawConstructor of rawConstructors) {
                    const rawParameterCount = rawConstructor.parameters !== undefined ? rawConstructor.parameters.length : 0;
                    let foundConstructor;
                    for (const nextConstructor of this.constructors) {
                        const nextParameterCount = nextConstructor.parameters.length;
                        if (rawParameterCount === nextParameterCount) {
                            foundConstructor = nextConstructor;
                            break;
                        }
                    }
                    if (foundConstructor === undefined) {
                        throw new Error(`Class Constructor ${this.name} not found with param count: ${rawParameterCount}`);
                    }
                    foundConstructor.parse(rawConstructor);
                }
            }
        }
        getField(id) {
            return this.fields[id];
        }
        getConstructor(...parameterTypes) {
            if (!this.constructors.length)
                return undefined;
            for (const conztructor of this.constructors) {
                if (conztructor.parameters.length === parameterTypes.length) {
                    let invalid = false;
                    for (let index = 0; index < parameterTypes.length; index++) {
                        if (parameterTypes[index] !== conztructor.parameters[index].type.basic) {
                            invalid = true;
                            break;
                        }
                    }
                    if (invalid)
                        continue;
                    return conztructor;
                }
            }
            return;
        }
        getMethod(...parameterTypes) {
            if (!this.methods.length)
                return undefined;
            for (const cluster of Object.values(this.methods)) {
                for (const method of cluster.methods) {
                    if (method.parameters.length === parameterTypes.length) {
                        let invalid = false;
                        for (let index = 0; index < parameterTypes.length; index++) {
                            if (parameterTypes[index] !== method.parameters[index].type.basic) {
                                invalid = true;
                                break;
                            }
                        }
                        if (invalid)
                            continue;
                        return method;
                    }
                }
            }
            return;
        }
        toJSON(patch = false) {
            const { extendz, modifiers, javaType, deprecated, notes, fields, constructors, methods } = this;
            const json = {};
            /* (Properties) */
            json.notes = notes !== undefined && notes !== '' ? this.writeNotes(notes) : undefined;
            if (!patch) {
                if (extendz !== undefined)
                    json.extends = extendz;
                if (modifiers !== undefined)
                    json.modifiers = modifiers;
                json.deprecated = deprecated;
                json.javaType = javaType;
            }
            /* (Fields) */
            let keys = Object.keys(fields);
            keys.sort((a, b) => a.localeCompare(b));
            if (keys.length) {
                json.fields = {};
                for (const key of keys) {
                    json.fields[key] = fields[key].toJSON(patch);
                }
            }
            /* (Constructors) */
            if (constructors.length) {
                json.constructors = [];
                for (const conztructor of constructors)
                    json.constructors.push(conztructor.toJSON(patch));
            }
            /* (Methods) */
            keys = Object.keys(methods);
            keys.sort((a, b) => a.localeCompare(b));
            if (keys.length) {
                json.methods = [];
                /* (Flatten MethodClusters into JSON method bodies) */
                for (const key of keys) {
                    for (const method of methods[key].methods)
                        json.methods.push(method.toJSON(patch));
                }
            }
            return json;
        }
    }
    exports.RosettaJavaClass = RosettaJavaClass;
});
define("src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator"], function (require, exports, LuaLuaGenerator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.luaType = exports.generateJavaClass = exports.generateGlobalJavaMethod = exports.generateJavaMethod = exports.generateJavaConstructor = exports.generateJavaField = void 0;
    function generateJavaField(field) {
        if (field.getVisibilityScope() !== 'public')
            return '';
        const notes = field.notes && field.notes.length ? field.notes.replace(/\n/g, '<br>') : '';
        return `@field ${field.name} ${luaType(field.type.basic, field.type.nullable)} ${notes}`;
    }
    exports.generateJavaField = generateJavaField;
    function generateJavaConstructor(className, con) {
        const ds = [];
        const cs = [];
        // Notes.
        if (con.notes && con.notes.trim().length) {
            const notes = (0, LuaLuaGenerator_1.paginateNotes)(con.notes.trim(), 96);
            for (const line of notes)
                ds.push(line);
        }
        // Parameter(s).
        if (con.parameters && con.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of con.parameters) {
                let line = `@param ${param.name} ${luaType(param.type.basic, param.type.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = (0, LuaLuaGenerator_1.paginateNotes)(line + ' ' + param.notes.trim(), 96);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(line);
                }
            }
        }
        // Returns.
        if (ds.length)
            ds.push('');
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
        }
        else {
            cs.push(line);
        }
        return (0, LuaLuaGenerator_1.applyLuaDocumentation)(ds, 0) + cs.join('\n');
    }
    exports.generateJavaConstructor = generateJavaConstructor;
    function generateJavaMethod(className, operator, method) {
        const ds = [];
        const cs = [];
        // Notes.
        if (method.notes && method.notes.trim().length) {
            const notes = (0, LuaLuaGenerator_1.paginateNotes)(method.notes.trim(), 96);
            for (const line of notes)
                ds.push(line);
        }
        // Parameter(s).
        if (method.parameters && method.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of method.parameters) {
                let line = `@param ${param.name} ${luaType(param.type.basic, param.type.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = (0, LuaLuaGenerator_1.paginateNotes)(line + ' ' + param.notes.trim(), 96);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(line);
                }
            }
        }
        // Returns.
        if (method.returns) {
            if (ds.length)
                ds.push('');
            let line = `@return ${luaType(method.returns.type.basic, method.returns.type.nullable)}`;
            if (method.returns.notes && method.returns.notes.trim().length) {
                const notes = (0, LuaLuaGenerator_1.paginateNotes)(line + ' result ' + method.returns.notes.trim(), 96);
                for (const line of notes)
                    ds.push(line);
            }
            else {
                ds.push(line);
            }
        }
        let mName = method.name;
        if (mName === '__toString__')
            mName = 'toString';
        // Constructor-Body.
        let line = `function ${className}${operator}${mName}(`;
        if (method.parameters && method.parameters.length) {
            for (const param of method.parameters) {
                line += param.name + ', ';
            }
            line = line.substring(0, line.length - 2);
        }
        line += ') end';
        // If too long, render as slinky.
        if (line.length > 100) {
            cs.push(`function ${className}${operator}${mName}(`);
            if (method.parameters && method.parameters.length) {
                for (const param of method.parameters) {
                    cs.push(`    ${param.name},`);
                }
                cs[cs.length - 1] = cs[cs.length - 1].substring(0, cs[cs.length - 1].length - 1);
            }
            cs.push(') end');
        }
        else {
            cs.push(line);
        }
        return (0, LuaLuaGenerator_1.applyLuaDocumentation)(ds, 0) + cs.join('\n');
    }
    exports.generateJavaMethod = generateJavaMethod;
    function generateGlobalJavaMethod(method) {
        const ds = [];
        const cs = [];
        // Notes.
        if (method.notes && method.notes.trim().length) {
            const notes = (0, LuaLuaGenerator_1.paginateNotes)(method.notes.trim(), 96);
            for (const line of notes)
                ds.push(line);
        }
        // Parameter(s).
        if (method.parameters && method.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of method.parameters) {
                let line = `@param ${param.name} ${luaType(param.type.basic, param.type.nullable)}`;
                if (param.notes && param.notes.trim().length) {
                    const notes = (0, LuaLuaGenerator_1.paginateNotes)(line + ' ' + param.notes.trim(), 96);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(line);
                }
            }
        }
        // Returns.
        if (method.returns) {
            if (ds.length)
                ds.push('');
            let line = `@return ${luaType(method.returns.type.basic, method.returns.type.nullable)}`;
            if (method.returns.notes && method.returns.notes.trim().length) {
                const notes = (0, LuaLuaGenerator_1.paginateNotes)(line + ' result ' + method.returns.notes.trim(), 96);
                for (const line of notes)
                    ds.push(line);
            }
            else {
                ds.push(line);
            }
        }
        let mName = method.name;
        if (mName === '__toString__')
            mName = 'toString';
        // Constructor-Body.
        let line = `function ${mName}(`;
        if (method.parameters && method.parameters.length) {
            for (const param of method.parameters) {
                line += param.name + ', ';
            }
            line = line.substring(0, line.length - 2);
        }
        line += ') end';
        // If too long, render as slinky.
        if (line.length > 100) {
            cs.push(`function ${mName}(`);
            if (method.parameters && method.parameters.length) {
                for (const param of method.parameters) {
                    cs.push(`    ${param.name},`);
                }
                cs[cs.length - 1] = cs[cs.length - 1].substring(0, cs[cs.length - 1].length - 1);
            }
            cs.push(') end');
        }
        else {
            cs.push(line);
        }
        return (0, LuaLuaGenerator_1.applyLuaDocumentation)(ds, 0) + cs.join('\n');
    }
    exports.generateGlobalJavaMethod = generateGlobalJavaMethod;
    function generateJavaClass(clazz) {
        const ds = [];
        const cs = [];
        // Class-notes.
        if (clazz.notes && clazz.notes.trim().length) {
            const notes = (0, LuaLuaGenerator_1.paginateNotes)(clazz.notes.trim(), 96);
            for (const line of notes)
                ds.push(line);
        }
        // Class definition line.
        ds.push(`@class ${clazz.name}`);
        if (clazz.extendz && clazz.extendz.length && clazz.extendz !== 'Object') {
            ds[ds.length - 1] = ds[ds.length - 1] + `: ${clazz.extendz}`;
        }
        // Method(s) & Functtion(s).
        const staticMethods = [];
        const methods = [];
        const methodClusterNames = Object.keys(clazz.methods);
        if (methodClusterNames.length) {
            methodClusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of methodClusterNames) {
                const cluster = clazz.methods[clusterName];
                for (const method of cluster.methods) {
                    if (method.isStatic())
                        staticMethods.push(method);
                    else
                        methods.push(method);
                }
            }
        }
        // Field(s).
        const fieldNames = Object.keys(clazz.fields);
        if (fieldNames.length) {
            fieldNames.sort((a, b) => a.localeCompare(b));
            for (const fieldName of fieldNames) {
                const field = clazz.fields[fieldName];
                if (field.getVisibilityScope() !== 'public')
                    continue;
                if (!field.isStatic())
                    continue;
                if (!field.isFinal())
                    continue;
                ds.push(generateJavaField(field));
            }
        }
        // Constructor(s).
        const constructors = [];
        for (const con of clazz.constructors) {
            if (con.getVisibilityScope() !== 'public')
                continue;
            constructors.push(con);
        }
        cs.push(`${clazz.name} = {};`);
        // If nothing is defined for the class, render it empty.
        if (!methods.length
            && !staticMethods.length
            && !constructors.length) {
            return (0, LuaLuaGenerator_1.applyLuaDocumentation)(ds, 0) + cs.join('\n');
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
        return (0, LuaLuaGenerator_1.applyLuaDocumentation)(ds, 0) + cs.join('\n');
    }
    exports.generateJavaClass = generateJavaClass;
    function luaType(type, optional) {
        let result = type;
        switch (type) {
            // Internal Strings are transformed to Lua's 'string' type.
            case 'String': {
                result = 'string';
                break;
            }
            // Internal reference to tables.
            case 'KahluaTable': {
                result = 'any';
                break;
            }
            default: {
                break;
            }
        }
        if (optional) {
            result += ' | nil';
        }
        return result;
    }
    exports.luaType = luaType;
});
define("src/asledgehammer/mallet/component/Component", ["require", "exports", "src/asledgehammer/rosetta/1.0/util"], function (require, exports, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Component = void 0;
    class Component {
        constructor(options) {
            this.options = options;
            /* (Parameter: string id) */
            if (this.options && this.options.id) {
                this.id = this.options.id;
            }
            else {
                this.id = `component-${(0, util_1.randomString)(8)}`;
            }
            /* (Parameter: string[] classes) */
            if (this.options && this.options.classes) {
                this.classes = this.options.classes;
            }
            else {
                this.classes = [];
            }
            /* (Parameter: {[id: string]: any} styles) */
            if (this.options && this.options.style) {
                this.style = this.options.style;
            }
            else {
                this.style = {};
            }
            /* (Parameter: string domType) */
            if (this.options && this.options.domType) {
                this.domType = this.options.domType;
            }
            else {
                this.domType = 'div';
            }
        }
        render() {
            const { id } = this;
            return (0, util_1.html) `<div id="${id}" ${this.buildClasses()} ${this.buildStyle()}>${this.onRender()}</div>`;
        }
        listen() { }
        buildClasses() {
            const { classes } = this;
            if (!classes.length) {
                return '';
            }
            return `class="${classes.join(' ')}"`;
        }
        buildStyle() {
            const keys = Object.keys(this.style);
            if (!keys.length)
                return '';
            let built = '';
            for (const key of keys) {
                built += `${key}: ${this.style[key]};`;
            }
            return `style="${built.trim()}"`;
        }
    }
    exports.Component = Component;
});
define("src/asledgehammer/mallet/component/CardComponent", ["require", "exports", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/Component"], function (require, exports, util_2, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CardComponent = void 0;
    class CardComponent extends Component_1.Component {
        constructor(options) {
            super((0, util_2.combine)({ allowArrayDuplicates: false }, { classes: ['card', 'responsive-card', 'rounded-0', 'shadow-lg'] }, options));
        }
        onRender() {
            return (0, util_2.html) `${this.headerHTML()}${this.bodyHTML()}`;
        }
        headerHTML() {
            let htmlHeaderInner = this.onHeaderHTML();
            return htmlHeaderInner ? (0, util_2.html) `<div class="card-header">${htmlHeaderInner}</div>` : '';
        }
        onHeaderHTML() {
            return undefined;
        }
        bodyHTML() {
            let htmlBodyInner = this.onBodyHTML();
            return htmlBodyInner ? (0, util_2.html) `<div class="card-body">${htmlBodyInner}</div>` : '';
        }
        onBodyHTML() {
            return undefined;
        }
        footerHTML() {
            let htmlFooterInner = this.onFooterHTML();
            return htmlFooterInner ? (0, util_2.html) `<div class="card-footer">${htmlFooterInner}</div>` : '';
        }
        onFooterHTML() {
            return undefined;
        }
    }
    exports.CardComponent = CardComponent;
});
define("src/asledgehammer/mallet/component/CodeLanguage", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/mallet/component/NameModeType", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/Delta", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDeltaEditor = exports.toDelta = exports.fromDelta = void 0;
    function fromDelta(ops) {
        let md = '';
        for (const op of ops) {
            const { attributes } = op;
            let link = undefined;
            let s = '';
            let w = '';
            if (op.insert)
                s = op.insert;
            if (attributes) {
                if (attributes.bold && attributes.italic)
                    w = '***';
                else if (attributes.bold && !attributes.italic)
                    w = '**';
                else if (attributes.italic)
                    w = '*';
                if (attributes.link)
                    link = attributes.link;
            }
            s = `${w}${s}${w}`;
            if (link)
                s = `[${s}](${link})`;
            md += s;
        }
        return md;
    }
    exports.fromDelta = fromDelta;
    function toDelta(md, forcedAttributes = undefined) {
        var _a;
        const ops = [];
        let op = { insert: '' };
        if (forcedAttributes)
            op.attributes = Object.assign({}, forcedAttributes);
        const nextOp = (push = true) => {
            if (push)
                ops.push(op);
            op = { insert: '' };
            if (forcedAttributes)
                op.attributes = Object.assign({}, forcedAttributes);
        };
        const lastOp = () => {
            let op3 = ops.pop();
            if (!op3) {
                op3 = { insert: '' };
                if (forcedAttributes)
                    op3.attributes = Object.assign({}, forcedAttributes);
            }
            op = op3;
        };
        let c0 = '', c1 = '', c2 = '', ccc = '';
        const next = (i) => {
            c0 = md[i + 0]; // Character + 0
            c1 = md[i + 1]; // Character + 1
            c2 = md[i + 2]; // Character + 2
            ccc = '';
            if (c0 && c1 && c2) {
                ccc = c0 + c1 + c2;
            }
            else if (c0 && c1) {
                ccc = c0 + c1;
            }
            else {
                ccc = c0;
            }
        };
        let linkSeek = 0;
        let linkStage = 0;
        let linkText = '';
        let link = '';
        for (let i = 0; i < md.length; i++) {
            next(i);
            let seek = 0;
            let charsToSeek = '';
            if (ccc.startsWith('***')) {
                if (op.insert && op.insert.length)
                    nextOp();
                charsToSeek = '***';
                seek = 3;
                if (!op.attributes)
                    op.attributes = {};
                op.attributes.italic = true;
                op.attributes.bold = true;
            }
            else if (ccc.startsWith('**')) {
                if (op.insert && op.insert.length)
                    nextOp();
                charsToSeek = '**';
                seek = 2;
                if (!op.attributes)
                    op.attributes = {};
                op.attributes.bold = true;
            }
            else if (ccc.startsWith('*')) {
                if (op.insert && op.insert.length)
                    nextOp();
                charsToSeek = '*';
                seek = 1;
                if (!op.attributes)
                    op.attributes = {};
                op.attributes.italic = true;
            }
            else if (c0 === '[') {
                if (op.insert && op.insert.length)
                    nextOp();
                linkStage = 1;
                linkSeek = 1;
                linkText = '';
                link = '';
            }
            const handleLink = () => {
                while (c0 !== ']') {
                    c0 = md[i + linkSeek];
                    linkSeek++;
                    // Catch EOL here.
                    if (!c0) {
                        console.warn(`Invalid markdown! "${md}`);
                        linkStage = 0;
                        lastOp();
                        return false;
                    }
                    if (c0 !== ']')
                        linkText += c0;
                }
                // Catch bad link syntax here.
                if (md.substring(i + linkSeek - 1, i + linkSeek + 1) !== '](') {
                    console.warn(`Invalid markdown! "${md}`);
                    // Catch EOL here.
                    if (!c0) {
                        console.warn(`Invalid markdown! "${md}`);
                        linkStage = 0;
                        lastOp();
                        return false;
                    }
                }
                while (c0 !== ')') {
                    c0 = md[i + linkSeek];
                    linkSeek++;
                    // Catch EOL here.
                    if (!c0) {
                        console.warn(`Invalid markdown! "${md}`);
                        linkStage = 0;
                        lastOp();
                        return false;
                    }
                    if (c0 !== ')')
                        link += c0;
                }
                // Set link.
                // Check for inner-text markdown. In delta, we can stack link attributes to allow rich text features.
                let opsCheck = toDelta(linkText, Object.assign(Object.assign({}, forcedAttributes), { link }));
                for (const _ of opsCheck)
                    ops.push(_);
                nextOp();
                // Reset metadata.
                linkStage = 0;
                i += linkSeek - 1;
                return true;
            };
            if (linkStage === 1) {
                // Valid link. Continue on..
                if (handleLink())
                    continue;
            }
            // Run-out the insert length until the attribute-closure appears.
            if (seek !== 0) {
                while (true) {
                    next(i + seek);
                    // Catch EOL here.
                    if (!c0) {
                        console.warn(`Invalid markdown! "${md}`);
                        return [{ insert: md }];
                    }
                    if (ccc.startsWith(charsToSeek)) {
                        const ourText = md.substring(i + charsToSeek.length, i + seek);
                        seek += charsToSeek.length - 1;
                        i += seek; // Set ahead.
                        const ops3 = toDelta(ourText, Object.assign(Object.assign({}, forcedAttributes), op.attributes));
                        for (const n of ops3) {
                            ops.push(n);
                        }
                        nextOp(true);
                        break;
                    }
                    else {
                        seek++;
                    }
                }
                continue;
            }
            // Normal insert chars.
            op.insert += c0;
        }
        if ((_a = op.insert) === null || _a === void 0 ? void 0 : _a.length)
            nextOp();
        // Filter empty inserts.
        let ops2 = [];
        for (const next of ops) {
            if (!next.insert || !next.insert.length)
                continue;
            ops2.push(next);
        }
        return ops2;
    }
    exports.toDelta = toDelta;
    const createDeltaEditor = (id, markdown, onChange) => {
        if (!markdown)
            markdown = '';
        const toolbarOptions = [['bold', 'italic', 'link']];
        const options = {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions,
                QuillMarkdown: {}
            }
        };
        // @ts-ignore
        const editor = new Quill(`#${id}`, options);
        // @ts-ignore
        new QuillMarkdown(editor, {});
        let flag = false;
        const update = () => {
            if (flag)
                return;
            flag = true;
            const { ops } = editor.editor.getContents(0, 99999999);
            let markdown = fromDelta(ops);
            if (markdown === '\n')
                markdown = '';
            else if (!markdown.endsWith('\n'))
                markdown += '\n';
            onChange(markdown);
            flag = false;
        };
        let flag2 = false;
        editor.on('text-change', () => {
            if (flag || flag2)
                return;
            update();
        });
        // Apply markdown as delta.
        if (markdown && markdown.length) {
            setTimeout(() => {
                flag2 = true;
                editor.editor.insertContents(0, toDelta(markdown));
                flag2 = false;
            }, 1);
        }
    };
    exports.createDeltaEditor = createDeltaEditor;
});
define("src/asledgehammer/mallet/component/lua/LuaCard", ["require", "exports", "highlight.js", "src/asledgehammer/mallet/component/CardComponent", "src/asledgehammer/Delta", "src/asledgehammer/rosetta/1.0/util"], function (require, exports, hljs, CardComponent_1, Delta_1, util_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaCard = void 0;
    class LuaCard extends CardComponent_1.CardComponent {
        constructor(app, options) {
            super(options);
            this.languageMode = 'lua';
            this.app = app;
            this.idPreview = `${this.id}-preview`;
            this.idPreviewCode = `${this.id}-preview-code`;
            this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
            this.idBtnLanguageLua = `${this.id}-btn-language-lua`;
            this.idBtnLanguageTypeScript = `${this.id}-btn-language-typescript`;
            this.idBtnLanguageJSON = `${this.id}-btn-language-json`;
        }
        listenEdit(entity, idBtnEdit, mode, title, nameSelected = undefined, type) {
            (0, util_3.$get)(idBtnEdit).on('click', () => {
                const { $btnName, $titleName, $inputName } = this.app.modalName;
                $titleName.html(title);
                if (mode === 'edit_parameter'
                    || mode === 'edit_lua_class'
                    || mode === 'edit_lua_table'
                    || mode === 'edit_field'
                    || mode === 'edit_function'
                    || mode === 'edit_method'
                    || mode === 'edit_value') {
                    $btnName.html('Edit');
                    $btnName.removeClass('btn-success');
                    $btnName.addClass('btn-primary');
                }
                else {
                    $btnName.html('Create');
                    $btnName.addClass('btn-success');
                    $btnName.removeClass('btn-primary');
                }
                $inputName.val(entity.name);
                this.app.modalName.nameMode = mode;
                if (!nameSelected)
                    nameSelected = entity.name;
                this.app.modalName.nameSelected = nameSelected;
                switch (type) {
                    case 'class': {
                        this.app.modalName.luaClass = this.options.entity;
                        break;
                    }
                    case 'table': {
                        this.app.modalName.luaTable = this.options.entity;
                        break;
                    }
                    case 'function': {
                        this.app.modalName.luaFunction = this.options.entity;
                        break;
                    }
                    case 'method': {
                        this.app.modalName.luaMethod = this.options.entity;
                        break;
                    }
                    case 'constructor': {
                        this.app.modalName.luaConstructor = this.options.entity;
                        break;
                    }
                    case 'field': {
                        this.app.modalName.luaField = this.options.entity;
                        break;
                    }
                    case 'global_field': {
                        this.app.modalName.globalLuaField = this.options.entity;
                        break;
                    }
                    case 'global_function': {
                        this.app.modalName.globalLuaFunction = this.options.entity;
                        break;
                    }
                }
                this.app.modalName.show(true);
            });
        }
        renderEdit(idBtnEdit) {
            return (0, util_3.html) `
            <!-- Edit Button -->
            <div style="position: absolute; padding: 0; right: 0; top: 0">
                <button 
                    id="${idBtnEdit}"
                    class="btn btn-sm responsive-btn float-end"
                    style="position: relative; top: 5px; right: 5px;"
                    title="Edit Name"
                >
                    <div class="btn-pane" style="width: 30px; height: 30px;">
                        <i class="fa-solid fa-pen"></i>
                    </div>
                </button>
            </div>
        `;
        }
        listenNotes(entity, idNotes) {
            (0, Delta_1.createDeltaEditor)(idNotes, entity.notes, (markdown) => {
                while (markdown.endsWith('\n'))
                    markdown = markdown.substring(0, markdown.length - 1);
                entity.notes = markdown;
                this.update();
                this.app.renderCode();
            });
        }
        renderNotes(idNotes) {
            return (0, util_3.html) `
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <div id="${idNotes}" style="background-color: #222;"></div>
            </div>
        `;
        }
        listenDefaultValue(entity, idDefaultValue) {
            const $defaultValue = (0, util_3.$get)(idDefaultValue);
            $defaultValue.on('input', () => {
                entity.defaultValue = $defaultValue.val();
                this.update();
                this.app.renderCode();
            });
        }
        renderDefaultValue(defaultValue, idDefaultValue) {
            if (!defaultValue)
                defaultValue = '';
            return (0, util_3.html) `
            <div class="mb-3">
                <label for="${idDefaultValue}" class="form-label mb-2">Default Value</label>
                <textarea
                    id="${idDefaultValue}"
                    class="form-control responsive-input mt-1"
                    spellcheck="false"
                >${defaultValue}</textarea>
            </div>
        `;
        }
        listenParameters(entity, type) {
            const _this = this;
            const { parameters } = entity;
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;
                const idNullable = `${entity.name}-parameter-${param.name}-nullable`;
                const idOptional = `${entity.name}-parameter-${param.name}-optional`;
                (0, Delta_1.createDeltaEditor)(idParamNotes, param.notes, (markdown) => {
                    while (markdown.endsWith('\n'))
                        markdown = markdown.substring(0, markdown.length - 1);
                    param.notes = markdown;
                    this.update();
                    this.app.renderCode();
                });
                const $select = (0, util_3.$get)(idParamType);
                const $customInput = (0, util_3.$get)(`${idParamType}-custom-input`);
                $select.on('change', (value) => {
                    param.type = value.target.value;
                    if (param.type === 'custom') {
                        $customInput.show();
                        // We default to 'any' for an undefined custom value.
                        param.type = 'any';
                    }
                    else {
                        $customInput.hide();
                        $customInput.val(''); // Clear custom field.
                    }
                    this.update();
                    this.app.renderCode();
                });
                // When the custom field is changed, set this as the type.
                $customInput.on('input', () => {
                    const val = $customInput.val();
                    if (val === '')
                        param.type = 'any';
                    else
                        param.type = val;
                    this.update();
                    this.app.renderCode();
                });
                $customInput.on('focusout', () => {
                    const value = $customInput.val().trim();
                    switch (value.toLowerCase()) {
                        // Here the reference stays valid.
                        case 'custom':
                            break;
                        // Here the reference converts to its select option.
                        case 'void':
                        case 'any':
                        case 'nil':
                        case 'boolean':
                        case 'number':
                        case 'string':
                            param.type = value;
                            $select.val(value);
                            $customInput.hide();
                            $customInput.val(''); // Clear custom field.
                            this.update();
                            this.app.renderCode();
                            break;
                    }
                });
                (0, util_3.$get)(idBtnDelete).on('click', () => {
                    this.app.modalConfirm.show(() => {
                        entity.parameters.splice(entity.parameters.indexOf(param), 1);
                        this.update();
                        // Implicit check for refreshability for parameters.
                        if (this.refreshParameters)
                            this.refreshParameters();
                    }, `Delete Parameter ${param.name}?`);
                });
                /* (Nullable CheckBox) */
                (0, util_3.$get)(idNullable).on('change', function () {
                    param.nullable = this.checked;
                    _this.update();
                    _this.app.renderCode();
                });
                /* (Optional CheckBox) */
                (0, util_3.$get)(idOptional).on('change', function () {
                    param.optional = this.checked;
                    _this.update();
                    _this.app.renderCode();
                });
                this.listenEdit({
                    name: param.name
                }, idBtnEdit, 'edit_parameter', 'Edit Parameter Name', `${entity.name}-${param.name}`, type);
            }
            const idBtnAdd = `btn-${entity.name}-parameter-add`;
            (0, util_3.$get)(idBtnAdd).on('click', () => {
                const { $inputName, $titleName } = this.app.modalName;
                this.app.modalName.nameMode = 'new_parameter';
                if (type === 'constructor') {
                    this.app.modalName.luaConstructor = entity;
                }
                else if (type === 'function') {
                    this.app.modalName.luaFunction = entity;
                }
                else if (type === 'method') {
                    this.app.modalName.luaMethod = entity;
                }
                else if (type === 'global_function') {
                    this.app.modalName.globalLuaFunction = entity;
                }
                this.app.modalName.nameSelected = `${type}-${entity.name}`;
                $titleName.html('Add Parameter');
                $inputName.val('');
                this.app.modalName.show(true);
            });
        }
        renderParameters(entity, show = false) {
            const { parameters } = entity;
            const idAccordion = `${entity.name}-parameters-accordion`;
            let htmlParams = '';
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;
                const idNullable = `${entity.name}-parameter-${param.name}-nullable`;
                const idOptional = `${entity.name}-parameter-${param.name}-optional`;
                htmlParams += (0, util_3.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button 
                                class="border-0 accordion-button collapsed rounded-0 p-0 text-white"
                                style="background-color: transparent !important"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#${idCollapse}"
                                aria-expanded="false"
                                aria-controls="${idCollapse}"
                            >
                                <div 
                                    class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2"
                                    style="display: inline;"
                                >
                                    <strong>${param.type}</strong>
                                </div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                        <div 
                            style="position: absolute; height: 32px; top: 5px; right: 2rem; z-index: 4;"
                        >
                            <!-- Delete Button -->
                            <button 
                                id="${idBtnDelete}"
                                class="btn btn-sm responsive-btn float-end ms-1"
                                style="z-index: 4"
                            >
                                <div class="btn-pane">
                                    <i class="fa-solid fa-xmark"></i>
                                </div>
                            </button>

                            <!-- Edit Button -->
                            <button 
                                id="${idBtnEdit}"
                                class="btn btn-sm responsive-btn float-end"
                                style="z-index: 4"
                            >
                                <div class="btn-pane"> 
                                    <i class="fa-solid fa-pen"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div 
                        id="${idCollapse}" 
                        class="accordion-collapse collapse rounded-0"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#${idAccordion}"
                    >
                        <div class="accordion-body bg-dark" style="position: relative;">
                            
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
                            </div>
                            
                            <div class="mb-3 form-check">
                                <!-- Optional Flag -->
                                <div class="col-auto">
                                    <input 
                                        id="${idOptional}"
                                        type="checkbox"
                                        class="form-check-input"
                                        ${param.optional ? ' checked' : ''}
                                    />
                                    <label class="form-check-label" for="${idOptional}">
                                        Optional
                                    </label>
                                </div>

                                <!-- Nullable Flag -->
                                <div class="col-auto">
                                    <input 
                                        id="${idNullable}"
                                        type="checkbox"
                                        class="form-check-input"
                                        ${param.nullable ? ' checked' : ''}
                                    />
                                    <label class="form-check-label" for="${idNullable}">
                                        Nullable
                                    </label>
                                </div>
                            </div>

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <div id="${idParamNotes}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
            const idBtnAdd = `btn-${entity.name}-parameter-add`;
            return (0, util_3.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button 
                        class="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#${idAccordion}"
                        aria-expanded="true"
                        aria-controls="${idAccordion}"
                    >
                        <strong>Parameters</strong>
                    </button>
                    <div style="position: absolute; height: 32px; top: 5px; right: 5px; z-index: 4;">
                        <!-- Add Button -->
                        <button id="${idBtnAdd}" class="btn btn-sm responsive-btn float-end ms-1">
                            <div class="btn-pane">
                               <i class="fa-solid fa-plus"></i>
                            </div>
                        </button>
                    </div>
                </div>
                <div id="${idAccordion}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                </div>
            </div>
        `;
        }
        update() {
            const { idPreviewCode } = this;
            const $pre = (0, util_3.$get)(idPreviewCode);
            $pre.empty();
            let text = this.onRenderPreview(this.languageMode);
            if (text.endsWith('\n'))
                text = text.substring(0, text.length - 1);
            // @ts-ignore
            const highlightedCode = hljs.default.highlightAuto(text, [this.languageMode]).value;
            $pre.append(highlightedCode);
        }
        listenPreview() {
            const { idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON, idBtnPreviewCopy } = this;
            // Copy the code.
            (0, util_3.$get)(idBtnPreviewCopy).on('click', (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(this.onRenderPreview('lua'));
            });
            (0, util_3.$get)(idBtnLanguageLua).on('click', () => {
                this.languageMode = 'lua';
                this.update();
            });
            (0, util_3.$get)(idBtnLanguageTypeScript).on('click', () => {
                this.languageMode = 'typescript';
                this.update();
            });
            (0, util_3.$get)(idBtnLanguageJSON).on('click', () => {
                this.languageMode = 'json';
                this.update();
            });
        }
        renderPreview(show) {
            const { idPreview, idPreviewCode, idBtnPreviewCopy, idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON } = this;
            return (0, util_3.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button 
                        class="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#${idPreview}"
                        aria-expanded="true"
                        aria-controls="${idPreview}"
                    >
                        <strong>Preview</strong>
                    </button>

                    <!-- Copy Button -->
                    <button 
                        id="${idBtnPreviewCopy}"
                        class="btn btn-sm responsive-btn"
                        style="z-index: 4; position: absolute; top: 5px; right: 5px;"
                        title="Copy Code"
                    >
                        <div class="btn-pane"> 
                            <i class="fa-solid fa-copy"></i>
                        </div>
                    </button>
                </div>
                <div 
                    id="${idPreview}"
                    class="card-body mb-0 p-0 collapse${show ? ' show' : ''}"
                    style="position: relative;"
                >
                    <div class="p-2">
                        <button 
                            id="${idBtnLanguageLua}"
                            class="btn btn-sm btn-primary"
                            title="View Lua Code"
                        >
                            Lua
                        </button>
                        <button 
                            id="${idBtnLanguageTypeScript}"
                            class="btn btn-sm btn-primary"
                            title="View Lua Code"
                        >
                            TypeScript
                        </button>
                        <button 
                            id="${idBtnLanguageJSON}"
                            class="btn btn-sm btn-primary"
                            title="View Lua Code"
                        >
                            Rosetta JSON
                        </button>
                    </div>
                    <pre 
                        id="${idPreviewCode}"
                        class="w-100 h-100 p-4 m-0"
                        style="background-color: #111; overflow: scroll; max-height: 512px;"
                    ></pre>
                </div>
            </div>
        `;
        }
        listenReturns(entity, idReturnType, idReturnNotes, idSelect) {
            const { returns } = entity;
            (0, Delta_1.createDeltaEditor)(idReturnNotes, entity.returns.notes, (markdown) => {
                while (markdown.endsWith('\n'))
                    markdown = markdown.substring(0, markdown.length - 1);
                entity.returns.notes = markdown;
                this.update();
                this.app.renderCode();
            });
            const _this = this;
            const $select = (0, util_3.$get)(idReturnType);
            const $customInput = (0, util_3.$get)(`${idSelect}-custom-input`);
            const idNullable = `${entity.name}-returns-nullable`;
            $select.on('change', (value) => {
                returns.type = value.target.value;
                if (returns.type === 'custom') {
                    $customInput.show();
                }
                else {
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                }
                this.update();
                this.app.renderCode();
            });
            $customInput.on('change', () => {
                const val = $customInput.val();
                if (val === '')
                    returns.type = 'any';
                else
                    returns.type = val;
                this.update();
                this.app.renderCode();
            });
            $customInput.on('focusout', () => {
                const value = $customInput.val().trim();
                switch (value.toLowerCase()) {
                    // Here the reference stays valid.
                    case 'custom':
                        break;
                    // Here the reference converts to its select option.
                    case 'void':
                    case 'any':
                    case 'nil':
                    case 'boolean':
                    case 'number':
                    case 'string':
                        returns.type = value;
                        $select.val(value);
                        $customInput.hide();
                        $customInput.val(''); // Clear custom field.
                        this.update();
                        this.app.renderCode();
                        break;
                }
            });
            /* (Nullable CheckBox) */
            (0, util_3.$get)(idNullable).on('change', function () {
                entity.returns.nullable = this.checked;
                _this.update();
                _this.app.renderCode();
            });
        }
        renderReturns(entity, idReturnType, idReturnNotes, show = false) {
            const { returns } = entity;
            let { notes } = returns;
            if (!notes)
                notes = '';
            const idCard = `${entity.name}-returns-card`;
            const idNullable = `${entity.name}-returns-nullable`;
            return (0, util_3.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button 
                        class="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#${idCard}"
                        aria-expanded="true"
                        aria-controls="${idCard}"
                    >
                        <strong>Returns</strong>
                    </button>
                </div>
                <div id="${idCard}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <!-- Return Type -->
                    <div class="mb-3">
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', returns.type, true)}
                    </div>
                    <div class="mb-3 form-check">
                        
                        <!-- Nullable Flag -->
                        <div class="col-auto">
                            <input 
                                id="${idNullable}"
                                type="checkbox"
                                class="form-check-input"
                                ${returns.nullable ? ' checked' : ''}
                            />
                            <label class="form-check-label" for="${idNullable}">Nullable</label>
                        </div>
                    </div>
                    
                    <!-- Return Notes -->
                    <div>
                        <label for="${idReturnNotes}" class="form-label">Description</label>
                        <div id="${idReturnNotes}" style="background-color: #222 !important;"></div>
                    </div>
                </div>
            </div>
        `;
        }
        listenType(entity, idType, idSelect) {
            const _this = this;
            const $select = (0, util_3.$get)(idType);
            const $customInput = (0, util_3.$get)(`${idSelect}-custom-input`);
            const $nullable = (0, util_3.$get)(`${entity.name}-type-nullable`);
            $select.on('change', (value) => {
                entity.type = value.target.value;
                if (entity.type === 'custom') {
                    $customInput.show();
                    // We default to 'any' for an undefined custom value.
                    entity.type = 'any';
                }
                else {
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                }
                this.update();
                this.app.renderCode();
            });
            $customInput.on('input', () => {
                const val = $customInput.val();
                if (val === '') {
                    entity.type = 'any';
                }
                else {
                    entity.type = val;
                }
                this.update();
                this.app.renderCode();
            });
            $customInput.on('focusout', () => {
                const value = $customInput.val().trim();
                switch (value.toLowerCase()) {
                    // Here the reference stays valid.
                    case 'custom':
                        break;
                    // Here the reference converts to its select option.
                    case 'void':
                    case 'any':
                    case 'nil':
                    case 'boolean':
                    case 'number':
                    case 'string':
                        entity.type = value;
                        $select.val(value);
                        $customInput.hide();
                        $customInput.val(''); // Clear custom field.
                        this.update();
                        this.app.renderCode();
                        break;
                }
            });
            /* (Nullable CheckBox) */
            $nullable.on('change', function () {
                entity.nullable = this.checked;
                _this.update();
                _this.app.renderCode();
            });
        }
        renderType(name, type, nullable, idReturnType) {
            const idTypeCard = `${name}-type-card`;
            const idNullable = `${name}-type-nullable`;
            return (0, util_3.html) `
            <div class="card responsive-subcard">
                <div class="card-header">
                    <button 
                        class="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#${idTypeCard}"
                        aria-expanded="true"
                        aria-controls="${idTypeCard}"
                    >
                        Type
                    </button>   
                </div>
                <div id="${idTypeCard}" class="card-body collapse show">
                    <div class="mb-3">
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', type, false)}
                    </div>
                    <!-- Nullable Flag -->
                    <div class="col-auto">
                        <input 
                            id="${idNullable}"
                            type="checkbox"
                            class="form-check-input"
                            ${nullable ? ' checked' : ''}
                        />
                        <label class="form-check-label" for="${idNullable}">Nullable</label>
                    </div>
                </div>
            </div>
        `;
        }
        static renderTypeSelect(idSelect, label = '', value = 'any', margin) {
            // Determine if custom field should show.
            let style = '';
            let customInputValue = value;
            value = value.trim();
            switch (value.toLowerCase()) {
                // Here the reference stays valid.
                case 'custom':
                    style = '';
                    customInputValue = value;
                    break;
                // Erase custom definition here.
                case 'void':
                case 'any':
                case 'nil':
                case 'boolean':
                case 'number':
                case 'string':
                    style = 'display: none';
                    customInputValue = '';
                    break;
                // Everything else gets shoved into the custom value.
                default:
                    customInputValue = value;
                    value = 'custom';
                    style = '';
            }
            return (0, util_3.html) `
            <div class="${margin ? 'mb-2' : ''}">

                <!-- Type Selection List -->
                <select 
                    id="${idSelect}"
                    class="form-select responsive-select"
                    aria-label="${label}"
                >
                    <option value="any" ${value === 'any' ? 'selected' : ''}>
                        <strong>Any</strong>
                    </option>
                    <option value="void" ${value === 'void' ? 'selected' : ''}>
                        <strong>Void</strong>
                    </option>
                    <option value="nil" ${value === 'nil' ? 'selected' : ''}>
                        <strong>Nil</strong>
                    </option>
                    <option value="boolean" ${value === 'boolean' ? 'selected' : ''}>
                        <strong>Boolean</strong>
                    </option>
                    <option value="number" ${value === 'number' ? 'selected' : ''}>
                        <strong>Number</strong>
                    </option>
                    <option value="string" ${value === 'string' ? 'selected' : ''}>
                        <strong>String</strong>
                    </option>
                    <option value="custom" ${value === 'custom' ? 'selected' : ''}>
                        <strong>Custom</strong>
                    </option>
                </select>
                
                <!-- Manual Input for Custom Type -->
                <input 
                    id="${idSelect}-custom-input"
                    class="form-control responsive-input mt-2"
                    type="text"
                    style="${style}"
                    value="${customInputValue}"
                />
            
            </div>
        `;
        }
        static getTypeIcon(type) {
            switch (type.toLocaleLowerCase().trim()) {
                case 'class': return 'fa-solid fa-box-archive text-light mx-2 desaturate';
                case 'constructor': return 'fa-solid fa-copyright text-light mx-2 desaturate';
                case 'nil': return 'fa-solid fa-ban fa-danger mx-2 desaturate';
                case 'void': return 'fa-solid fa-xmark mx-2 desaturate';
                case 'nibble':
                case 'tinyint':
                case 'short':
                case 'int':
                case 'integer':
                case 'float':
                case 'double':
                case 'number': return 'fa-solid fa-hashtag text-warning mx-2 desaturate';
                case 'string': return 'fa-solid fa-quote-left text-light mx-2 desaturate';
                case 'boolean': return 'fa-solid fa-flag text-info mx-2 desaturate';
                // Uknown or other.
                case 'any': return 'fa-solid fa-question text-danger mx-2 desaturate';
                // Objects
                default: return 'fa-solid fa-box text-success mx-2 desaturate';
            }
        }
    }
    exports.LuaCard = LuaCard;
});
define("src/asledgehammer/mallet/component/lua/LuaClassCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_2, LuaTypeScriptGenerator_2, util_4, LuaCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaClassCard = void 0;
    class LuaClassCard extends LuaCard_1.LuaCard {
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'typescript':
                    return (0, LuaTypeScriptGenerator_2.luaClassToTS)(this.options.entity, true);
                case 'lua':
                    return '--- @meta\n\n' + (0, LuaLuaGenerator_2.generateLuaClass)(this.options.entity);
                case 'json':
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
            }
        }
        constructor(app, options) {
            super(app, options);
            this.idAuthors = `${this.id}-authors`;
            this.idNotes = `${this.id}-description`;
            this.idPreview = `${this.id}-preview`;
            this.idBtnEdit = `${this.id}-edit`;
            this.idCheckMutable = `${this.id}-check-mutable`;
            this.idInputExtends = `${this.id}-input-extends`;
        }
        onHeaderHTML() {
            const { idBtnEdit } = this;
            const { entity } = this.options;
            return (0, util_4.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow"><strong>Lua Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
                ${this.renderEdit(idBtnEdit)}
            </div>
        `;
        }
        onBodyHTML() {
            const { idCheckMutable, idInputExtends } = this;
            const entity = this.options.entity;
            const extendz = entity.extendz ? entity.extendz : '';
            return (0, util_4.html) `
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Extends SuperClass -->
                <div class="mb-3" title="The super-class that the Lua class extends.">
                    <label class="form-label" for="${idInputExtends}">Extends</label>
                    <input id="${idInputExtends}" class="form-control responsive-input mt-2" type="text" style="" value="${extendz}" />
                </div>
                <!-- Mutable Flag -->
                <div class="mb-3 form-check" title="Allows Lua to add custom properties to the class.">
                    <input id="${idCheckMutable}" type="checkbox" class="form-check-input" id="exampleCheck1"${entity.mutable ? ' checked' : ''}>
                    <label class="form-check-label" for="${idCheckMutable}">Mutable</label>
                </div>
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { idInputExtends, idCheckMutable, idBtnEdit, idNotes } = this;
            const { entity } = this.options;
            const _this = this;
            this.listenEdit(entity, idBtnEdit, 'edit_lua_class', 'Edit Lua Class', undefined, 'class');
            this.listenNotes(entity, idNotes);
            this.listenPreview();
            const $checkMutable = (0, util_4.$get)(idCheckMutable);
            $checkMutable.on('change', function () {
                entity.mutable = this.checked;
                _this.update();
                _this.app.renderCode();
            });
            const $inputExtends = (0, util_4.$get)(idInputExtends);
            $inputExtends.on('input', function () {
                entity.extendz = this.value;
                _this.update();
                _this.app.renderCode();
            });
        }
    }
    exports.LuaClassCard = LuaClassCard;
});
define("src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", ["require", "exports", "src/asledgehammer/rosetta/1.0/typescript/TSUtils"], function (require, exports, TSUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tsType = exports.javaClassToTS = exports.javaMethodToTS = exports.javaMethodDocumentation = exports.javaConstructorDocumentation = exports.javaMethodClusterToTS = exports.javaConstructorsToTS = exports.javaConstructorToTS = exports.javaFieldToTS = void 0;
    function javaFieldToTS(field, indent = 0, notesLength) {
        if (field.getVisibilityScope() !== 'public')
            return '';
        const i = ' '.repeat(indent * 4);
        let s = '';
        /* Documentation */
        let ds = [];
        if (field.deprecated)
            ds.push('@deprecated');
        if (field.notes) {
            const notes = (0, TSUtils_2.paginateNotes)(field.notes, notesLength);
            if (ds.length)
                ds.push('');
            for (const line of notes) {
                ds.push(line);
            }
        }
        s = (0, TSUtils_2.applyTSDocumentation)(ds, s, indent);
        s += i;
        /* Definition-line */
        if (field.isStatic())
            s += 'static ';
        if (field.isFinal())
            s += 'readonly ';
        s += `${field.name}: ${tsType(field.type.basic, field.type.nullable)};`;
        // Format documented variables as spaced for better legability.
        if (ds.length)
            s += '\n';
        return s;
    }
    exports.javaFieldToTS = javaFieldToTS;
    function javaConstructorToTS(con, indent, notesLength) {
        if (con.getVisibilityScope() !== 'public')
            return '';
        const i = ' '.repeat(indent * 4);
        const ds = javaConstructorDocumentation(con, notesLength);
        let ps = '';
        if (con.parameters && con.parameters.length) {
            ps += '(';
            for (const parameter of con.parameters) {
                ps += `${parameter.name}: ${tsType(parameter.type.basic, parameter.type.nullable)}, `;
            }
            ps = ps.substring(0, ps.length - 2) + ')';
        }
        else {
            ps = '()';
        }
        let fs = `${i}constructor${ps};`;
        if (fs.length > notesLength) {
            fs = `${i}`;
            fs += `constructor(\n`;
            for (const parameter of con.parameters) {
                fs += `${i}    ${parameter.name}: ${tsType(parameter.type.basic, parameter.type.nullable)}, \n`;
            }
            fs += `${i});`;
        }
        return (0, TSUtils_2.applyTSDocumentation)(ds, '', indent) + fs + '\n';
    }
    exports.javaConstructorToTS = javaConstructorToTS;
    function javaConstructorsToTS(constructors, indent, notesLength) {
        const i = ' '.repeat(indent * 4);
        let s = '';
        const cons = [];
        for (const c of constructors) {
            if (c.getVisibilityScope() !== 'public')
                continue;
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
                        if (compare !== 0)
                            break;
                    }
                }
                return compare;
            });
            for (const con of cons) {
                if (con.getVisibilityScope() !== 'public')
                    continue;
                s += javaConstructorToTS(con, indent, notesLength) + '\n\n';
            }
            // Remove trailing new-line.
            s = s.substring(0, s.length - 3);
        }
        return s;
    }
    exports.javaConstructorsToTS = javaConstructorsToTS;
    function javaMethodClusterToTS(cluster, indent = 0, notesLength) {
        if (cluster.methods.length === 1) {
            return javaMethodToTS(cluster.methods[0], indent, notesLength);
        }
        let s = '';
        const methods = [];
        for (const m of cluster.methods) {
            if (m.getVisibilityScope() !== 'public')
                continue;
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
                        if (compare !== 0)
                            break;
                    }
                }
                return compare;
            });
            for (const method of cluster.methods) {
                if (method.getVisibilityScope() !== 'public')
                    continue;
                s += javaMethodToTS(method, indent, notesLength) + '\n';
            }
            // Remove trailing new-line.
            s = s.substring(0, s.length - 1);
        }
        return s;
    }
    exports.javaMethodClusterToTS = javaMethodClusterToTS;
    function javaConstructorDocumentation(con, notesLength) {
        const ds = [];
        /* (Annotations) */
        if (con.deprecated)
            ds.push('@deprecated');
        /* (Notes) */
        if (con.notes && con.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_2.paginateNotes)(con.notes, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        /* (Parameters) */
        if (con.parameters && con.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of con.parameters) {
                if (param.notes && param.notes.length) {
                    const notes = (0, TSUtils_2.paginateNotes)(`@param ${param.name} ${param.notes}`, notesLength);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(`@param ${param.name}`);
                }
            }
        }
        return ds;
    }
    exports.javaConstructorDocumentation = javaConstructorDocumentation;
    function javaMethodDocumentation(method, notesLength, overload = false) {
        const ds = [];
        /* (Annotations) */
        if (overload)
            ds.push('@overload');
        if (method.deprecated)
            ds.push('@deprecated');
        /* (Notes) */
        if (method.notes && method.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_2.paginateNotes)(method.notes, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        /* (Parameters) */
        if (method.parameters && method.parameters.length) {
            if (ds.length)
                ds.push('');
            for (const param of method.parameters) {
                if (param.notes && param.notes.length) {
                    const notes = (0, TSUtils_2.paginateNotes)(`@param ${param.name} ${param.notes}`, notesLength);
                    for (const line of notes)
                        ds.push(line);
                }
                else {
                    ds.push(`@param ${param.name}`);
                }
            }
        }
        /* (Returns) */
        if (method.returns && method.returns.notes && method.returns.notes.length) {
            if (ds.length)
                ds.push('');
            const notes = (0, TSUtils_2.paginateNotes)(`@returns ${method.returns.notes}`, notesLength);
            for (const line of notes)
                ds.push(line);
        }
        return ds;
    }
    exports.javaMethodDocumentation = javaMethodDocumentation;
    function javaMethodToTS(method, indent = 0, notesLength) {
        if (method.getVisibilityScope() !== 'public')
            return '';
        const i = ' '.repeat(indent * 4);
        const ds = javaMethodDocumentation(method, notesLength, false);
        let ps = '';
        if (method.parameters && method.parameters.length) {
            ps += '(';
            for (const parameter of method.parameters) {
                ps += `${parameter.name}: ${tsType(parameter.type.basic, parameter.type.nullable)}, `;
            }
            ps = ps.substring(0, ps.length - 2) + ')';
        }
        else {
            ps = '()';
        }
        const rs = tsType(method.returns.type.basic, method.returns.type.nullable);
        let fs = `${i}`;
        if (method.isStatic())
            fs += 'static ';
        if (method.isFinal())
            fs += 'readonly ';
        let mName = method.name;
        if (mName === '__toString__')
            mName = 'toString';
        fs += `${mName}${ps}: ${rs};\n`;
        if (fs.length > notesLength) {
            fs = `${i}`;
            if (method.isStatic())
                fs += 'static ';
            if (method.isFinal())
                fs += 'readonly ';
            fs += `${mName}(\n`;
            for (const parameter of method.parameters) {
                fs += `${i}    ${parameter.name}: ${tsType(parameter.type.basic, parameter.type.nullable)}, \n`;
            }
            fs += `${i}): ${rs}\n`;
        }
        return (0, TSUtils_2.applyTSDocumentation)(ds, '', indent) + fs;
    }
    exports.javaMethodToTS = javaMethodToTS;
    function javaClassToTS(clazz, wrapNamespace = false, wrapFile = false) {
        let s = '';
        const fieldNames = Object.keys(clazz.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const methodNames = Object.keys(clazz.methods);
        methodNames.sort((a, b) => a.localeCompare(b));
        const staticFields = [];
        const fields = [];
        const staticMethods = [];
        const methods = [];
        /* (STATIC FIELDS) */
        for (const fieldName of fieldNames) {
            const field = clazz.fields[fieldName];
            if (field.getVisibilityScope() !== 'public')
                continue;
            if (field.isStatic())
                staticFields.push(field);
            else
                fields.push(field);
        }
        /* (INSTANCE METHODS) */
        for (const methodName of methodNames) {
            const cluster = clazz.methods[methodName];
            if (!cluster.methods.length)
                continue; // (Sanity-Check)
            if (!cluster.methods[0].isStatic())
                staticMethods.push(cluster);
            else
                methods.push(cluster);
        }
        /** 100 - 4 (module indent) - 4 (namespace indent) - 3 (' * ') */
        let notesLength = 96;
        if (wrapFile)
            notesLength -= 4;
        if (wrapNamespace)
            notesLength -= 4;
        /* (Class Documentation) */
        const ds = [];
        ds.push(`@customConstructor ${clazz.name}.new`);
        ds.push('');
        ds.push(`Class: ${clazz.namespace.name}.${clazz.name}`);
        if (clazz.notes && clazz.notes.length) {
            ds.push('');
            const lines = (0, TSUtils_2.paginateNotes)(clazz.notes, notesLength);
            for (const line of lines)
                ds.push(line);
        }
        s = (0, TSUtils_2.applyTSDocumentation)(ds, s, 0);
        s += `export class ${clazz.name} `;
        let i = '    ';
        let is = '';
        let temp = '';
        if (staticFields.length) {
            temp = '';
            for (const field of staticFields) {
                if (field.getVisibilityScope() !== 'public')
                    continue;
                else if (!field.isFinal())
                    continue;
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
        if (clazz.constructors && clazz.constructors.length) {
            temp = `${javaConstructorsToTS(clazz.constructors, 1, notesLength)}\n`;
            if (temp.length) {
                if (is.length)
                    is += '\n';
                is += `${i}/* ------------------------------------ */\n`;
                is += `${i}/* ----------- CONSTRUCTORS ----------- */\n`;
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
                if (is.length)
                    is += '\n';
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
                if (is.length)
                    is += '\n';
                is += `${i}/* ------------------------------------ */\n`;
                is += `${i}/* ---------- STATIC METHODS ---------- */\n`;
                is += `${i}/* ------------------------------------ */\n`;
                is += '\n';
                is += temp;
            }
        }
        if (is.length) {
            s += `{\n\n${is}}`;
        }
        else {
            s += `{}\n`;
        }
        if (wrapNamespace)
            s = (0, TSUtils_2.wrapAsTSNamespace)(clazz.namespace.name, s);
        if (wrapFile)
            return (0, TSUtils_2.wrapAsTSFile)(s);
        return s;
    }
    exports.javaClassToTS = javaClassToTS;
    function tsType(type, optional) {
        let result = type;
        switch (type) {
            case 'String': {
                result = 'string';
                break;
            }
            case 'KahluaTable': {
                result = 'any';
                break;
            }
            default: {
                break;
            }
        }
        if (optional) {
            result += ' | null';
        }
        return result;
    }
    exports.tsType = tsType;
});
define("src/asledgehammer/mallet/component/java/JavaCard", ["require", "exports", "highlight.js", "src/asledgehammer/mallet/component/CardComponent", "src/asledgehammer/Delta", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/rosetta/1.0/java/RosettaJavaConstructor"], function (require, exports, hljs, CardComponent_2, Delta_2, util_5, RosettaJavaConstructor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaCard = void 0;
    class JavaCard extends CardComponent_2.CardComponent {
        constructor(app, options) {
            super(options);
            this.languageMode = 'lua';
            this.app = app;
            this.idPreview = `${this.id}-preview`;
            this.idPreviewCode = `${this.id}-preview-code`;
            this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
            this.idBtnLanguageLua = `${this.id}-btn-language-lua`;
            this.idBtnLanguageTypeScript = `${this.id}-btn-language-typescript`;
            this.idBtnLanguageJSON = `${this.id}-btn-language-json`;
        }
        listenEdit(entity, idBtnEdit, mode, title, nameSelected = undefined) {
            (0, util_5.$get)(idBtnEdit).on('click', () => {
                const { modalName, $btnName, $titleName, $inputName } = this.app.modalName;
                $titleName.html(title);
                if (mode === 'edit_parameter'
                    || mode === 'edit_lua_class'
                    || mode === 'edit_lua_table'
                    || mode === 'edit_field'
                    || mode === 'edit_function'
                    || mode === 'edit_method'
                    || mode === 'edit_value') {
                    $btnName.html('Edit');
                    $btnName.removeClass('btn-success');
                    $btnName.addClass('btn-primary');
                }
                else {
                    $btnName.html('Create');
                    $btnName.addClass('btn-success');
                    $btnName.removeClass('btn-primary');
                }
                $inputName.val(entity.name);
                this.app.modalName.nameMode = mode;
                if (!nameSelected)
                    nameSelected = entity.name;
                this.app.modalName.nameSelected = nameSelected;
                this.app.modalName.show(true);
            });
        }
        renderEdit(idBtnEdit) {
            return (0, util_5.html) `
            <!-- Edit Button -->
            <div style="position: absolute; padding: 0; right: 0; top: 0">
                <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" style="position: relative; top: 5px; right: 5px;" title="Edit Name">
                    <div class="btn-pane" style="width: 30px; height: 30px;">
                        <i class="fa-solid fa-pen"></i>
                    </div>
                </button>
            </div>
        `;
        }
        listenNotes(entity, idNotes) {
            (0, Delta_2.createDeltaEditor)(idNotes, entity.notes, (markdown) => {
                while (markdown.endsWith('\n'))
                    markdown = markdown.substring(0, markdown.length - 1);
                entity.notes = markdown;
                this.update();
                this.app.renderCode();
            });
        }
        renderNotes(idNotes) {
            return (0, util_5.html) `
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <div id="${idNotes}" style="background-color: #222;"></div>
            </div>
        `;
        }
        listenDefaultValue(entity, idDefaultValue) {
            const $defaultValue = (0, util_5.$get)(idDefaultValue);
            $defaultValue.on('input', () => {
                entity.defaultValue = $defaultValue.val();
                this.update();
                this.app.renderCode();
            });
        }
        renderDefaultValue(defaultValue, idDefaultValue) {
            if (!defaultValue)
                defaultValue = '';
            return (0, util_5.html) `
            <div class="mb-3">
                <label for="${idDefaultValue}" class="form-label mb-2">Default Value</label>
                <textarea id="${idDefaultValue}" class="form-control responsive-input mt-1" spellcheck="false">${defaultValue}</textarea>
            </div>
        `;
        }
        listenParameters(entity, type) {
            const { parameters } = entity;
            const name = entity instanceof RosettaJavaConstructor_2.RosettaJavaConstructor ? 'new' : entity.name;
            for (let index = 0; index < parameters.length; index++) {
                const param = parameters[index];
                const idParamNotes = `${name}-parameter-${param.name}-notes`;
                const idBtnEdit = `${name}-parameter-${param.name}-edit`;
                (0, Delta_2.createDeltaEditor)(idParamNotes, param.notes, (markdown) => {
                    while (markdown.endsWith('\n'))
                        markdown = markdown.substring(0, markdown.length - 1);
                    param.notes = markdown;
                    this.update();
                    this.app.renderCode();
                });
                (0, util_5.$get)(idBtnEdit).on('click', () => {
                    const { $btnName, $titleName, $inputName } = this.app.modalName;
                    $titleName.html('Edit Parameter Name');
                    $btnName.html('Edit');
                    $btnName.removeClass('btn-success');
                    $btnName.addClass('btn-primary');
                    if (type === 'constructor') {
                        this.app.modalName.javaConstructor = entity;
                    }
                    else if (type === 'method') {
                        this.app.modalName.javaMethod = entity;
                    }
                    else if (type === 'global_method') {
                        this.app.modalName.globalJavaMethod = entity;
                    }
                    $inputName.val(param.name);
                    this.app.modalName.javaParameter = param;
                    this.app.modalName.nameMode = 'edit_parameter';
                    this.app.modalName.nameSelected = param.name;
                    this.app.modalName.javaCallback = (nameNew) => {
                        $(`#${name}_${index}_name`).html(nameNew);
                    };
                    this.app.modalName.show(true);
                });
                this.listenType(param);
            }
        }
        renderParameters(entity, show = false) {
            const { parameters } = entity;
            const idAccordion = `${entity.name}-parameters-accordion`;
            let htmlParams = '';
            if (parameters && parameters.length) {
                for (let index = 0; index < parameters.length; index++) {
                    const param = parameters[index];
                    const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                    const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                    const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                    htmlParams += (0, util_5.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type.basic}</strong></div>
                                <h6 id="${entity.name}_${index}_name" class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                        <div style="position: absolute; height: 32px; top: 5px; right: 2rem; z-index: 4;">
                            <!-- Edit Button -->
                            <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" style="z-index: 4">
                                <div class="btn-pane"> 
                                    <i class="fa-solid fa-pen"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-dark" style="position: relative;">
                            
                                ${this.renderType(param)}

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <div id="${idParamNotes}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
                }
            }
            else {
                htmlParams += (0, util_5.html) `<h6 class="font-monospace mb-1">(None)</h6>`;
            }
            return (0, util_5.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idAccordion}" aria-expanded="true" aria-controls="${idAccordion}">
                        <strong>Parameters</strong>
                    </button>
                </div>
                <div id="${idAccordion}" class="card-body p-2 mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                </div>
            </div>
        `;
        }
        update() {
            const { idPreviewCode } = this;
            const $pre = (0, util_5.$get)(idPreviewCode);
            $pre.empty();
            let text = this.onRenderPreview(this.languageMode);
            if (text.endsWith('\n'))
                text = text.substring(0, text.length - 1);
            // @ts-ignore
            const highlightedCode = hljs.default.highlightAuto(text, [this.languageMode]).value;
            $pre.append(highlightedCode);
        }
        listenPreview() {
            const { idBtnPreviewCopy, idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON } = this;
            // Copy the code.
            (0, util_5.$get)(idBtnPreviewCopy).on('click', (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(this.onRenderPreview(this.languageMode));
            });
            (0, util_5.$get)(idBtnLanguageLua).on('click', () => {
                this.languageMode = 'lua';
                this.update();
            });
            (0, util_5.$get)(idBtnLanguageTypeScript).on('click', () => {
                this.languageMode = 'typescript';
                this.update();
            });
            (0, util_5.$get)(idBtnLanguageJSON).on('click', () => {
                this.languageMode = 'json';
                this.update();
            });
        }
        renderPreview(show) {
            const { idPreview, idPreviewCode, idBtnPreviewCopy, idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON } = this;
            return (0, util_5.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idPreview}" aria-expanded="true" aria-controls="${idPreview}">
                        <strong>Preview</strong>
                    </button>

                    <!-- Copy Button -->
                    <button id="${idBtnPreviewCopy}" class="btn btn-sm responsive-btn" style="z-index: 4; position: absolute; top: 5px; right: 5px;" title="Copy Code">
                        <div class="btn-pane"> 
                            <i class="fa-solid fa-copy"></i>
                        </div>
                    </button>
                </div>
                <div id="${idPreview}" class="card-body mb-0 p-0 collapse${show ? ' show' : ''}" style="position: relative;">
                    <div class="p-2">
                        <button id="${idBtnLanguageLua}" class="btn btn-sm btn-primary" title="View Lua Code">Lua</button>
                        <button id="${idBtnLanguageTypeScript}" class="btn btn-sm btn-primary" title="View Lua Code">TypeScript</button>
                        <button id="${idBtnLanguageJSON}" class="btn btn-sm btn-primary" title="View Lua Code">Rosetta JSON</button>
                    </div>
                    <pre id="${idPreviewCode}" class="w-100 h-100 p-2 m-0" style="background-color: #111; overflow: scroll; max-height: 512px;"></pre>
                </div>
            </div>
        `;
        }
        listenReturns(entity, idReturnNotes) {
            (0, Delta_2.createDeltaEditor)(idReturnNotes, entity.returns.notes, (markdown) => {
                while (markdown.endsWith('\n'))
                    markdown = markdown.substring(0, markdown.length - 1);
                entity.returns.notes = markdown;
                this.update();
                this.app.renderCode();
            });
            this.listenType({ name: 'returns', type: entity.returns.type });
        }
        renderReturns(entity, idReturnType, idReturnNotes, show = false) {
            const { returns } = entity;
            let { notes } = returns;
            if (!notes)
                notes = '';
            const idCard = `${entity.name}-returns-card`;
            return (0, util_5.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idCard}" aria-expanded="true" aria-controls="${idCard}">
                        <strong>Returns</strong>
                    </button>
                </div>
                <div id="${idCard}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <!-- Return Type -->
                    <div class="mb-3">
                        <label for="${idReturnType}" class="form-label">Type: ${returns.type.basic}</label>
                    </div>
                    ${this.renderType({ name: 'returns', type: entity.returns.type })}
                    <!-- Return Notes -->
                    <div>
                        <label for="${idReturnNotes}" class="form-label">Description</label>
                        <div id="${idReturnNotes}" style="background-color: #222 !important;"></div>
                    </div>
                </div>
            </div>
        `;
        }
        listenType(entity) {
            // Don't let the user change the nullability.
            if (!entity.type.isNullPossible())
                return;
            const _this = this;
            const idNullable = `${entity.name}-nullable`;
            /* (Nullable CheckBox) */
            (0, util_5.$get)(idNullable).on('change', function () {
                entity.type.nullable = this.checked;
                _this.update();
                _this.app.renderCode();
            });
        }
        renderType(entity) {
            const idNullable = `${entity.name}-nullable`;
            // Don't let the user change the nullable status.
            if (!entity.type.isNullPossible())
                return '';
            return (0, util_5.html) `
            <!-- Nullable Flag -->
            <div class="mb-3">
                <div class="col-auto">
                    <input id="${idNullable}" type="checkbox" class="form-check-input" ${entity.type.nullable ? ' checked' : ''}>
                    <label class="form-check-label" for="${idNullable}">Nullable</label>
                </div>
            </div>
        `;
        }
        static renderTypeSelect(idSelect, label = '', value = 'any', margin) {
            // Determine if custom field should show.
            let style = '';
            let customInputValue = value;
            value = value.trim();
            switch (value.toLowerCase()) {
                // Here the reference stays valid.
                case 'custom':
                    style = '';
                    customInputValue = value;
                    break;
                // Erase custom definition here.
                case 'void':
                case 'any':
                case 'nil':
                case 'boolean':
                case 'number':
                case 'string':
                    style = 'display: none';
                    customInputValue = '';
                    break;
                // Everything else gets shoved into the custom value.
                default:
                    customInputValue = value;
                    value = 'custom';
                    style = '';
            }
            return (0, util_5.html) `
            <div class="${margin ? 'mb-2' : ''}">

                <!-- Type Selection List -->
                <select id="${idSelect}" class="form-select responsive-select" aria-label="${label}">
                    <option value="any"  ${value === 'any' ? 'selected' : ''}><strong>Any</strong></option>
                    <option value="void"  ${value === 'void' ? 'selected' : ''}><strong>Void</strong></option>
                    <option value="nil"  ${value === 'nil' ? 'selected' : ''}><strong>Nil</strong></option>
                    <option value="boolean"  ${value === 'boolean' ? 'selected' : ''}><strong>Boolean</strong></option>
                    <option value="number" ${value === 'number' ? 'selected' : ''}><strong>Number</strong></option>
                    <option value="string"  ${value === 'string' ? 'selected' : ''}><strong>String</strong></option>
                    <option value="custom" ${value === 'custom' ? 'selected' : ''}><strong>Custom</strong></option>
                </select>
                
                <!-- Manual Input for Custom Type -->
                <input id="${idSelect}-custom-input" class="form-control responsive-input mt-2" type="text" style="${style}" value="${customInputValue}" />
            
            </div>
        `;
        }
        static getTypeIcon(type) {
            switch (type.toLocaleLowerCase().trim()) {
                case 'class': return 'fa-solid fa-box-archive text-light mx-2 desaturate';
                case 'constructor': return 'fa-solid fa-copyright text-light mx-2 desaturate';
                case 'nil': return 'fa-solid fa-ban fa-danger mx-2 desaturate';
                case 'void': return 'fa-solid fa-xmark mx-2 desaturate';
                case 'number': return 'fa-solid fa-hashtag text-warning mx-2 desaturate';
                case 'string': return 'fa-solid fa-quote-left text-light mx-2 desaturate';
                case 'boolean': return 'fa-solid fa-flag text-info mx-2 desaturate';
                // Uknown or other.
                case 'any': return 'fa-solid fa-question text-danger mx-2 desaturate';
                // Objects
                default: return 'fa-solid fa-box text-success mx-2 desaturate';
            }
        }
    }
    exports.JavaCard = JavaCard;
});
define("src/asledgehammer/mallet/component/java/JavaClassCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/java/JavaCard"], function (require, exports, JavaLuaGenerator2_1, JavaTypeScriptGenerator_1, util_6, JavaCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaClassCard = void 0;
    class JavaClassCard extends JavaCard_1.JavaCard {
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua':
                    return '--- @meta\n\n' + (0, JavaLuaGenerator2_1.generateJavaClass)(this.options.entity);
                case 'typescript':
                    return (0, JavaTypeScriptGenerator_1.javaClassToTS)(this.options.entity, true, true);
                case 'json':
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
            }
        }
        constructor(app, options) {
            super(app, options);
            this.idAuthors = `${this.id}-authors`;
            this.idNotes = `${this.id}-description`;
            this.idPreview = `${this.id}-preview`;
            this.idInputExtends = `${this.id}-input-extends`;
        }
        onHeaderHTML() {
            const { entity } = this.options;
            return (0, util_6.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow"><strong>Java Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${entity.name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idInputExtends } = this;
            const entity = this.options.entity;
            const extendz = entity.extendz ? entity.extendz : '';
            return (0, util_6.html) `
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Extends SuperClass -->
                <div class="mb-3" title="The super-class that the Java class extends.">
                    <label class="form-label" for="${idInputExtends}">Extends ${this.options.entity.extendz}</label>
                </div>
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { idNotes } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenPreview();
        }
    }
    exports.JavaClassCard = JavaClassCard;
});
define("src/asledgehammer/mallet/component/ItemTree", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, RosettaJavaClass_1, RosettaLuaClass_1, RosettaLuaTable_1, util_7, LuaCard_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemTree = void 0;
    function wrapFolderCount(text) {
        return `<strong class="font-monospace text-white">${text}</strong>`;
    }
    function wrapItem(text) {
        return `<span class="font-monospace" style="position: relative; top: -2px; font-size: 12px;">${text}</span>`;
    }
    class ItemTree {
        constructor(app, sidebar) {
            /* Lua Class Folders */
            this.idFolderLuaClassField = `item-tree-folder-lua-class-field`;
            this.idFolderLuaClassValue = `item-tree-folder-lua-class-value`;
            this.idFolderLuaClassFunction = `item-tree-folder-lua-class-function`;
            this.idFolderLuaClassMethod = `item-tree-folder-lua-class-method`;
            this.folderLuaClassFieldOpen = true;
            this.folderLuaClassValueOpen = true;
            this.folderLuaClassFunctionOpen = true;
            this.folderLuaClassMethodOpen = true;
            /* Lua Table Folders */
            this.idFolderLuaTableField = `item-tree-folder-lua-table-value`;
            this.idFolderLuaTableFunction = `item-tree-folder-lua-table-function`;
            this.folderLuaTableFieldOpen = true;
            this.folderLuaTableFunctionOpen = true;
            /* Java Class Folders */
            this.idFolderJavaClassConstructor = 'item-tree-folder-java-class-constructor';
            this.idFolderJavaClassStaticField = 'item-tree-folder-java-class-static-field';
            this.idFolderJavaClassStaticMethod = 'item-tree-folder-java-class-static-method';
            this.idFolderJavaClassField = 'item-tree-folder-java-class-field';
            this.idFolderJavaClassMethod = 'item-tree-folder-java-class-method';
            this.folderJavaClassConstructorOpen = true;
            this.folderJavaClassStaticFieldOpen = true;
            this.folderJavaClassStaticMethodOpen = true;
            this.folderJavaClassFieldOpen = true;
            this.folderJavaClassMethodOpen = true;
            this.listening = false;
            this.selected = undefined;
            this.selectedID = undefined;
            this.constructorSignatureMap = {};
            this.methodSignatureMap = {};
            this.staticMethodSignatureMap = {};
            this.luaConstructorSignatureMap = {};
            this.luaMethodSignatureMap = {};
            this.luaStaticMethodSignatureMap = {};
            this.app = app;
            this.sidebar = sidebar;
        }
        listen() {
            if (this.listening)
                return;
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.item-tree-item', function () {
                const $this = $(this);
                $('.item-tree-item.selected').removeClass('selected');
                $this.addClass('selected');
                _this.selectedID = this.id;
                // console.log(`Selected item: ${_this.selectedID}`);
            });
            this.listenGlobal();
            this.listenLuaClass();
            this.listenLuaTable();
            this.listenJavaClass();
            this.listening = true;
        }
        listenGlobal() {
            const { app } = this;
            const { catalog } = app;
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.global-lua-field-item', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const field = catalog.fields[fieldName];
                if (!field)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
                _this.selectedID = this.id;
                app.showGlobalLuaField(field);
            });
            $doc.on('click', '.global-lua-function-item', function () {
                const signature = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const func = _this.luaStaticMethodSignatureMap[signature];
                if (!func)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showGlobalLuaFunction(func);
            });
            $doc.on('click', '.global-java-method-item', function () {
                const signature = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                // This is lazy but it works.
                let method = _this.methodSignatureMap[signature];
                if (!method)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showGlobalJavaMethod(method);
            });
        }
        listenLuaClass() {
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.lua-class-constructor-item', function () {
                const signature = this.id.split('constructor-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const conztructor = _this.luaConstructorSignatureMap[signature];
                if (!conztructor)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showLuaClassConstructor(conztructor);
            });
            $doc.on('click', '.lua-class-field-item', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const entity = _this.app.catalog.selected;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
                _this.selectedID = this.id;
                _this.app.showLuaClassField(field);
            });
            $doc.on('click', '.lua-class-value-item', function () {
                const valueName = this.id.split('value-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === valueName)
                    return;
                const entity = _this.app.catalog.selected;
                const value = entity.values[valueName];
                if (!value)
                    return;
                // Let the editor know we last selected the value.
                _this.selected = valueName;
                _this.selectedID = this.id;
                _this.app.showLuaClassValue(value);
            });
            $doc.on('click', '.lua-class-method-item', function () {
                const signature = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                // This is lazy but it works.
                const method = _this.luaMethodSignatureMap[signature];
                if (!method)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showLuaClassMethod(method);
            });
            $doc.on('click', '.lua-class-function-item', function () {
                const signature = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const func = _this.luaStaticMethodSignatureMap[signature];
                if (!func)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showLuaClassFunction(func);
            });
            // Preserve the state of folders.
            $doc.on('click', '#' + this.idFolderLuaClassField, () => {
                this.folderLuaClassFieldOpen = !this.folderLuaClassFieldOpen;
            });
            $doc.on('click', '#' + this.idFolderLuaClassValue, () => {
                this.folderLuaClassValueOpen = !this.folderLuaClassValueOpen;
            });
            $doc.on('click', '#' + this.idFolderLuaClassMethod, () => {
                this.folderLuaClassMethodOpen = !this.folderLuaClassMethodOpen;
            });
            $doc.on('click', '#' + this.idFolderLuaClassFunction, () => {
                this.folderLuaClassFunctionOpen = !this.folderLuaClassFunctionOpen;
            });
        }
        listenLuaTable() {
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.lua-table-field-item', function () {
                const fieldName = this.id.split('field-')[1].trim();
                console.log(this.id);
                console.log(fieldName);
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const entity = _this.app.catalog.selected;
                const field = entity.fields[fieldName];
                console.log(field);
                if (!field)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
                _this.selectedID = this.id;
                _this.app.showLuaTableField(field);
            });
            $doc.on('click', '.lua-table-function-item', function () {
                const signature = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const func = _this.luaStaticMethodSignatureMap[signature];
                if (!func)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showLuaTableFunction(func);
            });
            // Preserve the state of folders.
            $doc.on('click', '#' + this.idFolderLuaTableField, () => {
                this.folderLuaTableFieldOpen = !this.folderLuaTableFieldOpen;
            });
            $doc.on('click', '#' + this.idFolderLuaTableFunction, () => {
                this.folderLuaTableFunctionOpen = !this.folderLuaTableFunctionOpen;
            });
        }
        listenJavaClass() {
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.java-class-field-item', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const entity = _this.app.catalog.selected;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
                _this.selectedID = this.id;
                _this.app.showJavaClassField(field);
            });
            $doc.on('click', '.java-class-method-item', function () {
                const signature = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                // This is lazy but it works.
                let method = _this.staticMethodSignatureMap[signature];
                if (!method)
                    method = _this.methodSignatureMap[signature];
                if (!method)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showJavaClassMethod(method);
            });
            $doc.on('click', '.java-class-constructor-item', function () {
                const signature = this.id.split('constructor-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const conztructor = _this.constructorSignatureMap[signature];
                if (!conztructor)
                    return;
                // Let the editor know we last selected the field.
                _this.selected = signature;
                _this.selectedID = this.id;
                _this.app.showJavaClassConstructor(conztructor);
            });
            // Preserve the state of folders.
            $doc.on('click', '#' + this.idFolderJavaClassStaticField, () => {
                this.folderJavaClassStaticFieldOpen = !this.folderJavaClassStaticFieldOpen;
            });
            $doc.on('click', '#' + this.idFolderJavaClassStaticMethod, () => {
                this.folderJavaClassStaticMethodOpen = !this.folderJavaClassStaticMethodOpen;
            });
            $doc.on('click', '#' + this.idFolderJavaClassField, () => {
                this.folderJavaClassFieldOpen = !this.folderJavaClassFieldOpen;
            });
            $doc.on('click', '#' + this.idFolderJavaClassMethod, () => {
                this.folderJavaClassMethodOpen = !this.folderJavaClassMethodOpen;
            });
        }
        populate() {
            if (this.sidebar.objTree.globalSelected) {
                this.populateGlobal();
                return;
            }
            const { selected } = this.app.catalog;
            if (!selected)
                return;
            if (selected instanceof RosettaLuaClass_1.RosettaLuaClass) {
                this.populateLuaClass(selected);
            }
            else if (selected instanceof RosettaLuaTable_1.RosettaLuaTable) {
                this.populateLuaTable(selected);
            }
            else if (selected instanceof RosettaJavaClass_1.RosettaJavaClass) {
                this.populateJavaClass(selected);
            }
        }
        populateGlobal() {
            const _this = this;
            const { catalog } = this.app;
            const fieldNames = Object.keys(catalog.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const fields = [];
            for (const fieldName of fieldNames) {
                const field = catalog.fields[fieldName];
                const id = `lua-global-field-${field.name}`;
                const classes = ['item-tree-item', 'global-lua-field-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                fields.push({
                    text: field.name,
                    icon: LuaCard_2.LuaCard.getTypeIcon(field.type),
                    id,
                    class: classes
                });
            }
            // const functionNames = Object.keys(catalog.functions);
            // functionNames.sort((a, b) => a.localeCompare(b));
            // const functions = [];
            // for (const functionName of functionNames) {
            //     const func = catalog.functions[functionName];
            //     const id = `lua-global-function-${func.name}`;
            //     const classes: string[] = ['item-tree-item', 'global-lua-function-item'];
            //     if (id === this.selectedID) classes.push('selected');
            //     functions.push({
            //         text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
            //         icon: 'fa-solid fa-terminal text-success mx-2',
            //         id,
            //         class: classes
            //     });
            // }
            this.methodSignatureMap = {};
            this.luaStaticMethodSignatureMap = {};
            let clusterNames = Object.keys(catalog.methods);
            clusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of clusterNames) {
                const cluster = catalog.methods[clusterName];
                for (const method of cluster.methods) {
                    this.methodSignatureMap[method.getSignature()] = method;
                }
            }
            clusterNames = Object.keys(catalog.functions);
            clusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of clusterNames) {
                const cluster = catalog.functions[clusterName];
                for (const func of cluster.functions) {
                    this.luaStaticMethodSignatureMap[func.getSignature()] = func;
                }
            }
            // Global Method(s)
            const methods = [];
            const methodSignatures = Object.keys(this.methodSignatureMap);
            methodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of methodSignatures) {
                const method = this.methodSignatureMap[signature];
                const id = `global-java-method-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'global-java-method-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                methods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type.basic),
                    id,
                    class: classes
                });
            }
            // Global Functions(s)
            const functions = [];
            const funcSignatures = Object.keys(this.luaStaticMethodSignatureMap);
            funcSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of funcSignatures) {
                const func = this.luaStaticMethodSignatureMap[signature];
                const id = `global-lua-function-${signature}`;
                let params = '';
                for (const param of func.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'global-lua-function-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                functions.push({
                    text: wrapItem(`${func.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(func.returns.type),
                    id,
                    class: classes
                });
            }
            const folderFields = {
                text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassField,
                expanded: _this.folderLuaClassFieldOpen,
                nodes: fields
            };
            const folderFuncs = {
                text: `${wrapFolderCount(`(${functions.length})`)} Function(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassFunction,
                expanded: _this.folderLuaClassFunctionOpen,
                nodes: functions
            };
            const folderMethods = {
                text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassMethod,
                expanded: _this.folderJavaClassMethodOpen,
                nodes: methods
            };
            const data = [];
            if (fields.length)
                data.push(folderFields);
            if (methods.length)
                data.push(folderMethods);
            if (functions.length)
                data.push(folderFuncs);
            let $treeLower = (0, util_7.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_7.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_7.$get)('tree-lower');
            // @ts-ignore
            $treeLower.bstreeview({ data });
        }
        populateLuaClass(entity) {
            if (!entity)
                return;
            const _this = this;
            const constructors = [];
            this.luaConstructorSignatureMap = {};
            this.luaMethodSignatureMap = {};
            this.luaStaticMethodSignatureMap = {};
            let clusterNames = Object.keys(entity.methods);
            clusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of clusterNames) {
                const cluster = entity.methods[clusterName];
                for (const method of cluster.functions) {
                    this.luaMethodSignatureMap[method.getSignature()] = method;
                }
            }
            clusterNames = Object.keys(entity.functions);
            clusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of clusterNames) {
                const cluster = entity.functions[clusterName];
                for (const func of cluster.functions) {
                    this.luaStaticMethodSignatureMap[func.getSignature()] = func;
                }
            }
            // Constructor(s)
            for (const cons of entity.constructors) {
                this.luaConstructorSignatureMap[cons.getSignature()] = cons;
            }
            const consSignatures = Object.keys(this.luaConstructorSignatureMap);
            consSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of consSignatures) {
                const cons = this.luaConstructorSignatureMap[signature];
                const id = `lua-class-${entity.name}-constructor-${signature}`;
                let params = '';
                if (cons.parameters && cons.parameters.length) {
                    for (const param of cons.parameters) {
                        params += `${param.name}, `;
                    }
                    if (params.length)
                        params = params.substring(0, params.length - 2);
                }
                const classes = ['item-tree-item', 'lua-class-constructor-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                constructors.push({
                    text: wrapItem(`${entity.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon('object'),
                    id,
                    class: classes
                });
            }
            const fieldNames = Object.keys(entity.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const fields = [];
            for (const fieldName of fieldNames) {
                const field = entity.fields[fieldName];
                const id = `lua-class-${entity.name}-field-${field.name}`;
                const classes = ['item-tree-item', 'lua-class-field-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                fields.push({
                    text: field.name,
                    icon: LuaCard_2.LuaCard.getTypeIcon(field.type),
                    id,
                    class: classes
                });
            }
            const valueNames = Object.keys(entity.values);
            valueNames.sort((a, b) => a.localeCompare(b));
            const values = [];
            for (const valueName of valueNames) {
                const value = entity.values[valueName];
                const id = `lua-class-${entity.name}-value-${value.name}`;
                const classes = ['item-tree-item', 'lua-class-value-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                values.push({
                    text: (0, util_7.html) `<span class="fst-italic">${value.name}</span>`,
                    icon: LuaCard_2.LuaCard.getTypeIcon(value.type),
                    id,
                    class: classes
                });
            }
            // Static method(s)
            const functions = [];
            const staticMethodSignatures = Object.keys(this.luaStaticMethodSignatureMap);
            staticMethodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of staticMethodSignatures) {
                const method = this.luaStaticMethodSignatureMap[signature];
                const id = `lua-class-${entity.name}-function-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'lua-class-function-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                functions.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type),
                    id,
                    class: classes
                });
            }
            // Instance method(s)
            const methods = [];
            const methodSignatures = Object.keys(this.luaMethodSignatureMap);
            methodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of methodSignatures) {
                const method = this.luaMethodSignatureMap[signature];
                const id = `lua-class-${entity.name}-method-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'lua-class-method-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                methods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type),
                    id,
                    class: classes
                });
            }
            let $treeLower = (0, util_7.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_7.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_7.$get)('tree-lower');
            const conzID = `lua-class-${entity.name}-constructor`;
            const conzClasses = ['item-tree-item', 'lua-class-constructor-item'];
            if (conzID === this.selectedID)
                conzClasses.push('selected');
            const folderConstructors = {
                text: `${wrapFolderCount(`(${constructors.length})`)} Constructor(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassConstructor,
                expanded: _this.folderJavaClassConstructorOpen,
                nodes: constructors
            };
            const folderFields = {
                text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassField,
                expanded: _this.folderLuaClassFieldOpen,
                nodes: fields
            };
            const folderValues = {
                text: `${wrapFolderCount(`(${values.length})`)} Value(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassValue,
                expanded: _this.folderLuaClassValueOpen,
                nodes: values
            };
            const folderMethods = {
                text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassMethod,
                expanded: _this.folderLuaClassMethodOpen,
                nodes: methods
            };
            const folderFuncs = {
                text: `${wrapFolderCount(`(${functions.length})`)} Function(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassFunction,
                expanded: _this.folderLuaClassFunctionOpen,
                nodes: functions
            };
            const data = [];
            if (constructors.length)
                data.push(folderConstructors);
            if (fields.length)
                data.push(folderFields);
            if (values.length)
                data.push(folderValues);
            if (methods.length)
                data.push(folderMethods);
            if (functions.length)
                data.push(folderFuncs);
            // @ts-ignore
            $treeLower.bstreeview({ data });
        }
        populateLuaTable(table) {
            if (!table)
                return;
            const _this = this;
            this.luaConstructorSignatureMap = {};
            this.luaMethodSignatureMap = {};
            this.luaStaticMethodSignatureMap = {};
            const clusterNames = Object.keys(table.functions);
            clusterNames.sort((a, b) => a.localeCompare(b));
            for (const clusterName of clusterNames) {
                const cluster = table.functions[clusterName];
                for (const func of cluster.functions) {
                    this.luaStaticMethodSignatureMap[func.getSignature()] = func;
                }
            }
            const fieldNames = Object.keys(table.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const fields = [];
            for (const fieldName of fieldNames) {
                const field = table.fields[fieldName];
                const id = `lua-table-${table.name}-field-${field.name}`;
                const classes = ['item-tree-item', 'lua-table-field-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                fields.push({
                    text: field.name,
                    icon: LuaCard_2.LuaCard.getTypeIcon(field.type),
                    id,
                    class: classes
                });
            }
            const functions = [];
            const staticMethodSignatures = Object.keys(this.luaStaticMethodSignatureMap);
            staticMethodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of staticMethodSignatures) {
                const method = this.luaStaticMethodSignatureMap[signature];
                const id = `lua-table-${table.name}-function-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'lua-table-function-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                functions.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type),
                    id,
                    class: classes
                });
            }
            const folderFields = {
                text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassField,
                expanded: _this.folderLuaClassFieldOpen,
                nodes: fields
            };
            const folderFuncs = {
                text: `${wrapFolderCount(`(${functions.length})`)} Function(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClassFunction,
                expanded: _this.folderLuaClassFunctionOpen,
                nodes: functions
            };
            const data = [];
            if (fields.length)
                data.push(folderFields);
            if (functions.length)
                data.push(folderFuncs);
            let $treeLower = (0, util_7.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_7.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_7.$get)('tree-lower');
            // @ts-ignore
            $treeLower.bstreeview({ data });
        }
        populateJavaClass(entity) {
            if (!entity)
                return;
            const _this = this;
            let $treeLower = (0, util_7.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_7.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_7.$get)('tree-lower');
            const staticFields = [];
            const staticMethods = [];
            // const fields: any[] = [];
            const methods = [];
            const constructors = [];
            const fieldNames = Object.keys(entity.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const clusterNames = Object.keys(entity.methods);
            clusterNames.sort((a, b) => a.localeCompare(b));
            this.constructorSignatureMap = {};
            this.methodSignatureMap = {};
            this.staticMethodSignatureMap = {};
            for (const clusterName of clusterNames) {
                const cluster = entity.methods[clusterName];
                for (const method of cluster.methods) {
                    if (method.getVisibilityScope() !== 'public')
                        continue;
                    if (method.isStatic()) {
                        this.staticMethodSignatureMap[method.getSignature()] = method;
                    }
                    else {
                        this.methodSignatureMap[method.getSignature()] = method;
                    }
                }
            }
            for (const cons of entity.constructors) {
                if (cons.getVisibilityScope() !== 'public')
                    continue;
                this.constructorSignatureMap[cons.getSignature()] = cons;
            }
            // Constructor(s)
            const consSignatures = Object.keys(this.constructorSignatureMap);
            consSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of consSignatures) {
                const cons = this.constructorSignatureMap[signature];
                const id = `java-class-${entity.name}-constructor-${signature}`;
                let params = '';
                if (cons.parameters && cons.parameters.length) {
                    for (const param of cons.parameters) {
                        params += `${param.name}, `;
                    }
                    if (params.length)
                        params = params.substring(0, params.length - 2);
                }
                const classes = ['item-tree-item', 'java-class-constructor-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                constructors.push({
                    text: wrapItem(`${entity.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon('object'),
                    id,
                    class: classes
                });
            }
            // Static field(s)
            for (const name of fieldNames) {
                const field = entity.fields[name];
                if (field.getVisibilityScope() !== 'public')
                    continue;
                else if (!field.isStatic())
                    continue;
                else if (!field.isFinal())
                    continue;
                const id = `java-class-${entity.name}-field-${field.name}`;
                const classes = ['item-tree-item', 'java-class-field-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                staticFields.push({
                    text: wrapItem(field.name),
                    icon: LuaCard_2.LuaCard.getTypeIcon(field.type.basic),
                    id,
                    class: classes
                });
            }
            // Static method(s)
            const staticMethodSignatures = Object.keys(this.staticMethodSignatureMap);
            staticMethodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of staticMethodSignatures) {
                const method = this.staticMethodSignatureMap[signature];
                const id = `java-class-${entity.name}-method-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'java-class-method-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                staticMethods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type.basic),
                    id,
                    class: classes
                });
            }
            // Instance method(s)
            const methodSignatures = Object.keys(this.methodSignatureMap);
            methodSignatures.sort((a, b) => a.localeCompare(b));
            for (const signature of methodSignatures) {
                const method = this.methodSignatureMap[signature];
                const id = `java-class-${entity.name}-method-${signature}`;
                let params = '';
                for (const param of method.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length)
                    params = params.substring(0, params.length - 2);
                const classes = ['item-tree-item', 'java-class-method-item'];
                if (id === this.selectedID)
                    classes.push('selected');
                methods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_2.LuaCard.getTypeIcon(method.returns.type.basic),
                    id,
                    class: classes
                });
            }
            const folderConstructors = {
                text: `${wrapFolderCount(`(${constructors.length})`)} Constructor(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassConstructor,
                expanded: _this.folderJavaClassConstructorOpen,
                nodes: constructors
            };
            const folderStaticFields = {
                text: `${wrapFolderCount(`(${staticFields.length})`)} Static Field(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassStaticField,
                expanded: _this.folderJavaClassStaticFieldOpen,
                nodes: staticFields
            };
            const folderStaticMethods = {
                text: `${wrapFolderCount(`(${staticMethods.length})`)} Static Method(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassStaticMethod,
                expanded: _this.folderJavaClassStaticMethodOpen,
                nodes: staticMethods
            };
            // const folderFields = {
            //     text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
            //     icon: "fa-solid fa-folder text-light mx-2",
            //     class: ['item-tree-folder', 'bg-secondary'],
            //     id: _this.idFolderJavaClassField,
            //     expanded: _this.folderJavaClassFieldOpen,
            //     nodes: fields
            // };
            const folderMethods = {
                text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassMethod,
                expanded: _this.folderJavaClassMethodOpen,
                nodes: methods
            };
            // Only add the folder if it is populated.
            const data = [];
            if (constructors.length)
                data.push(folderConstructors);
            if (staticFields.length)
                data.push(folderStaticFields);
            if (staticMethods.length)
                data.push(folderStaticMethods);
            // if (fields.length) data.push(folderFields);
            if (methods.length)
                data.push(folderMethods);
            // @ts-ignore
            $treeLower.bstreeview({ data });
            // if(this.selectedID != null) {
            //     document.getElementById(this.selectedID)!.scrollIntoView(true);
            // }
        }
    }
    exports.ItemTree = ItemTree;
});
define("src/asledgehammer/mallet/component/lua/LuaTableCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_3, LuaTypeScriptGenerator_3, util_8, LuaCard_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaTableCard = void 0;
    class LuaTableCard extends LuaCard_3.LuaCard {
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'typescript':
                    return (0, LuaTypeScriptGenerator_3.luaTableToTS)(this.options.entity, true);
                case 'lua':
                    return '--- @meta\n\n' + (0, LuaLuaGenerator_3.generateLuaTable)(this.options.entity);
                case 'json':
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
            }
        }
        constructor(app, options) {
            super(app, options);
            this.idAuthors = `${this.id}-authors`;
            this.idNotes = `${this.id}-description`;
            this.idPreview = `${this.id}-preview`;
            this.idBtnEdit = `${this.id}-edit`;
            this.idCheckMutable = `${this.id}-check-mutable`;
        }
        onHeaderHTML() {
            const { idBtnEdit } = this;
            const { entity } = this.options;
            return (0, util_8.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow"><strong>Lua Table</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
                ${this.renderEdit(idBtnEdit)}
            </div>
        `;
        }
        onBodyHTML() {
            const { idCheckMutable } = this;
            const entity = this.options.entity;
            return (0, util_8.html) `
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Mutable Flag -->
                <div class="mb-3 form-check" title="Allows Lua to add custom properties to the class.">
                    <input id="${idCheckMutable}" type="checkbox" class="form-check-input" id="exampleCheck1"${entity.mutable ? ' checked' : ''}>
                    <label class="form-check-label" for="${idCheckMutable}">Mutable</label>
                </div>
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { idCheckMutable, idBtnEdit, idNotes } = this;
            const { entity } = this.options;
            const _this = this;
            this.listenEdit(entity, idBtnEdit, 'edit_lua_table', 'Edit Lua Table', undefined, 'table');
            this.listenNotes(entity, idNotes);
            this.listenPreview();
            const $checkMutable = (0, util_8.$get)(idCheckMutable);
            $checkMutable.on('change', function () {
                entity.mutable = this.checked;
                _this.update();
                _this.app.renderCode();
            });
        }
    }
    exports.LuaTableCard = LuaTableCard;
});
define("src/asledgehammer/mallet/component/ObjectTree", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, RosettaJavaClass_2, RosettaLuaClass_2, RosettaLuaTable_2, util_9, LuaCard_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectTree = void 0;
    const CLASS_HEADER = 'obj-tree';
    function wrapFolderCount(count) {
        return `<strong class="font-monospace text-white">(${count})</strong>`;
    }
    function wrapItem(text) {
        return `<span class="font-monospace">${text}</span>`;
    }
    class ObjectTree {
        constructor(app, sidebar) {
            this.idFolderLuaClass = `${CLASS_HEADER}-folder-lua-class`;
            this.idFolderLuaTable = `${CLASS_HEADER}-folder-value`;
            this.idFolderJavaClass = `${CLASS_HEADER}-folder-function`;
            this.folderLuaClassOpen = true;
            this.folderLuaTableOpen = true;
            this.folderJavaClassOpen = true;
            this.globalSelected = false;
            this.listening = false;
            this.selected = undefined;
            this.selectedID = undefined;
            this.app = app;
            this.sidebar = sidebar;
        }
        listen() {
            if (this.listening)
                return;
            const $doc = $(document);
            const _this = this;
            $doc.on('click', '.object-tree-item', function () {
                const $this = $(this);
                $('.object-tree-item.selected').removeClass('selected');
                $this.addClass('selected');
                _this.selectedID = this.id;
            });
            // Apply jQuery listeners next.
            $doc.on('click', '.object-tree-lua-class', function () {
                _this.globalSelected = false;
                const name = this.id.substring('object-lua-class-'.length);
                _this.app.showLuaClass(_this.app.catalog.luaClasses[name]);
                $(`#btn-new-lua-value`).show();
                $(`#btn-new-lua-field`).show();
                $(`#btn-new-lua-function`).show();
                $(`#btn-new-lua-method`).show();
                $(`#btn-lua-class-dropdown`).show();
                $(`#save-object-dropdown`).css({ 'display': 'inline' });
            });
            $doc.on('click', '.object-tree-lua-table', function () {
                _this.globalSelected = false;
                const name = this.id.substring('object-lua-table-'.length);
                _this.app.showLuaTable(_this.app.catalog.luaTables[name]);
                $(`#btn-new-lua-value`).hide();
                $(`#btn-new-lua-field`).show();
                $(`#btn-new-lua-function`).show();
                $(`#btn-new-lua-method`).hide();
                $(`#btn-lua-class-dropdown`).show();
                $(`#save-object-dropdown`).css({ 'display': 'inline' });
            });
            $doc.on('click', '.object-tree-java-class', function () {
                _this.globalSelected = false;
                const name = this.id.substring('object-java-class-'.length);
                _this.app.showJavaClass(_this.app.catalog.javaClasses[name]);
                $(`#btn-lua-class-dropdown`).hide();
                $(`#save-object-dropdown`).css({ 'display': 'inline' });
            });
            $doc.on('click', '.object-tree-global', () => {
                this.globalSelected = true;
                this.sidebar.itemTree.selected = undefined;
                this.sidebar.itemTree.selectedID = undefined;
                $(`#btn-new-lua-value`).hide();
                $(`#btn-new-lua-field`).show();
                $(`#btn-new-lua-function`).show();
                $(`#btn-new-lua-method`).hide();
                $(`#btn-lua-class-dropdown`).show();
                this.app.hideCard();
                this.app.renderCode();
            });
            // Preserve the state of folders.
            $doc.on('click', '#' + this.idFolderLuaClass, () => {
                this.folderLuaClassOpen = !this.folderLuaClassOpen;
            });
            $doc.on('click', '#' + this.idFolderLuaTable, () => {
                this.folderLuaTableOpen = !this.folderLuaTableOpen;
            });
            $doc.on('click', '#' + this.idFolderJavaClass, () => {
                this.folderJavaClassOpen = !this.folderJavaClassOpen;
            });
            this.listening = true;
        }
        populate() {
            const _this = this;
            const { selected } = this.app.catalog;
            if (!this.globalSelected) {
                if (selected instanceof RosettaLuaClass_2.RosettaLuaClass) {
                    this.selectedID = `object-lua-class-${selected.name}`;
                }
                else if (selected instanceof RosettaLuaTable_2.RosettaLuaTable) {
                    this.selectedID = `object-lua-table-${selected.name}`;
                }
                else if (selected instanceof RosettaJavaClass_2.RosettaJavaClass) {
                    this.selectedID = `object-java-class-${selected.name}`;
                }
                else {
                    this.selectedID = undefined;
                }
            }
            let $treeUpper = (0, util_9.$get)('tree-upper');
            $treeUpper.remove();
            const $sidebarContentUpper = (0, util_9.$get)('sidebar-content-upper');
            $sidebarContentUpper.append('<div id="tree-upper" class="rounded-0 bg-dark text-white"></div>');
            $treeUpper = (0, util_9.$get)('tree-upper');
            const luaClasses = [];
            for (const name of Object.keys(this.app.catalog.luaClasses)) {
                const id = `object-lua-class-${name}`;
                const classes = ['object-tree-item', 'object-tree-lua-class'];
                if (this.selectedID === id)
                    classes.push('selected');
                luaClasses.push({
                    id,
                    text: wrapItem(name),
                    icon: LuaCard_4.LuaCard.getTypeIcon('class'),
                    class: classes
                });
            }
            const luaTables = [];
            for (const name of Object.keys(this.app.catalog.luaTables)) {
                const id = `object-lua-table-${name}`;
                const classes = ['object-tree-item', 'object-tree-lua-table'];
                if (this.selectedID === id)
                    classes.push('selected');
                luaTables.push({
                    id,
                    text: wrapItem(name),
                    icon: LuaCard_4.LuaCard.getTypeIcon('class'),
                    class: classes,
                });
            }
            const javaClasses = [];
            for (const name of Object.keys(this.app.catalog.javaClasses)) {
                const id = `object-java-class-${name}`;
                const classes = ['object-tree-item', 'object-tree-java-class'];
                if (this.selectedID === id)
                    classes.push('selected');
                javaClasses.push({
                    id,
                    text: wrapItem(name),
                    icon: LuaCard_4.LuaCard.getTypeIcon('class'),
                    class: classes,
                });
            }
            const folderLuaClasses = {
                text: `${wrapFolderCount(luaClasses.length)} Lua Classes`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaClass,
                expanded: _this.folderLuaClassOpen,
                nodes: luaClasses
            };
            const folderLuaTables = {
                text: `${wrapFolderCount(luaTables.length)} Lua Tables`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderLuaTable,
                expanded: _this.folderLuaTableOpen,
                nodes: luaTables
            };
            const folderJavaClasses = {
                text: `${wrapFolderCount(javaClasses.length)} Java Classes`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClass,
                expanded: _this.folderJavaClassOpen,
                nodes: javaClasses
            };
            const itemGlobal = {
                id: 'object-global',
                text: wrapItem('Global'),
                icon: 'fa-solid fa-globe text-light mx-2 desaturate',
                class: ['object-tree-item', 'object-tree-global']
            };
            if (this.globalSelected) {
                itemGlobal.class.push('selected');
            }
            const data = [
                itemGlobal
            ];
            if (luaClasses.length)
                data.push(folderLuaClasses);
            if (luaTables.length)
                data.push(folderLuaTables);
            if (javaClasses.length)
                data.push(folderJavaClasses);
            // @ts-ignore
            $treeUpper.bstreeview({ data });
            // if(this.selectedID != null) {
            //     document.getElementById(this.selectedID)!.scrollIntoView(true);
            // }
        }
    }
    exports.ObjectTree = ObjectTree;
});
define("src/asledgehammer/mallet/component/Sidebar", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/Component", "src/asledgehammer/mallet/component/ItemTree", "src/asledgehammer/mallet/component/ObjectTree"], function (require, exports, JavaLuaGenerator2_2, RosettaJavaClass_3, LuaLuaGenerator_4, RosettaLuaClass_3, RosettaLuaTable_3, JavaTypeScriptGenerator_2, LuaTypeScriptGenerator_4, util_10, Component_2, ItemTree_1, ObjectTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sidebar = void 0;
    class Sidebar extends Component_2.Component {
        constructor(app) {
            super({
                classes: ['vs-bg-6', 'shadow-lg', 'border', 'border-1'],
                style: {
                    width: '100%',
                    height: '100%',
                },
            });
            this.listening = false;
            this.idLuaClassDropdown = 'btn-lua-class-dropdown';
            this.app = app;
            const result = document.getElementById('result');
            const reader = new FileReader();
            reader.addEventListener('load', () => (result.innerHTML = reader.result));
            this.objTree = new ObjectTree_1.ObjectTree(app, this);
            this.itemTree = new ItemTree_1.ItemTree(app, this);
        }
        onRender() {
            return (0, util_10.html) `
        <div class="bg-dark" style="position: relative; top: 0; left: 0; width: 100%; height: 100%;">
            <div style="position: relative; top: 0; left: 0; width: 100%; height: 30%;">
                <div class="p-1 border-bottom border-bottom-2 border-black shadow">
                    
                    <!-- New dropdown -->
                    <div id="new-dropdown" class="dropdown" style="display: inline;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Create a new object.">
                        <div class="btn-pane">     
                            <i class="fa fa-file"></i>
                        </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-new-lua-class" class="dropdown-item" href="#">Lua Class</a></li>
                            <li><a id="btn-new-lua-table" class="dropdown-item" href="#">Lua Table</a></li>
                        </ul>
                    </div>

                    <!-- Open -->
                    <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open JSON File">
                        <div class="btn-pane">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                    </button>

                    <!-- Save dropdown -->
                    <div id="save-file-dropdown" class="dropdown" style="display: inline;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Save Catalog">
                        <div class="btn-pane">     
                        <i class="fa fa-save"></i>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-save-json" class="dropdown-item" href="#">JSON Catalog</a></li>
                            <li><a id="btn-save-json-compressed" class="dropdown-item" href="#">JSON Catalog (Compressed)</a></li>
                            <li><a id="btn-save-lua" class="dropdown-item" href="#">Lua Typings</a></li>
                            <li><a id="btn-save-typescript" class="dropdown-item" href="#">TypeScript Declarations</a></li>
                        </ul>
                    </div>

                </div>

                <div class="bg-dark" style="height: 100%; overflow-y: auto;">
                    <div id="sidebar-content-upper" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                        <div id="tree-upper" class="rounded-0 bg-dark text-white"></div>
                    </div>
                </div>
            </div>
            <div style="position: absolute; top: 30%; left: 0; width: 100%; height: 70%;">
                <div 
                    class="p-1 border-top border-top-2 border-bottom border-bottom-2 border-black shadow"
                    style="height: 41px;">
                    
                    
                    <!-- Save dropdown -->
                    <div id="save-object-dropdown" class="dropdown" style="display: none;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Save Object">
                        <div class="btn-pane">     
                            <i class="fa fa-save"></i>
                        </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-save-object-json" class="dropdown-item" href="#">JSON Object</a></li>
                            <li><a id="btn-save-object-json-compressed" class="dropdown-item" href="#">JSON Object (Compressed)</a></li>
                            <li><a id="btn-save-object-lua" class="dropdown-item" href="#">Lua Typings</a></li>
                            <li><a id="btn-save-object-typescript" class="dropdown-item" href="#">TypeScript Declarations</a></li>
                        </ul>
                    </div>
                    
                    <!-- New Properties -->
                    <div id="${this.idLuaClassDropdown}" class="dropdown" style="position: absolute; top: 5px; right: 5px; display: none">
                        <button class="btn btn-sm responsive-btn responsive-btn-success float-end" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Add Element">
                        <div class="btn-pane">     
                                <i class="fa-solid fa-plus"></i>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-new-lua-value" class="dropdown-item" href="#">New Value</a></li>
                            <li><a id="btn-new-lua-field" class="dropdown-item" href="#">New Field</a></li>
                            <li><a id="btn-new-lua-function" class="dropdown-item" href="#">New Function</a></li>
                            <li><a id="btn-new-lua-method" class="dropdown-item" href="#">New Method</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="bg-dark" style="height: 100%; overflow-y: auto;">
                    <div id="sidebar-content-lower" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                        <div id="tree-lower" class="rounded-0 bg-dark text-white"></div>
                    </div>
                </div>

            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        </div>
        `;
        }
        listen() {
            if (this.listening)
                return;
            this.objTree.listen();
            this.itemTree.listen();
            this.populateTrees();
            const { app } = this;
            const _this = this;
            const $doc = $(document);
            const { $titleName, $btnName, $inputName, modalName } = app.modalName;
            $doc.on('click', '#btn-new-lua-class', () => {
                try {
                    $titleName.html('New Lua Class');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    $inputName.val('');
                    app.modalName.nameMode = 'new_lua_class';
                    app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create LuaClass.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-new-lua-table', () => {
                try {
                    $titleName.html('New Lua Table');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    $inputName.val('');
                    app.modalName.nameMode = 'new_lua_table';
                    app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create LuaTable.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-new-lua-value', () => {
                try {
                    this.app.modalName.nameMode = 'new_value';
                    this.app.modalName.luaClass = this.app.catalog.selected;
                    $titleName.html('Create Lua Value');
                    $inputName.val('');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    this.app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Value.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-new-lua-field', () => {
                try {
                    this.app.modalName.nameMode = 'new_field';
                    if (this.objTree.globalSelected) {
                        $titleName.html('Create Global Lua Field');
                    }
                    else {
                        $titleName.html('Create Lua Field');
                        const { selected } = this.app.catalog;
                        if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            this.app.modalName.luaClass = selected;
                        }
                        else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                            this.app.modalName.luaTable = selected;
                        }
                        else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                            this.app.modalName.javaClass = selected;
                        }
                    }
                    $inputName.val('');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    this.app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Field.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-new-lua-function', () => {
                try {
                    this.app.modalName.nameMode = 'new_function';
                    if (this.objTree.globalSelected) {
                        $titleName.html('Create Global Lua Function');
                    }
                    else {
                        $titleName.html('Create Lua Function');
                        const { selected } = this.app.catalog;
                        if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            this.app.modalName.luaClass = selected;
                        }
                        else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                            this.app.modalName.luaTable = selected;
                        }
                        else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                            this.app.modalName.javaClass = selected;
                        }
                    }
                    $inputName.val('');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    this.app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Function.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-new-lua-method', () => {
                try {
                    this.app.modalName.nameMode = 'new_method';
                    if (this.objTree.globalSelected) {
                        $titleName.html('Create Global Lua Method');
                    }
                    else {
                        $titleName.html('Create Lua Method');
                        const { selected } = this.app.catalog;
                        if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            this.app.modalName.luaClass = selected;
                        }
                        else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                            this.app.modalName.luaTable = selected;
                        }
                        else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                            this.app.modalName.javaClass = selected;
                        }
                    }
                    $inputName.val('');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    this.app.modalName.show(true);
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Method.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#open-lua-class', () => {
                const dFileLoad = document.getElementById('load-file');
                const onchange = () => {
                    try {
                        const file = dFileLoad.files[0];
                        const textType = 'application/json';
                        if (file.type.match(textType)) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                const json = JSON.parse(reader.result);
                                app.catalog.fromJSON(json);
                                app.renderCode();
                                _this.populateTrees();
                            };
                            reader.readAsText(file);
                        }
                        app.toast.alert(`Loaded JSON file.`, 'success');
                    }
                    catch (e) {
                        if (e instanceof DOMException) {
                            console.warn(e.name);
                        }
                        app.toast.alert(`Failed to load JSON file.`, 'error');
                        console.error(e);
                    }
                };
                dFileLoad.onchange = onchange;
                dFileLoad.click();
            });
            $doc.on('click', '#btn-save-lua', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-lua',
                        types: [
                            {
                                description: "Lua file",
                                accept: { "text/x-lua": [".lua"] },
                            },
                        ],
                    });
                    const { catalog } = this.app;
                    const lua = catalog.toLuaTypings();
                    const writable = await result.createWritable();
                    await writable.write(lua);
                    await writable.close();
                    app.toast.alert(`Saved Lua typings file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save Lua typings.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-object-lua', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-lua',
                        types: [
                            {
                                description: "Lua file",
                                accept: { "text/x-lua": [".lua"] },
                            },
                        ],
                    });
                    const { selected } = this.app.catalog;
                    let lua = '--- @meta\n\n';
                    if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                        lua += (0, LuaLuaGenerator_4.generateLuaClass)(selected);
                    }
                    else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                        lua += (0, LuaLuaGenerator_4.generateLuaTable)(selected);
                    }
                    else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                        lua += (0, JavaLuaGenerator2_2.generateJavaClass)(selected);
                    }
                    const writable = await result.createWritable();
                    await writable.write(lua);
                    await writable.close();
                    app.toast.alert(`Saved Lua typings file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save Lua typings.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-typescript', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-typescript',
                        types: [
                            {
                                description: "TypeScript Declarations file",
                                accept: { "application/typescript": [".d.ts"] },
                            },
                        ],
                    });
                    const { catalog } = this.app;
                    const lua = catalog.toTypeScript();
                    const writable = await result.createWritable();
                    await writable.write(lua);
                    await writable.close();
                    app.toast.alert(`Saved Lua typings file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save Lua typings.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-object-typescript', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-typescript',
                        types: [
                            {
                                description: "TypeScript Declarations file",
                                accept: { "application/typescript": [".d.ts"] },
                            },
                        ],
                    });
                    const { selected } = this.app.catalog;
                    let ts = '';
                    if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                        ts += (0, LuaTypeScriptGenerator_4.luaClassToTS)(selected, true);
                    }
                    else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                        ts += (0, LuaTypeScriptGenerator_4.luaTableToTS)(selected, true);
                    }
                    else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                        ts += (0, JavaTypeScriptGenerator_2.javaClassToTS)(selected, true, true);
                    }
                    const writable = await result.createWritable();
                    await writable.write(ts);
                    await writable.close();
                    app.toast.alert(`Saved Lua typings file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save Lua typings.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-json', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-json',
                        types: [
                            {
                                description: "JSON file",
                                accept: { "application/json": [".json"] },
                            }
                        ],
                    });
                    const { catalog } = this.app;
                    const json = catalog.toJSON();
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(json, null, 2));
                    await writable.close();
                    app.toast.alert(`Saved JSON file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save JSON file.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-object-json', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-json',
                        types: [
                            {
                                description: "JSON file",
                                accept: { "application/json": [".json"] },
                            }
                        ],
                    });
                    const jsonFile = {
                        $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
                    };
                    const { selected } = this.app.catalog;
                    if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                        jsonFile.luaClasses = {};
                        jsonFile.luaClasses[selected.name] = selected.toJSON();
                    }
                    else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                        jsonFile.tables = {};
                        jsonFile.tables[selected.name] = selected.toJSON();
                    }
                    else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                        jsonFile.namespaces = {};
                        jsonFile.namespaces[selected.namespace.name] = {};
                        jsonFile.namespaces[selected.namespace.name][selected.name] = selected.toJSON();
                    }
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(jsonFile, null, 2));
                    await writable.close();
                    app.toast.alert(`Saved JSON file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save JSON file.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-json-compressed', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-json',
                        types: [
                            {
                                description: "JSON file",
                                accept: { "application/json": [".json"] },
                            }
                        ],
                    });
                    const jsonFile = {
                        $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
                    };
                    const { selected } = this.app.catalog;
                    if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                        jsonFile.luaClasses = {};
                        jsonFile.luaClasses[selected.name] = selected.toJSON();
                    }
                    else if (selected instanceof RosettaLuaTable_3.RosettaLuaTable) {
                        jsonFile.tables = {};
                        jsonFile.tables[selected.name] = selected.toJSON();
                    }
                    else if (selected instanceof RosettaJavaClass_3.RosettaJavaClass) {
                        jsonFile.namespaces = {};
                        jsonFile.namespaces[selected.namespace.name] = {};
                        jsonFile.namespaces[selected.namespace.name][selected.name] = selected.toJSON();
                    }
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(jsonFile));
                    await writable.close();
                    app.toast.alert(`Saved JSON file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save JSON file.`, 'error');
                    console.error(e);
                }
            });
            $doc.on('click', '#btn-save-object-json-compressed', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker({
                        id: 'mallet-save-json',
                        types: [
                            {
                                description: "JSON file",
                                accept: { "application/json": [".json"] },
                            }
                        ],
                    });
                    const { catalog } = this.app;
                    const json = catalog.toJSON();
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(json));
                    await writable.close();
                    app.toast.alert(`Saved JSON file.`, 'info');
                }
                catch (e) {
                    /* (Ignore aborted dialogs) */
                    if (e instanceof DOMException && e.name === 'AbortError')
                        return;
                    app.toast.alert(`Failed to save JSON file.`, 'error');
                    console.error(e);
                }
            });
            this.listening = true;
        }
        populateTrees() {
            this.objTree.populate();
            this.itemTree.populate();
        }
    }
    exports.Sidebar = Sidebar;
    ;
});
define("src/asledgehammer/mallet/component/lua/LuaConstructorCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_5, LuaTypeScriptGenerator_5, util_11, LuaCard_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaConstructorCard = void 0;
    class LuaConstructorCard extends LuaCard_5.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    const classEntity = this.app.catalog.selectedCard.options.entity;
                    return (0, LuaLuaGenerator_5.generateLuaConstructor)(classEntity.name, entity);
                }
                case 'typescript': {
                    return (0, LuaTypeScriptGenerator_5.luaConstructorToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const classEntity = this.app.catalog.selectedCard.options.entity;
            const className = classEntity.name;
            const name = `${className}:new( )`;
            return (0, util_11.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua Constructor</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer } = this;
            const { entity } = this.options;
            return (0, util_11.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters({ name: 'new', parameters: entity.parameters })}
            </div>
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { idNotes } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(Object.assign(Object.assign({}, entity), { name: 'new' }), 'constructor');
            this.listenPreview();
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity } = this.options;
            const $paramContainer = (0, util_11.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters({ name: 'new', parameters: entity.parameters }, true));
            this.listenParameters({ name: 'new', parameters: entity.parameters }, 'constructor');
        }
    }
    exports.LuaConstructorCard = LuaConstructorCard;
});
define("src/asledgehammer/mallet/component/lua/LuaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTableField", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_6, RosettaLuaField_2, RosettaLuaTableField_2, LuaTypeScriptGenerator_6, util_12, LuaCard_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFieldCard = void 0;
    class LuaFieldCard extends LuaCard_6.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idBtnDelete = `${this.id}-btn-delete`;
        }
        onRenderPreview(language) {
            var _a, _b;
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { app } = this;
                    const { entity, isStatic } = this.options;
                    const { defaultValue } = entity;
                    const name = (_b = (_a = app.catalog.selectedCard) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.entity.name;
                    if (isStatic) {
                        return `${(0, LuaLuaGenerator_6.generateLuaField)(entity)}\n\n${(0, LuaLuaGenerator_6.generateLuaValue)(name, entity)}`;
                    }
                    let s = (0, LuaLuaGenerator_6.generateLuaField)(entity);
                    if (defaultValue) {
                        s += `\n\n--- (Example of initialization of field) ---\nself.${entity.name} = ${defaultValue};`;
                    }
                    return s;
                }
                case 'typescript': {
                    return (0, LuaTypeScriptGenerator_6.luaFieldToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            var _a;
            const { idBtnEdit, idBtnDelete } = this;
            const { entity, isStatic } = this.options;
            const luaClass = (_a = this.app.catalog.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
            let name = `${luaClass.name}.${entity.name}`;
            if (isStatic) {
                name = (0, util_12.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_12.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua ${isStatic ? 'Property' : 'Field'}</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete ${isStatic ? 'Value' : 'Field'}">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idDefaultValue, idNotes, idType } = this;
            const { entity } = this.options;
            return (0, util_12.html) `
            <div>
                ${this.renderNotes(idNotes)}
                ${this.renderDefaultValue(entity.defaultValue, idDefaultValue)}
                <hr>
                ${this.renderType(entity.name, entity.type, entity.nullable, idType)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idBtnEdit, idDefaultValue, idNotes, idType } = this;
            const { entity, isStatic } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenDefaultValue(entity, idDefaultValue);
            this.listenType(entity, idType, idType);
            this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_value' : 'edit_field', `Edit ${isStatic ? 'Value' : 'Field'} Name`, undefined, 'field');
            this.listenPreview();
            (0, util_12.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    const entity = this.options.entity;
                    // Global field.
                    if (app.sidebar.objTree.globalSelected) {
                        delete app.catalog.fields[entity.name];
                        app.hideCard();
                        return;
                    }
                    if (entity instanceof RosettaLuaField_2.RosettaLuaField) {
                        const clazz = app.catalog.selected;
                        if (isStatic) {
                            delete clazz.values[entity.name];
                        }
                        else {
                            delete clazz.fields[entity.name];
                        }
                        app.sidebar.itemTree.selectedID = undefined;
                        app.showLuaClass(clazz);
                    }
                    else if (entity instanceof RosettaLuaTableField_2.RosettaLuaTableField) {
                        const table = app.catalog.selected;
                        delete table.fields[entity.name];
                        app.sidebar.itemTree.selectedID = undefined;
                        app.showLuaTable(table);
                    }
                }, `Delete Field ${entity.name}`);
            });
        }
    }
    exports.LuaFieldCard = LuaFieldCard;
});
define("src/asledgehammer/mallet/component/lua/LuaFunctionCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_7, RosettaLuaClass_4, RosettaLuaTable_4, LuaTypeScriptGenerator_7, util_13, LuaCard_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFunctionCard = void 0;
    class LuaFunctionCard extends LuaCard_7.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
            this.idBtnDelete = `${this.id}-btn-delete`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    const classEntity = this.app.catalog.selectedCard.options.entity;
                    const className = classEntity.name;
                    return (0, LuaLuaGenerator_7.generateLuaFunction)(className, ':', entity);
                }
                case 'typescript': {
                    return (0, LuaTypeScriptGenerator_7.luaFunctionToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { idBtnDelete, idBtnEdit } = this;
            const { entity, isStatic } = this.options;
            const classEntity = this.app.catalog.selectedCard.options.entity;
            const className = classEntity.name;
            let name = `${className}${isStatic ? '.' : ':'}${entity.name}( )`;
            if (isStatic) {
                name = (0, util_13.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_13.html) ` 
            <div class="row">

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua ${isStatic ? 'Function' : 'Method'}</strong>
                    </div>
                </div>
                
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete ${isStatic ? 'Function' : 'Method'}">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_13.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idBtnEdit, idNotes, idReturnType, idReturnNotes } = this;
            const { entity, isStatic } = this.options;
            this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_function' : 'edit_method', `Edit Lua ${isStatic ? 'Function' : 'Method'}`, undefined, 'function');
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, isStatic ? 'function' : 'method');
            this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
            this.listenPreview();
            (0, util_13.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    const entity = this.options.entity;
                    // Global function.
                    if (app.sidebar.objTree.globalSelected) {
                        delete app.catalog.functions[entity.name];
                        app.hideCard();
                        return;
                    }
                    const selected = this.app.catalog.selected;
                    if (selected instanceof RosettaLuaClass_4.RosettaLuaClass) {
                        if (isStatic) {
                            delete selected.functions[entity.name];
                        }
                        else {
                            delete selected.methods[entity.name];
                        }
                        app.sidebar.itemTree.selectedID = undefined;
                        app.showLuaClass(selected);
                    }
                    else if (selected instanceof RosettaLuaTable_4.RosettaLuaTable) {
                        delete selected.functions[entity.name];
                        app.sidebar.itemTree.selectedID = undefined;
                        app.showLuaTable(selected);
                    }
                }, `Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`);
            });
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity, isStatic } = this.options;
            const $paramContainer = (0, util_13.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, isStatic ? 'function' : 'method');
        }
    }
    exports.LuaFunctionCard = LuaFunctionCard;
});
define("src/asledgehammer/mallet/component/java/JavaConstructorCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/java/JavaCard"], function (require, exports, JavaLuaGenerator2_3, JavaTypeScriptGenerator_3, util_14, JavaCard_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaConstructorCard = void 0;
    class JavaConstructorCard extends JavaCard_2.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    const classEntity = this.app.catalog.selectedCard.options.entity;
                    const className = classEntity.name;
                    return (0, JavaLuaGenerator2_3.generateJavaConstructor)(className, entity);
                }
                case 'typescript': {
                    return (0, JavaTypeScriptGenerator_3.javaConstructorToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity, null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { entity } = this.options;
            const classEntity = this.app.catalog.selectedCard.options.entity;
            const className = classEntity.name;
            let params = '';
            for (const param of entity.parameters) {
                params += `${param.name}, `;
            }
            if (params.length)
                params = params.substring(0, params.length - 2);
            let name = `${className}(${params})`;
            return (0, util_14.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Constructor</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer } = this;
            const { entity } = this.options;
            return (0, util_14.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters({ name: 'new', parameters: entity.parameters })}
            </div>
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { idNotes } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, 'constructor');
            this.listenPreview();
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity } = this.options;
            const $paramContainer = (0, util_14.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters({ name: 'new', parameters: entity.parameters }, true));
            this.listenParameters(entity, 'constructor');
        }
    }
    exports.JavaConstructorCard = JavaConstructorCard;
});
define("src/asledgehammer/mallet/component/java/JavaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/java/JavaCard"], function (require, exports, JavaLuaGenerator2_4, JavaTypeScriptGenerator_4, util_15, JavaCard_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaFieldCard = void 0;
    class JavaFieldCard extends JavaCard_3.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idBtnDelete = `${this.id}-btn-delete`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    return (0, JavaLuaGenerator2_4.generateJavaField)(entity);
                }
                case 'typescript': {
                    return (0, JavaTypeScriptGenerator_4.javaFieldToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity, null, 2);
                }
            }
        }
        onHeaderHTML() {
            var _a;
            const { idBtnEdit, idBtnDelete } = this;
            const { entity, isStatic } = this.options;
            const javaClass = (_a = this.app.catalog.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
            let name = `${javaClass.name}.${entity.name}`;
            if (isStatic) {
                name = (0, util_15.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_15.html) ` 
            <div class="row">
            ${isStatic ?
                (0, util_15.html) `
                        <div class="col-auto ps-2 pe-0">
                            <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                                <strong>Static</strong>
                            </div>
                        </div>
                        `
                : ''}

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Field</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idType } = this;
            const { entity } = this.options;
            return (0, util_15.html) `
            <div>
                ${this.renderNotes(idNotes)}
                <hr>
                ${this.renderType(entity)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idBtnEdit, idNotes } = this;
            const { entity, isStatic } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_value' : 'edit_field', `Edit ${isStatic ? 'Value' : 'Field'} Name`);
            this.listenPreview();
            this.listenType(entity);
            (0, util_15.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    var _a;
                    const clazz = (_a = app.catalog.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                    delete clazz.fields[entity.name];
                    app.showJavaClass(clazz);
                    app.sidebar.itemTree.selectedID = undefined;
                    app.sidebar.populateTrees();
                }, `Delete ${isStatic ? 'Value' : 'Field'} ${entity.name}`);
            });
        }
    }
    exports.JavaFieldCard = JavaFieldCard;
});
define("src/asledgehammer/mallet/component/java/JavaMethodCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/java/JavaCard"], function (require, exports, JavaLuaGenerator2_5, JavaTypeScriptGenerator_5, util_16, JavaCard_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaMethodCard = void 0;
    class JavaMethodCard extends JavaCard_4.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
            this.idBtnDelete = `${this.id}-btn-delete`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    const classEntity = this.app.catalog.selectedCard.options.entity;
                    const className = classEntity.name;
                    return (0, JavaLuaGenerator2_5.generateJavaMethod)(className, entity.isStatic() ? '.' : ':', entity);
                }
                case 'typescript': {
                    return (0, JavaTypeScriptGenerator_5.javaMethodToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { entity, isStatic } = this.options;
            const classEntity = this.app.catalog.selectedCard.options.entity;
            const className = classEntity.name;
            let params = '';
            for (const param of entity.parameters) {
                params += `${param.name}, `;
            }
            if (params.length)
                params = params.substring(0, params.length - 2);
            let name = `${className}${isStatic ? '.' : ':'}${entity.name}(${params})`;
            if (isStatic) {
                name = (0, util_16.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_16.html) ` 
            <div class="row">

            ${isStatic ?
                (0, util_16.html) `
                        <div class="col-auto ps-2 pe-0">
                            <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                                <strong>Static</strong>
                            </div>
                        </div>
                        `
                : ''}
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Method</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_16.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idNotes, idReturnNotes } = this;
            const { entity, isStatic } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, 'method');
            this.listenReturns(entity, idReturnNotes);
            this.listenPreview();
            (0, util_16.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    var _a;
                    const clazz = (_a = app.catalog.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                    delete clazz.methods[entity.name];
                    app.showJavaClass(clazz);
                    app.sidebar.itemTree.selectedID = undefined;
                    app.sidebar.populateTrees();
                }, `Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`);
            });
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity, isStatic } = this.options;
            const $paramContainer = (0, util_16.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, 'method');
        }
    }
    exports.JavaMethodCard = JavaMethodCard;
});
define("src/asledgehammer/mallet/modal/ModalName", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunctionCluster", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/util"], function (require, exports, RosettaJavaClass_4, RosettaLuaClass_5, RosettaLuaField_3, RosettaLuaFunction_3, RosettaLuaFunctionCluster_3, RosettaLuaTable_5, util_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModalName = void 0;
    class ModalName {
        constructor(app) {
            // Temporary fields for editing.
            this.javaClass = undefined;
            this.javaMethod = undefined;
            this.javaConstructor = undefined;
            this.javaParameter = undefined;
            this.javaCallback = undefined;
            this.luaClass = undefined;
            this.luaTable = undefined;
            this.luaConstructor = undefined;
            this.luaFunction = undefined;
            this.luaMethod = undefined;
            this.luaField = undefined;
            this.globalJavaMethod = undefined;
            this.globalLuaFunction = undefined;
            this.globalLuaField = undefined;
            this.app = app;
            // @ts-ignore This modal is for new items and editing their names.
            this.modalName = new bootstrap.Modal('#modal-name', {});
            this.$titleName = (0, util_17.$get)('title-name');
            this.$inputName = (0, util_17.$get)('input-name');
            this.$btnName = (0, util_17.$get)('btn-name-create');
            this.nameMode = null;
        }
        listen() {
            const { app, $inputName, $btnName } = this;
            const { catalog: active } = app;
            this.$inputName.on('input', () => {
                const val = $inputName.val();
                const isValid = (0, util_17.isNameValid)(val);
                $btnName.prop('disabled', !isValid);
                if (isValid) {
                    $inputName.removeClass('is-invalid');
                    $inputName.addClass('is-valid');
                }
                else {
                    $inputName.addClass('is-invalid');
                    $inputName.removeClass('is-valid');
                }
            });
            const $modalName = $('#modal-name');
            $modalName.on('shown.bs.modal', function () {
                $inputName.trigger('focus');
            });
            $modalName.on('keydown', function (e) {
                if (e.key === 'Enter') {
                    $btnName.trigger('click');
                }
            });
            this.$btnName.on('click', () => {
                var _a;
                const name = (0, util_17.validateLuaVariableName)($inputName.val()).trim();
                const nameOld = this.nameSelected;
                // Handle global creation elsewhere.
                if (this.app.sidebar.objTree.globalSelected) {
                    this.onGlobalListen(nameOld, name);
                    return;
                }
                const entity = (_a = active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                switch (this.nameMode) {
                    case 'new_lua_class': {
                        this.onNewLuaClass(name);
                        break;
                    }
                    case 'new_lua_table': {
                        this.onNewLuaTable(name);
                        break;
                    }
                    case 'edit_lua_class': {
                        if (this.luaClass) {
                            this.onEditLuaClass(this.luaClass, name);
                        }
                        break;
                    }
                    case 'edit_lua_table': {
                        if (this.luaTable) {
                            this.onEditLuaTable(this.luaTable, name);
                        }
                        break;
                    }
                    case 'new_field': {
                        if (this.luaClass) {
                            this.onLuaClassNewField(this.luaClass, name);
                        }
                        else if (this.luaTable) {
                            this.onLuaTableNewField(this.luaTable, name);
                        }
                        break;
                    }
                    case 'edit_field': {
                        if (this.luaClass) {
                            this.onLuaClassEditField(this.luaClass, nameOld, name);
                        }
                        else if (this.luaTable) {
                            this.onLuaTableEditField(this.luaTable, nameOld, name);
                        }
                        break;
                    }
                    case 'new_value': {
                        if (this.luaClass) {
                            this.onLuaClassNewValue(this.luaClass, name);
                        }
                        break;
                    }
                    case 'edit_value': {
                        if (this.luaClass) {
                            this.onLuaClassEditValue(this.luaClass, nameOld, name);
                        }
                        break;
                    }
                    case 'new_function': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassNewFunction(entity, name);
                        }
                        else if (entity instanceof RosettaLuaTable_5.RosettaLuaTable) {
                            this.onLuaTableNewFunction(entity, name);
                        }
                        break;
                    }
                    case 'edit_function': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassEditFunction(entity, this.luaFunction, name);
                        }
                        else if (entity instanceof RosettaLuaTable_5.RosettaLuaTable) {
                            this.onLuaTableEditFunction(entity, this.luaFunction, name);
                        }
                        break;
                    }
                    case 'new_method': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassNewMethod(entity, name);
                        }
                        break;
                    }
                    case 'edit_method': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassEditMethod(entity, this.luaFunction, name);
                        }
                        break;
                    }
                    case 'new_parameter': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassNewParameter(nameOld, name);
                        }
                        else if (entity instanceof RosettaLuaTable_5.RosettaLuaTable) {
                            this.onLuaTableNewParameter(nameOld, name);
                        }
                        break;
                    }
                    case 'edit_parameter': {
                        if (entity instanceof RosettaLuaClass_5.RosettaLuaClass) {
                            this.onLuaClassEditParameter(entity, nameOld, name);
                        }
                        else if (entity instanceof RosettaLuaTable_5.RosettaLuaTable) {
                            this.onLuaTableEditParameter(entity, nameOld, name);
                        }
                        else if (entity instanceof RosettaJavaClass_4.RosettaJavaClass) {
                            this.onJavaClassEditParameter(entity, nameOld, name);
                        }
                        break;
                    }
                }
                this.reset();
                this.modalName.hide();
            });
        }
        onGlobalListen(nameOld, name) {
            switch (this.nameMode) {
                case 'new_lua_class': {
                    this.onNewLuaClass(name);
                    break;
                }
                case 'new_lua_table': {
                    this.onNewLuaTable(name);
                    break;
                }
                case 'edit_lua_class': {
                    if (this.luaClass) {
                        this.onEditLuaClass(this.luaClass, name);
                    }
                    break;
                }
                case 'edit_lua_table': {
                    if (this.luaTable) {
                        this.onEditLuaTable(this.luaTable, name);
                    }
                    break;
                }
                case 'new_field': {
                    this.onGlobalNewField(name);
                    break;
                }
                case 'edit_field': {
                    this.onGlobalEditField(nameOld, name);
                    break;
                }
                case 'new_function': {
                    this.onGlobalNewFunction(name);
                    break;
                }
                case 'edit_function': {
                    this.onGlobalEditFunction(nameOld, name);
                    break;
                }
                case 'new_parameter': {
                    this.onGlobalNewParameter(nameOld, name);
                    break;
                }
                case 'edit_parameter': {
                    this.onGlobalEditParameter(nameOld, name);
                    break;
                }
                default: {
                    throw new Error('Unsupported Global name-mode: ' + this.nameMode);
                }
            }
            this.reset();
            this.modalName.hide();
        }
        onGlobalNewField(name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const field = new RosettaLuaField_3.RosettaLuaField(name);
                catalog.fields[field.name] = field;
                app.showGlobalLuaField(field);
                toast.alert('Created Global Lua Field.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Global Lua Field.`, 'error');
                console.error(e);
            }
        }
        onGlobalEditField(nameOld, name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const field = catalog.fields[nameOld];
                field.name = name;
                delete catalog.fields[nameOld];
                catalog.fields[name] = field;
                app.showGlobalLuaField(field);
                toast.alert('Edited Global Lua Field.');
            }
            catch (e) {
                toast.alert(`Failed to edit Global Lua Field.`, 'error');
                console.error(e);
            }
        }
        onGlobalNewFunction(name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const func = new RosettaLuaFunction_3.RosettaLuaFunction(name, { returns: { type: 'void' } });
                let cluster = catalog.functions[func.name];
                if (!cluster) {
                    cluster = new RosettaLuaFunctionCluster_3.RosettaLuaFunctionCluster(func.name);
                    catalog.functions[func.name] = cluster;
                }
                cluster.add(func);
                app.showGlobalLuaFunction(func);
                toast.alert('Created Global Lua Function.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Global Lua Function.`, 'error');
                console.error(e);
            }
        }
        onGlobalEditFunction(nameOld, name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const func = this.globalLuaFunction;
                func.name = name;
                let cluster = catalog.functions[nameOld];
                cluster.functions.splice(cluster.functions.indexOf(func), 1);
                if (cluster.functions.length === 0) {
                    delete catalog.functions[nameOld];
                }
                cluster = catalog.functions[name];
                if (!cluster) {
                    cluster = new RosettaLuaFunctionCluster_3.RosettaLuaFunctionCluster(name);
                    catalog.functions[name] = cluster;
                }
                cluster.add(func);
                app.showGlobalLuaFunction(func);
                toast.alert('Created Global Lua Function.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Global Lua Function.`, 'error');
                console.error(e);
            }
        }
        onGlobalNewParameter(nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const type = split[0];
                const funcName = split[1];
                let func = undefined;
                if (type === 'global_function') {
                    func = this.globalLuaFunction;
                }
                else {
                    throw new Error('Creating parameters for Java Methods is not supported.');
                }
                if (!func) {
                    toast.alert('Unknown function: ' + funcName, 'error');
                    return;
                }
                func.addParameter(name, 'any');
                app.showGlobalLuaFunction(func);
                toast.alert('Created Global Lua Function Parameter.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Global Lua Function Parameter.`, 'error');
                console.error(e);
            }
        }
        onGlobalEditParameter(nameOld, name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const split = nameOld.split('-');
                const funcName = split[0];
                const paramName = split[1];
                let type = null;
                let func = undefined;
                let param = null;
                // First, check methods.
                func = this.globalJavaMethod;
                // Second, check functions.
                if (!func) {
                    func = this.globalLuaFunction;
                }
                if (!func) {
                    console.warn(`Unknown function / method: _G.${funcName}!`);
                    return;
                }
                for (const next of func.parameters) {
                    if (next.name === paramName) {
                        param = next;
                        break;
                    }
                }
                if (!param) {
                    console.warn(`Unknown parameter: _G.${funcName}#${paramName}!`);
                    return;
                }
                param.name = name;
                if (type === 'function') {
                    app.showGlobalLuaFunction(func);
                    toast.alert('Edited Global Lua Function Parameter.');
                }
                else if (type === 'method') {
                    app.showGlobalJavaMethod(func);
                    toast.alert('Edited Global Java Method Parameter.');
                }
            }
            catch (e) {
                toast.alert(`Failed to edit Parameter.`, 'error');
                console.error(e);
            }
        }
        onNewLuaClass(name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const entity = new RosettaLuaClass_5.RosettaLuaClass(name);
                catalog.luaClasses[entity.name] = entity;
                app.showLuaClass(entity);
                toast.alert('Created Lua Class.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Class.`, 'error');
                console.error(e);
            }
        }
        onNewLuaTable(name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                const entity = new RosettaLuaTable_5.RosettaLuaTable(name);
                catalog.luaTables[entity.name] = entity;
                app.showLuaTable(entity);
                toast.alert('Created Lua Table.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Table.`, 'error');
                console.error(e);
            }
        }
        onEditLuaClass(clazz, name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                // Modify the dictionary.
                delete catalog.luaClasses[clazz.name];
                clazz.name = name;
                catalog.luaClasses[name] = clazz;
                app.showLuaClass(clazz);
                toast.alert('Edited Lua Class.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua class.`, 'error');
                console.error(e);
            }
        }
        onEditLuaTable(table, name) {
            const { app } = this;
            const { catalog, toast } = app;
            try {
                // Modify the dictionary.
                delete catalog.luaTables[table.name];
                table.name = name;
                catalog.luaTables[name] = table;
                app.showLuaTable(table);
                toast.alert('Edited Lua table.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua table.`, 'error');
                console.error(e);
            }
        }
        onLuaClassNewField(clazz, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const field = clazz.createField(name);
                app.showLuaClassField(field);
                toast.alert('Created Lua Class Field.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Class Field.`, 'error');
                console.error(e);
            }
        }
        onLuaTableNewField(table, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const field = table.createField(name);
                app.showLuaTableField(field);
                toast.alert('Created Lua Table Field.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Table Field.`, 'error');
                console.error(e);
            }
        }
        onLuaClassEditField(clazz, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const field = clazz.fields[nameOld];
                field.name = name;
                delete clazz.fields[nameOld];
                clazz.fields[name] = field;
                app.showLuaClassField(field);
                toast.alert('Edited Lua Class Field.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Class Field.`, 'error');
                console.error(e);
            }
        }
        onLuaTableEditField(table, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const field = table.fields[nameOld];
                field.name = name;
                delete table.fields[nameOld];
                table.fields[name] = field;
                app.showLuaTableField(field);
                toast.alert('Edited Lua Table Field.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Table Field.`, 'error');
                console.error(e);
            }
        }
        onLuaClassNewValue(clazz, name) {
            console.log(`onLuaClassNewValue(${clazz.name}, ${name})`);
            const { app } = this;
            const { toast } = app;
            try {
                const value = clazz.createValue(name);
                app.showLuaClassValue(value);
                toast.alert('Created Lua Value.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Value.`, 'error');
                console.error(e);
            }
        }
        onLuaClassEditValue(clazz, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const value = clazz.values[nameOld];
                value.name = name;
                delete clazz.values[nameOld];
                clazz.values[name] = value;
                app.showLuaClassValue(value);
                toast.alert('Edited Lua value.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Value.`, 'error');
                console.error(e);
            }
        }
        onLuaClassNewFunction(clazz, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const func = clazz.createFunction(name);
                app.showLuaClassFunction(func);
                toast.alert('Created Lua Function.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Function.`, 'error');
                console.error(e);
            }
        }
        onLuaTableNewFunction(table, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const func = table.createFunction(name);
                app.showLuaTableFunction(func);
                toast.alert('Created Lua Function.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Function.`, 'error');
                console.error(e);
            }
        }
        onLuaClassEditFunction(clazz, func, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const nameOld = func.name;
                func.name = name;
                // Grab the old cluster and remove the function.
                let cluster = clazz.functions[nameOld];
                cluster.functions.splice(cluster.functions.indexOf(func), 1);
                // Remove cluster if empty.
                if (cluster.functions.length === 0) {
                    delete clazz.functions[nameOld];
                }
                // Grab the new-named cluster.
                cluster = clazz.functions[name];
                // Create the cluster if not present.
                if (!cluster) {
                    cluster = new RosettaLuaFunctionCluster_3.RosettaLuaFunctionCluster(name);
                    clazz.functions[name] = cluster;
                }
                // Add the function to this cluster.
                cluster.add(func);
                app.showLuaClassFunction(func);
                toast.alert('Edited Lua Class Function.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Class Function.`, 'error');
                console.error(e);
            }
        }
        onLuaTableEditFunction(table, func, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const nameOld = func.name;
                func.name = name;
                // Grab the old cluster and remove the function.
                let cluster = table.functions[nameOld];
                cluster.functions.splice(cluster.functions.indexOf(func), 1);
                // Remove cluster if empty.
                if (cluster.functions.length === 0) {
                    delete table.functions[nameOld];
                }
                // Grab the new-named cluster.
                cluster = table.functions[name];
                // Create the cluster if not present.
                if (!cluster) {
                    cluster = new RosettaLuaFunctionCluster_3.RosettaLuaFunctionCluster(name);
                    table.functions[name] = cluster;
                }
                // Add the function to this cluster.
                cluster.add(func);
                app.showLuaTableFunction(func);
                toast.alert('Edited Lua Table Function.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Table Function.`, 'error');
                console.error(e);
            }
        }
        onLuaClassNewMethod(clazz, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const method = clazz.createMethod(name);
                app.showLuaClassMethod(method);
                toast.alert('Created Lua Method.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Method.`, 'error');
                console.error(e);
            }
        }
        onLuaClassEditMethod(clazz, func, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const nameOld = func.name;
                func.name = name;
                // Grab the old cluster and remove the function.
                let cluster = clazz.methods[nameOld];
                cluster.functions.splice(cluster.functions.indexOf(func), 1);
                // Remove cluster if empty.
                if (cluster.functions.length === 0) {
                    delete clazz.methods[nameOld];
                }
                // Grab the new-named cluster.
                cluster = clazz.methods[name];
                // Create the cluster if not present.
                if (!cluster) {
                    cluster = new RosettaLuaFunctionCluster_3.RosettaLuaFunctionCluster(name);
                    clazz.methods[name] = cluster;
                }
                // Add the function to this cluster.
                cluster.add(func);
                app.showLuaClassMethod(func);
                toast.alert('Edited Lua Class Method.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Class Method.`, 'error');
                console.error(e);
            }
        }
        onLuaClassNewParameter(nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const type = split[0];
                let func = null;
                if (type === 'constructor') {
                    func = this.luaConstructor;
                }
                else if (type === 'function') {
                    func = this.luaFunction;
                }
                else {
                    func = this.luaMethod;
                }
                func.addParameter(name, 'any');
                if (type === 'constructor') {
                    app.showLuaClassConstructor(func);
                }
                else if (type === 'function') {
                    app.showLuaClassFunction(func);
                }
                else {
                    app.showLuaClassMethod(func);
                }
                toast.alert('Created Lua Parameter.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Parameter.`, 'error');
                console.error(e);
            }
        }
        onLuaTableNewParameter(nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const type = split[0];
                let func = null;
                if (type === 'constructor') {
                    func = this.luaConstructor;
                }
                else if (type === 'function') {
                    func = this.luaFunction;
                }
                else {
                    func = this.luaMethod;
                }
                func.addParameter(name, 'any');
                app.showLuaTableFunction(func);
                toast.alert('Created Lua Parameter.', 'success');
            }
            catch (e) {
                toast.alert(`Failed to create Lua Parameter.`, 'error');
                console.error(e);
            }
        }
        onLuaClassEditParameter(clazz, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const funcName = split[0];
                const paramName = split[1];
                let type = null;
                let func = null;
                let param = null;
                // Could be the constructor.
                if (funcName === 'new') {
                    func = this.luaConstructor;
                    type = 'constructor';
                }
                else {
                    if (this.luaMethod) {
                        func = this.luaMethod;
                        type = 'method';
                    }
                    else if (this.luaFunction) {
                        func = this.luaFunction;
                        type = 'function';
                    }
                }
                if (!func) {
                    console.warn(`Unknown function / method / constructor: ${clazz.name}.${funcName}!`);
                    return;
                }
                for (const next of func.parameters) {
                    if (next.name === paramName) {
                        param = next;
                        break;
                    }
                }
                if (!param) {
                    console.warn(`Unknown parameter: ${clazz.name}.${funcName}#${paramName}!`);
                    return;
                }
                param.name = name;
                if (type === 'constructor') {
                    app.showLuaClassConstructor(func);
                }
                else if (type === 'function') {
                    app.showLuaClassFunction(func);
                }
                else if (type === 'method') {
                    app.showLuaClassMethod(func);
                }
                toast.alert('Edited Lua Parameter.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Parameter.`, 'error');
                console.error(e);
            }
        }
        onLuaTableEditParameter(table, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const funcName = split[0];
                const paramName = split[1];
                let type = null;
                let func = null;
                let param = null;
                // Could be the constructor.
                if (funcName === 'new') {
                    func = this.luaConstructor;
                    type = 'constructor';
                }
                else {
                    if (this.luaMethod) {
                        func = this.luaMethod;
                        type = 'method';
                    }
                    else if (this.luaFunction) {
                        func = this.luaFunction;
                        type = 'function';
                    }
                }
                if (!func) {
                    console.warn(`Unknown function / method / constructor: ${table.name}.${funcName}!`);
                    return;
                }
                for (const next of func.parameters) {
                    if (next.name === paramName) {
                        param = next;
                        break;
                    }
                }
                if (!param) {
                    console.warn(`Unknown parameter: ${table.name}.${funcName}#${paramName}!`);
                    return;
                }
                param.name = name;
                app.showLuaTableFunction(func);
                toast.alert('Edited Lua Parameter.');
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Parameter.`, 'error');
                console.error(e);
            }
        }
        onJavaClassEditParameter(clazz, nameOld, name) {
            const { app } = this;
            const { toast } = app;
            try {
                const split = nameOld.split('-');
                const funcName = split[0];
                const paramName = split[1];
                let type = null;
                let method = undefined;
                let param = this.javaParameter;
                if (funcName === 'new') {
                    method = this.javaConstructor;
                    type = 'constructor';
                }
                else {
                    method = this.javaMethod;
                }
                if (!method) {
                    console.warn(`Unknown function / method / constructor: ${clazz.name}.${funcName}!`);
                    return;
                }
                if (!param) {
                    console.warn(`Unknown parameter: ${clazz.name}.${funcName}#${paramName}!`);
                    return;
                }
                param.name = name;
                if (type === 'constructor') {
                    app.showJavaClassConstructor(method);
                }
                else if (type === 'method') {
                    app.showJavaClassMethod(method);
                }
                toast.alert('Edited Lua Parameter.');
                if (this.javaCallback)
                    this.javaCallback(name);
            }
            catch (e) {
                toast.alert(`Failed to edit Lua Parameter.`, 'error');
                console.error(e);
            }
        }
        show(disableBtn) {
            this.$btnName.prop('disabled', disableBtn);
            this.modalName.show();
        }
        hide() {
            this.modalName.hide();
        }
        reset() {
            /* (Global Types) */
            this.globalLuaField = undefined;
            this.globalLuaFunction = undefined;
            this.globalJavaMethod = undefined;
            /* (Lua Types) */
            this.luaClass = undefined;
            this.luaConstructor = undefined;
            this.luaField = undefined;
            this.luaFunction = undefined;
            this.luaMethod = undefined;
            this.luaTable = undefined;
            /* (Java Types) */
            this.javaClass = undefined;
            this.javaConstructor = undefined;
            this.javaMethod = undefined;
            this.javaParameter = undefined;
            this.javaCallback = undefined;
            this.nameSelected = undefined;
        }
    }
    exports.ModalName = ModalName;
});
define("src/asledgehammer/mallet/modal/ModalConfirm", ["require", "exports", "src/asledgehammer/rosetta/1.0/util"], function (require, exports, util_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModalConfirm = void 0;
    class ModalConfirm {
        constructor(app) {
            this.app = app;
            // @ts-ignore This modal is for confirming actions.
            this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
            this.$titleConfirm = (0, util_18.$get)('title-confirm');
            this.$bodyConfirm = (0, util_18.$get)('body-confirm');
            this.$btnConfirm = (0, util_18.$get)('btn-confirm');
            this.confirmSuccess = undefined;
        }
        listen() {
            this.$btnConfirm.on('click', () => {
                this.hide();
                if (this.confirmSuccess) {
                    this.confirmSuccess();
                    this.confirmSuccess = undefined;
                }
            });
        }
        show(onSuccess, title = 'Confirm', body = 'Are you sure?') {
            this.$titleConfirm.html(title);
            this.$bodyConfirm.html(body);
            this.confirmSuccess = onSuccess;
            this.modalConfirm.show();
        }
        hide() {
            this.modalConfirm.hide();
        }
    }
    exports.ModalConfirm = ModalConfirm;
});
define("src/asledgehammer/mallet/component/Toast", ["require", "exports", "src/asledgehammer/rosetta/1.0/util"], function (require, exports, util_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Toast = void 0;
    class Toast {
        constructor(app) {
            this.idSimpleBody = 'toast-simple-body';
            this.idToastSimple = 'toast-simple';
            this.app = app;
            // @ts-ignore
            this.toastSimple = new bootstrap.Toast(document.getElementById('toast-simple'), {});
        }
        alert(text, color = undefined) {
            const { idSimpleBody, idToastSimple } = this;
            const $toast = (0, util_19.$get)(idToastSimple);
            // Set the background color.
            $toast.removeClass('bg-success');
            $toast.removeClass('bg-danger');
            $toast.removeClass('bg-info');
            if (color === 'success')
                $toast.addClass('bg-success');
            else if (color === 'error')
                $toast.addClass('bg-danger');
            else if (color === 'info')
                $toast.addClass('bg-info');
            // Set the text content.
            document.getElementById(idSimpleBody).innerHTML = text;
            // Show the toast to the user.
            this.toastSimple.show();
        }
    }
    exports.Toast = Toast;
});
define("src/asledgehammer/mallet/Catalog", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/java/RosettaJavaMethod", "src/asledgehammer/rosetta/1.0/java/RosettaJavaMethodCluster", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunctionCluster", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/typescript/TSUtils"], function (require, exports, JavaLuaGenerator2_6, RosettaJavaClass_5, RosettaJavaMethod_2, RosettaJavaMethodCluster_2, LuaLuaGenerator_8, RosettaLuaClass_6, RosettaLuaField_4, RosettaLuaFunction_4, RosettaLuaFunctionCluster_4, RosettaLuaTable_6, JavaTypeScriptGenerator_6, LuaTypeScriptGenerator_8, TSUtils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Catalog = void 0;
    class Catalog {
        constructor(app) {
            this.luaClasses = {};
            this.luaTables = {};
            this.javaClasses = {};
            this.methods = {};
            this.fields = {};
            this.functions = {};
            this.selected = undefined;
            this.selectedCard = undefined;
            this.app = app;
        }
        reset() {
            // Wipe all content from the dictionaries.
            for (const name of Object.keys(this.luaClasses)) {
                delete this.luaClasses[name];
            }
            for (const name of Object.keys(this.luaTables)) {
                delete this.luaTables[name];
            }
            for (const name of Object.keys(this.javaClasses)) {
                delete this.javaClasses[name];
            }
            for (const name of Object.keys(this.fields)) {
                delete this.fields[name];
            }
            for (const name of Object.keys(this.functions)) {
                delete this.functions[name];
            }
            for (const name of Object.keys(this.methods)) {
                delete this.methods[name];
            }
            // Wipe active selections.
            this.selected = undefined;
            this.selectedCard = undefined;
            // Clear the screen container.
            this.app.$screenContent.empty();
        }
        toTypeScript() {
            let keys;
            let s = '';
            /* Java Classes */
            keys = Object.keys(this.javaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const javaClass = this.javaClasses[name];
                    // s += `// Java Class: ${javaClass.namespace.name}.${javaClass.name} \n\n`;
                    s += (0, JavaTypeScriptGenerator_6.javaClassToTS)(javaClass, false, false);
                }
            }
            /* Lua Classes */
            keys = Object.keys(this.luaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const luaClass = this.luaClasses[name];
                    // s += `// Lua Class: ${luaClass.name} \n\n`;
                    s += (0, LuaTypeScriptGenerator_8.luaClassToTS)(luaClass, false);
                }
            }
            /* Lua Tables */
            keys = Object.keys(this.luaTables);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const luaTable = this.luaTables[name];
                    // s += `// Lua Table: ${luaTable.name} \n\n`;
                    s += (0, LuaTypeScriptGenerator_8.luaTableToTS)(luaTable, false);
                }
            }
            /* Global Lua Fields */
            keys = Object.keys(this.fields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const field = this.fields[name];
                    // s += `// Global Lua Field: ${field.name} \n\n`;
                    s += (0, LuaTypeScriptGenerator_8.luaFieldToTS)(field, 0, 100) + '\n';
                }
            }
            /* Global Lua Functions */
            keys = Object.keys(this.functions);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const cluster = this.functions[name];
                    for (const func of cluster.functions) {
                        // s += `// Global Lua Function: ${func.name} \n\n`;
                        s += (0, LuaTypeScriptGenerator_8.luaFunctionToTS)(func, 0, 100) + '\n';
                    }
                }
            }
            /* Global Java Methods */
            keys = Object.keys(this.methods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const cluster = this.methods[name];
                    // s += `// Global Java Method(s): ${cluster.name} \n\n`;
                    s += (0, JavaTypeScriptGenerator_6.javaMethodClusterToTS)(cluster, 0, 100) + '\n';
                }
            }
            return (0, TSUtils_3.wrapAsTSFile)(s);
        }
        toLuaTypings() {
            let keys;
            let s = '--- @meta\n\n';
            /* Java Classes */
            keys = Object.keys(this.javaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const javaClass = this.javaClasses[name];
                    // s += `-- Java Class: ${javaClass.namespace.name}.${javaClass.name} --\n\n`;
                    s += (0, JavaLuaGenerator2_6.generateJavaClass)(javaClass) + '\n\n';
                }
            }
            /* Lua Classes */
            keys = Object.keys(this.luaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const luaClass = this.luaClasses[name];
                    // s += `-- Lua Class: ${luaClass.name} --\n\n`;
                    s += (0, LuaLuaGenerator_8.generateLuaClass)(luaClass) + '\n\n';
                }
            }
            /* Lua Tables */
            keys = Object.keys(this.luaTables);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const luaTable = this.luaTables[name];
                    // s += `-- Lua Table: ${luaTable.name} --\n\n`;
                    s += (0, LuaLuaGenerator_8.generateLuaTable)(luaTable) + '\n\n';
                }
            }
            /* Global Lua Fields */
            keys = Object.keys(this.fields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const field = this.fields[name];
                    // s += `-- Global Lua Field: ${name} --\n\n`;
                    s += (0, LuaLuaGenerator_8.generateGlobalLuaField)(field) + '\n\n';
                }
            }
            /* Global Lua Functions */
            keys = Object.keys(this.functions);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const name of keys) {
                    const cluster = this.functions[name];
                    for (const func of cluster.functions) {
                        // s += `-- Global Lua Function: ${name} --\n\n`;
                        s += (0, LuaLuaGenerator_8.generateGlobalLuaFunction)(func) + '\n\n';
                    }
                }
            }
            /* Global Java Methods */
            const staticMethods = [];
            const methodClusterNames = Object.keys(this.methods);
            if (methodClusterNames.length) {
                methodClusterNames.sort((a, b) => a.localeCompare(b));
                for (const clusterName of methodClusterNames) {
                    for (const method of this.methods[clusterName].methods) {
                        staticMethods.push(method);
                    }
                }
            }
            keys = Object.keys(staticMethods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                for (const method of staticMethods) {
                    // s += `-- Global Java Method: ${method.name} --\n\n`;
                    s += (0, JavaLuaGenerator2_6.generateGlobalJavaMethod)(method) + '\n\n';
                }
            }
            return s;
        }
        fromJSON(json) {
            this.reset();
            if (json.luaClasses) {
                for (const name of Object.keys(json.luaClasses)) {
                    const entity = new RosettaLuaClass_6.RosettaLuaClass(name, json.luaClasses[name]);
                    this.luaClasses[name] = entity;
                }
            }
            if (json.tables) {
                for (const name of Object.keys(json.tables)) {
                    const entity = new RosettaLuaTable_6.RosettaLuaTable(name, json.tables[name]);
                    this.luaTables[name] = entity;
                }
            }
            if (json.namespaces) {
                for (const name of Object.keys(json.namespaces)) {
                    const namespace = new RosettaJavaClass_5.RosettaJavaNamespace(name, json.namespaces[name]);
                    for (const className of Object.keys(namespace.classes)) {
                        this.javaClasses[className] = namespace.classes[className];
                    }
                }
            }
            /* (Fields) */
            if (json.fields) {
                const rawFields = json.fields;
                for (const name of Object.keys(rawFields)) {
                    const rawField = rawFields[name];
                    const field = new RosettaLuaField_4.RosettaLuaField(name, rawField);
                    this.fields[name] = this.fields[field.name] = field;
                }
            }
            /* (Global Functions) */
            if (json.functions !== undefined) {
                /* (Legacy) */
                if (!Array.isArray(json.functions)) {
                    console.log('PZ-Rosetta: Upgrading legacy Global Lua functions from singleton-object per name to clustered array..');
                    const rawMethods = json.functions;
                    for (const name2 of Object.keys(rawMethods)) {
                        const rawMethod = rawMethods[name2];
                        const method = new RosettaLuaFunction_4.RosettaLuaFunction(name2, rawMethod);
                        this.functions[method.name] = new RosettaLuaFunctionCluster_4.RosettaLuaFunctionCluster(method.name);
                        this.functions[method.name].add(method);
                    }
                }
                /* (Current) */
                else {
                    const rawMethods = json.functions;
                    for (const rawMethod of rawMethods) {
                        const method = new RosettaLuaFunction_4.RosettaLuaFunction(rawMethod.name, rawMethod);
                        const { name: methodName } = method;
                        let cluster;
                        if (this.functions[methodName] === undefined) {
                            cluster = new RosettaLuaFunctionCluster_4.RosettaLuaFunctionCluster(methodName);
                            this.functions[methodName] = cluster;
                        }
                        else {
                            cluster = this.functions[methodName];
                        }
                        cluster.add(method);
                    }
                }
            }
            /* METHODS */
            if (json.methods) {
                const rawMethods = json.methods;
                for (const rawMethod of rawMethods) {
                    const method = new RosettaJavaMethod_2.RosettaJavaMethod(rawMethod);
                    const { name: methodName } = method;
                    let cluster;
                    if (this.methods[methodName] === undefined) {
                        cluster = new RosettaJavaMethodCluster_2.RosettaJavaMethodCluster(methodName);
                        this.methods[methodName] = cluster;
                    }
                    else {
                        cluster = this.methods[methodName];
                    }
                    cluster.add(method);
                }
            }
            this.app.sidebar.populateTrees();
        }
        toJSON() {
            let keys;
            // Lua Classes
            let luaClasses = undefined;
            keys = Object.keys(this.luaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                luaClasses = {};
                for (const name of keys) {
                    luaClasses[name] = this.luaClasses[name].toJSON();
                }
            }
            // Lua Tables
            let tables = undefined;
            keys = Object.keys(this.luaTables);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                tables = {};
                for (const name of keys) {
                    tables[name] = this.luaTables[name].toJSON();
                }
            }
            // Java Classes
            let namespaces = undefined;
            keys = Object.keys(this.javaClasses);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                namespaces = {};
                for (const name of keys) {
                    const javaClass = this.javaClasses[name];
                    const namespace = javaClass.namespace;
                    if (!namespaces[namespace.name]) {
                        namespaces[namespace.name] = {};
                    }
                    namespaces[namespace.name][name] = this.javaClasses[name].toJSON();
                }
            }
            // Global Lua Fields
            let fields = undefined;
            keys = Object.keys(this.fields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                fields = {};
                for (const name of keys) {
                    fields[name] = this.fields[name].toJSON();
                }
            }
            // Global Lua Functions
            let functions = undefined;
            keys = Object.keys(this.functions);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                functions = [];
                for (const name of keys) {
                    const cluster = this.functions[name];
                    for (const func of cluster.functions) {
                        functions.push(func.toJSON());
                    }
                }
            }
            /* (Methods) */
            let methods = undefined;
            keys = Object.keys(this.methods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                methods = [];
                /* (Flatten MethodClusters into JSON method bodies) */
                for (const key of keys) {
                    for (const method of this.methods[key].methods)
                        methods.push(method.toJSON());
                }
            }
            return {
                $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
                luaClasses,
                tables,
                namespaces,
                fields,
                functions,
                methods
            };
        }
    }
    exports.Catalog = Catalog;
});
define("src/asledgehammer/mallet/component/lua/LuaGlobalFunctionCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_9, LuaTypeScriptGenerator_9, util_20, LuaCard_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaGlobalFunctionCard = void 0;
    class LuaGlobalFunctionCard extends LuaCard_8.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
            this.idBtnDelete = `${this.id}-btn-delete`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    return (0, LuaLuaGenerator_9.generateGlobalLuaFunction)(entity);
                }
                case 'typescript': {
                    return (0, LuaTypeScriptGenerator_9.luaFunctionToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { idBtnDelete, idBtnEdit } = this;
            const { entity } = this.options;
            let name = `_G.${entity.name}( )`;
            return (0, util_20.html) ` 
            <div class="row">

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Lua Function</strong>
                    </div>
                </div>
                
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete Function">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_20.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idBtnEdit, idNotes, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            this.listenEdit(entity, idBtnEdit, 'edit_function', `Edit Global Lua Function`, undefined, 'global_function');
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, 'global_function');
            this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
            this.listenPreview();
            (0, util_20.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    const entity = this.options.entity;
                    delete app.catalog.functions[entity.name];
                    app.hideCard();
                    return;
                }, `Delete Global Lua Function ${entity.name}`);
            });
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity } = this.options;
            const $paramContainer = (0, util_20.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, 'function');
        }
    }
    exports.LuaGlobalFunctionCard = LuaGlobalFunctionCard;
});
define("src/asledgehammer/mallet/component/lua/LuaGlobalFieldCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/lua/LuaCard"], function (require, exports, LuaLuaGenerator_10, LuaTypeScriptGenerator_10, util_21, LuaCard_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaGlobalFieldCard = void 0;
    class LuaGlobalFieldCard extends LuaCard_9.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idBtnDelete = `${this.id}-btn-delete`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            const { entity } = this.options;
            switch (language) {
                case 'lua': {
                    return (0, LuaLuaGenerator_10.generateGlobalLuaField)(entity);
                }
                case 'typescript': {
                    return (0, LuaTypeScriptGenerator_10.luaFieldToTS)(entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { idBtnEdit, idBtnDelete } = this;
            const { entity } = this.options;
            let name = `_G.${entity.name}`;
            return (0, util_21.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Lua Field</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete Global Lua Field">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idDefaultValue, idNotes, idType } = this;
            const { entity } = this.options;
            return (0, util_21.html) `
            <div>
                ${this.renderNotes(idNotes)}
                ${this.renderDefaultValue(entity.defaultValue, idDefaultValue)}
                <hr>
                ${this.renderType(entity.name, entity.type, entity.nullable, idType)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idBtnEdit, idDefaultValue, idNotes, idType } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenDefaultValue(entity, idDefaultValue);
            this.listenType(entity, idType, idType);
            this.listenEdit(entity, idBtnEdit, 'edit_field', 'Edit Global Field Name', undefined, 'global_field');
            this.listenPreview();
            (0, util_21.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    const entity = this.options.entity;
                    delete app.catalog.fields[entity.name];
                    app.hideCard();
                }, `Delete Global Lua Field ${entity.name}`);
            });
        }
    }
    exports.LuaGlobalFieldCard = LuaGlobalFieldCard;
});
define("src/asledgehammer/mallet/component/java/JavaGlobalMethodCard", ["require", "exports", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/java/JavaCard"], function (require, exports, JavaLuaGenerator2_7, JavaTypeScriptGenerator_7, util_22, JavaCard_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaGlobalMethodCard = void 0;
    class JavaGlobalMethodCard extends JavaCard_5.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
            this.idBtnDelete = `${this.id}-btn-delete`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview(language) {
            if (!this.options)
                return '';
            switch (language) {
                case 'lua': {
                    const { entity } = this.options;
                    return (0, JavaLuaGenerator2_7.generateGlobalJavaMethod)(entity);
                }
                case 'typescript': {
                    return (0, JavaTypeScriptGenerator_7.javaMethodToTS)(this.options.entity, 0, 100);
                }
                case 'json': {
                    return JSON.stringify(this.options.entity.toJSON(), null, 2);
                }
            }
        }
        onHeaderHTML() {
            const { entity } = this.options;
            let params = '';
            for (const param of entity.parameters) {
                params += `${param.name}, `;
            }
            if (params.length)
                params = params.substring(0, params.length - 2);
            let name = `_G.${entity.name}(${params})`;
            return (0, util_22.html) ` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Java Method</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_22.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
        }
        listen() {
            super.listen();
            const { app, idBtnDelete, idNotes, idReturnNotes } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, 'global_method');
            this.listenReturns(entity, idReturnNotes);
            this.listenPreview();
            (0, util_22.$get)(idBtnDelete).on('click', () => {
                app.modalConfirm.show(() => {
                    delete app.catalog.methods[entity.name];
                    app.hideCard();
                }, `Delete Global Java Method ${entity.name}`);
            });
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity } = this.options;
            const $paramContainer = (0, util_22.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, 'global_method');
        }
    }
    exports.JavaGlobalMethodCard = JavaGlobalMethodCard;
});
define("src/app", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/1.0/lua/LuaLuaGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/rosetta/1.0/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.0/java/JavaLuaGenerator2", "src/asledgehammer/mallet/component/lua/LuaClassCard", "src/asledgehammer/mallet/component/java/JavaClassCard", "src/asledgehammer/mallet/component/Sidebar", "src/asledgehammer/mallet/component/lua/LuaConstructorCard", "src/asledgehammer/mallet/component/lua/LuaFieldCard", "src/asledgehammer/mallet/component/lua/LuaFunctionCard", "src/asledgehammer/mallet/component/java/JavaConstructorCard", "src/asledgehammer/mallet/component/java/JavaFieldCard", "src/asledgehammer/mallet/component/java/JavaMethodCard", "src/asledgehammer/mallet/modal/ModalName", "src/asledgehammer/mallet/modal/ModalConfirm", "src/asledgehammer/mallet/component/Toast", "src/asledgehammer/mallet/Catalog", "src/asledgehammer/rosetta/1.0/typescript/JavaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/typescript/LuaTypeScriptGenerator", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/mallet/component/lua/LuaTableCard", "src/asledgehammer/mallet/component/lua/LuaGlobalFunctionCard", "src/asledgehammer/mallet/component/lua/LuaGlobalFieldCard", "src/asledgehammer/mallet/component/java/JavaGlobalMethodCard"], function (require, exports, hljs, LuaLuaGenerator_11, RosettaLuaClass_7, RosettaLuaConstructor_2, util_23, RosettaJavaClass_6, JavaLuaGenerator2_8, LuaClassCard_1, JavaClassCard_1, Sidebar_1, LuaConstructorCard_1, LuaFieldCard_1, LuaFunctionCard_1, JavaConstructorCard_1, JavaFieldCard_1, JavaMethodCard_1, ModalName_1, ModalConfirm_1, Toast_1, Catalog_1, JavaTypeScriptGenerator_8, LuaTypeScriptGenerator_11, RosettaLuaTable_7, LuaTableCard_1, LuaGlobalFunctionCard_1, LuaGlobalFieldCard_1, JavaGlobalMethodCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    class App {
        constructor() {
            this.previewCode = '';
            this.idBtnLanguageLua = `app-btn-language-lua`;
            this.idBtnLanguageTypeScript = `app-btn-language-typescript`;
            this.idBtnLanguageJSON = `app-btn-language-json`;
            this.languageMode = 'lua';
            this.catalog = new Catalog_1.Catalog(this);
            this.sidebar = new Sidebar_1.Sidebar(this);
            this.toast = new Toast_1.Toast(this);
            this.modalName = new ModalName_1.ModalName(this);
            this.modalConfirm = new ModalConfirm_1.ModalConfirm(this);
            this.eSidebarContainer = document.getElementById('screen-sidebar-container');
            this.$screenContent = $('#screen-content-end-container');
        }
        async init() {
            this.createSidebar();
        }
        hideCard() {
            this.$screenContent.empty();
            this.catalog.selected = undefined;
            this.catalog.selectedCard = undefined;
            this.sidebar.itemTree.selected = undefined;
            this.sidebar.itemTree.selectedID = undefined;
            this.sidebar.objTree.selected = undefined;
            this.sidebar.objTree.selectedID = undefined;
            this.sidebar.populateTrees();
        }
        showGlobalLuaField(entity) {
            this.catalog.selected = undefined;
            this.catalog.selectedCard = undefined;
            this.sidebar.objTree.globalSelected = true;
            this.$screenContent.empty();
            const card = new LuaGlobalFieldCard_1.LuaGlobalFieldCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            // this.sidebar.itemTree.selectedID = `global-lua-field-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showGlobalLuaFunction(entity) {
            this.catalog.selected = undefined;
            this.catalog.selectedCard = undefined;
            this.sidebar.objTree.globalSelected = true;
            this.$screenContent.empty();
            const card = new LuaGlobalFunctionCard_1.LuaGlobalFunctionCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            // this.sidebar.itemTree.selectedID = `global-lua-function-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showGlobalJavaMethod(entity) {
            this.catalog.selected = undefined;
            this.catalog.selectedCard = undefined;
            this.sidebar.objTree.globalSelected = true;
            this.$screenContent.empty();
            const card = new JavaGlobalMethodCard_1.JavaGlobalMethodCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            // this.sidebar.itemTree.selectedID = `global-java-method-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaClass(entity) {
            this.$screenContent.empty();
            // For new object-selections, unselect prior items.
            if (this.catalog.selected !== entity) {
                this.sidebar.itemTree.selectedID = undefined;
            }
            this.catalog.selected = entity;
            this.catalog.selectedCard = new LuaClassCard_1.LuaClassCard(this, { entity });
            this.$screenContent.append(this.catalog.selectedCard.render());
            this.catalog.selectedCard.listen();
            this.catalog.selectedCard.update();
            this.sidebar.objTree.globalSelected = false;
            this.sidebar.populateTrees();
            this.renderCode();
            return this.catalog.selectedCard;
        }
        showLuaClassConstructor(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaClass_7.RosettaLuaClass))
                return null;
            this.catalog.selected = selected;
            if (!entity)
                entity = new RosettaLuaConstructor_2.RosettaLuaConstructor(selected);
            this.$screenContent.empty();
            const card = new LuaConstructorCard_1.LuaConstructorCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaClassField(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaClass_7.RosettaLuaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-field-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaClassValue(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaClass_7.RosettaLuaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-value-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaClassMethod(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaClass_7.RosettaLuaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            // this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-method-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaClassFunction(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaClass_7.RosettaLuaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            // this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-function-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaTable(entity) {
            this.$screenContent.empty();
            // For new object-selections, unselect prior items.
            if (this.catalog.selected !== entity) {
                this.sidebar.itemTree.selectedID = undefined;
            }
            this.catalog.selected = entity;
            this.catalog.selectedCard = new LuaTableCard_1.LuaTableCard(this, { entity });
            this.$screenContent.append(this.catalog.selectedCard.render());
            this.catalog.selectedCard.listen();
            this.catalog.selectedCard.update();
            this.sidebar.objTree.globalSelected = false;
            this.sidebar.populateTrees();
            this.renderCode();
            return this.catalog.selectedCard;
        }
        showLuaTableField(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaTable_7.RosettaLuaTable))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `lua-table-${selected.name}-field-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showLuaTableFunction(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaLuaTable_7.RosettaLuaTable))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `lua-table-${selected.name}-function-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showJavaClass(entity) {
            this.$screenContent.empty();
            // For new object-selections, unselect prior items.
            if (this.catalog.selected !== entity) {
                this.sidebar.itemTree.selectedID = undefined;
            }
            this.catalog.selected = entity;
            this.catalog.selectedCard = new JavaClassCard_1.JavaClassCard(this, { entity });
            this.$screenContent.append(this.catalog.selectedCard.render());
            this.catalog.selectedCard.listen();
            this.catalog.selectedCard.update();
            this.sidebar.populateTrees();
            this.sidebar.objTree.globalSelected = false;
            this.renderCode();
            return this.catalog.selectedCard;
        }
        showJavaClassConstructor(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaJavaClass_6.RosettaJavaClass))
                return null;
            if (!entity)
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new JavaConstructorCard_1.JavaConstructorCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `java-class-${selected.name}-constructor-${entity.getSignature()}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showJavaClassField(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaJavaClass_6.RosettaJavaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new JavaFieldCard_1.JavaFieldCard(this, { entity, isStatic: entity.isStatic() });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `java-class-${selected.name}-field-${entity.name}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        showJavaClassMethod(entity) {
            const { selected } = this.catalog;
            if (!(selected instanceof RosettaJavaClass_6.RosettaJavaClass))
                return null;
            this.catalog.selected = selected;
            this.$screenContent.empty();
            const card = new JavaMethodCard_1.JavaMethodCard(this, { entity, isStatic: entity.isStatic() });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.sidebar.itemTree.selectedID = `java-class-${selected.name}-method-${entity.getSignature()}`;
            this.sidebar.populateTrees();
            this.renderCode();
            return card;
        }
        renderCode() {
            const $renderPane = (0, util_23.$get)('code-preview');
            $renderPane.empty();
            let highlightedCode = '';
            if (this.sidebar.objTree.globalSelected) {
                switch (this.languageMode) {
                    case 'lua': {
                        this.previewCode = this.catalog.toLuaTypings();
                        break;
                    }
                    case 'typescript': {
                        this.previewCode = this.catalog.toTypeScript();
                        break;
                    }
                    case 'json': {
                        this.previewCode = JSON.stringify(this.catalog.toJSON(), null, 2);
                        break;
                    }
                }
            }
            else {
                /* (Keep empty if nothing renders) */
                if (!this.catalog.selectedCard) {
                    this.previewCode = '';
                    return;
                }
                const { selected } = this.catalog;
                if (selected instanceof RosettaLuaClass_7.RosettaLuaClass) {
                    switch (this.languageMode) {
                        case 'lua': {
                            this.previewCode = '--- @meta\n\n' + (0, LuaLuaGenerator_11.generateLuaClass)(selected);
                            break;
                        }
                        case 'typescript': {
                            this.previewCode = (0, LuaTypeScriptGenerator_11.luaClassToTS)(selected, true);
                            break;
                        }
                        case 'json': {
                            this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                            break;
                        }
                    }
                }
                else if (selected instanceof RosettaLuaTable_7.RosettaLuaTable) {
                    switch (this.languageMode) {
                        case 'lua': {
                            this.previewCode = '--- @meta\n\n' + (0, LuaLuaGenerator_11.generateLuaTable)(selected);
                            break;
                        }
                        case 'typescript': {
                            this.previewCode = (0, LuaTypeScriptGenerator_11.luaTableToTS)(selected, true);
                            break;
                        }
                        case 'json': {
                            this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                            break;
                        }
                    }
                }
                else if (selected instanceof RosettaJavaClass_6.RosettaJavaClass) {
                    switch (this.languageMode) {
                        case 'lua': {
                            this.previewCode = '--- @meta\n\n' + (0, JavaLuaGenerator2_8.generateJavaClass)(selected);
                            break;
                        }
                        case 'typescript': {
                            this.previewCode = (0, JavaTypeScriptGenerator_8.javaClassToTS)(selected, true, true);
                            break;
                        }
                        case 'json': {
                            this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                            break;
                        }
                    }
                }
            }
            highlightedCode = hljs.default.highlightAuto(this.previewCode, [this.languageMode]).value;
            $renderPane.html(highlightedCode);
        }
        createSidebar() {
            const { eSidebarContainer, sidebar } = this;
            eSidebarContainer.innerHTML = sidebar.render();
        }
        listen() {
            this.sidebar.listen();
            this.modalName.listen();
            this.modalConfirm.listen();
            const _this = this;
            const $btnCopy = (0, util_23.$get)('btn-code-preview-copy');
            const $container = (0, util_23.$get)('screen-content-container');
            const $cardPreview = (0, util_23.$get)('screen-content-end-container');
            const $codePreview = (0, util_23.$get)('code-preview');
            const $btnCardCode = (0, util_23.$get)('btn-card-code');
            const $iconCard = (0, util_23.$get)('icon-card');
            const $iconCode = (0, util_23.$get)('icon-code');
            let mode = 'card';
            let cog = false;
            let hideCog = () => {
                cog = false;
                $('#btns-code-left').hide();
            };
            let showCog = () => {
                cog = true;
                $('#btns-code-left').show();
            };
            $btnCardCode.on('click', () => {
                if (mode === 'card') {
                    $container.removeClass('p-4');
                    $container.addClass('p-0');
                    $cardPreview.hide();
                    $codePreview.css({ 'overflow': 'scroll' });
                    $codePreview.show(150);
                    $iconCode.hide();
                    $iconCard.show();
                    $btnCardCode.css({ 'right': '2rem' });
                    $btnCopy.show(150);
                    $('#btn-code-preview-cog').show(150);
                    mode = 'code';
                }
                else if (mode === 'code') {
                    $container.removeClass('p-0');
                    $container.addClass('pt-4');
                    $codePreview.hide(150, () => {
                        $container.removeClass('pt-4');
                        $container.addClass('p-4');
                        $codePreview.css({ 'overflow': 'none' });
                    });
                    $cardPreview.slideDown(150);
                    $iconCard.hide();
                    $iconCode.show();
                    $btnCardCode.css({ 'right': '1rem' });
                    $btnCopy.hide(150);
                    $('#btns-code-left').hide();
                    $('#btn-code-preview-cog').hide(150);
                    hideCog();
                    mode = 'card';
                }
            });
            $('#btn-code-preview-cog').on('click', () => {
                if (cog) {
                    hideCog();
                }
                else {
                    showCog();
                }
            });
            $('#app-btn-language-lua').on('click', () => {
                this.languageMode = 'lua';
                this.renderCode();
            });
            $('#app-btn-language-typescript').on('click', () => {
                this.languageMode = 'typescript';
                this.renderCode();
            });
            $('#app-btn-language-json').on('click', () => {
                this.languageMode = 'json';
                this.renderCode();
            });
            /* (For copying the preview code) */
            $btnCopy.on('click', () => {
                if (!this.previewCode.length) {
                    this.toast.alert('No code to copy.', 'error');
                    return;
                }
                this.copy(this.previewCode);
                this.toast.alert('Copied code.', 'info');
            });
        }
        copy(text) {
            navigator.clipboard.writeText(text);
        }
    }
    exports.App = App;
    async function init() {
        // @ts-ignore
        Quill.register('modules/QuillMarkdown', QuillMarkdown, true);
        const app = new App();
        app.init();
        app.listen();
        // @ts-ignore
        const greet = new bootstrap.Modal('#modal-greet', {});
        greet.show();
        // @ts-ignore
        window.app = app;
    }
    $(() => init());
});
define("src/asledgehammer/JsonSerializable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/mallet/component/LabelComponent", ["require", "exports", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/Component"], function (require, exports, util_24, Component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelComponent = void 0;
    class LabelComponent extends Component_3.Component {
        constructor(options) {
            super(options);
        }
        onRender() {
            return (0, util_24.html) ``;
        }
    }
    exports.LabelComponent = LabelComponent;
});
define("src/asledgehammer/mallet/component/SidebarPanelButton", ["require", "exports", "src/asledgehammer/rosetta/1.0/util", "src/asledgehammer/mallet/component/Component"], function (require, exports, util_25, Component_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanelButton = void 0;
    class SidebarPanelButton extends Component_4.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            (0, util_25.$get)(this.id).on('click', () => {
                if (this.options && this.options.onclick) {
                    this.options.onclick();
                }
            });
        }
        onRender() {
            const { label } = this.options;
            return (0, util_25.html) `
            <button class="btn btn-primary col-12 rounded-0">${label}</button>
        `;
        }
    }
    exports.SidebarPanelButton = SidebarPanelButton;
});
define("src/asledgehammer/mallet/component/SidebarPanel", ["require", "exports", "src/asledgehammer/mallet/component/Component"], function (require, exports, Component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanel = void 0;
    class SidebarPanel extends Component_5.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            const { buttons } = this.options;
            if (buttons && buttons.length) {
                for (const button of buttons) {
                    button.listen();
                }
            }
        }
        onRender() {
            return '';
        }
    }
    exports.SidebarPanel = SidebarPanel;
    ;
});
define("src/asledgehammer/rosetta/RosettaGame", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/RosettaLanguage", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/1.0/Rosetta", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSON_PATCH_SCHEMA_URL = exports.JSON_SCHEMA_URL = void 0;
    exports.JSON_SCHEMA_URL = 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json';
    exports.JSON_PATCH_SCHEMA_URL = 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-patch-schema.json';
});
define("src/asledgehammer/rosetta/1.0/RosettaFileInfo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/1.0/RosettaFile", ["require", "exports", "src/asledgehammer/rosetta/1.0/Rosetta", "src/asledgehammer/rosetta/1.0/RosettaEntity", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTable", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaTableField", "src/asledgehammer/rosetta/1.0/lua/RosettaLuaClass"], function (require, exports, Rosetta_1, RosettaEntity_16, RosettaLuaFunction_5, RosettaLuaTable_8, RosettaLuaTableField_3, RosettaLuaClass_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaFile = void 0;
    /**
     * **RosettaFile**
     *
     * @author Jab
     */
    class RosettaFile extends RosettaEntity_16.RosettaEntity {
        constructor(fileInfo, raw = {}, readOnly) {
            super(raw, readOnly);
            /* (Lua) */
            this.luaClasses = {};
            this.tables = {};
            this.functions = {};
            this.fields = {};
            this.fileInfo = fileInfo;
            this.id = RosettaFile.asFileID(fileInfo.uri);
            /* (Tables) */
            if (raw.tables !== undefined) {
                const rawTables = raw.tables;
                for (const name of Object.keys(rawTables)) {
                    const rawTable = rawTables[name];
                    const table = new RosettaLuaTable_8.RosettaLuaTable(name, rawTable);
                    this.tables[table.name] = this.tables[name] = table;
                }
            }
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name];
                    const func = new RosettaLuaFunction_5.RosettaLuaFunction(name, rawFunction);
                    this.functions[func.name] = this.functions[name] = func;
                }
            }
            /* (Values) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name of Object.keys(rawValues)) {
                    const rawValue = rawValues[name];
                    const value = new RosettaLuaTableField_3.RosettaLuaTableField(name, rawValue);
                    this.fields[value.name] = this.fields[name] = value;
                }
            }
            /* (Lua Classes) */
            if (raw.luaClasses !== undefined) {
                const rawLuaClasses = raw.luaClasses;
                for (const name of Object.keys(rawLuaClasses)) {
                    const rawLuaClass = rawLuaClasses[name];
                    const luaClass = new RosettaLuaClass_8.RosettaLuaClass(name, rawLuaClass);
                    this.luaClasses[luaClass.name] = this.luaClasses[name] = luaClass;
                }
            }
        }
        /**
         * Creates a new Lua class in the patch.
         *
         * @param name The name of the new Lua class.
         * @returns The new Lua class.
         *
         * @throws Error Thrown if:
         * - The object is in 'read-only' mode.
         * - A global Lua field already exists with the same name in the patch.
         */
        createLuaClass(name) {
            /* (Make sure the object can be modified) */
            this.checkReadOnly();
            const luaClass = new RosettaLuaClass_8.RosettaLuaClass(name);
            // (Only check for the file instance)
            if (this.luaClasses[luaClass.name]) {
                throw new Error(`A global Lua Class already exists: ${luaClass.name}`);
            }
            this.luaClasses[luaClass.name] = luaClass;
            return luaClass;
        }
        /**
         * Creates a new Lua table in the patch.
         *
         * @param name The name of the new Lua table.
         * @returns The new Lua table.
         *
         * @throws Error Thrown if:
         * - The object is in 'read-only' mode.
         * - A global Lua field already exists with the same name in the patch.
         */
        createGlobalLuaTable(name) {
            /* (Make sure the object can be modified) */
            this.checkReadOnly();
            const luaTable = new RosettaLuaTable_8.RosettaLuaTable(name);
            // (Only check for the file instance)
            if (this.tables[luaTable.name]) {
                throw new Error(`A global Lua Table already exists: ${luaTable.name}`);
            }
            this.tables[luaTable.name] = luaTable;
            return luaTable;
        }
        /**
         * Creates a new global Lua function in the patch.
         *
         * @param name The name of the new global Lua function.
         * @returns The new global Lua function.
         *
         * @throws Error Thrown if:
         * - The object is in 'read-only' mode.
         * - A global Lua field already exists with the same name in the patch.
         */
        createGlobalLuaFunction(name) {
            /* (Make sure the object can be modified) */
            this.checkReadOnly();
            const luaFunction = new RosettaLuaFunction_5.RosettaLuaFunction(name);
            // (Only check for the file instance)
            if (this.functions[luaFunction.name]) {
                throw new Error(`A global Lua Function already exists: ${luaFunction.name}`);
            }
            this.functions[luaFunction.name] = luaFunction;
            return luaFunction;
        }
        /**
         * Creates a new global Lua field in the patch.
         *
         * @param name The name of the new global Lua field.
         * @returns The new global Lua field.
         *
         * @throws Error Thrown if:
         * - The object is in 'read-only' mode.
         * - A global Lua field already exists with the same name in the patch.
         */
        createGlobalLuaField(name) {
            /* (Make sure the object can be modified) */
            this.checkReadOnly();
            const luaField = new RosettaLuaTableField_3.RosettaLuaTableField(name);
            // (Only check for the file instance)
            if (this.fields[luaField.name]) {
                throw new Error(`A global Lua Field already exists: ${luaField.name}`);
            }
            this.fields[luaField.name] = luaField;
            return luaField;
        }
        save(patch = false) {
            const json = this.toJSON(patch);
            return JSON.stringify(Object.assign({ $schema: Rosetta_1.JSON_PATCH_SCHEMA_URL }, json), null, 4);
            ;
        }
        toJSON(patch = false) {
            const { luaClasses, functions, tables, fields } = this;
            const json = {};
            /* (Global Lua Classes) */
            let keys = Object.keys(luaClasses);
            if (keys.length) {
                json.luaClasses = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    json.luaClasses[key] = luaClasses[key].toJSON(patch);
                }
            }
            /* (Global Tables) */
            keys = Object.keys(tables);
            if (keys.length) {
                json.tables = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    json.tables[key] = tables[key].toJSON(patch);
                }
            }
            /* (Global Functions) */
            keys = Object.keys(functions);
            if (keys.length) {
                json.functions = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    json.functions[key] = functions[key].toJSON(patch);
                }
            }
            /* (Global Values) */
            keys = Object.keys(fields);
            if (keys.length) {
                json.fields = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    json.fields[key] = fields[key].toJSON(patch);
                }
            }
            return json;
        }
        /**
         * Transforms a raw path URI to a file identifier by:
         * - Forcing all lower-case lettering.
         * - Forces all directory delimiters to be `/`.
         * - Removes `/` at the beginning of the URI.
         * - Removes `json/` and `yml/` at the beginning of the URI.
         * - Removes '.ext' from the end of the URI.
         *
         * @param path The raw path URI to transform.
         * @returns The transformed path URI as a file identifier.
         */
        static asFileID(path) {
            path = path.toLowerCase().trim();
            while (path.indexOf('\\') !== -1)
                path = path.replace('\\', '/');
            /* ('/' check at beginning of path) */
            if (path.indexOf('/') === 0)
                path = path.substring(1);
            /* ('json/' check at beginning of path) */
            if (path.indexOf('json/') === 0)
                path = path.substring('json/'.length);
            /* ('yml/' check at beginning of path) */
            if (path.indexOf('yml/') === 0)
                path = path.substring('yml/'.length);
            // (File extension check) */
            if (path.indexOf('.yml') !== -1)
                path = path.substring(0, path.length - '.yml'.length);
            if (path.indexOf('.yaml') !== -1)
                path = path.substring(0, path.length - '.yaml'.length);
            if (path.indexOf('.json') !== -1)
                path = path.substring(0, path.length - '.json'.length);
            if (path.indexOf('.jsonc') !== -1)
                path = path.substring(0, path.length - '.jsonc'.length);
            return path;
        }
    }
    exports.RosettaFile = RosettaFile;
});
define("src/asledgehammer/rosetta/1.0/SerializableComponent", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SerializableComponent = void 0;
    class SerializableComponent {
        serialize() {
            return JSON.stringify(this.onSave());
        }
        deserialize(json) {
            this.onLoad(JSON.parse(json));
        }
    }
    exports.SerializableComponent = SerializableComponent;
});
define("src/asledgehammer/rosetta/1.1/Rosetta", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LANGUAGE_ADAPTERS = void 0;
    exports.LANGUAGE_ADAPTERS = {};
});
define("src/asledgehammer/rosetta/1.1/RosettaFile", ["require", "exports", "src/asledgehammer/rosetta/1.1/Rosetta"], function (require, exports, Rosetta_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaFile = void 0;
    class RosettaFile {
        constructor() {
            this.languages = {};
        }
        fromJSON(json) {
            const { languages } = this;
            // (Version Check)
            if (!json.version || json.version !== '1.1') {
                throw new Error(`Invalid Rosetta version: ${json.version} (Should be "1.1")`);
            }
            // (Rosetta Languages)
            const keys = Object.keys(json);
            for (const key of keys) {
                if (Rosetta_2.LANGUAGE_ADAPTERS[key]) {
                    languages[key] = Rosetta_2.LANGUAGE_ADAPTERS[key](json[key]);
                }
            }
        }
        toJSON() {
            const { languages } = this;
            const json = {};
            let keys;
            // (Rosetta Version)
            json.version = '1.1';
            // (Rosetta Languages)
            keys = Object.keys(languages);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write Language)
                for (const key of keys) {
                    json[key] = languages[key].toJSON();
                }
            }
            return json;
        }
    }
    exports.RosettaFile = RosettaFile;
});
define("src/asledgehammer/rosetta/1.1/RosettaNamedCollection", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaNamedCollection = void 0;
    class RosettaNamedCollection {
        constructor(name) {
            this.elements = [];
            this.name = name;
        }
    }
    exports.RosettaNamedCollection = RosettaNamedCollection;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaGenerics", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaType"], function (require, exports, RosettaJavaType_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaGenerics = void 0;
    class RosettaJavaGenerics {
        constructor(json) {
            // (Items)
            if (!json.items) {
                throw new Error();
            }
            else if (!Array.isArray(json.items)) {
                throw new Error();
            }
            this.items = [...json.items.map((item) => new RosettaJavaType_4.RosettaJavaType(item))];
        }
        toJSON() {
            const { items } = this;
            const json = {};
            // (Items)
            json.items = [...items.map((item) => item.toJSON())];
            return json;
        }
    }
    exports.RosettaJavaGenerics = RosettaJavaGenerics;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaType", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaGenerics"], function (require, exports, RosettaJavaGenerics_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaType = void 0;
    class RosettaJavaType {
        constructor(json) {
            // (String: Basic)
            if (!json.basic) {
                throw new Error();
            }
            else if (!json.basic.length) {
                throw new Error();
            }
            this.basic = json.basic;
            // (String: Full)
            if (json.full && json.full.length) {
                this.full = json.full;
            }
            // (Flag: Nullable)
            if (!this.isNullPossible()) {
                this.nullable = false;
            }
            else if (json.nullable !== undefined) {
                if (typeof (json.nullable) !== 'boolean') {
                    throw new Error();
                }
                this.nullable = json.nullable;
            }
            // (Generics)
            if (json.generics && json.generics.length) {
                this.generics = new RosettaJavaGenerics_1.RosettaJavaGenerics(json.generics);
            }
        }
        toJSON() {
            const { basic, full, generics, nullable } = this;
            const json = {};
            // (Flag: Nullable)
            if (nullable !== undefined) {
                json.nullable = nullable;
            }
            // (String: Full)
            if (full && full.length) {
                json.full = full;
            }
            // (String: Basic)
            if (basic && basic.length) {
                json.basic = basic;
            }
            // (Generics)
            if (generics) {
                json.generics = generics.toJSON();
            }
            return json;
        }
        isNullPossible() {
            switch (this.basic) {
                case 'boolean':
                case 'byte':
                case 'short':
                case 'int':
                case 'float':
                case 'double':
                case 'long':
                case 'char':
                case 'null':
                case 'void': {
                    return false;
                }
            }
            return true;
        }
    }
    exports.RosettaJavaType = RosettaJavaType;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaParameter", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaType"], function (require, exports, RosettaJavaType_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaParameter = void 0;
    class RosettaJavaParameter {
        constructor(json) {
            this.name = '';
            this.type = new RosettaJavaType_5.RosettaJavaType({ basic: 'Object', nullable: true });
            // (String: Name)
            if (!json.name || !json.name.length) {
                throw new Error(`JavaParameter doesn't have a defined name!`);
            }
            else if (typeof (json.name) !== 'string') {
                throw new Error(`JavaParameter's property "name" isn't a string!`);
            }
            this.name = json.name;
            // (String: Notes)
            if (json.notes) {
                if (typeof (json.notes) !== 'string') {
                    throw new Error(`JavaParameter "${this.name}"'s property "notes" is not a string!`);
                }
                this.notes = json.notes;
            }
            // (Type)
            if (!json.type) {
                throw new Error(`JavaParameter "${this.name}" doesn't have a defined type!`);
            }
            this.type = new RosettaJavaType_5.RosettaJavaType(json.type);
        }
        toJSON() {
            const { name, notes, type } = this;
            const json = {};
            // (String: Name)
            json.name = name;
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            // (Type)
            if (type === undefined) {
                throw new Error('Type must be defined for RosettaJavaParameters!');
            }
            json.type = type === null || type === void 0 ? void 0 : type.toJSON();
            return json;
        }
    }
    exports.RosettaJavaParameter = RosettaJavaParameter;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaConstructor", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaParameter"], function (require, exports, RosettaJavaParameter_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaConstructor = void 0;
    class RosettaJavaConstructor {
        constructor(json) {
            // (String[]: Modifiers)
            if (json.modifiers) {
                if (!Array.isArray(json.modifiers)) {
                    throw new Error(`JavaConstructor's property "modifiers" is not a string[]!`);
                }
                if (json.modifiers.length) {
                    // (Force strings)
                    this.modifiers = [...json.modifiers.map((a) => `${a}`)];
                }
            }
            // (Flag: Deprecated)
            if (json.deprecated !== undefined) {
                if (typeof (json.deprecated) !== 'boolean') {
                    throw new Error(`JavaConstructor's property "deprecated" is not a boolean!`);
                }
                this.deprecated = json.deprecated;
            }
            // (Parameters)
            if (json.parameters) {
                if (!Array.isArray(json.parameters)) {
                    throw new Error(`JavaConstructor's property "parameters" is not an array!`);
                }
                if (json.parameters.length) {
                    this.parameters = [
                        ...json.parameters.map((param) => new RosettaJavaParameter_3.RosettaJavaParameter(param))
                    ];
                }
            }
            // (String: Notes)
            if (json.notes) {
                if (typeof (json.notes) !== 'string') {
                    throw new Error(`JavaConstructor's property "notes" is not a string!`);
                }
                this.notes = json.notes;
            }
        }
        toJSON() {
            const { deprecated, modifiers, notes, parameters } = this;
            const json = {};
            // (Flag: Deprecated)
            if (deprecated) {
                json.deprecated = true;
            }
            // (String[]: Modifiers)
            if (modifiers && modifiers.length) {
                json.modifiers = [...modifiers];
            }
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            // (Parameters)
            if (parameters && parameters.length) {
                json.parameters = [...parameters.map((param) => param.toJSON())];
            }
            return json;
        }
    }
    exports.RosettaJavaConstructor = RosettaJavaConstructor;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaField", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaType"], function (require, exports, RosettaJavaType_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaField = void 0;
    class RosettaJavaField {
        constructor(json) {
            // (String: Name)
            if (!json.name || !json.name.length) {
                throw new Error(`JavaField doesn't have a defined name!`);
            }
            else if (typeof (json.name) !== 'string') {
                throw new Error(`JavaField's property "name" isn't a string!`);
            }
            this.name = json.name;
            // (Flag: Deprecated)
            if (json.deprecated !== undefined) {
                if (typeof (json.deprecated) !== 'boolean') {
                    throw new Error(`JavaField "${this.name}"'s property "deprecated" is not a boolean!`);
                }
                this.deprecated = json.deprecated;
            }
            // (String[]: Modifiers)
            if (json.modifiers) {
                if (!Array.isArray(json.modifiers)) {
                    throw new Error(`JavaField "${this.name}"'s property "modifiers" is not a string[]!`);
                }
                if (json.modifiers.length) {
                    // (Force strings)
                    this.modifiers = [...json.modifiers.map((a) => `${a}`)];
                }
            }
            // (String: defaultValue)
            if (json.defaultValue) {
                if (typeof (json.defaultValue) !== 'string') {
                    throw new Error(`JavaField "${this.name}"'s property "defaultValue" is not a string!`);
                }
                this.defaultValue = json.defaultValue;
            }
            // (String[]: Tags)
            if (json.tags) {
                if (!Array.isArray(json.tags)) {
                    throw new Error(`JavaField "${this.name}"'s property "tags" is not a string[]!`);
                }
                // (Force strings)
                this.tags = [...json.tags.map((a) => `${a}`)];
            }
            // (String: Notes)
            if (json.notes) {
                if (typeof (json.notes) !== 'string') {
                    throw new Error(`JavaField "${this.name}"'s property "notes" is not a string!`);
                }
                this.notes = json.notes;
            }
            // (Type)
            if (!json.type) {
                throw new Error(`JavaField "${this.name}" doesn't have a defined type!`);
            }
            this.type = new RosettaJavaType_6.RosettaJavaType(json.type);
        }
        toJSON() {
            const { deprecated, defaultValue, modifiers, name, notes, tags, type } = this;
            const json = {};
            // (String: Name)
            json.name = name;
            // (Type)
            json.type = type.toJSON();
            // (Flag: Deprecated)
            if (deprecated) {
                json.deprecated = true;
            }
            // (String: DefaultValue)
            if (defaultValue) {
                json.defaultValue = defaultValue;
            }
            // (String[]: Modifiers)
            if (modifiers && modifiers.length) {
                json.modifiers = [...modifiers];
            }
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            // (String[]: Tags)
            if (tags && tags.length) {
                json.tags = [...tags];
            }
            return json;
        }
    }
    exports.RosettaJavaField = RosettaJavaField;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaMethod", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaMethod = void 0;
    class RosettaJavaMethod {
        constructor(json) {
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaJavaMethod = RosettaJavaMethod;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaClass", ["require", "exports", "src/asledgehammer/rosetta/1.1/RosettaNamedCollection", "src/asledgehammer/rosetta/1.1/java/RosettaJavaConstructor", "src/asledgehammer/rosetta/1.1/java/RosettaJavaField", "src/asledgehammer/rosetta/1.1/java/RosettaJavaGenerics", "src/asledgehammer/rosetta/1.1/java/RosettaJavaMethod"], function (require, exports, RosettaNamedCollection_1, RosettaJavaConstructor_3, RosettaJavaField_2, RosettaJavaGenerics_2, RosettaJavaMethod_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaClass = void 0;
    class RosettaJavaClass {
        constructor(json) {
            this.staticFields = {};
            this.staticMethods = {};
            this.methods = {};
            this.constructors = [];
            let keys;
            // (Flag: Deprecated)
            if (json.deprecated !== undefined) {
                if (typeof (json.deprecated) !== 'boolean') {
                    throw new Error();
                }
                this.deprecated = json.deprecated;
            }
            // (String: Extends)
            if (json.extends !== undefined) {
                if (typeof (json.extends) !== 'string') {
                    throw new Error();
                }
                this.extends = json.extends;
            }
            // (String: Notes)
            if (json.notes !== undefined) {
                if (typeof (json.notes) !== 'boolean') {
                    throw new Error();
                }
                this.notes = '' + json.notes;
            }
            // (String[]: Tags)
            if (json.tags !== undefined) {
                if (!Array.isArray(json.tags)) {
                    throw new Error();
                }
                if (json.tags.length) {
                    // (Force strings)
                    this.tags = [...json.tags.map((a) => `${a}`)];
                }
            }
            // (Generics)
            if (json.generics && json.generics.length) {
                this.generics = new RosettaJavaGenerics_2.RosettaJavaGenerics(json.generics);
            }
            // (Static Fields)
            if (json.staticFields) {
                keys = Object.keys(json.staticFields);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.staticFields[key] = new RosettaJavaField_2.RosettaJavaField(json.staticFields[key]);
                }
            }
            // (Constructors)
            if (json.constructors) {
                for (const cons of json.constructors) {
                    this.constructors.push(new RosettaJavaConstructor_3.RosettaJavaConstructor(cons));
                }
            }
            // (Methods)
            if (json.methods) {
                for (const jsonMethod of json.methods) {
                    const name = jsonMethod.name;
                    let cluster = this.methods[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_1.RosettaNamedCollection(name);
                        this.methods[name] = cluster;
                    }
                    cluster.elements.push(new RosettaJavaMethod_3.RosettaJavaMethod(json.methods[name]));
                }
            }
            // (Static Methods)
            if (json.staticMethods) {
                for (const jsonMethod of json.staticMethods) {
                    const name = jsonMethod.name;
                    let cluster = this.methods[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_1.RosettaNamedCollection(name);
                        this.methods[name] = cluster;
                    }
                    cluster.elements.push(new RosettaJavaMethod_3.RosettaJavaMethod(json.staticMethods[name]));
                }
            }
        }
        toJSON() {
            const { constructors, deprecated, extends: extendz, generics, methods, notes, staticFields, staticMethods, tags } = this;
            const json = {};
            let keys;
            // (Constructors)
            if (constructors.length) {
                json.constructors = [];
                // (Write constructors)
                for (const cons of constructors) {
                    json.constructors.push(cons.toJSON());
                }
            }
            // (Static Fields)
            keys = Object.keys(staticFields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write fields)
                json.staticFields = {};
                for (const key of keys) {
                    json.staticFields[key] = staticFields[key].toJSON();
                }
            }
            // (Static Methods)
            keys = Object.keys(staticMethods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write methods)
                json.staticMethods = [];
                for (const key of keys) {
                    for (const method of staticMethods[key].elements) {
                        json.staticMethods.push(method.toJSON());
                    }
                }
            }
            // (Methods)
            keys = Object.keys(methods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write methods)
                json.methods = [];
                for (const key of keys) {
                    for (const method of methods[key].elements) {
                        json.methods.push(method.toJSON());
                    }
                }
            }
            // (Generics)
            if (generics) {
                json.generics = generics.toJSON();
            }
            // (Flag: Deprecated)
            if (deprecated) {
                json.deprecated = true;
            }
            // (String: Extends)
            if (extendz && extendz.length) {
                json.extends = extendz;
            }
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            // (String[]: Tags)
            if (tags && tags.length) {
                json.tags = [];
                // (Write tags)
                for (const tag of tags) {
                    json.tags.push(tag);
                }
            }
            return json;
        }
    }
    exports.RosettaJavaClass = RosettaJavaClass;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJava", ["require", "exports", "src/asledgehammer/rosetta/1.1/Rosetta", "src/asledgehammer/rosetta/1.1/RosettaNamedCollection", "src/asledgehammer/rosetta/1.1/java/RosettaJavaClass", "src/asledgehammer/rosetta/1.1/java/RosettaJavaMethod"], function (require, exports, Rosetta_3, RosettaNamedCollection_2, RosettaJavaClass_7, RosettaJavaMethod_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJava = exports.GAME_ADAPTERS = void 0;
    exports.GAME_ADAPTERS = {};
    class RosettaJava {
        constructor(json) {
            this.games = {};
            this.classes = {};
            this.methods = {};
            this.language = 'java';
            let keys;
            // (Java Classes)
            if (json.classes) {
                keys = Object.keys(json.classes);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.classes[key] = new RosettaJavaClass_7.RosettaJavaClass(json.classes[key]);
                }
            }
            // (Java Methods)
            if (json.methods) {
                for (const jsonMethod of json.methods) {
                    const name = jsonMethod.name;
                    let cluster = this.methods[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_2.RosettaNamedCollection(name);
                        this.methods[name] = cluster;
                    }
                    cluster.elements.push(new RosettaJavaMethod_4.RosettaJavaMethod(json.methods[name]));
                }
            }
            // (Java Games)
            if (json.games) {
                keys = Object.keys(json.games);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    // (Grab registered adapter for game)
                    const adapter = exports.GAME_ADAPTERS[key];
                    if (!adapter) {
                        console.warn(`Unknown adapter: ${key}`);
                        continue;
                    }
                    // (Load game JSON)
                    this.games[key] = adapter(json.games[key]);
                }
            }
        }
        toJSON() {
            const { classes, methods, games } = this;
            const json = {};
            let keys;
            // (Java Classes)
            keys = Object.keys(classes);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write classes)
                json.classses = {};
                for (const key of keys) {
                    json.classes[key] = classes[key].toJSON();
                }
            }
            // (Java Methods)
            keys = Object.keys(methods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write methods)
                json.methods = [];
                for (const key of keys) {
                    for (const method of methods[key].elements) {
                        json.methods.push(method.toJSON());
                    }
                }
            }
            // (Java Games)
            keys = Object.keys(games);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write games)
                json.games = {};
                for (const key of keys) {
                    json.games[key] = games[key].toJSON();
                }
            }
            return json;
        }
    }
    exports.RosettaJava = RosettaJava;
    // Register the language to the global adapters.
    Rosetta_3.LANGUAGE_ADAPTERS['java'] = (json) => new RosettaJava(json);
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaPackage", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaPackage = void 0;
    class RosettaJavaPackage {
        constructor(json) {
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaJavaPackage = RosettaJavaPackage;
});
define("src/asledgehammer/rosetta/1.1/java/RosettaJavaReturn", ["require", "exports", "src/asledgehammer/rosetta/1.1/java/RosettaJavaType"], function (require, exports, RosettaJavaType_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaReturn = void 0;
    class RosettaJavaReturn {
        constructor(json) {
            // (Type)
            if (!json.type) {
                throw new Error();
            }
            this.type = new RosettaJavaType_7.RosettaJavaType(json.type);
            // (String: Notes)
            if (json.notes && json.notes.length) {
                this.notes = json.notes;
            }
        }
        toJSON() {
            const { notes, type } = this;
            const json = {};
            // (Type)
            json.type = type.toJSON();
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            return json;
        }
    }
    exports.RosettaJavaReturn = RosettaJavaReturn;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaConstructor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaConstructor = void 0;
    class RosettaLuaConstructor {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaConstructor = RosettaLuaConstructor;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaField", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaField = void 0;
    class RosettaLuaField {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaField = RosettaLuaField;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaMethod", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaMethod = void 0;
    class RosettaLuaMethod {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaMethod = RosettaLuaMethod;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaClass", ["require", "exports", "src/asledgehammer/rosetta/1.1/RosettaNamedCollection", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaMethod"], function (require, exports, RosettaNamedCollection_3, RosettaLuaConstructor_3, RosettaLuaField_5, RosettaLuaMethod_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaClass = void 0;
    class RosettaLuaClass {
        constructor(json) {
            this.staticFields = {};
            this.staticMethods = {};
            this.fields = {};
            this.methods = {};
            this.constructors = [];
            this.mutable = false;
            let keys;
            // (Flag: Deprecated)
            if (json.deprecated !== undefined) {
                if (typeof (json.deprecated) !== 'boolean') {
                    throw new Error();
                }
                this.deprecated = json.deprecated;
            }
            // (Flag: Mutable)
            if (json.mutable !== undefined) {
                if (typeof (json.mutable) !== 'boolean') {
                    throw new Error();
                }
                this.mutable = json.mutable;
            }
            // (String: Extends)
            if (json.extends !== undefined) {
                if (typeof (json.extends) !== 'string') {
                    throw new Error();
                }
                this.extends = '' + json.extends;
            }
            // (String: Notes)
            if (json.notes !== undefined) {
                if (typeof (json.notes) !== 'string') {
                    throw new Error();
                }
                if (json.notes.length) {
                    this.notes = json.notes;
                }
            }
            // (String[]: Tags)
            if (json.tags !== undefined) {
                if (!Array.isArray(json.tags)) {
                    throw new Error();
                }
                // (Force strings)
                this.tags = [...json.tags.map((a) => `${a}`)];
            }
            // (Static Fields)
            if (json.staticFields) {
                keys = Object.keys(json.staticFields);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.staticFields[key] = new RosettaLuaField_5.RosettaLuaField(json.staticFields[key]);
                }
            }
            // (Fields)
            if (json.fields) {
                keys = Object.keys(json.fields);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.fields[key] = new RosettaLuaField_5.RosettaLuaField(json.fields[key]);
                }
            }
            // (Constructors)
            if (json.constructors) {
                for (const cons of json.constructors) {
                    this.constructors.push(new RosettaLuaConstructor_3.RosettaLuaConstructor(cons));
                }
            }
            // (Methods)
            if (json.methods) {
                for (const jsonMethod of json.methods) {
                    const name = jsonMethod.name;
                    let cluster = this.methods[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_3.RosettaNamedCollection(name);
                        this.methods[name] = cluster;
                    }
                    cluster.elements.push(new RosettaLuaMethod_1.RosettaLuaMethod(json.methods[name]));
                }
            }
            // (Static Methods)
            if (json.staticMethods) {
                for (const jsonMethod of json.staticMethods) {
                    const name = jsonMethod.name;
                    let cluster = this.methods[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_3.RosettaNamedCollection(name);
                        this.methods[name] = cluster;
                    }
                    cluster.elements.push(new RosettaLuaMethod_1.RosettaLuaMethod(json.staticMethods[name]));
                }
            }
        }
        toJSON() {
            const { constructors, deprecated, extends: extendz, fields, methods, mutable, notes, staticFields, staticMethods, tags } = this;
            const json = {};
            let keys;
            // (Constructors)
            if (constructors.length) {
                json.constructors = [];
                // (Write constructors)
                for (const cons of constructors) {
                    json.constructors.push(cons.toJSON());
                }
            }
            // (Static Fields)
            keys = Object.keys(staticFields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write fields)
                json.staticFields = {};
                for (const key of keys) {
                    json.staticFields[key] = staticFields[key].toJSON();
                }
            }
            // (Fields)
            keys = Object.keys(fields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write fields)
                json.fields = {};
                for (const key of keys) {
                    json.fields[key] = fields[key].toJSON();
                }
            }
            // (Static Methods)
            keys = Object.keys(staticMethods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write methods)
                json.staticMethods = [];
                for (const key of keys) {
                    for (const method of staticMethods[key].elements) {
                        json.staticMethods.push(method.toJSON());
                    }
                }
            }
            // (Methods)
            keys = Object.keys(methods);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write methods)
                json.methods = [];
                for (const key of keys) {
                    for (const method of methods[key].elements) {
                        json.methods.push(method.toJSON());
                    }
                }
            }
            // (Flag: Deprecated)
            if (deprecated) {
                json.deprecated = true;
            }
            // (Flag: Mutable)
            if (mutable) {
                json.mutable = true;
            }
            // (String: Extends)
            if (extendz && extendz.length) {
                json.extends = extendz;
            }
            // (String: Notes)
            if (notes && notes.length) {
                json.notes = notes;
            }
            // (String[]: Tags)
            if (tags && tags.length) {
                json.tags = [];
                // (Write tags)
                for (const tag of tags) {
                    json.tags.push(tag);
                }
            }
            return json;
        }
    }
    exports.RosettaLuaClass = RosettaLuaClass;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaTable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaTable = void 0;
    class RosettaLuaTable {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaTable = RosettaLuaTable;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaFunction", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaFunction = void 0;
    class RosettaLuaFunction {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaFunction = RosettaLuaFunction;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLua", ["require", "exports", "src/asledgehammer/rosetta/1.1/Rosetta", "src/asledgehammer/rosetta/1.1/RosettaNamedCollection", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaClass", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaField", "src/asledgehammer/rosetta/1.1/lua/RosettaLuaFunction"], function (require, exports, Rosetta_4, RosettaNamedCollection_4, RosettaLuaClass_9, RosettaLuaField_6, RosettaLuaFunction_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLua = exports.GAME_ADAPTERS = void 0;
    exports.GAME_ADAPTERS = {};
    class RosettaLua {
        constructor(json) {
            this.classes = {};
            this.games = {};
            this.functions = {};
            this.fields = {};
            this.tables = {};
            this.language = 'lua';
            this.fromJSON(json);
        }
        fromJSON(json) {
            let keys;
            // (Lua Classes)
            if (json.classes) {
                keys = Object.keys(json.classes);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.classes[key] = new RosettaLuaClass_9.RosettaLuaClass(json.classes[key]);
                }
            }
            // (Lua Functions)
            if (json.functions) {
                for (const jsonFunction of json.functions) {
                    const name = jsonFunction.name;
                    let cluster = this.functions[name];
                    if (!cluster) {
                        cluster = new RosettaNamedCollection_4.RosettaNamedCollection(name);
                        this.functions[name] = cluster;
                    }
                    cluster.elements.push(new RosettaLuaFunction_6.RosettaLuaFunction(json.functions[name]));
                }
            }
            // (Lua Fields)
            if (json.fields) {
                keys = Object.keys(json.fields);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    this.fields[key] = new RosettaLuaField_6.RosettaLuaField(json.fields[key]);
                }
            }
            // (Lua Games)
            if (json.games) {
                keys = Object.keys(json.games);
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys) {
                    // (Grab registered adapter for game)
                    const adapter = exports.GAME_ADAPTERS[key];
                    if (!adapter) {
                        console.warn(`Unknown adapter: ${key}`);
                        continue;
                    }
                    // (Load game JSON)
                    this.games[key] = adapter(json.games[key]);
                }
            }
        }
        toJSON() {
            const { classes, fields, functions, games } = this;
            const json = {};
            let keys;
            // (Lua Classes)
            keys = Object.keys(classes);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write classes)
                json.classses = {};
                for (const key of keys) {
                    json.classes[key] = classes[key].toJSON();
                }
            }
            // (Lua Functions)
            keys = Object.keys(functions);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write functions)
                json.functions = [];
                for (const key of keys) {
                    for (const func of functions[key].elements) {
                        json.methods.push(func.toJSON());
                    }
                }
            }
            // (Lua Fields)
            keys = Object.keys(fields);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write fields)
                json.fields = {};
                for (const key of keys) {
                    json.fields[key] = fields[key].toJSON();
                }
            }
            // (Lua Games)
            keys = Object.keys(games);
            if (keys.length) {
                keys.sort((a, b) => a.localeCompare(b));
                // (Write games)
                json.games = {};
                for (const key of keys) {
                    json.games[key] = games[key].toJSON();
                }
            }
            return json;
        }
    }
    exports.RosettaLua = RosettaLua;
    // Register the language to the global adapters.
    Rosetta_4.LANGUAGE_ADAPTERS['lua'] = (json) => new RosettaLua(json);
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaCallback", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaCallback = void 0;
    class RosettaLuaCallback {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaCallback = RosettaLuaCallback;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaParameter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaParameter = void 0;
    class RosettaLuaParameter {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaParameter = RosettaLuaParameter;
});
define("src/asledgehammer/rosetta/1.1/lua/RosettaLuaReturn", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaReturn = void 0;
    class RosettaLuaReturn {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaLuaReturn = RosettaLuaReturn;
});
define("src/asledgehammer/rosetta/1.1/lua/game/projectzomboid/RosettaProjectZomboid", ["require", "exports", "src/asledgehammer/rosetta/1.1/lua/RosettaLua"], function (require, exports, RosettaLua_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaProjectZomboid = void 0;
    class RosettaProjectZomboid {
        constructor(json) {
            this.language = 'lua';
            this.game = 'projectzomboid';
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaProjectZomboid = RosettaProjectZomboid;
    // Register the game to the lua game-adapters.
    RosettaLua_1.GAME_ADAPTERS['projectzomboid'] = (json) => new RosettaProjectZomboid(json);
});
define("src/asledgehammer/rosetta/1.1/lua/game/projectzomboid/RosettaProjectZomboidContext", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaProjectZomboidContext = void 0;
    class RosettaProjectZomboidContext {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaProjectZomboidContext = RosettaProjectZomboidContext;
});
define("src/asledgehammer/rosetta/1.1/lua/game/projectzomboid/RosettaProjectZomboidEvent", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaProjectZomboidEvent = void 0;
    class RosettaProjectZomboidEvent {
        constructor(json) {
            this.fromJSON(json);
        }
        fromJSON(json) {
            throw new Error("Method not implemented.");
        }
        toJSON() {
            throw new Error("Method not implemented.");
        }
    }
    exports.RosettaProjectZomboidEvent = RosettaProjectZomboidEvent;
});
//# sourceMappingURL=app.js.map