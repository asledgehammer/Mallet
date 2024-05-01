"use strict";
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
define("src/asledgehammer/rosetta/RosettaUtils", ["require", "exports"], function (require, exports) {
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
define("src/asledgehammer/rosetta/RosettaEntity", ["require", "exports", "src/asledgehammer/Assert"], function (require, exports, Assert) {
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
        readNotes(raw = this.raw) {
            const notes = this.readString('notes', raw);
            if (notes != null) {
                return notes.replace(/\s/g, ' ').replace(/\s\s/g, ' ').trim();
            }
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
define("src/asledgehammer/rosetta/lua/RosettaLuaParameter", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/RosettaUtils"], function (require, exports, Assert, RosettaEntity_1, RosettaUtils_1) {
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
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
        }
        toJSON(patch = false) {
            const { name, type, notes } = this;
            const json = {};
            /* (Properties) */
            json.name = name;
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            return json;
        }
    }
    exports.RosettaLuaParameter = RosettaLuaParameter;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaReturns", ["require", "exports", "src/asledgehammer/rosetta/RosettaEntity"], function (require, exports, RosettaEntity_2) {
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
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
        }
        toJSON(patch = false) {
            const { type, notes } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            return json;
        }
    }
    exports.RosettaLuaReturns = RosettaLuaReturns;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaFunction", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaUtils", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaParameter", "src/asledgehammer/rosetta/lua/RosettaLuaReturns"], function (require, exports, Assert, RosettaUtils_2, RosettaEntity_3, RosettaLuaParameter_1, RosettaLuaReturns_1) {
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
            const { notes, parameters, returns } = this;
            const json = {};
            /* (Properties) */
            json.deprecated = this.deprecated ? true : undefined;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
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
    }
    exports.RosettaLuaFunction = RosettaLuaFunction;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity"], function (require, exports, Assert, RosettaEntity_4) {
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
        }
        parse(raw) {
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
            if (raw.defaultValue !== undefined) {
                this.defaultValue = this.readRequiredString('defaultValue', raw);
            }
        }
        toJSON(patch = false) {
            const { defaultValue, type, notes } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            json.defaultValue = defaultValue !== undefined && defaultValue !== '' ? defaultValue : undefined;
            return json;
        }
    }
    exports.RosettaLuaField = RosettaLuaField;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaConstructor", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaParameter"], function (require, exports, Assert, RosettaEntity_5, RosettaLuaParameter_2) {
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
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            /* (Parameters) */
            if (parameters.length) {
                json.parameters = [];
                for (const parameter of parameters)
                    json.parameters.push(parameter.toJSON(patch));
            }
            return json;
        }
    }
    exports.RosettaLuaConstructor = RosettaLuaConstructor;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaClass", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaUtils", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaField", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor"], function (require, exports, Assert, RosettaUtils_3, RosettaEntity_6, RosettaLuaFunction_1, RosettaLuaField_1, RosettaLuaConstructor_1) {
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
            this.deprecated = false;
            /** (Default: off) */
            this.mutable = false;
            Assert.assertNonEmptyString(name, 'name');
            this.name = (0, RosettaUtils_3.formatName)(name);
            this.extendz = this.readString('extends');
            this.notes = this.readNotes();
            this.deprecated = this.readBoolean('deprecated') === true;
            /* (Constructor) */
            if (raw.constructor !== undefined) {
                const rawConstructor = raw.constructor;
                this.conztructor = new RosettaLuaConstructor_1.RosettaLuaConstructor(this, rawConstructor);
            }
            else {
                this.conztructor = new RosettaLuaConstructor_1.RosettaLuaConstructor(this);
            }
            /* (Methods) */
            if (raw.methods !== undefined) {
                const rawMethods = raw.methods;
                for (const name2 of Object.keys(rawMethods)) {
                    const rawMethod = rawMethods[name2];
                    const method = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawMethod);
                    this.methods[name2] = this.methods[method.name] = method;
                }
            }
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name2 of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name2];
                    const func = new RosettaLuaFunction_1.RosettaLuaFunction(name2, rawFunction);
                    this.functions[name2] = this.functions[func.name] = func;
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
            /* (Constructor) */
            if (raw.constructor !== undefined) {
                const rawConstructor = raw.constructor;
                this.conztructor = new RosettaLuaConstructor_1.RosettaLuaConstructor(this, rawConstructor);
            }
            /* (Methods) */
            if (raw.methods !== undefined) {
                const rawMethods = raw.methods;
                for (const name of Object.keys(rawMethods)) {
                    const rawMethod = rawMethods[name];
                    let method = this.methods[name];
                    if (method == null) {
                        method = new RosettaLuaFunction_1.RosettaLuaFunction(name, rawMethod);
                        this.methods[name] = this.methods[method.name] = method;
                    }
                    else {
                        method.parse(rawMethod);
                    }
                }
            }
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name];
                    let func = this.functions[name];
                    if (func == null) {
                        func = new RosettaLuaFunction_1.RosettaLuaFunction(name, rawFunction);
                        this.functions[name] = this.functions[func.name] = func;
                    }
                    else {
                        func.parse(rawFunction);
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
            const method = new RosettaLuaFunction_1.RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });
            // (Only check for the file instance)
            if (this.methods[method.name]) {
                throw new Error(`A method already exists: ${method.name}`);
            }
            if (this.functions[method.name]) {
                throw new Error(`A function already exists with name and cannot be a method: ${method.name}`);
            }
            this.methods[method.name] = method;
            return method;
        }
        /**
         * Creates a function in the Lua class.
         *
         * @param name The name of the new function.
         * @returns The new function.
         *
         * @throws Error Thrown if:
         * - A method already exists with the same name in the Lua class.
         */
        createFunction(name) {
            const func = new RosettaLuaFunction_1.RosettaLuaFunction(name, { returns: { type: 'void', notes: '' } });
            // (Only check for the file instance)
            if (this.functions[func.name]) {
                throw new Error(`A function already exists: ${func.name}`);
            }
            if (this.methods[func.name]) {
                throw new Error(`A method already exists with name and cannot be a function: ${func.name}`);
            }
            this.functions[func.name] = func;
            return func;
        }
        toJSON(patch = false) {
            var _a;
            const { fields, functions, methods, values } = this;
            const json = {};
            /* (Properties) */
            json.extends = this.extendz !== undefined && this.extendz !== '' ? this.extendz : undefined;
            json.notes = this.notes !== undefined && this.notes !== '' ? this.notes : undefined;
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
            if (this.conztructor !== undefined) {
                json.constructor = this.conztructor !== undefined ? (_a = this.conztructor) === null || _a === void 0 ? void 0 : _a.toJSON(patch) : undefined;
            }
            /* (Methods) */
            keys = Object.keys(methods);
            if (keys.length) {
                json.methods = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.methods[key] = methods[key].toJSON(patch);
            }
            /* (Functions) */
            keys = Object.keys(functions);
            if (keys.length) {
                json.functions = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.functions[key] = functions[key].toJSON(patch);
            }
            /* (Mutable Flag) */
            json.mutable = this.mutable;
            return json;
        }
    }
    exports.RosettaLuaClass = RosettaLuaClass;
});
define("src/asledgehammer/rosetta/lua/LuaGenerator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateLuaClass = exports.generateLuaConstructor = exports.generateLuaMethod = exports.generateLuaFunction = exports.generateLuaParameterBody = exports.generateLuaValue = exports.generateLuaField = void 0;
    const generateLuaField = (field) => {
        let s = '';
        // Function Description
        if (field.notes && field.notes.length) {
            const notes = field.notes.split('\n').join(' ');
            s += `${notes}\n`;
        }
        while (s.endsWith('\n'))
            s = s.substring(0, s.length - 1);
        return `--- @field ${field.name} ${field.type} ${s.trim()}`;
    };
    exports.generateLuaField = generateLuaField;
    const generateLuaValue = (containerName, field) => {
        let s = '';
        // Function Description
        if (field.notes && field.notes.length) {
            const notes = field.notes.split('\n').join('\n--- ');
            s += `--- ${notes}\n`;
        }
        let q = `${s}${containerName}.${field.name}`;
        if (field.defaultValue) {
            let d = field.defaultValue;
            // Try parsing as a int.
            if (!parseInt(d) && !parseFloat(d)) {
                // String-wrapping with escaped double-quotes.
                d = `"${d.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
            }
            q += ` = ${d}`;
        }
        return `${q};`;
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
    const generateLuaFunction = (className, func) => {
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
        if (s.length)
            s += '\n';
        s += `function ${className}.${func.name}${(0, exports.generateLuaParameterBody)(func.parameters)} end`;
        return s;
    };
    exports.generateLuaFunction = generateLuaFunction;
    const generateLuaMethod = (className, func) => {
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
        if (s.length)
            s += '\n';
        s += `function ${className}:${func.name}${(0, exports.generateLuaParameterBody)(func.parameters)} end`;
        return s;
    };
    exports.generateLuaMethod = generateLuaMethod;
    const generateLuaConstructor = (className, conzstructor) => {
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
        if (s.length)
            s += '\n';
        s += `function ${className}:new${(0, exports.generateLuaParameterBody)(conzstructor.parameters)} end`;
        return s;
    };
    exports.generateLuaConstructor = generateLuaConstructor;
    const generateLuaClass = (clazz) => {
        let s = '--- @meta\n\n';
        // If the class has a description.
        if (clazz.notes && clazz.notes.length > 0) {
            const notes = clazz.notes.split('\n').join('\n--- ');
            s += `--- ${notes}\n`;
            if (notes.endsWith('\n'))
                s += '--- \n';
        }
        s += `--- @class ${clazz.name}\n`;
        // Generate any value-comments in the class here.
        const valueNames = Object.keys(clazz.values);
        if (valueNames.length) {
            valueNames.sort((a, b) => a.localeCompare(b));
            for (const valueName of valueNames) {
                const value = clazz.values[valueName];
                s += (0, exports.generateLuaField)(value) + '\n';
            }
        }
        // Generate any fields in the class here.
        const fieldNames = Object.keys(clazz.fields);
        if (fieldNames.length) {
            fieldNames.sort((a, b) => a.localeCompare(b));
            for (const fieldName of fieldNames) {
                const field = clazz.fields[fieldName];
                s += (0, exports.generateLuaField)(field) + '\n';
            }
        }
        // NOTE: This is to keep flexability in Lua for adding custom properties to existing classes.
        if (clazz.mutable) {
            s += '--- @field [any] any\n';
        }
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
                s += (0, exports.generateLuaValue)(clazz.name, value) + '\n';
            }
            s += '\n';
        }
        s += (0, exports.generateLuaConstructor)(clazz.name, clazz.conztructor) + '\n';
        // Generate any methods in the class here.
        const methodNames = Object.keys(clazz.methods);
        if (methodNames.length) {
            s += '\n';
            methodNames.sort((a, b) => a.localeCompare(b));
            for (const methodName of methodNames) {
                const method = clazz.methods[methodName];
                s += (0, exports.generateLuaMethod)(clazz.name, method) + '\n\n';
            }
        }
        // Generate any functions in the class here.
        const functionNames = Object.keys(clazz.functions);
        if (functionNames.length) {
            functionNames.sort((a, b) => a.localeCompare(b));
            for (const functionName of functionNames) {
                const func = clazz.functions[functionName];
                s += (0, exports.generateLuaFunction)(clazz.name, func) + '\n\n';
            }
        }
        return s;
    };
    exports.generateLuaClass = generateLuaClass;
});
define("src/asledgehammer/rosetta/util", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.get = exports.$get = exports.validateLuaVariableName = exports.combine = exports.combineArrays = exports.randomString = exports.css = exports.html = void 0;
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
});
define("src/asledgehammer/rosetta/component/Component", ["require", "exports", "src/asledgehammer/rosetta/util"], function (require, exports, util_1) {
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
define("src/asledgehammer/rosetta/component/CardComponent", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component"], function (require, exports, util_2, Component_1) {
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
define("src/asledgehammer/rosetta/component/NameModeType", ["require", "exports"], function (require, exports) {
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
define("src/asledgehammer/rosetta/component/LuaCard", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/CardComponent", "src/asledgehammer/Delta"], function (require, exports, hljs, util_3, CardComponent_1, Delta_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaCard = void 0;
    class LuaCard extends CardComponent_1.CardComponent {
        constructor(app, options) {
            super(options);
            this.app = app;
            this.idPreview = `${this.id}-preview`;
            this.idPreviewCode = `${this.id}-preview-code`;
            this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
        }
        listenEdit(entity, idBtnEdit, mode, title, nameSelected = undefined) {
            (0, util_3.$get)(idBtnEdit).on('click', () => {
                const { modalName, $btnName, $titleName, $inputName } = this.app;
                $titleName.html(title);
                if (mode === 'edit_class' || mode === 'edit_field' || mode === 'edit_function' || mode === 'edit_method' || mode === 'edit_value') {
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
                this.app.nameMode = mode;
                if (!nameSelected)
                    nameSelected = entity.name;
                this.app.nameSelected = nameSelected;
                modalName.show();
            });
        }
        renderEdit(idBtnEdit) {
            return (0, util_3.html) `
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
            (0, Delta_1.createDeltaEditor)(idNotes, entity.notes, (markdown) => {
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
                <textarea id="${idDefaultValue}" class="form-control responsive-input mt-1" spellcheck="false">${defaultValue}</textarea>
            </div>
        `;
        }
        listenParameters(entity, type) {
            const { parameters } = entity;
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;
                (0, Delta_1.createDeltaEditor)(idParamNotes, param.notes, (markdown) => {
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
                    this.app.askConfirm(() => {
                        entity.parameters.splice(entity.parameters.indexOf(param), 1);
                        this.update();
                        // Implicit check for refreshability for parameters.
                        if (this.refreshParameters)
                            this.refreshParameters();
                    }, `Delete Parameter ${param.name}?`);
                });
                this.listenEdit({ name: param.name }, idBtnEdit, 'edit_parameter', 'Edit Parameter Name', `${entity.name}-${param.name}`);
            }
            const idBtnAdd = `btn-${entity.name}-parameter-add`;
            (0, util_3.$get)(idBtnAdd).on('click', () => {
                const { modalName, $inputName, $titleName } = this.app;
                this.app.nameMode = 'new_parameter';
                this.app.nameSelected = `${type}-${entity.name}`;
                $titleName.html('Add Parameter');
                $inputName.val('');
                modalName.show();
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
                htmlParams += (0, util_3.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                        <div style="position: absolute; height: 32px; top: 5px; right: 2rem; z-index: 4;">
                            <!-- Delete Button -->
                            <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" style="z-index: 4">
                                <div class="btn-pane">
                                    <i class="fa-solid fa-xmark"></i>
                                </div>
                            </button>
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
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
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
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idAccordion}" aria-expanded="true" aria-controls="${idAccordion}">
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
                    <!-- <div class="mt-3" style="position: relative; width: 100%; height: 32px;"></div> -->
                </div>
            </div>
        `;
        }
        update() {
            const { idPreviewCode } = this;
            const $pre = (0, util_3.$get)(idPreviewCode);
            $pre.empty();
            let text = this.onRenderPreview();
            if (text.endsWith('\n'))
                text = text.substring(0, text.length - 1);
            // @ts-ignore
            const highlightedCode = hljs.default.highlightAuto(text, ['lua']).value;
            $pre.append(highlightedCode);
        }
        listenPreview() {
            const { idBtnPreviewCopy } = this;
            // Copy the code.
            (0, util_3.$get)(idBtnPreviewCopy).on('click', (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(this.onRenderPreview());
            });
        }
        renderPreview(show) {
            const { idPreview, idPreviewCode, idBtnPreviewCopy } = this;
            return (0, util_3.html) `
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
                <div id="${idPreview}" class="card-body mb-0 p-0 collapse${show ? ' show' : ''}" style="position: relative; max-height: 512px">
                    <pre id="${idPreviewCode}" class="w-100 h-100 p-4 m-0" style="background-color: #111; overflow: scroll; max-height: 512px;"></pre>
                </div>
            </div>
        `;
        }
        listenReturns(entity, idReturnType, idReturnNotes, idSelect) {
            const { returns } = entity;
            (0, Delta_1.createDeltaEditor)(idReturnNotes, entity.returns.notes, (markdown) => {
                entity.returns.notes = markdown;
                this.update();
                this.app.renderCode();
            });
            const $select = (0, util_3.$get)(idReturnType);
            const $customInput = (0, util_3.$get)(`${idSelect}-custom-input`);
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
        }
        renderReturns(entity, idReturnType, idReturnNotes, show = false) {
            const { returns } = entity;
            let { notes } = returns;
            if (!notes)
                notes = '';
            const idCard = `${entity.name}-returns-card`;
            return (0, util_3.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idCard}" aria-expanded="true" aria-controls="${idCard}">
                        <strong>Returns</strong>
                    </button>
                </div>
                <div id="${idCard}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <!-- Return Type -->
                    <div class="mb-3">
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', returns.type, true)}
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
            const $select = (0, util_3.$get)(idType);
            const $customInput = (0, util_3.$get)(`${idSelect}-custom-input`);
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
        }
        renderType(name, type, idReturnType) {
            const idTypeCard = `${name}-type-card`;
            return (0, util_3.html) `
            <div class="card responsive-subcard">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idTypeCard}" aria-expanded="true" aria-controls="${idTypeCard}">
                        Type
                    </button>   
                </div>
                <div id="${idTypeCard}" class="card-body collapse show">
                    <div>
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', type, false)}
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
    exports.LuaCard = LuaCard;
});
define("src/asledgehammer/rosetta/component/LuaClassCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_1, util_4, LuaCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaClassCard = void 0;
    class LuaClassCard extends LuaCard_1.LuaCard {
        onRenderPreview() {
            return (0, LuaGenerator_1.generateLuaClass)(this.options.entity);
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
            this.listenEdit(entity, idBtnEdit, 'edit_class', 'Edit Lua Class');
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
define("src/asledgehammer/rosetta/component/LuaConstructorCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_2, util_5, LuaCard_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaConstructorCard = void 0;
    class LuaConstructorCard extends LuaCard_2.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview() {
            if (!this.options)
                return '';
            const { entity } = this.options;
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            return (0, LuaGenerator_2.generateLuaConstructor)(className, entity);
        }
        onHeaderHTML() {
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            const name = `${className}:new( )`;
            return (0, util_5.html) ` 
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
            return (0, util_5.html) `
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
            const $paramContainer = (0, util_5.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters({ name: 'new', parameters: entity.parameters }, true));
            this.listenParameters({ name: 'new', parameters: entity.parameters }, 'constructor');
        }
    }
    exports.LuaConstructorCard = LuaConstructorCard;
});
define("src/asledgehammer/rosetta/component/LuaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_3, util_6, LuaCard_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFieldCard = void 0;
    class LuaFieldCard extends LuaCard_3.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idBtnDelete = `${this.id}-btn-delete`;
        }
        onRenderPreview() {
            var _a, _b;
            if (!this.options)
                return '';
            const { app } = this;
            const { entity, isStatic } = this.options;
            const { defaultValue } = entity;
            const name = (_b = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.entity.name;
            if (isStatic) {
                return `${(0, LuaGenerator_3.generateLuaField)(entity)}\n\n${(0, LuaGenerator_3.generateLuaValue)(name, entity)}`;
            }
            let s = (0, LuaGenerator_3.generateLuaField)(entity);
            if (defaultValue) {
                s += `\n\n--- (Example of initialization of field) ---\nself.${entity.name} = ${defaultValue};`;
            }
            return s;
        }
        onHeaderHTML() {
            var _a;
            const { idBtnEdit, idBtnDelete } = this;
            const { entity, isStatic } = this.options;
            const luaClass = (_a = this.app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
            let name = `${luaClass.name}.${entity.name}`;
            if (isStatic) {
                name = (0, util_6.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_6.html) ` 
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
            return (0, util_6.html) `
            <div>
                ${this.renderNotes(idNotes)}
                ${this.renderDefaultValue(entity.defaultValue, idDefaultValue)}
                <hr>
                ${this.renderType(entity.name, entity.type, idType)}
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
            this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_value' : 'edit_field', `Edit ${isStatic ? 'Value' : 'Field'} Name`);
            this.listenPreview();
            (0, util_6.$get)(idBtnDelete).on('click', () => {
                app.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.values[entity.name];
                    }
                    else {
                        delete clazz.fields[entity.name];
                    }
                    app.showClass(clazz);
                    app.sidebar.itemTree.selectedItemID = undefined;
                    app.sidebar.itemTree.populate();
                }, `Delete ${isStatic ? 'Value' : 'Field'} ${entity.name}`);
            });
        }
    }
    exports.LuaFieldCard = LuaFieldCard;
});
define("src/asledgehammer/rosetta/component/LuaFunctionCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_4, util_7, LuaCard_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFunctionCard = void 0;
    class LuaFunctionCard extends LuaCard_4.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
            this.idBtnDelete = `${this.id}-btn-delete`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview() {
            if (!this.options)
                return '';
            const { entity } = this.options;
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            return (0, LuaGenerator_4.generateLuaMethod)(className, entity);
        }
        onHeaderHTML() {
            const { idBtnDelete, idBtnEdit } = this;
            const { entity, isStatic } = this.options;
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            let name = `${className}${isStatic ? '.' : ':'}${entity.name}( )`;
            if (isStatic) {
                name = (0, util_7.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_7.html) ` 
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
            return (0, util_7.html) `
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
            this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_function' : 'edit_method', `Edit Lua ${isStatic ? 'Function' : 'Method'}`);
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, isStatic ? 'function' : 'method');
            this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
            this.listenPreview();
            (0, util_7.$get)(idBtnDelete).on('click', () => {
                app.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.functions[entity.name];
                    }
                    else {
                        delete clazz.methods[entity.name];
                    }
                    app.showClass(clazz);
                    app.sidebar.itemTree.selectedItemID = undefined;
                    app.sidebar.itemTree.populate();
                }, `Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`);
            });
        }
        refreshParameters() {
            const { idParamContainer } = this;
            const { entity, isStatic } = this.options;
            const $paramContainer = (0, util_7.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, isStatic ? 'function' : 'method');
        }
    }
    exports.LuaFunctionCard = LuaFunctionCard;
});
define("src/asledgehammer/rosetta/component/ItemTree", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, util_8, LuaCard_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemTree = void 0;
    class ItemTree {
        constructor(app) {
            this.folderFieldOpen = false;
            this.folderValueOpen = false;
            this.folderFunctionOpen = false;
            this.folderMethodOpen = false;
            this.app = app;
            this.idItemClass = `item-tree-item-class`;
            this.idFolderField = `item-tree-folder-field`;
            this.idFolderValue = `item-tree-folder-value`;
            this.idFolderFunction = `item-tree-folder-function`;
            this.idFolderMethod = `item-tree-folder-method`;
        }
        populate() {
            const _this = this;
            const { card: luaClass } = this.app;
            if (!luaClass)
                return;
            const entity = luaClass.options.entity;
            if (!entity)
                return;
            // Generate nodes first.
            const fieldNames = Object.keys(entity.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const fields = [];
            for (const fieldName of fieldNames) {
                const field = entity.fields[fieldName];
                const id = `lua-class-${entity.name}-field-${field.name}`;
                fields.push({
                    text: field.name,
                    icon: LuaCard_5.LuaCard.getTypeIcon(field.type),
                    id,
                    class: ['item-tree-item', 'lua-field-item']
                });
            }
            const valueNames = Object.keys(entity.values);
            valueNames.sort((a, b) => a.localeCompare(b));
            const values = [];
            for (const valueName of valueNames) {
                const value = entity.values[valueName];
                const id = `lua-class-${entity.name}-value-${value.name}`;
                values.push({
                    text: (0, util_8.html) `<span class="fst-italic">${value.name}</span>`,
                    icon: LuaCard_5.LuaCard.getTypeIcon(value.type),
                    id,
                    class: ['item-tree-item', 'lua-value-item']
                });
            }
            const methodNames = Object.keys(entity.methods);
            methodNames.sort((a, b) => a.localeCompare(b));
            const methods = [];
            for (const methodName of methodNames) {
                const method = entity.methods[methodName];
                const id = `lua-class-${entity.name}-method-${method.name}`;
                methods.push({
                    text: (0, util_8.html) `<i class="fa-solid fa-xmark me-2" title="${method.returns.type}"></i>${method.name}`,
                    icon: 'fa-solid fa-terminal text-success mx-2',
                    id,
                    class: ['item-tree-item', 'lua-method-item'],
                });
            }
            const functionNames = Object.keys(entity.functions);
            functionNames.sort((a, b) => a.localeCompare(b));
            const functions = [];
            for (const functionName of functionNames) {
                const func = entity.functions[functionName];
                const id = `lua-class-${entity.name}-function-${func.name}`;
                functions.push({
                    text: (0, util_8.html) `<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                    icon: 'fa-solid fa-terminal text-success mx-2',
                    id,
                    class: ['item-tree-item', 'lua-function-item'],
                });
            }
            let $tree = (0, util_8.$get)('tree');
            $tree.remove();
            (0, util_8.$get)('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
            $tree = (0, util_8.$get)('tree');
            // If something isn't selected then the properties must be.
            const classClasses = ['item-tree-item', 'lua-class-item'];
            if (!_this.selectedItemID)
                classClasses.push('selected');
            // @ts-ignore
            $tree.bstreeview({
                data: [
                    {
                        id: _this.idItemClass,
                        text: "Class Properties",
                        icon: LuaCard_5.LuaCard.getTypeIcon('class'),
                        class: classClasses
                    },
                    {
                        text: "Constructor",
                        icon: LuaCard_5.LuaCard.getTypeIcon('constructor'),
                        class: ['item-tree-item', 'lua-constructor-item']
                    },
                    {
                        text: "Fields",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderField,
                        expanded: _this.folderFieldOpen,
                        nodes: fields
                    },
                    {
                        text: "Values",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderValue,
                        expanded: _this.folderValueOpen,
                        nodes: values
                    },
                    {
                        text: "Methods",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderMethod,
                        expanded: _this.folderMethodOpen,
                        nodes: methods
                    },
                    {
                        text: "Functions",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderFunction,
                        expanded: _this.folderFunctionOpen,
                        nodes: functions
                    },
                ]
            });
            // Apply jQuery listeners next.
            $('.lua-class-item').on('click', function () {
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === 'class')
                    return;
                _this.app.showClass(entity);
                // Let the editor know we last selected the class.
                _this.app.selected = 'class';
            });
            $('.lua-constructor-item').on('click', function () {
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === 'constructor')
                    return;
                _this.app.showConstructor(entity.conztructor);
                // Let the editor know we last selected the constructor.
                _this.app.selected = 'constructor';
            });
            $('.lua-field-item').on('click', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === fieldName)
                    return;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                _this.app.showField(field);
                // Let the editor know we last selected the field.
                _this.app.selected = fieldName;
            });
            $('.lua-value-item').on('click', function () {
                const valueName = this.id.split('value-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === valueName)
                    return;
                const value = entity.values[valueName];
                if (!value)
                    return;
                _this.app.showValue(value);
                // Let the editor know we last selected the value.
                _this.app.selected = valueName;
            });
            $('.lua-method-item').on('click', function () {
                const methodName = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === methodName)
                    return;
                const method = entity.methods[methodName];
                if (!method)
                    return;
                _this.app.showMethod(method);
                // Let the editor know we last selected the method.
                _this.app.selected = methodName;
            });
            $('.lua-function-item').on('click', function () {
                const functionName = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.app.selected === functionName)
                    return;
                const func = entity.functions[functionName];
                if (!func)
                    return;
                _this.app.showFunction(func);
                // Let the editor know we last selected the function.
                _this.app.selected = functionName;
            });
            $('.item-tree-item').on('click', function () {
                const $this = $(this);
                $('.selected').removeClass('selected');
                $this.addClass('selected');
                _this.selectedItemID = this.id;
            });
            // Preserve the state of folders.
            (0, util_8.$get)(this.idFolderField).on('click', () => this.folderFieldOpen = !this.folderFieldOpen);
            (0, util_8.$get)(this.idFolderValue).on('click', () => this.folderValueOpen = !this.folderValueOpen);
            (0, util_8.$get)(this.idFolderMethod).on('click', () => this.folderMethodOpen = !this.folderMethodOpen);
            (0, util_8.$get)(this.idFolderFunction).on('click', () => this.folderFunctionOpen = !this.folderFunctionOpen);
            // Re-apply selection for re-population.
            const $selectedItem = this.selectedItemID ? $(this.selectedItemID) : $(this.idItemClass);
            console.log($selectedItem);
            $selectedItem.addClass('selected');
        }
    }
    exports.ItemTree = ItemTree;
});
define("src/asledgehammer/rosetta/component/Sidebar", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/component/ItemTree"], function (require, exports, util_9, Component_2, ItemTree_1) {
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
            this.app = app;
            const result = document.getElementById('result');
            const reader = new FileReader();
            reader.addEventListener('load', () => (result.innerHTML = reader.result));
            this.itemTree = new ItemTree_1.ItemTree(app);
        }
        onRender() {
            return (0, util_9.html) `
            <div class="bg-dark p-1 border-bottom border-bottom-2 border-black shadow">
                <!-- New Class -->
                <button id="new-lua-class" class="btn btn-sm responsive-btn responsive-btn-success" title="New Class">
                    <div class="btn-pane">    
                        <i class="fa fa-file"></i>
                    </div>
                </button>
                
                <!-- Open Class -->
                <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open Class">
                    <div class="btn-pane">
                        <i class="fa-solid fa-folder-open"></i>
                    </div>
                </button>

                <!-- Save Class -->
                <button id="save-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Save Class">
                    <div class="btn-pane">
                        <i class="fa fa-save"></i>
                    </div>
                </button>

                <!-- Lua Wizard -->
                <button id="lua-wizard" class="btn btn-sm responsive-btn responsive-btn-info" title="Lua Wizard">
                    <div class="btn-pane">    
                        <i class="fa-solid fa-wand-sparkles"></i>
                    </div>
                </button>

                <!-- New Properties -->
                <div class="dropdown" style="position: absolute; top: 5px; right: 5px;">
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
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
        }
        listen() {
            this.itemTree.populate();
            const { app } = this;
            const _this = this;
            const { $titleName, $btnName, $inputName, modalName } = app;
            (0, util_9.$get)('new-lua-class').on('click', () => {
                try {
                    $titleName.html('New Lua Class');
                    $btnName.html('Create');
                    $btnName.removeClass('btn-primary');
                    $btnName.addClass('btn-success');
                    $inputName.val('');
                    app.nameMode = 'new_class';
                    modalName.show();
                }
                catch (e) {
                    app.toast.alert(`Failed to create LuaClass.`, 'error');
                    console.error(e);
                }
            });
            (0, util_9.$get)('open-lua-class').on('click', () => {
                const dFileLoad = document.getElementById('load-file');
                const onchange = () => {
                    try {
                        const file = dFileLoad.files[0];
                        const textType = 'application/json';
                        if (file.type.match(textType)) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                const json = JSON.parse(reader.result);
                                app.loadLuaClass(json);
                                app.renderCode();
                                _this.itemTree.populate();
                            };
                            reader.readAsText(file);
                        }
                        app.toast.alert(`Loaded LuaClass.`, 'success');
                    }
                    catch (e) {
                        app.toast.alert(`Failed to load LuaClass.`, 'error');
                        console.error(e);
                    }
                };
                dFileLoad.onchange = onchange;
                dFileLoad.click();
            });
            (0, util_9.$get)('save-lua-class').on('click', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker();
                    const entity = this.app.card.options.entity;
                    const luaClasses = {};
                    luaClasses[entity.name] = entity.toJSON();
                    const contents = {
                        $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
                        luaClasses
                    };
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(contents, null, 2));
                    await writable.close();
                    app.toast.alert(`Saved LuaClass.`, 'info');
                }
                catch (e) {
                    app.toast.alert(`Failed to load LuaClass.`, 'error');
                    console.error(e);
                }
                return;
            });
            (0, util_9.$get)('btn-new-lua-value').on('click', () => {
                try {
                    const { card } = app;
                    if (!card)
                        return;
                    const clazz = card.options.entity;
                    if (!clazz)
                        return;
                    this.app.nameMode = 'new_value';
                    this.app.$titleName.html('Create Lua Value');
                    this.app.$inputName.val('');
                    this.app.modalName.show();
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Value.`, 'error');
                    console.error(e);
                }
            });
            (0, util_9.$get)('btn-new-lua-field').on('click', () => {
                try {
                    const { card } = app;
                    if (!card)
                        return;
                    const clazz = card.options.entity;
                    if (!clazz)
                        return;
                    this.app.nameMode = 'new_field';
                    this.app.$titleName.html('Create Lua Field');
                    this.app.$inputName.val('');
                    this.app.modalName.show();
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Field.`, 'error');
                    console.error(e);
                }
            });
            (0, util_9.$get)('btn-new-lua-function').on('click', () => {
                try {
                    const { card } = app;
                    if (!card)
                        return;
                    const clazz = card.options.entity;
                    if (!clazz)
                        return;
                    this.app.nameMode = 'new_function';
                    this.app.$titleName.html('Create Lua Function');
                    this.app.$inputName.val('');
                    this.app.modalName.show();
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Function.`, 'error');
                    console.error(e);
                }
            });
            (0, util_9.$get)('btn-new-lua-method').on('click', () => {
                try {
                    const { card } = app;
                    if (!card)
                        return;
                    const clazz = card.options.entity;
                    if (!clazz)
                        return;
                    this.app.nameMode = 'new_method';
                    this.app.$titleName.html('Create Lua Method');
                    this.app.$inputName.val('');
                    this.app.modalName.show();
                }
                catch (e) {
                    app.toast.alert(`Failed to create Lua Method.`, 'error');
                    console.error(e);
                }
            });
            $('#lua-wizard').on('click', () => {
                app.luaParser.parseFilePicker();
            });
        }
    }
    exports.Sidebar = Sidebar;
    ;
});
define("src/asledgehammer/rosetta/lua/wizard/String", ["require", "exports", "luaparse"], function (require, exports, ast) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chunkToString = exports.statementToString = exports.expressionToString = exports.callStatementToString = exports.assignmentStatementToString = exports.tableConstructorExpressionToString = exports.ifStatementToString = exports.elseClauseToString = exports.elseIfClauseToString = exports.ifClauseToString = exports.forGenericStatementToString = exports.forNumericStatementToString = exports.repeatStatementToString = exports.doStatementToString = exports.whileStatementToString = exports.functionDeclarationToString = exports.bodyToString = exports.parametersToString = exports.varargLiteralToString = exports.localStatementToString = exports.breakStatementToString = exports.labelStatementToString = exports.gotoStatementToString = exports.returnStatementToString = exports.callExpressionToString = exports.memberExpressionToString = exports.argsToString = exports.binaryExpressionToString = exports.tableCallExpressionToString = exports.stringCallExpressionToString = exports.unaryExpressionToString = exports.logicalExpressionToString = exports.indexExpressionToString = exports.identifierToString = exports.literalToString = exports.indent = void 0;
    // @ts-ignore
    const luaparse = ast.default;
    ;
    function indent(options) {
        return Object.assign(Object.assign({}, options), { indent: options.indent + 1 });
    }
    exports.indent = indent;
    function literalToString(literal, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        switch (literal.type) {
            // Simple raw-calls.
            case 'BooleanLiteral':
            case 'NumericLiteral':
            case 'NilLiteral': return `${i}${literal.raw}`;
            case 'StringLiteral': return (options.raw) ? `${i}${literal.value}` : `${i}${literal.raw}`;
            case 'VarargLiteral': {
                // TODO: Check validity.
                console.warn('VarargLiteral: ', literal);
                return `${i}${literal.raw}`;
            }
        }
    }
    exports.literalToString = literalToString;
    function identifierToString(identifier, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${identifier.name}`;
    }
    exports.identifierToString = identifierToString;
    function indexExpressionToString(expression, options = { indent: 0 }) {
        return `${expressionToString(expression.base)}[${expressionToString(expression.index)}]`;
    }
    exports.indexExpressionToString = indexExpressionToString;
    function logicalExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
    }
    exports.logicalExpressionToString = logicalExpressionToString;
    function unaryExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expression.operator} ${expressionToString(expression.argument)}`;
    }
    exports.unaryExpressionToString = unaryExpressionToString;
    function stringCallExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const base = expressionToString(expression.base);
        const arg = expressionToString(expression.argument);
        console.log(expression);
        return `${i}${base} ${arg}`;
    }
    exports.stringCallExpressionToString = stringCallExpressionToString;
    function tableCallExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        console.log(expression);
        throw new Error('Not implemented.');
    }
    exports.tableCallExpressionToString = tableCallExpressionToString;
    function binaryExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`;
    }
    exports.binaryExpressionToString = binaryExpressionToString;
    function argsToString(args2, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const args = [];
        for (const arg of args2)
            args.push(expressionToString(arg));
        return `${i}${args.join(', ')}`;
    }
    exports.argsToString = argsToString;
    function memberExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expressionToString(expression.base)}${expression.indexer}${expression.identifier.name}`;
    }
    exports.memberExpressionToString = memberExpressionToString;
    function callExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expressionToString(expression.base)}(${argsToString(expression.arguments)})`;
    }
    exports.callExpressionToString = callExpressionToString;
    function returnStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const args = [];
        for (const arg of statement.arguments)
            args.push(expressionToString(arg));
        return `${i}return${args.length ? ` ${args.join(', ')}` : ''}`;
    }
    exports.returnStatementToString = returnStatementToString;
    function gotoStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}goto $${statement.label}`;
    }
    exports.gotoStatementToString = gotoStatementToString;
    function labelStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}::${statement.label}::`;
    }
    exports.labelStatementToString = labelStatementToString;
    function breakStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}break`;
    }
    exports.breakStatementToString = breakStatementToString;
    function localStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        // The local name(s).
        const vars = [];
        for (const _var_ of statement.variables)
            vars.push(_var_.name);
        // The value(s) to set.
        const inits = [];
        for (const i of statement.init)
            inits.push(expressionToString(i));
        return `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
    }
    exports.localStatementToString = localStatementToString;
    function varargLiteralToString(param, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${param.raw}`;
    }
    exports.varargLiteralToString = varargLiteralToString;
    function parametersToString(params, options = { indent: 0 }) {
        const ps = [];
        for (const param of params) {
            switch (param.type) {
                case 'Identifier': {
                    ps.push(identifierToString(param, options));
                    break;
                }
                case 'VarargLiteral': {
                    ps.push(varargLiteralToString(param, options));
                    break;
                }
            }
        }
        return ps.join(', ');
    }
    exports.parametersToString = parametersToString;
    function bodyToString(body, options = { indent: 0 }) {
        let s = '';
        for (let index = 0; index < body.length; index++) {
            const prevStatement = body[index - 1];
            const currStatement = body[index];
            const nextStatement = body[index + 1];
            // For cleaner separation of code.
            let endingSemicolon = true;
            let leadingNewline = false;
            let endingNewline = false;
            switch (currStatement.type) {
                case 'FunctionDeclaration': {
                    endingSemicolon = false;
                    // No blank spaces for the first line of a body.
                    if (prevStatement)
                        leadingNewline = true;
                    // No blank spaces at the end of a body.
                    if (nextStatement)
                        endingNewline = true;
                }
                case 'IfStatement':
                case 'ForGenericStatement':
                case 'ForNumericStatement':
                case 'WhileStatement':
                case 'DoStatement':
                case 'RepeatStatement': {
                    endingSemicolon = false;
                    // No blank spaces at the end of a body.
                    if (nextStatement)
                        endingNewline = true;
                    break;
                }
                case 'BreakStatement':
                case 'LabelStatement': {
                    endingSemicolon = false;
                    break;
                }
            }
            s += `${leadingNewline ? '\n' : ''}${statementToString(currStatement, options)}${endingSemicolon ? ';' : ''}\n${endingNewline ? '\n' : ''}`;
        }
        // Remove the last newline. (If present)
        if (s.length)
            s = s.substring(0, s.length - 1);
        return s;
    }
    exports.bodyToString = bodyToString;
    /**
     * Renders a Lua function declaration as a string.
     *
     * @param func The function to render.
     * @param options Passed options on indenting the code.
     * @returns The function rendered as a string.
     */
    function functionDeclarationToString(func, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        /* (If exists, generate the name of the function) */
        let name = '';
        if (func.identifier) {
            switch (func.identifier.type) {
                case 'Identifier': {
                    name = func.identifier.name;
                    break;
                }
                case 'MemberExpression': {
                    name = memberExpressionToString(func.identifier);
                    break;
                }
            }
        }
        /* (Build the function's declaration) */
        let s = `${i}${func.isLocal ? 'local ' : ''}function${name && name.length ? ` ${name}` : ''}(${parametersToString(func.parameters)})`;
        // Only render multi-line functions if its body is populated.
        if (func.body.length) {
            s += '\n';
            s += `${bodyToString(func.body, options2)}\n`;
            s += `${i}end`;
        }
        else {
            s += ' end';
        }
        return s;
    }
    exports.functionDeclarationToString = functionDeclarationToString;
    function whileStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}while ${expressionToString(statement.condition)} do\n`;
        s += `${bodyToString(statement.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.whileStatementToString = whileStatementToString;
    function doStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}do\n`;
        s += `${bodyToString(statement.body), options2}\n`;
        s += `${i}end`;
        return s;
    }
    exports.doStatementToString = doStatementToString;
    function repeatStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}repeat\n`;
        s += `${bodyToString(statement.body, options2)}\n`;
        s += `${i}until ${statement.condition};`;
        return s;
    }
    exports.repeatStatementToString = repeatStatementToString;
    function forNumericStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}for ${expressionToString(statement.start)}, ${expressionToString(statement.end)}`;
        if (statement.step)
            s += `, ${expressionToString(statement.step)}`; // (Optional 3rd step argument)
        s += `\n${bodyToString(statement.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.forNumericStatementToString = forNumericStatementToString;
    function forGenericStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        const vars = [];
        for (const variable of statement.variables)
            vars.push(variable.name);
        const iterate = [];
        for (const iterator of statement.iterators)
            iterate.push(expressionToString(iterator));
        let s = `${i}for ${vars.join(', ')} in ${iterate.join(', ')} do\n`;
        s += `${bodyToString(statement.body, options2)}\n`;
        s += 'end';
        return s;
    }
    exports.forGenericStatementToString = forGenericStatementToString;
    function ifClauseToString(clause, isLastClause, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}if ${expressionToString(clause.condition)} then\n`;
        s += `${bodyToString(clause.body, options2)}\n`;
        if (isLastClause)
            s += `${i}end`;
        return s;
    }
    exports.ifClauseToString = ifClauseToString;
    function elseIfClauseToString(clause, isLastClause, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}elseif ${expressionToString(clause.condition)} then\n`;
        s += `${bodyToString(clause.body, options2)}\n`;
        if (isLastClause)
            s += `${i}end`;
        return s;
    }
    exports.elseIfClauseToString = elseIfClauseToString;
    function elseClauseToString(clause, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}else\n`;
        s += `${bodyToString(clause.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.elseClauseToString = elseClauseToString;
    function ifStatementToString(statement, options = { indent: 0 }) {
        let s = '';
        for (let index = 0; index < statement.clauses.length; index++) {
            const isLastClause = index === statement.clauses.length - 1;
            const clause = statement.clauses[index];
            switch (clause.type) {
                case 'IfClause': {
                    s += `${ifClauseToString(clause, isLastClause, options)}`;
                    break;
                }
                case 'ElseifClause': {
                    s += `${elseIfClauseToString(clause, isLastClause, options)}`;
                    break;
                }
                case 'ElseClause': {
                    s += `${elseClauseToString(clause, options)}`;
                    break;
                }
            }
        }
        return s;
    }
    exports.ifStatementToString = ifStatementToString;
    function tableConstructorExpressionToString(expression, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        // Empty table.
        if (!expression.fields.length)
            return `${i}{}`;
        const entries = [];
        for (const field of expression.fields) {
            switch (field.type) {
                case 'TableKey': {
                    entries.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                    break;
                }
                case 'TableKeyString': {
                    entries.push(`${field.key.name} = ${expressionToString(field.value)}`);
                    break;
                }
                case 'TableValue': {
                    entries.push(expressionToString(field.value));
                    break;
                }
            }
        }
        return `${i}{ ${entries.join(', ')} }`;
    }
    exports.tableConstructorExpressionToString = tableConstructorExpressionToString;
    function assignmentStatementToString(statement, options = { indent: 0 }) {
        const i = ' '.repeat(options.indent * 4);
        // The local name(s).
        const vars = [];
        for (const _var_ of statement.variables) {
            switch (_var_.type) {
                case 'Identifier': {
                    vars.push(identifierToString(_var_));
                    break;
                }
                case 'IndexExpression': {
                    vars.push(indexExpressionToString(_var_));
                    break;
                }
                case 'MemberExpression': {
                    vars.push(memberExpressionToString(_var_));
                    break;
                }
            }
        }
        // The value(s) to set.
        const inits = [];
        for (const init of statement.init)
            inits.push(expressionToString(init));
        return `${i}${vars.join(', ')} = ${inits.join(', ')}`;
    }
    exports.assignmentStatementToString = assignmentStatementToString;
    function callStatementToString(statement, options) {
        switch (statement.expression.type) {
            case 'CallExpression': return callExpressionToString(statement.expression, options);
            case 'StringCallExpression': return stringCallExpressionToString(statement.expression, options);
            case 'TableCallExpression': return tableCallExpressionToString(statement.expression, options);
        }
    }
    exports.callStatementToString = callStatementToString;
    function expressionToString(arg, options = { indent: 0 }) {
        switch (arg.type) {
            case 'BooleanLiteral': return literalToString(arg, options);
            case 'NumericLiteral': return literalToString(arg, options);
            case 'NilLiteral': return literalToString(arg, options);
            case 'StringLiteral': return literalToString(arg, options);
            case 'VarargLiteral': return literalToString(arg, options);
            case 'Identifier': return identifierToString(arg, options);
            case 'BinaryExpression': return binaryExpressionToString(arg, options);
            case 'CallExpression': return callExpressionToString(arg, options);
            case 'MemberExpression': return memberExpressionToString(arg);
            case 'FunctionDeclaration': return functionDeclarationToString(arg, options);
            case 'IndexExpression': return indexExpressionToString(arg);
            case 'TableConstructorExpression': return tableConstructorExpressionToString(arg);
            case 'LogicalExpression': return logicalExpressionToString(arg);
            case 'UnaryExpression': return unaryExpressionToString(arg);
            case 'StringCallExpression': return stringCallExpressionToString(arg);
            case 'TableCallExpression': return tableCallExpressionToString(arg);
        }
    }
    exports.expressionToString = expressionToString;
    function statementToString(statement, options) {
        switch (statement.type) {
            case 'LocalStatement': return localStatementToString(statement, options);
            case 'CallStatement': return callStatementToString(statement, options);
            case 'AssignmentStatement': return assignmentStatementToString(statement, options);
            case 'ReturnStatement': return returnStatementToString(statement, options);
            case 'IfStatement': return ifStatementToString(statement, options);
            case 'ForNumericStatement': return forNumericStatementToString(statement, options);
            case 'ForGenericStatement': return forGenericStatementToString(statement, options);
            case 'BreakStatement': return breakStatementToString(statement, options);
            case 'WhileStatement': return whileStatementToString(statement, options);
            case 'RepeatStatement': return repeatStatementToString(statement, options);
            case 'DoStatement': return doStatementToString(statement, options);
            case 'FunctionDeclaration': return functionDeclarationToString(statement, options);
            case 'LabelStatement': return labelStatementToString(statement, options);
            case 'GotoStatement': return gotoStatementToString(statement, options);
        }
    }
    exports.statementToString = statementToString;
    function chunkToString(chunk, options = { indent: 0 }) {
        let s = '';
        console.log({ chunk });
        for (let index = 0; index < chunk.body.length; index++) {
            const currStatement = chunk.body[index + 0];
            const nextStatement = chunk.body[index + 1];
            switch (currStatement.type) {
                case 'FunctionDeclaration': {
                    s += `\n${statementToString(currStatement, options)}\n`;
                    break;
                }
                case 'AssignmentStatement': {
                    s += `${assignmentStatementToString(currStatement, options)};\n`;
                    break;
                }
                case 'LabelStatement':
                case 'BreakStatement':
                case 'GotoStatement':
                case 'ReturnStatement':
                case 'IfStatement':
                case 'WhileStatement':
                case 'DoStatement':
                case 'RepeatStatement':
                case 'LocalStatement':
                case 'CallStatement': {
                    const callStatement = currStatement;
                    s += `${callStatementToString(callStatement, options)};\n`;
                    // Clean seperation from `require` lines.
                    if ((nextStatement === null || nextStatement === void 0 ? void 0 : nextStatement.type) !== 'CallStatement') {
                        s += '\n';
                    }
                    break;
                }
                case 'ForNumericStatement':
                case 'ForGenericStatement':
                    s += `${statementToString(currStatement, options)}\n`;
                    break;
            }
        }
        return s;
    }
    exports.chunkToString = chunkToString;
});
define("src/asledgehammer/rosetta/lua/wizard/LuaWizard", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.knownMethodTypes = void 0;
    exports.knownMethodTypes = {
        'math.min': ['number'],
        'math.max': ['number'],
        'math.floor': ['number'],
        'math.ceil': ['number'],
        'math.round': ['number'],
        /* PZ Java API */
        'getCore():getScreenWidth()': ['number'],
        'getCore():getScreenHeight()': ['number'],
    };
    ;
    ;
    ;
    ;
});
define("src/asledgehammer/rosetta/lua/wizard/Scope", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/String"], function (require, exports, String_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scope = void 0;
    /**
     * **Scope** is a class that stores scope-based information about Lua elements and their relationshop to other elements.
     * Data is used in this class to determine stronger types to assign to fields, returns, parameters, among other elements.
     *
     * @author asledgehammer
     */
    class Scope {
        /////////////////////////////
        /**
         * @param element The element container.
         * @param parent The parent scope. (Set to null if root. E.G: __G is global root)
         * @param index For statements with multiple variables, this index helps target the right one.
         */
        constructor(element = undefined, parent = undefined, index = 0, name = undefined) {
            /** Any child scopes. This is helpful with {@link Scope.resolve resolving scopes}. */
            this.children = {};
            /** All discovered scopes that directly call or assign this scope. */
            this.references = [];
            this.types = [];
            /** For statements with multiple variables, this index helps with the initialization of Scopes. */
            this.index = 0;
            /** Generated or identified when constructing Scopes. */
            this.name = '';
            /////////////////////////////
            // These are for children. //
            /////////////////////////////
            this._nextMemberExpressionID = 0;
            this._nextBreakID = 0;
            this._nextGotoID = 0;
            this._nextReturnID = 0;
            this._nextIfID = 0;
            this._nextIfClauseID = 0;
            this._nextElseIfClauseID = 0;
            this._nextElseClauseID = 0;
            this._nextForNumericID = 0;
            this._nextForGenericID = 0;
            this._nextWhileID = 0;
            this._nextDoID = 0;
            this._nextRepeatID = 0;
            this._nextAnonFuncID = 0;
            this._nextCallID = 0;
            this.element = element;
            this.parent = parent;
            if (name) {
                this.name = name;
            }
            else {
                this.name = this.generateName();
            }
            this.path = `${parent ? `${parent.path}.` : ''}${this.name}`;
            if (this.path === '__G.addChild') {
                // throw new Error();
            }
            this.index = index;
            // Assign the parent this new child.
            if (parent) {
                parent.addChild(this);
                this.addToRootMap(this);
            }
            // Forward any types.
            if (element && element.types) {
                for (const type of element.types) {
                    this.types.push(type);
                }
            }
            this.map = {};
        }
        addChild(child) {
            // Add child to parent Scope.
            this.children[child.name] = child;
        }
        addToRootMap(child) {
            // Add child to root Scope's map.
            let currScope = this;
            while (currScope.parent !== undefined) {
                currScope = currScope.parent;
            }
            currScope.map[child.path] = child;
        }
        /**
         * Resolves a scope from the top-level Scope.
         *
         * @param path The absolute path to resolve.
         * @returns
         */
        resolveAbsolute(path) {
            // Replace the signifier for top-level Lua scope lookup.
            if (path.indexOf('__G.'))
                path = path.replace('__G.', '');
            // Get to the root Scope.
            let currScope = this;
            while (currScope.parent)
                currScope = currScope.parent;
            // Look inward like a relative Scope.
            return currScope.resolveInto(path);
        }
        resolve(path) {
            if (!path.length)
                return undefined;
            const { parent } = this;
            // If __G is the start of the path, immediately go to the top and search down.
            // This is an absolute path, not a relative path.
            if (path.startsWith('__G.')) {
                path = path.replace('__G.', '');
                return this.resolveAbsolute(path);
            }
            // Check into the scope first. If something resolves, we're in the most immediate scope that contains the reference which is consistent with the
            // Lua language in scope-discovery when accessing a referenced variable in the most immediate scope.
            let child = this.resolveInto(path);
            if (child)
                return child;
            // Try to resolve in the next outer-scope. If one doesn't exist, the path does not resolve.
            return parent === null || parent === void 0 ? void 0 : parent.resolve(path);
        }
        /**
         * Search into the scope, going out-to-in.
         *
         * @param path The path to traverse.
         *
         * @returns Scope if found. undefined if not.
         */
        resolveInto(path) {
            if (!path.length)
                return undefined;
            const { children } = this;
            let pathSub = '';
            let firstScope;
            // The path is made of multiple scopes.
            if (path.indexOf('.') !== -1) {
                // We grab the first node here and produce the sub-path following that node.
                let split = path.split('.');
                split = split.reverse();
                firstScope = split.pop();
                pathSub = split.reverse().join();
            }
            else {
                // We have one scope. The path is the scope.
                return children[path];
            }
            const child = children[firstScope];
            // The child doesn't exist.
            if (!child)
                return undefined;
            // We still have scope to traverse. Go to the child and then repeat the process until traversed.
            if (pathSub.length)
                return child.resolveInto(pathSub);
            // We've reached the last scope in the path and located the child. 
            return child;
        }
        generateName() {
            const { element: e, parent } = this;
            if (!e)
                return '__G';
            if (!parent)
                throw new Error('A parent is required!');
            switch (e.type) {
                case 'ScopeVariable': {
                    switch (e.init.type) {
                        case 'LocalStatement': {
                            return e.init.variables[this.index].name;
                        }
                        case 'AssignmentStatement': {
                            const variable = e.init.variables[this.index];
                            switch (variable.type) {
                                case 'Identifier': {
                                    return variable.name;
                                }
                                case 'IndexExpression': {
                                    return (0, String_1.indexExpressionToString)(variable);
                                }
                                case 'MemberExpression': {
                                    const baseName = (0, String_1.expressionToString)(variable.base);
                                    if (this.parent) {
                                        if (this.parent.element) {
                                            switch (this.parent.element.type) {
                                                case 'ScopeFunction': {
                                                    if (this.parent.element.selfAlias === baseName) {
                                                        return `${this.parent.parent.name}.${variable.identifier.name}`;
                                                    }
                                                    break;
                                                }
                                                case 'ScopeConstructor': {
                                                    if (this.parent.element.selfAlias === baseName) {
                                                        return `${this.parent.parent.name}.${variable.identifier.name}`;
                                                    }
                                                    break;
                                                }
                                                default: {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    return `${baseName}${variable.indexer}${variable.identifier.name}`;
                                }
                            }
                        }
                        default: {
                            console.warn(e);
                            throw new Error(`Unsupported statement for ScopeVariable name: ${e.init.type} `);
                        }
                    }
                }
                case 'ScopeFunction': {
                    // Named functions / methods.
                    if (e.init.identifier) {
                        switch (e.init.identifier.type) {
                            case 'Identifier':
                                return e.init.identifier.name;
                            case 'MemberExpression':
                                return e.init.identifier.identifier.name;
                        }
                    }
                    // Anonymous functions.
                    return parent === null || parent === void 0 ? void 0 : parent.nextAnonymousFunctionID();
                }
                case 'ScopeForGenericBlock': return parent.nextForGenericID();
                case 'ScopeForNumericBlock': return parent.nextForNumericID();
                case 'ScopeDoBlock': return parent.nextDoID();
                case 'ScopeWhileBlock': return parent.nextWhileID();
                case 'ScopeRepeatBlock': return parent.nextRepeatID();
                case 'ScopeIfBlock': return parent.nextIfID();
                case 'ScopeIfClauseBlock': return parent.nextIfClauseID();
                case 'ScopeTable': return e.name;
                case 'ScopeClass': return e.name;
                case 'ScopeConstructor': return 'new';
            }
        }
        getStatementName(statement) {
            const { parent } = this;
            if (!parent)
                throw new Error('A parent is required!');
            switch (statement.type) {
                case 'LabelStatement': return statement.label.name;
                case 'BreakStatement': return parent.nextBreakID();
                case 'GotoStatement': return parent.nextGotoID();
                case 'ReturnStatement': return parent.nextReturnID();
                case 'IfStatement': return parent.nextIfID();
                case 'WhileStatement': return parent.nextWhileID();
                case 'DoStatement': return parent.nextDoID();
                case 'RepeatStatement': return parent.nextRepeatID();
                case 'LocalStatement': return statement.variables[this.index].name;
                case 'AssignmentStatement': return this.getExpressionName(statement.variables[this.index]);
                case 'CallStatement': return parent.nextCallID();
                case 'FunctionDeclaration': return parent.nextAnonymousFunctionID();
                case 'ForNumericStatement': return parent.nextForNumericID();
                case 'ForGenericStatement': return parent.nextForGenericID();
            }
        }
        getExpressionName(expression) {
            if (expression.type === 'Identifier')
                return expression.name;
            switch (expression.type) {
                case 'IndexExpression': return this.getExpressionName(expression.base);
                case 'MemberExpression': return `${this.getExpressionName(expression.base)}${expression.indexer}${expression.identifier.name} `;
                default: {
                    console.log(expression);
                    throw new Error(`Unimplemented expression in 'Scope.getExpressionName(${expression.type}). (scope path: '${this.path} ') Check the line above for more info on the expression.`);
                }
            }
        }
        resetIDs() {
            this._nextMemberExpressionID = 0;
            this._nextCallID = 0;
            this._nextBreakID = 0;
            this._nextGotoID = 0;
            this._nextReturnID = 0;
            this._nextIfID = 0;
            this._nextIfClauseID = 0;
            this._nextElseIfClauseID = 0;
            this._nextElseClauseID = 0;
            this._nextForNumericID = 0;
            this._nextForGenericID = 0;
            this._nextWhileID = 0;
            this._nextDoID = 0;
            this._nextRepeatID = 0;
            this._nextAnonFuncID = 0;
        }
        addType(...types) {
            let changes = 0;
            for (const type of types) {
                if (!this.hasType(type)) {
                    this.types.push(type);
                    changes++;
                }
            }
            return changes;
        }
        sortTypes() {
            this.types.sort((a, b) => a.localeCompare(b));
        }
        hasType(type) {
            return this.types.indexOf(type) !== -1;
        }
        /** NOTE: Must be called from sub-scope! */
        nextMemberExpressionID() {
            return `___member_expression___${this._nextMemberExpressionID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextBreakID() {
            return `___break___${this._nextBreakID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextGotoID() {
            return `___goto___${this._nextGotoID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextReturnID() {
            return `___return___${this._nextReturnID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextIfID() {
            return `___if___${this._nextIfID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextIfClauseID() {
            return `___clause_if___${this._nextIfClauseID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextElseIfClauseID() {
            return `___clause_elseif___${this._nextElseIfClauseID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextElseClauseID() {
            return `___clause_else___${this._nextElseClauseID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextForNumericID() {
            return `___for_numeric___${this._nextForNumericID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextForGenericID() {
            return `___for_generic___${this._nextForGenericID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextWhileID() {
            return `___while___${this._nextWhileID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextDoID() {
            return `___do___${this._nextDoID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextRepeatID() {
            return `___repeat___${this._nextRepeatID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextAnonymousFunctionID() {
            return `___anonymous_function___${this._nextAnonFuncID++}`;
        }
        /** NOTE: Must be called from sub-scope! */
        nextCallID() {
            return `___call___${this._nextCallID++}`;
        }
    }
    exports.Scope = Scope;
});
define("src/asledgehammer/rosetta/lua/wizard/PZ", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/String", "src/asledgehammer/rosetta/lua/wizard/Scope"], function (require, exports, String_2, Scope_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scanFile = exports.getPZClasses = exports.getPZProperty = exports.getPZExecutable = exports.getPZClass = void 0;
    /**
     * @param statement The statement to process.
     *
     * @returns
     */
    function getPZClass(global, statement) {
        // Check for ISBaseObject (or subclass), and derive call signature.
        const init0 = statement.init[0];
        if (init0.type !== 'CallExpression')
            return undefined;
        // Check the assignment for a "SuperClass:derive('PurClassName')"...
        if (init0.base.type !== 'MemberExpression')
            return undefined;
        if (init0.base.indexer !== ':')
            return undefined;
        if (init0.base.base.type !== 'Identifier')
            return undefined;
        if (init0.base.identifier.type !== 'Identifier')
            return undefined;
        if (init0.base.identifier.name !== 'derive')
            return undefined;
        // Check for class name here.
        const vars0 = statement.variables[0];
        if (vars0.type !== 'Identifier')
            return undefined;
        const scopeClass = {
            type: 'ScopeClass',
            name: vars0.name,
            values: {},
            fields: {},
            funcs: {},
            methods: {},
            references: {},
            assignments: {}
        };
        const scope = new Scope_1.Scope(scopeClass, global);
        return {
            name: vars0.name,
            extendz: init0.base.base.name,
            fields: {},
            values: {},
            methods: {},
            funcs: {},
            conztructor: undefined,
            scope
        };
    }
    exports.getPZClass = getPZClass;
    /**
     * @param clazz The name of the class.
     * @param statement The statement to process.
     *
     * @returns
     */
    function getPZExecutable(global, clazz, statement) {
        // Check if assigned as a member declaration.
        if (statement.identifier == null)
            return undefined;
        if (statement.identifier.type !== 'MemberExpression')
            return undefined;
        // Verify that the base assignment table is the class.
        if (statement.identifier.base.type !== 'Identifier')
            return undefined;
        if (statement.identifier.base.name !== clazz)
            return undefined;
        // Grab the function / method name.
        if (statement.identifier.identifier.type !== 'Identifier')
            return undefined;
        const name = statement.identifier.identifier.name;
        let selfAlias = 'self';
        // Get type.
        let type = 'function';
        if (name === 'new') {
            type = 'constructor';
            // Grab the alias used to return in the constructor.
            selfAlias = '';
            for (let index = statement.body.length - 1; index >= 0; index--) {
                const next = statement.body[index];
                if (next.type !== 'ReturnStatement')
                    continue;
                // Sanity check for bad Lua code.
                if (!next.arguments.length) {
                    throw new Error(`class Constructor ${clazz}:new() has invalid return!`);
                }
                // Assign the constructor-alias for 'self'.
                const arg0 = next.arguments[0];
                selfAlias = (0, String_2.expressionToString)(arg0);
                break;
            }
            // Sanity check for bad Lua code.
            if (!selfAlias.length) {
                throw new Error(`Class constructor ${clazz}:new() has no alias for 'self'.`);
            }
        }
        else if (statement.identifier.indexer === ':') {
            type = 'method';
        }
        // Build params.
        const params = [];
        for (const param of statement.parameters) {
            switch (param.type) {
                case 'Identifier': {
                    params.push((0, String_2.identifierToString)(param));
                    break;
                }
                case 'VarargLiteral': {
                    params.push((0, String_2.varargLiteralToString)(param));
                    break;
                }
            }
        }
        const returns = {
            type: 'ScopeReturn',
            types: []
        };
        let scopeFunc;
        if (type === 'constructor') {
            scopeFunc = {
                type: 'ScopeConstructor',
                init: statement,
                params: [],
                values: {},
                selfAlias,
                references: {},
                assignments: {},
            };
        }
        else {
            scopeFunc = {
                type: 'ScopeFunction',
                init: statement,
                name,
                params: [],
                values: {},
                selfAlias,
                returns,
                references: {},
                assignments: {},
            };
        }
        const scope = new Scope_1.Scope(scopeFunc, global);
        // Return result information.
        return { clazz, type, name, params, selfAlias, scope };
    }
    exports.getPZExecutable = getPZExecutable;
    /**
     * @param clazz The name of the class.
     * @param statement The statement to process.
     * @param selfAlias The alias used for field-declarations inside of executables within a instanced class context. (Default: 'self')
     */
    function getPZProperty(scopeParent, clazz, statement, selfAlias = 'self') {
        var _a;
        // Sanity-check
        if (!statement.variables.length) {
            return undefined;
        }
        const var0 = statement.variables[0];
        const init0 = statement.init[0];
        // Make sure the assignment is towards a member. (The class)
        if (var0.type !== 'MemberExpression') {
            return undefined;
        }
        if (var0.base.type !== 'Identifier') {
            return undefined;
        }
        // Sanity-check
        if (!statement.init.length) {
            console.warn('no init length.');
            console.warn(statement);
            return undefined;
        }
        // Check what type of property it is.
        let type = 'value';
        if (var0.base.name === clazz) {
            type = 'value';
        }
        else if (var0.base.name === selfAlias) {
            type = 'field';
        }
        else {
            // This belongs to something else.
            return undefined;
        }
        // The name of the property.
        const name = var0.identifier.name;
        // If the assignment is a literal expression then we know what the initial type is. Grab it.
        // We then conveniently know the default value of the property. Grab that too..
        let types = [];
        let defaultValue = undefined;
        switch (init0.type) {
            case 'NumericLiteral': {
                types.push('number');
                defaultValue = init0.raw;
                break;
            }
            case 'BooleanLiteral': {
                types.push('boolean');
                defaultValue = init0.raw;
                break;
            }
            case 'StringLiteral': {
                types.push('string');
                defaultValue = init0.value;
                break;
            }
            case 'NilLiteral': {
                types.push('nil');
                defaultValue = 'nil';
                break;
            }
            case 'VarargLiteral': {
                // TODO - Figure this out once we run into this case.
                console.log('#################');
                console.log('THIS IS A VARARG.');
                console.log(init0);
                console.log('#################');
                defaultValue = init0.value;
                break;
            }
            case 'TableConstructorExpression': {
                // TODO - Figure out how to assign table-like key-values as type-assigned.
                types.push('table');
                break;
            }
            case 'MemberExpression': {
                console.warn(init0);
                break;
            }
            default: {
                // console.log('unhandled type / default value handle: ');
                // console.log({ statement, init: init0 });
                break;
            }
        }
        const property = {
            type: 'ScopeVariable',
            name,
            types: [],
            init: statement,
            references: {},
            assignments: {},
            index: 0,
        };
        // Find out if this is a class variable via selfAlias reference.
        const base0 = var0.base;
        const baseName = base0.name;
        let scopeToAssign = scopeParent;
        if (selfAlias === baseName) {
            // In some situations, the parent is the class so we don't need to hop-skip and jump to get it.
            if (((_a = scopeParent.element) === null || _a === void 0 ? void 0 : _a.type) !== 'ScopeClass') {
                const scopeFound = scopeParent.parent;
                if (!scopeFound) {
                    console.warn(`Couldn't resolve scope: ${baseName} (scope: ${scopeParent.path})`);
                }
                scopeToAssign = scopeFound;
            }
        }
        const scope = new Scope_1.Scope(property, scopeToAssign, 0, name);
        // console.log(`property ${name}: `, scope);
        return { clazz, name, type, types, defaultValue, scope };
    }
    exports.getPZProperty = getPZProperty;
    function getPZClasses(globalInfo, statements) {
        const classes = {};
        // Find classes.
        for (const statement of statements) {
            if (statement.type !== 'AssignmentStatement')
                continue;
            const clazzInfo = getPZClass(globalInfo.scope, statement);
            if (clazzInfo)
                classes[clazzInfo.name] = globalInfo.classes[clazzInfo.name] = clazzInfo;
        }
        // Go through all classes, even outside of the file because other Lua files can define class functions.
        //
        //     FIXME: This can cause weird situations if the `require '<file>'` isn't followed. We could find issues of load-order.
        //            Look here if this is an issue later on.
        //
        for (const clazzName of Object.keys(globalInfo.classes)) {
            const clazz = globalInfo.classes[clazzName];
            const clazzScope = clazz.scope;
            function processExecutable(funcDec, executable) {
                for (const statement of funcDec.body) {
                    if (statement.type !== 'AssignmentStatement')
                        continue;
                    const propertyInfo = getPZProperty(clazzScope, clazz.name, statement, executable.selfAlias);
                    if (propertyInfo && propertyInfo.type === 'field') {
                        // Only add the result propertyInfo if not found already.
                        if (clazz.fields[propertyInfo.name]) {
                            const other = clazz.fields[propertyInfo.name];
                            // Apply back the old scope and object.
                            clazzScope.children[other.scope.name] = other.scope;
                            // Merge any unassigned types.
                            if (propertyInfo.types.length) {
                                for (const type of propertyInfo.types) {
                                    if (other.types.indexOf(type) === -1)
                                        other.types.push(type);
                                }
                            }
                            continue;
                        }
                        // Add the discovery.
                        clazz.fields[propertyInfo.name] = propertyInfo;
                    }
                }
            }
            for (const statement of statements) {
                // Look for class value(s) defined above class-level bodies here..
                if (statement.type === 'AssignmentStatement') {
                    const propertyInfo = getPZProperty(clazzScope, clazzName, statement, clazzName);
                    if (propertyInfo) {
                        if (propertyInfo.type === 'value') {
                            clazz.values[propertyInfo.name] = propertyInfo;
                        }
                    }
                }
                // Go through all functions in the chunk. These can either be: 
                //    - Class Constructors
                //    - Class Functions
                //    - Class Methods
                else if (statement.type === 'FunctionDeclaration') {
                    // The potential Class Executable.
                    const executableInfo = getPZExecutable(clazzScope, clazzName, statement);
                    if (executableInfo) {
                        if (executableInfo.type === 'constructor') {
                            if (clazz.conztructor) {
                                console.warn(`Class ${clazzName} already has a constructor. Overriding with bottom-most definition..`);
                            }
                            clazz.conztructor = executableInfo;
                        }
                        else if (executableInfo.type === 'function') {
                            if (clazz.funcs[executableInfo.name]) {
                                console.warn(`Class ${clazzName} already has the function ${executableInfo.name}. Overriding with bottom-most definition..`);
                            }
                            clazz.funcs[executableInfo.name] = executableInfo;
                        }
                        else if (executableInfo.type === 'method') {
                            if (clazz.methods[executableInfo.name]) {
                                console.warn(`Class ${clazzName} already has the method ${executableInfo.name}. Overriding with bottom-most definition..`);
                            }
                            clazz.methods[executableInfo.name] = executableInfo;
                        }
                        // Discover field(s) here.
                        processExecutable(statement, executableInfo);
                    }
                }
            }
        }
        return classes;
    }
    exports.getPZClasses = getPZClasses;
    function scanFile(global, statements) {
        getPZClasses(global, statements);
    }
    exports.scanFile = scanFile;
});
define("src/asledgehammer/rosetta/lua/wizard/Discover", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/Scope", "src/asledgehammer/rosetta/lua/wizard/LuaWizard", "src/asledgehammer/rosetta/lua/wizard/String"], function (require, exports, Scope_2, LuaWizard_1, String_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.discoverFile = exports.discoverStatement = exports.discoverForGenericStatement = exports.discoverForNumericStatement = exports.discoverCallStatement = exports.discoverAssignmentStatement = exports.discoverLocalStatement = exports.discoverRepeatStatement = exports.discoverDoStatement = exports.discoverWhileStatement = exports.discoverIfStatement = exports.discoverReturnStatement = exports.discoverGotoStatement = exports.discoverBreakStatement = exports.discoverLabelStatement = exports.discoverFunctionDeclaration = exports.discoverExpression = exports.discoverStringCallExpression = exports.discoverTableCallExpression = exports.discoverCallExpression = exports.discoverIndexExpression = exports.discoverMemberExpression = exports.discoverUnaryExpression = exports.discoverLogicalExpression = exports.discoverBinaryExpression = exports.discoverTableConstructorExpression = exports.discoverVarargLiteral = void 0;
    function discoverVarargLiteral(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverVarargLiteral = discoverVarargLiteral;
    function discoverTableConstructorExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverTableConstructorExpression = discoverTableConstructorExpression;
    function discoverBinaryExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverBinaryExpression = discoverBinaryExpression;
    function discoverLogicalExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverLogicalExpression = discoverLogicalExpression;
    function discoverUnaryExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverUnaryExpression = discoverUnaryExpression;
    function discoverMemberExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverMemberExpression = discoverMemberExpression;
    function discoverIndexExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverIndexExpression = discoverIndexExpression;
    function discoverCallExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverCallExpression = discoverCallExpression;
    function discoverTableCallExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverTableCallExpression = discoverTableCallExpression;
    /**
     * TODO: Implement Lua Modules references.
     *
     *       E.G:
     *            ```lua
     *            --- \@type MyModule
     *            local my_module = require '../my_module.lua';
     *            ```
     */
    function discoverStringCallExpression(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        let changes = 0;
        return changes;
    }
    exports.discoverStringCallExpression = discoverStringCallExpression;
    function discoverExpression(globalInfo, expression, scope) {
        switch (expression.type) {
            case 'Identifier': return 0;
            case 'StringLiteral': return scope.addType('string');
            case 'NumericLiteral': return scope.addType('number');
            case 'BooleanLiteral': return scope.addType('boolean');
            case 'NilLiteral': return scope.addType('nil');
            case 'FunctionDeclaration': return discoverFunctionDeclaration(globalInfo, expression, scope);
            case 'VarargLiteral': return discoverVarargLiteral(globalInfo, expression, scope);
            case 'TableConstructorExpression': return discoverTableConstructorExpression(globalInfo, expression, scope);
            case 'BinaryExpression': return discoverBinaryExpression(globalInfo, expression, scope);
            case 'LogicalExpression': return discoverLogicalExpression(globalInfo, expression, scope);
            case 'UnaryExpression': return discoverUnaryExpression(globalInfo, expression, scope);
            case 'MemberExpression': return discoverMemberExpression(globalInfo, expression, scope);
            case 'IndexExpression': return discoverIndexExpression(globalInfo, expression, scope);
            case 'CallExpression': return discoverCallExpression(globalInfo, expression, scope);
            case 'TableCallExpression': return discoverTableCallExpression(globalInfo, expression, scope);
            case 'StringCallExpression': return discoverStringCallExpression(globalInfo, expression, scope);
        }
    }
    exports.discoverExpression = discoverExpression;
    function discoverFunctionDeclaration(globalInfo, expression, scope) {
        // console.log(`func-dec: `, expression);
        const { scope: __G } = globalInfo;
        const changes = 0;
        let scopeToAssign = scope;
        let name = '';
        let scopeFunc;
        if (expression.identifier) {
            switch (expression.identifier.type) {
                case 'Identifier': {
                    name = expression.identifier.name;
                    scopeToAssign = scope;
                    break;
                }
                case 'MemberExpression': {
                    name = (0, String_3.memberExpressionToString)(expression.identifier);
                    while (name.indexOf(':') !== -1)
                        name = name.replace(':', '.');
                    // We need to locate the actual scope of the member reference here.
                    let scope2 = scope.resolve(name);
                    if (!scope2) {
                        scope2 = scope.resolveAbsolute(name);
                    }
                    if (scope2) {
                        scopeToAssign = scope2;
                    }
                    else {
                        console.warn(`couldn't resolve scope: ${name} (Parent scope: ${scope.path})`);
                    }
                    break;
                }
            }
        }
        else {
            console.warn(scope, expression);
            throw new Error('A function declaration here wouldn\'t make sense.');
        }
        scopeFunc = scope.resolve(name);
        if (!scopeFunc)
            scopeFunc = scope.resolveAbsolute(name);
        if (!scopeFunc) {
            const params = [];
            for (const param of expression.parameters) {
                switch (param.type) {
                    case 'Identifier': {
                        params.push({
                            type: 'ScopeVariable',
                            name: param.name,
                            types: [],
                            init: param,
                            index: 0,
                            references: {},
                            assignments: {},
                        });
                        break;
                    }
                    case 'VarargLiteral': {
                        params.push({
                            type: 'ScopeVariable',
                            name: param.raw,
                            types: [],
                            init: param,
                            index: 0,
                            references: {},
                            assignments: {},
                        });
                        break;
                    }
                }
            }
            name = name.indexOf('.') !== -1 ? name.split('.').pop() : name;
            console.log('name: ' + name);
            let selfAlias = 'self';
            let type = 'function';
            if (name === 'new') {
                type = 'constructor';
                selfAlias = '';
            }
            let func;
            if (type === 'constructor') {
                func = {
                    type: 'ScopeConstructor',
                    init: expression,
                    params: [],
                    values: {},
                    selfAlias,
                    references: {},
                    assignments: {},
                };
            }
            else {
                const returns = {
                    type: 'ScopeReturn',
                    types: []
                };
                func = {
                    type: 'ScopeFunction',
                    init: expression,
                    name,
                    params: [],
                    values: {},
                    selfAlias,
                    returns,
                    references: {},
                    assignments: {},
                };
            }
            scopeFunc = new Scope_2.Scope(func, scopeToAssign);
        }
        if (name === 'new') {
            console.log('new: ', scopeFunc);
        }
        // Handle body statements.
        for (const statement of expression.body) {
            discoverStatement(globalInfo, statement, scopeFunc);
        }
        // Handle return statements.
        return changes;
    }
    exports.discoverFunctionDeclaration = discoverFunctionDeclaration;
    function discoverLabelStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverLabelStatement = discoverLabelStatement;
    function discoverBreakStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverBreakStatement = discoverBreakStatement;
    function discoverGotoStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverGotoStatement = discoverGotoStatement;
    function discoverReturnStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverReturnStatement = discoverReturnStatement;
    function discoverIfStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverIfStatement = discoverIfStatement;
    function discoverWhileStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverWhileStatement = discoverWhileStatement;
    function discoverDoStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverDoStatement = discoverDoStatement;
    function discoverRepeatStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverRepeatStatement = discoverRepeatStatement;
    function discoverLocalStatement(globalInfo, statement, scope) {
        //console.log(`local: `, statement);
        const { scope: __G } = globalInfo;
        let changes = 0;
        // (Support for tuples)
        for (let index = 0; index < statement.variables.length; index++) {
            const name = statement.variables[index].name;
            // We already defined this local.
            if (scope.children[name]) {
                // console.warn(`Local statement already exists: ${scope.children[name].path}`);
                continue;
            }
            const types = [];
            const init = statement.init[index];
            const variable = {
                type: 'ScopeVariable',
                name,
                types,
                init: statement,
                index,
                references: {},
                assignments: {},
            };
            switch (init.type) {
                // Not a thing.
                case 'Identifier': break;
                case 'FunctionDeclaration':
                    // TODO - Implement.
                    variable.types.push('fun');
                    break;
                case 'StringLiteral': {
                    variable.types.push('string');
                    variable.defaultValue = `${init.value}`;
                    break;
                }
                case 'NumericLiteral': {
                    variable.types.push('number');
                    variable.defaultValue = `${init.value}`;
                    break;
                }
                case 'BooleanLiteral': {
                    variable.types.push('boolean');
                    variable.defaultValue = `${init.value}`;
                    break;
                }
                case 'NilLiteral': {
                    variable.types.push('nil');
                    variable.defaultValue = 'nil';
                    break;
                }
                case 'VarargLiteral': {
                    // TODO - Implement.
                    variable.types.push(`<${init.value}>`);
                    break;
                }
                case 'TableConstructorExpression':
                    // TODO - Implement.
                    variable.types.push('table');
                    // let s: string[] = [];
                    // for (const field of init.fields) {
                    //     switch (field.type) {
                    //         case 'TableKey': {
                    //             s.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                    //             break;
                    //         }
                    //         case 'TableKeyString': {
                    //             s.push(`${expressionToString(field.key)} = ${expressionToString(field.value)}`);
                    //             break;
                    //         }
                    //         case 'TableValue': {
                    //             s.push(expressionToString(field.value));
                    //             break;
                    //         }
                    //     }
                    // }
                    // if(s.length) {
                    // } else {
                    // }
                    break;
                case 'BinaryExpression': {
                    types.push('number');
                    break;
                }
                case 'LogicalExpression': {
                    types.push('boolean');
                    break;
                }
                case 'UnaryExpression': {
                    switch (init.operator) {
                        case '~':
                        case 'not': {
                            types.push('boolean');
                            break;
                        }
                        case '-':
                        case '#': {
                            types.push('number');
                            break;
                        }
                    }
                }
                case 'MemberExpression': {
                    // TODO - Build reference link.
                    break;
                }
                case 'IndexExpression': {
                    // TODO - Build reference link.
                    break;
                }
                case 'CallExpression': {
                    // TODO - Build reference link.
                    break;
                }
                case 'TableCallExpression': {
                    // TODO - Build reference link.
                    break;
                }
                case 'StringCallExpression': {
                    // TODO - Build reference link.
                    break;
                }
            }
            // Lastly check for known API for types.
            if (!types.length) {
                const str = (0, String_3.expressionToString)(init);
                console.log(str);
                const kTypes = LuaWizard_1.knownMethodTypes[(0, String_3.expressionToString)(init)];
                console.log(kTypes);
                if (kTypes) {
                    for (const kType of kTypes) {
                        if (types.indexOf(kType) === -1)
                            types.push(kType);
                    }
                }
            }
            // (Self-assigning)
            const lScope = new Scope_2.Scope(variable, scope);
            console.log(scope);
            changes++;
        }
        return changes;
    }
    exports.discoverLocalStatement = discoverLocalStatement;
    function discoverAssignmentStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverAssignmentStatement = discoverAssignmentStatement;
    function discoverCallStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverCallStatement = discoverCallStatement;
    function discoverForNumericStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverForNumericStatement = discoverForNumericStatement;
    function discoverForGenericStatement(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        return changes;
    }
    exports.discoverForGenericStatement = discoverForGenericStatement;
    function discoverStatement(globalInfo, statement, scope) {
        switch (statement.type) {
            case 'FunctionDeclaration': return discoverFunctionDeclaration(globalInfo, statement, scope);
            case 'LabelStatement': return discoverLabelStatement(globalInfo, statement, scope);
            case 'BreakStatement': return discoverBreakStatement(globalInfo, statement, scope);
            case 'GotoStatement': return discoverGotoStatement(globalInfo, statement, scope);
            case 'ReturnStatement': return discoverReturnStatement(globalInfo, statement, scope);
            case 'IfStatement': return discoverIfStatement(globalInfo, statement, scope);
            case 'WhileStatement': return discoverWhileStatement(globalInfo, statement, scope);
            case 'DoStatement': return discoverDoStatement(globalInfo, statement, scope);
            case 'RepeatStatement': return discoverRepeatStatement(globalInfo, statement, scope);
            case 'LocalStatement': return discoverLocalStatement(globalInfo, statement, scope);
            case 'AssignmentStatement': return discoverAssignmentStatement(globalInfo, statement, scope);
            case 'CallStatement': return discoverCallStatement(globalInfo, statement, scope);
            case 'ForNumericStatement': return discoverForNumericStatement(globalInfo, statement, scope);
            case 'ForGenericStatement': return discoverForGenericStatement(globalInfo, statement, scope);
        }
    }
    exports.discoverStatement = discoverStatement;
    function discoverFile(globalInfo, statements) {
        for (const statement of statements) {
            discoverStatement(globalInfo, statement, globalInfo.scope);
        }
    }
    exports.discoverFile = discoverFile;
});
define("src/asledgehammer/rosetta/lua/wizard/LuaParser", ["require", "exports", "luaparse", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/lua/wizard/PZ", "src/asledgehammer/rosetta/lua/wizard/Scope", "src/asledgehammer/rosetta/lua/wizard/Discover"], function (require, exports, ast, RosettaLuaClass_1, RosettaLuaConstructor_2, PZ_1, Scope_3, Discover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaParser = void 0;
    // import { discover } from './Old';
    // @ts-ignore
    const luaparse = ast.default;
    class LuaParser {
        constructor(app) {
            this.app = app;
        }
        // discover(statements: ast.Statement[], profiles: ClosureScope = {}): ClosureScope {
        //     for (const statement of statements) {
        //         switch (statement.type) {
        //             case 'AssignmentStatement': {
        //                 /* (Support tuple declarations) */
        //                 for (const variable of statement.variables) {
        //                     switch (variable.type) {
        //                         case 'Identifier': {
        //                             console.log("Please check this Identifier variable out: ");
        //                             console.log(variable);
        //                             break;
        //                         }
        //                         case 'IndexExpression': {
        //                             console.log("Please check this IndexExpression variable out: ");
        //                             console.log(variable);
        //                             break;
        //                         }
        //                         case 'MemberExpression': {
        //                             switch (variable.base.type) {
        //                                 case 'Identifier': {
        //                                     const baseName = variable.base.name;
        //                                     const identifier = variable.identifier.name;
        //                                     console.log('#####################');
        //                                     console.log(statement);
        //                                     console.log(`### ${baseName}${variable.indexer}${identifier}`);
        //                                     console.log(' ');
        //                                     break;
        //                                 }
        //                                 default: {
        //                                     console.log("Please check this variable.base out: ");
        //                                     console.log(variable);
        //                                     break;
        //                                 }
        //                             }
        //                             break;
        //                         }
        //                     }
        //                 }
        //                 console.log(statement);
        //                 break;
        //             }
        //         }
        //     }
        //     return profiles;
        // }
        getReturnTypes(clazz, statements, types = []) {
            for (const statement of statements) {
                switch (statement.type) {
                    /* (What we're looking for) */
                    case 'ReturnStatement': {
                        // console.log(statement);
                        /* (Void return calls) */
                        if (!statement.arguments.length) {
                            types.push('void');
                            break;
                        }
                        const arg0 = statement.arguments[0];
                        /* (If the return is a call to a variable or function) */
                        if (arg0.type === 'MemberExpression') {
                            break;
                        }
                        /* (Things like 'not', etc.) */
                        else if (arg0.type === 'UnaryExpression') {
                            switch (arg0.operator) {
                                case 'not':
                                    types.push('boolean');
                                    break;
                                case '-':
                                case '~':
                                case '#':
                                    types.push('number');
                                    break;
                            }
                            break;
                        }
                        break;
                    }
                    /* Nested Statements in loops and conditional code blocks */
                    case 'ForGenericStatement':
                    case 'ForNumericStatement':
                    case 'WhileStatement':
                    case 'DoStatement':
                    case 'RepeatStatement': {
                        const lTypes = this.getReturnTypes(clazz, statement.body);
                        if (lTypes.length)
                            for (const type of lTypes)
                                types.push(type);
                        break;
                    }
                    case 'IfStatement': {
                        for (const clause of statement.clauses) {
                            const lTypes = this.getReturnTypes(clazz, clause.body);
                            if (lTypes.length)
                                for (const type of lTypes)
                                    types.push(type);
                        }
                        break;
                    }
                }
            }
            return types;
        }
        parse(chunk) {
            let className = '';
            let clazz = undefined;
            let conzstructor = null;
            const handleClassDec = (statement) => {
                // console.log(statement);
                // Check for ISBaseObject (or subclass), and derive call signature.
                const init0 = statement.init[0];
                if (init0.type !== 'CallExpression')
                    return false;
                if (init0.base.type !== 'MemberExpression')
                    return false;
                if (init0.base.indexer !== ':')
                    return false;
                if (init0.base.base.type !== 'Identifier')
                    return false;
                if (init0.base.identifier.type !== 'Identifier')
                    return false;
                if (init0.base.identifier.name !== 'derive')
                    return false;
                // Check for class name here.
                const vars0 = statement.variables[0];
                if (vars0.type !== 'Identifier')
                    return false;
                className = vars0.name;
                const superClassName = init0.base.base.name;
                clazz = new RosettaLuaClass_1.RosettaLuaClass(className);
                clazz.extendz = superClassName;
                if (superClassName !== 'ISBaseObject')
                    clazz.extendz = superClassName;
                // At this point we absolutely know that this is a pz-class declaration.
                console.log(`Class found: ${className} extends ${superClassName}`);
                return true;
            };
            const handleFuncDec = (statement) => {
                // Check if assigned as a member declaration.
                if (statement.identifier == null)
                    return;
                if (statement.identifier.type !== 'MemberExpression')
                    return;
                // Check if method or function.
                let type = 'function';
                if (statement.identifier.indexer === ':')
                    type = 'method';
                // Verify that the base assignment table is the class.
                if (statement.identifier.base.type !== 'Identifier')
                    return;
                if (statement.identifier.base.name !== className)
                    return;
                // Grab the function / method name.
                if (statement.identifier.identifier.type !== 'Identifier')
                    return;
                const funcName = statement.identifier.identifier.name;
                const params = [];
                for (const param of statement.parameters) {
                    if (param.type !== 'Identifier')
                        continue;
                    params.push({ name: param.name, type: 'any' });
                }
                if (funcName === 'new') {
                    // console.log(statement);
                    conzstructor = statement;
                }
                if (funcName === 'new') {
                    clazz.conztructor = new RosettaLuaConstructor_2.RosettaLuaConstructor(clazz);
                    for (const param of params) {
                        clazz.conztructor.addParameter(param.name, param.type);
                    }
                }
                else {
                    // Make sure that any duplicates are handled properly. The last definition is the survivor.
                    let func;
                    if (type === 'function') {
                        if (clazz.functions[funcName]) {
                            console.warn(`Function already exists: ${className}.${funcName}. Overriding with lower-most definition..`);
                            delete clazz.functions[funcName];
                        }
                        func = clazz.createFunction(funcName);
                    }
                    else {
                        if (clazz.methods[funcName]) {
                            console.warn(`Method already exists: ${className}.${funcName}. Overriding with lower-most definition..`);
                            delete clazz.methods[funcName];
                        }
                        func = clazz.createMethod(funcName);
                    }
                    for (const param of params) {
                        func.addParameter(param.name, param.type);
                    }
                    // Search for all return types. If none are present, void is used as the type.
                    const types = this.getReturnTypes(clazz, statement.body);
                    if (!types.length) {
                        func.returns.type = 'void';
                    }
                    else {
                        func.returns.type = types.join(' | ');
                    }
                }
                // let paramsLog = [];
                // let { indexer } = statement.identifier;
                // for (const param of params) {
                //     paramsLog.push(`${param.name}: ${param.type}`);
                // }
                // if (funcName !== 'new') {
                //     console.log(`Found ${type}: ${className}${indexer}${funcName}(${paramsLog.join(', ')}): any;`);
                // } else {
                //     console.log(`Found constructor: ${className}:new(${paramsLog.join(', ')}): ${className};`);
                // }
            };
            const handleValueDec = (statement) => {
                if (!statement.variables.length)
                    return;
                const var0 = statement.variables[0];
                // Make sure the assignment is towards a member. (The class)
                if (var0.type !== 'MemberExpression')
                    return;
                if (var0.base.type !== 'Identifier')
                    return;
                if (var0.base.name !== className)
                    return;
                const { indexer } = var0;
                const varName = var0.identifier.name;
                const type = indexer === '.' ? 'value' : 'field';
                let varType = 'any';
                let defaultValue = undefined;
                if (!statement.init.length)
                    return;
                const init0 = statement.init[0];
                switch (init0.type) {
                    case 'NumericLiteral': {
                        varType = 'number';
                        defaultValue = init0.value;
                        break;
                    }
                    case 'BooleanLiteral': {
                        varType = 'boolean';
                        defaultValue = init0.value;
                        break;
                    }
                    case 'StringLiteral': {
                        varType = 'string';
                        defaultValue = init0.value;
                        break;
                    }
                    case 'VarargLiteral': {
                        // console.log('#################');
                        // console.log('THIS IS A VARARG.');
                        // console.log(init0);
                        // console.log('#################');
                        varType = 'any';
                        defaultValue = init0.value;
                        break;
                    }
                    case 'NilLiteral': {
                        varType = 'nil';
                        defaultValue = init0.value;
                        break;
                    }
                }
                // Check for possible duplicate.
                if (clazz.values[varName]) {
                    console.warn(`Value already exists: ${className}.${varName}. Overriding with lower-most definition..`);
                    delete clazz.values[varName];
                }
                const value = clazz.createValue(varName);
                value.type = varType;
                // console.log(`Found ${type}: ${className}.${varName}: ${varType};`);
                // console.log(statement);
            };
            for (const statement of chunk.body) {
                if (statement.type !== 'AssignmentStatement')
                    continue;
                // We found the class declaration so we're good to go.
                if (handleClassDec(statement))
                    break;
            }
            // No class detected.
            if (className === '')
                return undefined;
            // Crawl for values.
            for (const statement of chunk.body) {
                if (statement.type !== 'AssignmentStatement')
                    continue;
                handleValueDec(statement);
            }
            // Crawl for functions & methods.
            for (const statement of chunk.body) {
                // Only allow Function-Declarations here.
                if (statement.type !== 'FunctionDeclaration')
                    continue;
                handleFuncDec(statement);
            }
            const handleConstructor = (conzstructor) => {
                let selfAlias = '';
                for (let index = conzstructor.body.length - 1; index >= 0; index--) {
                    const statement = conzstructor.body[index];
                    if (statement.type !== 'ReturnStatement')
                        continue;
                    const arg0 = statement.arguments[0];
                    if (arg0.type !== 'Identifier')
                        continue;
                    selfAlias = arg0.name;
                    break;
                }
                if (selfAlias === '') {
                    console.warn('No known alias for "self" in constructor. Skipping reading its content(s)..');
                    return;
                }
                for (const statement of conzstructor.body) {
                    if (statement.type === 'AssignmentStatement') {
                        const var0 = statement.variables[0];
                        // Make sure the assignment is towards a member. (The class)
                        if (var0.type !== 'MemberExpression')
                            continue;
                        if (var0.base.type !== 'Identifier')
                            continue;
                        // Proxies the className in constructor definitions.
                        if (var0.base.name !== selfAlias)
                            continue;
                        const varName = var0.identifier.name;
                        let varType = 'any';
                        let defaultValue = undefined;
                        if (!statement.init.length)
                            continue;
                        const init0 = statement.init[0];
                        switch (init0.type) {
                            case 'NumericLiteral': {
                                varType = 'number';
                                defaultValue = init0.value;
                                break;
                            }
                            case 'BooleanLiteral': {
                                varType = 'boolean';
                                defaultValue = init0.value;
                                break;
                            }
                            case 'StringLiteral': {
                                varType = 'string';
                                defaultValue = init0.value;
                                break;
                            }
                            case 'VarargLiteral': {
                                // console.log('#################');
                                // console.log('THIS IS A VARARG.');
                                // console.log(init0);
                                // console.log('#################');
                                varType = 'any';
                                defaultValue = init0.value;
                                break;
                            }
                            case 'NilLiteral': {
                                varType = 'nil';
                                defaultValue = init0.value;
                                break;
                            }
                        }
                        // Check for possible duplicate.
                        if (clazz.fields[varName]) {
                            console.warn(`Field already exists: ${className}.${varName}. Overriding with lower-most definition..`);
                            delete clazz.fields[varName];
                        }
                        const field = clazz.createField(varName);
                        field.type = varType;
                        // console.log(`Found field: ${className}.${varName}: ${varType};`);
                        // if (field.type === 'any') {
                        //     console.log(statement);
                        // }
                    }
                }
            };
            if (conzstructor) {
                handleConstructor(conzstructor);
            }
            // const locals = discover(chunk);
            // console.log(locals);
            // console.log(clazz);
            return clazz;
        }
        async parseFilePicker() {
            const { app } = this;
            const _this = this;
            const dFileLoad = document.getElementById('load-file');
            const onchange = () => {
                try {
                    const file = dFileLoad.files[0];
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        const lua = reader.result;
                        const chunk = luaparse.parse(lua, {
                            luaVersion: '5.1',
                            comments: true,
                            locations: true,
                        });
                        ////////////////////
                        // LuaWizard Code //
                        ////////////////////
                        const globalScope = new Scope_3.Scope();
                        const globalInfo = {
                            classes: {},
                            tables: {},
                            values: {},
                            funcs: {},
                            scope: globalScope
                        };
                        (0, PZ_1.scanFile)(globalInfo, chunk.body);
                        (0, Discover_1.discoverFile)(globalInfo, chunk.body);
                        console.log("### LuaWizard ###");
                        console.log(globalInfo);
                        ////////////////////
                        const clazz = _this.parse(chunk);
                        if (clazz) {
                            const card = app.showClass(clazz);
                            app.renderCode();
                            app.sidebar.itemTree.populate();
                            card.update();
                        }
                    };
                    reader.readAsText(file);
                    app.toast.alert(`Loaded LuaClass.`, 'success');
                }
                catch (e) {
                    app.toast.alert(`Failed to load LuaClass.`, 'error');
                    console.error(e);
                }
            };
            dFileLoad.onchange = onchange;
            dFileLoad.click();
        }
    }
    exports.LuaParser = LuaParser;
});
define("src/app", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/component/LuaClassCard", "src/asledgehammer/rosetta/component/LuaConstructorCard", "src/asledgehammer/rosetta/component/LuaFieldCard", "src/asledgehammer/rosetta/component/LuaFunctionCard", "src/asledgehammer/rosetta/component/Sidebar", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/lua/wizard/LuaParser"], function (require, exports, hljs, LuaClassCard_1, LuaConstructorCard_1, LuaFieldCard_1, LuaFunctionCard_1, Sidebar_1, LuaGenerator_5, RosettaLuaClass_2, RosettaLuaConstructor_3, util_10, LuaParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = exports.Toast = void 0;
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
            const $toast = (0, util_10.$get)(idToastSimple);
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
    class App {
        constructor() {
            this.card = null;
            this.sidebar = new Sidebar_1.Sidebar(this);
            this.toast = new Toast(this);
            this.luaParser = new LuaParser_1.LuaParser(this);
            this.eSidebarContainer = document.getElementById('screen-sidebar-container');
            this.$screenContent = $('#screen-content-end-container');
            // @ts-ignore This modal is for new items and editing their names.
            this.modalName = new bootstrap.Modal('#modal-name', {});
            this.$titleName = (0, util_10.$get)('title-name');
            this.$inputName = (0, util_10.$get)('input-name');
            this.$btnName = (0, util_10.$get)('btn-name-create');
            // @ts-ignore This modal is for confirming actions.
            this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
            this.$titleConfirm = (0, util_10.$get)('title-confirm');
            this.$bodyConfirm = (0, util_10.$get)('body-confirm');
            this.$btnConfirm = (0, util_10.$get)('btn-confirm');
            this.confirmSuccess = undefined;
            this.nameMode = null;
        }
        async init() {
            this.createSidebar();
        }
        loadLuaClass(json) {
            this.$screenContent.empty();
            // Always get first class
            const name = Object.keys(json.luaClasses)[0];
            const entity = new RosettaLuaClass_2.RosettaLuaClass(name, json.luaClasses[name]);
            this.card = new LuaClassCard_1.LuaClassCard(this, { entity: entity });
            this.$screenContent.append(this.card.render());
            this.card.listen();
            this.card.update();
            this.renderCode();
            this.sidebar.itemTree.populate();
            return this.card;
        }
        showClass(entity) {
            this.$screenContent.empty();
            this.card = new LuaClassCard_1.LuaClassCard(this, { entity });
            this.$screenContent.append(this.card.render());
            this.card.listen();
            this.card.update();
            this.renderCode();
            return this.card;
        }
        showConstructor(entity) {
            var _a;
            const clazz = (_a = this.card) === null || _a === void 0 ? void 0 : _a.options.entity;
            if (!entity)
                entity = new RosettaLuaConstructor_3.RosettaLuaConstructor(clazz);
            this.$screenContent.empty();
            const card = new LuaConstructorCard_1.LuaConstructorCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.renderCode();
            return card;
        }
        showField(entity) {
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showValue(entity) {
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showMethod(entity) {
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showFunction(entity) {
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        renderCode() {
            const $renderPane = (0, util_10.$get)('code-preview');
            $renderPane.empty();
            if (!this.card)
                return;
            const highlightedCode = hljs.default.highlightAuto((0, LuaGenerator_5.generateLuaClass)(this.card.options.entity), ['lua']).value;
            $renderPane.html(highlightedCode);
        }
        createSidebar() {
            const { eSidebarContainer, sidebar } = this;
            eSidebarContainer.innerHTML = sidebar.render();
        }
        listen() {
            this.sidebar.listen();
            const _this = this;
            this.$btnConfirm.on('click', () => {
                this.modalConfirm.hide();
                if (this.confirmSuccess) {
                    this.confirmSuccess();
                    this.confirmSuccess = undefined;
                }
            });
            this.$inputName.on('input', () => {
                setTimeout(() => this.$inputName.val((0, util_10.validateLuaVariableName)(this.$inputName.val())), 1);
            });
            this.$btnName.on('click', () => {
                var _a;
                const clazz = (_a = this.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                const name = (0, util_10.validateLuaVariableName)(this.$inputName.val()).trim();
                const nameOld = this.nameSelected;
                switch (this.nameMode) {
                    case 'new_class': {
                        try {
                            const entity = new RosettaLuaClass_2.RosettaLuaClass((0, util_10.validateLuaVariableName)(this.$inputName.val()).trim());
                            this.showClass(entity);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Created Lua Class.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Class.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_class': {
                        try {
                            clazz.name = name;
                            this.showClass(clazz);
                            this.toast.alert('Edited Lua Class.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Class.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'new_field': {
                        try {
                            const field = clazz.createField(name);
                            this.showField(field);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Created Lua Field.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Field.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_field': {
                        try {
                            const field = clazz.fields[nameOld];
                            field.name = name;
                            clazz.fields[name] = field;
                            delete clazz.fields[nameOld];
                            this.showField(field);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Edited Lua Field.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Field.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'new_value': {
                        try {
                            const value = clazz.createValue(name);
                            this.showValue(value);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Created Lua Value.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Value.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_value': {
                        try {
                            const value = clazz.values[nameOld];
                            value.name = name;
                            clazz.values[name] = value;
                            delete clazz.values[nameOld];
                            this.showValue(value);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Edited Lua value.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Value.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'new_function': {
                        try {
                            const func = clazz.createFunction(name);
                            this.showFunction(func);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Created Lua Function.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Function.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_function': {
                        try {
                            const func = clazz.functions[nameOld];
                            func.name = name;
                            clazz.functions[name] = func;
                            delete clazz.functions[nameOld];
                            this.showFunction(func);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Edited Lua Function.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Function.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'new_method': {
                        try {
                            const method = clazz.createMethod(name);
                            this.showMethod(method);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Created Lua Method.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Method.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_method': {
                        try {
                            const method = clazz.methods[nameOld];
                            method.name = name;
                            clazz.methods[name] = method;
                            delete clazz.methods[nameOld];
                            this.showMethod(method);
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Edited Lua Method.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Method.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'new_parameter': {
                        try {
                            const split = nameOld.split('-');
                            const type = split[0];
                            const funcName = split[1];
                            let func = null;
                            if (type === 'constructor') {
                                func = clazz.conztructor;
                            }
                            else if (type === 'function') {
                                func = clazz.functions[funcName];
                            }
                            else {
                                func = clazz.methods[funcName];
                            }
                            func.addParameter(name, 'any');
                            if (type === 'constructor') {
                                this.showConstructor(func);
                            }
                            else if (type === 'function') {
                                this.showFunction(func);
                            }
                            else {
                                this.showMethod(func);
                            }
                            this.renderCode();
                            this.toast.alert('Created Lua Parameter.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Parameter.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_parameter': {
                        try {
                            const split = nameOld.split('-');
                            const funcName = split[0];
                            const paramName = split[1];
                            let type = null;
                            let func = null;
                            let param = null;
                            // Could be the constructor.
                            if (funcName === 'new') {
                                func = clazz.conztructor;
                                type = 'constructor';
                            }
                            else {
                                // First, check methods.
                                for (const methodName of Object.keys(clazz.methods)) {
                                    if (methodName === funcName) {
                                        func = clazz.methods[methodName];
                                        type = 'method';
                                        break;
                                    }
                                }
                                // Second, check functions.
                                if (!func) {
                                    for (const methodName of Object.keys(clazz.functions)) {
                                        if (methodName === funcName) {
                                            func = clazz.functions[methodName];
                                            type = 'function';
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!func) {
                                console.warn(`Unknown function / method / constructor: ${clazz.name}.${funcName}!`);
                                break;
                            }
                            for (const next of func.parameters) {
                                if (next.name === paramName) {
                                    param = next;
                                    break;
                                }
                            }
                            if (!param) {
                                console.warn(`Unknown parameter: ${clazz.name}.${funcName}#${paramName}!`);
                                break;
                            }
                            param.name = name;
                            if (type === 'constructor') {
                                this.showConstructor(func);
                            }
                            else if (type === 'function') {
                                this.showFunction(func);
                            }
                            else if (type === 'method') {
                                this.showMethod(func);
                            }
                            this.renderCode();
                            this.sidebar.itemTree.populate();
                            this.toast.alert('Edited Lua Parameter.');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to edit Lua Parameter.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                }
                this.nameSelected = undefined;
                this.modalName.hide();
            });
            const $btnCopy = (0, util_10.$get)('btn-code-preview-copy');
            const $container = (0, util_10.$get)('screen-content-container');
            const $cardPreview = (0, util_10.$get)('screen-content-end-container');
            const $codePreview = (0, util_10.$get)('code-preview');
            const $btnCardCode = (0, util_10.$get)('btn-card-code');
            const $iconCard = (0, util_10.$get)('icon-card');
            const $iconCode = (0, util_10.$get)('icon-code');
            let mode = 'card';
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
                    mode = 'card';
                }
            });
        }
        askConfirm(onSuccess, title = 'Confirm', body = 'Are you sure?') {
            this.$titleConfirm.html(title);
            this.$bodyConfirm.html(body);
            this.confirmSuccess = onSuccess;
            this.modalConfirm.show();
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
define("src/lib", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.message = void 0;
    exports.message = "Hello World!";
});
define("src/asledgehammer/JSONSerializable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/Rosetta", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSON_PATCH_SCHEMA_URL = exports.JSON_SCHEMA_URL = void 0;
    exports.JSON_SCHEMA_URL = 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json';
    exports.JSON_PATCH_SCHEMA_URL = 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-patch-schema.json';
});
define("src/asledgehammer/rosetta/lua/RosettaLuaTableField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/RosettaUtils"], function (require, exports, Assert, RosettaEntity_7, RosettaUtils_4) {
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
        }
        parse(raw) {
            /* (Properties) */
            this.notes = this.readNotes(raw);
            if (raw.type !== undefined) {
                this.type = this.readRequiredString('type', raw);
            }
        }
        /**
         * @param patch If true, the exported JSON object will only contain Patch-specific information.
         *
         * @returns The JSON of the Rosetta entity.
         */
        toJSON(patch = false) {
            const { name, type, notes } = this;
            const json = {};
            /* (Properties) */
            json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            return json;
        }
    }
    exports.RosettaLuaTableField = RosettaLuaTableField;
});
define("src/asledgehammer/rosetta/lua/RosettaLuaTable", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaTableField"], function (require, exports, Assert, RosettaEntity_8, RosettaLuaFunction_2, RosettaLuaTableField_1) {
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
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name2 of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name2];
                    const func = new RosettaLuaFunction_2.RosettaLuaFunction(name2, rawFunction);
                    this.functions[func.name] = this.functions[name2] = func;
                }
            }
            /* (Values) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name2 of Object.keys(rawValues)) {
                    const rawValue = rawValues[name2];
                    const value = new RosettaLuaTableField_1.RosettaLuaTableField(name2, rawValue);
                    this.fields[value.name] = this.fields[name2] = value;
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
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name];
                    let func = this.functions[name];
                    if (func === undefined) {
                        func = new RosettaLuaFunction_2.RosettaLuaFunction(name, rawFunction);
                    }
                    else {
                        func.parse(rawFunction);
                    }
                    this.functions[func.name] = this.functions[name] = func;
                }
            }
            /* (Values) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name of Object.keys(rawValues)) {
                    const rawValue = rawValues[name];
                    let value = this.fields[name];
                    if (value === undefined) {
                        value = new RosettaLuaTableField_1.RosettaLuaTableField(name, rawValue);
                    }
                    else {
                        value.parse(rawValue);
                    }
                    this.fields[value.name] = this.fields[name] = value;
                }
            }
        }
        toJSON(patch = false) {
            const { fields, tables, functions, name, notes } = this;
            const json = {};
            /* (Properties) */
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            /* (Fields) */
            let keys = Object.keys(fields);
            if (keys.length) {
                json.fields = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.fields[key] = fields[key].toJSON(patch);
            }
            /* (Functions) */
            keys = Object.keys(functions);
            if (keys.length) {
                json.functions = {};
                keys.sort((a, b) => a.localeCompare(b));
                for (const key of keys)
                    json.functions[key] = functions[key].toJSON(patch);
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
    }
    exports.RosettaLuaTable = RosettaLuaTable;
});
define("src/asledgehammer/rosetta/RosettaFileInfo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/RosettaFile", ["require", "exports", "src/asledgehammer/rosetta/Rosetta", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaTable", "src/asledgehammer/rosetta/lua/RosettaLuaTableField", "src/asledgehammer/rosetta/lua/RosettaLuaClass"], function (require, exports, Rosetta_1, RosettaEntity_9, RosettaLuaFunction_3, RosettaLuaTable_1, RosettaLuaTableField_2, RosettaLuaClass_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaFile = void 0;
    /**
     * **RosettaFile**
     *
     * @author Jab
     */
    class RosettaFile extends RosettaEntity_9.RosettaEntity {
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
                    const table = new RosettaLuaTable_1.RosettaLuaTable(name, rawTable);
                    this.tables[table.name] = this.tables[name] = table;
                }
            }
            /* (Functions) */
            if (raw.functions !== undefined) {
                const rawFunctions = raw.functions;
                for (const name of Object.keys(rawFunctions)) {
                    const rawFunction = rawFunctions[name];
                    const func = new RosettaLuaFunction_3.RosettaLuaFunction(name, rawFunction);
                    this.functions[func.name] = this.functions[name] = func;
                }
            }
            /* (Values) */
            if (raw.values !== undefined) {
                const rawValues = raw.values;
                for (const name of Object.keys(rawValues)) {
                    const rawValue = rawValues[name];
                    const value = new RosettaLuaTableField_2.RosettaLuaTableField(name, rawValue);
                    this.fields[value.name] = this.fields[name] = value;
                }
            }
            /* (Lua Classes) */
            if (raw.luaClasses !== undefined) {
                const rawLuaClasses = raw.luaClasses;
                for (const name of Object.keys(rawLuaClasses)) {
                    const rawLuaClass = rawLuaClasses[name];
                    const luaClass = new RosettaLuaClass_3.RosettaLuaClass(name, rawLuaClass);
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
            const luaClass = new RosettaLuaClass_3.RosettaLuaClass(name);
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
            const luaTable = new RosettaLuaTable_1.RosettaLuaTable(name);
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
            const luaFunction = new RosettaLuaFunction_3.RosettaLuaFunction(name);
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
            const luaField = new RosettaLuaTableField_2.RosettaLuaTableField(name);
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
define("src/asledgehammer/rosetta/SerializableComponent", ["require", "exports"], function (require, exports) {
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
define("src/asledgehammer/rosetta/component/LabelComponent", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component"], function (require, exports, util_11, Component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelComponent = void 0;
    class LabelComponent extends Component_3.Component {
        constructor(options) {
            super(options);
        }
        onRender() {
            return (0, util_11.html) ``;
        }
    }
    exports.LabelComponent = LabelComponent;
});
define("src/asledgehammer/rosetta/component/SidebarPanelButton", ["require", "exports", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/util"], function (require, exports, Component_4, util_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanelButton = void 0;
    class SidebarPanelButton extends Component_4.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            (0, util_12.$get)(this.id).on('click', () => {
                if (this.options && this.options.onclick) {
                    this.options.onclick();
                }
            });
        }
        onRender() {
            const { label } = this.options;
            return (0, util_12.html) `
            <button class="btn btn-primary col-12 rounded-0">${label}</button>
        `;
        }
    }
    exports.SidebarPanelButton = SidebarPanelButton;
});
define("src/asledgehammer/rosetta/component/SidebarPanel", ["require", "exports", "src/asledgehammer/rosetta/component/Component"], function (require, exports, Component_5) {
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
define("src/asledgehammer/rosetta/lua/wizard/Extract", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extractChunk = exports.extractStatement = exports.extractForGenericStatement = exports.extractForNumericStatement = exports.extractFunctionDeclaration = exports.extractCallStatement = exports.extractAssignmentStatement = exports.extractLocalStatement = exports.extractRepeatStatement = exports.extractDoStatement = exports.extractWhileStatement = exports.extractIfStatement = exports.extractReturnStatement = void 0;
    function extractReturnStatement(bag, statement) {
        let changes = 0;
        // Make sure we have something to return / discover.
        if (!statement.arguments.length)
            return changes;
        for (const arg of statement.arguments) {
        }
        return changes;
    }
    exports.extractReturnStatement = extractReturnStatement;
    function extractIfStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractIfStatement = extractIfStatement;
    function extractWhileStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractWhileStatement = extractWhileStatement;
    function extractDoStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractDoStatement = extractDoStatement;
    function extractRepeatStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractRepeatStatement = extractRepeatStatement;
    function extractLocalStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractLocalStatement = extractLocalStatement;
    function extractAssignmentStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractAssignmentStatement = extractAssignmentStatement;
    function extractCallStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractCallStatement = extractCallStatement;
    function extractFunctionDeclaration(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractFunctionDeclaration = extractFunctionDeclaration;
    function extractForNumericStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractForNumericStatement = extractForNumericStatement;
    function extractForGenericStatement(bag, statement) {
        let changes = 0;
        return changes;
    }
    exports.extractForGenericStatement = extractForGenericStatement;
    function extractStatement(bag, statement) {
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
    exports.extractStatement = extractStatement;
    function extractChunk(bag, chunk) {
        let changes = 0;
        for (let index = 0; index < chunk.body.length; index++) {
            const statement = chunk.body[index];
            changes += extractStatement(bag, statement);
        }
        return changes;
    }
    exports.extractChunk = extractChunk;
});
//# sourceMappingURL=app.js.map