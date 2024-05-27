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
define("src/asledgehammer/rosetta/component/lua/LuaCard", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/CardComponent", "src/asledgehammer/Delta"], function (require, exports, hljs, util_3, CardComponent_1, Delta_1) {
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
define("src/asledgehammer/rosetta/component/lua/LuaClassCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/lua/LuaCard"], function (require, exports, LuaGenerator_1, util_4, LuaCard_1) {
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
define("src/asledgehammer/rosetta/component/lua/LuaConstructorCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/lua/LuaCard"], function (require, exports, LuaGenerator_2, util_5, LuaCard_2) {
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
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            return (0, LuaGenerator_2.generateLuaConstructor)(className, entity);
        }
        onHeaderHTML() {
            const classEntity = this.app.active.selectedCard.options.entity;
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
define("src/asledgehammer/rosetta/component/lua/LuaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/lua/LuaCard"], function (require, exports, LuaGenerator_3, util_6, LuaCard_3) {
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
            const name = (_b = (_a = app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.entity.name;
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
            const luaClass = (_a = this.app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
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
                    const clazz = (_a = app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.values[entity.name];
                    }
                    else {
                        delete clazz.fields[entity.name];
                    }
                    app.showLuaClass(clazz);
                    app.sidebar.itemTree.selectedID = undefined;
                    app.sidebar.populateTrees();
                }, `Delete ${isStatic ? 'Value' : 'Field'} ${entity.name}`);
            });
        }
    }
    exports.LuaFieldCard = LuaFieldCard;
});
define("src/asledgehammer/rosetta/component/lua/LuaFunctionCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/lua/LuaCard"], function (require, exports, LuaGenerator_4, util_7, LuaCard_4) {
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
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            return (0, LuaGenerator_4.generateLuaMethod)(className, entity);
        }
        onHeaderHTML() {
            const { idBtnDelete, idBtnEdit } = this;
            const { entity, isStatic } = this.options;
            const classEntity = this.app.active.selectedCard.options.entity;
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
                    const clazz = (_a = app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.functions[entity.name];
                    }
                    else {
                        delete clazz.methods[entity.name];
                    }
                    app.showLuaClass(clazz);
                    app.sidebar.itemTree.selectedID = undefined;
                    app.sidebar.populateTrees();
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
define("src/asledgehammer/rosetta/java/RosettaJavaType", ["require", "exports", "src/asledgehammer/rosetta/RosettaEntity"], function (require, exports, RosettaEntity_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaType = void 0;
    /**
     * **RosettaJavaType**
     *
     * @author Jab
     */
    class RosettaJavaType extends RosettaEntity_7.RosettaEntity {
        constructor(raw) {
            super(raw);
            const basic = this.readRequiredString('basic');
            this.rawBasic = basic;
            if (basic.indexOf('.') !== -1) {
                const split = basic.split('.');
                this.basic = split[split.length - 1];
            }
            else {
                this.basic = basic;
            }
            this.full = this.readString('full');
        }
        toJSON(patch = false) {
            const { rawBasic: basic, full } = this;
            const json = {};
            if (!patch) {
                json.basic = basic;
                json.full = full;
            }
            return json;
        }
    }
    exports.RosettaJavaType = RosettaJavaType;
});
define("src/asledgehammer/rosetta/java/RosettaJavaParameter", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaType", "src/asledgehammer/rosetta/RosettaUtils"], function (require, exports, Assert, RosettaEntity_8, RosettaJavaType_1, RosettaUtils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaParameter = void 0;
    /**
     * **RosettaJavaParameter**
     *
     * @author Jab
     */
    class RosettaJavaParameter extends RosettaEntity_8.RosettaEntity {
        constructor(raw) {
            super(raw);
            Assert.assertNonNull(raw.type, 'raw.type');
            this.name = (0, RosettaUtils_4.formatName)(this.readRequiredString('name'));
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
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            return json;
        }
    }
    exports.RosettaJavaParameter = RosettaJavaParameter;
});
define("src/asledgehammer/rosetta/java/RosettaJavaConstructor", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaParameter"], function (require, exports, Assert, RosettaEntity_9, RosettaJavaParameter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaConstructor = void 0;
    /**
     * **RosettaJavaConstructor**
     *
     * @author Jab
     */
    class RosettaJavaConstructor extends RosettaEntity_9.RosettaEntity {
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
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
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
    }
    exports.RosettaJavaConstructor = RosettaJavaConstructor;
});
define("src/asledgehammer/rosetta/java/RosettaJavaReturns", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaType"], function (require, exports, Assert, RosettaEntity_10, RosettaJavaType_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaReturns = void 0;
    /**
     * **RosettaJavaReturns**
     *
     * @author Jab
     */
    class RosettaJavaReturns extends RosettaEntity_10.RosettaEntity {
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
            /* (Properties) */
            if (!patch)
                json.type = type;
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            return json;
        }
    }
    exports.RosettaJavaReturns = RosettaJavaReturns;
});
define("src/asledgehammer/rosetta/java/RosettaJavaMethod", ["require", "exports", "src/asledgehammer/rosetta/RosettaUtils", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaParameter", "src/asledgehammer/rosetta/java/RosettaJavaReturns"], function (require, exports, RosettaUtils_5, RosettaEntity_11, RosettaJavaParameter_2, RosettaJavaReturns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaMethod = void 0;
    /**
     * **RosettaJavaMethod**
     *
     * @author Jab
     */
    class RosettaJavaMethod extends RosettaEntity_11.RosettaEntity {
        constructor(raw) {
            super(raw);
            this.parameters = [];
            /* PROPERTIES */
            this.name = (0, RosettaUtils_5.formatName)(this.readRequiredString('name'));
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
        isStatic() {
            return this.modifiers != null && !!this.modifiers.length && this.modifiers.indexOf('static') !== -1;
        }
    }
    exports.RosettaJavaMethod = RosettaJavaMethod;
});
define("src/asledgehammer/rosetta/java/RosettaJavaMethodCluster", ["require", "exports", "src/asledgehammer/Assert"], function (require, exports, Assert) {
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
define("src/asledgehammer/rosetta/java/RosettaJavaField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaType"], function (require, exports, Assert, RosettaEntity_12, RosettaJavaType_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaField = void 0;
    /**
     * **RosettaJavaField**
     *
     * @author Jab
     */
    class RosettaJavaField extends RosettaEntity_12.RosettaEntity {
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
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
            if (!patch) {
                if (modifiers.length)
                    json.modifiers = modifiers;
                json.deprecated = deprecated;
                json.type = type.toJSON(patch);
            }
            return json;
        }
        isStatic() {
            return !!this.modifiers.length && this.modifiers.indexOf('static') !== -1;
        }
    }
    exports.RosettaJavaField = RosettaJavaField;
});
define("src/asledgehammer/rosetta/java/RosettaJavaClass", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaUtils", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/java/RosettaJavaConstructor", "src/asledgehammer/rosetta/java/RosettaJavaMethodCluster", "src/asledgehammer/rosetta/java/RosettaJavaMethod", "src/asledgehammer/rosetta/java/RosettaJavaField"], function (require, exports, Assert, RosettaUtils_6, RosettaEntity_13, RosettaJavaConstructor_1, RosettaJavaMethodCluster_1, RosettaJavaMethod_1, RosettaJavaField_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaJavaClass = exports.RosettaJavaNamespace = void 0;
    /**
     * **RosettaJavaNamespace**
     *
     * @author Jab
     */
    class RosettaJavaNamespace extends RosettaEntity_13.RosettaEntity {
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
    class RosettaJavaClass extends RosettaEntity_13.RosettaEntity {
        constructor(name, namespace, raw) {
            super(raw);
            this.fields = {};
            this.methods = {};
            this.constructors = [];
            Assert.assertNonEmptyString(name, 'name');
            Assert.assertNonNull(namespace, 'namsepace');
            this.namespace = namespace;
            this.name = (0, RosettaUtils_6.formatName)(name);
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
            const { extendz, modifiers, deprecated, javaType, notes, fields, constructors, methods } = this;
            const json = {};
            /* (Properties) */
            json.notes = notes !== undefined && notes !== '' ? notes : undefined;
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
define("src/asledgehammer/rosetta/lua/RosettaLuaTableField", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/RosettaUtils"], function (require, exports, Assert, RosettaEntity_14, RosettaUtils_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaTableField = void 0;
    /**
     * **RosettaLuaTableField**
     *
     * @author Jab
     */
    class RosettaLuaTableField extends RosettaEntity_14.RosettaEntity {
        constructor(name, raw = {}) {
            super(raw);
            Assert.assertNonEmptyString(name, 'name');
            this.name = (0, RosettaUtils_7.formatName)(name);
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
define("src/asledgehammer/rosetta/lua/RosettaLuaTable", ["require", "exports", "src/asledgehammer/Assert", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaTableField"], function (require, exports, Assert, RosettaEntity_15, RosettaLuaFunction_2, RosettaLuaTableField_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RosettaLuaTable = void 0;
    /**
     * **RosettaLuaTable**
     *
     * @author Jab
     */
    class RosettaLuaTable extends RosettaEntity_15.RosettaEntity {
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
define("src/asledgehammer/rosetta/component/ItemTree", ["require", "exports", "src/asledgehammer/rosetta/java/RosettaJavaClass", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaTable", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/lua/LuaCard"], function (require, exports, RosettaJavaClass_1, RosettaLuaClass_1, RosettaLuaTable_1, util_8, LuaCard_5) {
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
            this.folderLuaClassFieldOpen = false;
            this.folderLuaClassValueOpen = false;
            this.folderLuaClassFunctionOpen = false;
            this.folderLuaClassMethodOpen = false;
            /* Lua Table Folders */
            this.idFolderLuaTableValue = `item-tree-folder-lua-table-value`;
            this.idFolderLuaTableFunction = `item-tree-folder-lua-table-function`;
            this.folderLuaTableValueOpen = false;
            this.folderLuaTableFunctionOpen = false;
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
                console.log(`Selected item: ${_this.selectedID}`);
            });
            this.listenLuaClass();
            this.listenLuaTable();
            this.listenJavaClass();
            this.listening = true;
        }
        listenLuaClass() {
            const _this = this;
            const $doc = $(document);
            $doc.on('click', '.lua-constructor-item', function () {
                // Prevent wasteful selection code executions here.
                if (_this.selected === 'constructor')
                    return;
                const entity = _this.app.active.selected;
                _this.app.showLuaClassConstructor(entity.conztructor);
                // Let the editor know we last selected the constructor.
                _this.selected = 'constructor';
            });
            $doc.on('click', '.lua-field-item', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const entity = _this.app.active.selected;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                _this.app.showLuaClassField(field);
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
            });
            $doc.on('click', '.lua-value-item', function () {
                const valueName = this.id.split('value-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === valueName)
                    return;
                const entity = _this.app.active.selected;
                const value = entity.values[valueName];
                if (!value)
                    return;
                _this.app.showLuaClassValue(value);
                // Let the editor know we last selected the value.
                _this.selected = valueName;
            });
            $doc.on('click', '.lua-method-item', function () {
                const methodName = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === methodName)
                    return;
                const entity = _this.app.active.selected;
                const method = entity.methods[methodName];
                if (!method)
                    return;
                _this.app.showLuaClassMethod(method);
                // Let the editor know we last selected the method.
                _this.selected = methodName;
            });
            $doc.on('click', '.lua-function-item', function () {
                const functionName = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === functionName)
                    return;
                const entity = _this.app.active.selected;
                const func = entity.functions[functionName];
                if (!func)
                    return;
                _this.app.showLuaClassFunction(func);
                // Let the editor know we last selected the function.
                _this.selected = functionName;
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
            $doc.on('click', '#' + this.idFolderLuaTableValue, () => {
                this.folderLuaTableValueOpen = !this.folderLuaTableValueOpen;
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
                const entity = _this.app.active.selected;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                _this.app.showJavaClassField(field);
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
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
                _this.app.showJavaClassMethod(method);
                // Let the editor know we last selected the field.
                _this.selected = signature;
            });
            $doc.on('click', '.java-class-constructor-item', function () {
                const signature = this.id.split('constructor-')[1].trim();
                console.log(`signature: ${signature}`);
                // Prevent wasteful selection code executions here.
                if (_this.selected === signature)
                    return;
                const conztructor = _this.constructorSignatureMap[signature];
                if (!conztructor)
                    return;
                _this.app.showJavaClassConstructor(conztructor);
                // Let the editor know we last selected the field.
                _this.selected = signature;
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
            const { selected } = this.app.active;
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
        populateLuaClass(entity) {
            if (!entity)
                return;
            const _this = this;
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
            let $treeLower = (0, util_8.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_8.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_8.$get)('tree-lower');
            // @ts-ignore
            $treeLower.bstreeview({
                data: [
                    {
                        text: "Constructor",
                        icon: LuaCard_5.LuaCard.getTypeIcon('constructor'),
                        class: ['item-tree-item', 'lua-constructor-item']
                    },
                    {
                        text: "Fields",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaClassField,
                        expanded: _this.folderLuaClassFieldOpen,
                        nodes: fields
                    },
                    {
                        text: "Values",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaClassValue,
                        expanded: _this.folderLuaClassValueOpen,
                        nodes: values
                    },
                    {
                        text: "Methods",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaClassMethod,
                        expanded: _this.folderLuaClassMethodOpen,
                        nodes: methods
                    },
                    {
                        text: "Functions",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaClassFunction,
                        expanded: _this.folderLuaClassFunctionOpen,
                        nodes: functions
                    },
                ]
            });
            // Apply jQuery listeners next.
        }
        populateLuaTable(entity) {
            if (!entity)
                return;
            const _this = this;
            const funcs = [];
            const values = [];
            // @ts-ignore
            $treeLower.bstreeview({
                data: [
                    {
                        text: "Values",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaTableValue,
                        expanded: _this.folderLuaTableValueOpen,
                        nodes: values
                    },
                    {
                        text: "Functions",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['item-tree-folder', 'bg-secondary'],
                        id: _this.idFolderLuaTableFunction,
                        expanded: _this.folderLuaTableFunctionOpen,
                        nodes: funcs
                    }
                ]
            });
        }
        populateJavaClass(entity) {
            if (!entity)
                return;
            const _this = this;
            let $treeLower = (0, util_8.$get)('tree-lower');
            $treeLower.remove();
            const $sidebarContentLower = (0, util_8.$get)('sidebar-content-lower');
            $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
            $treeLower = (0, util_8.$get)('tree-lower');
            const staticFields = [];
            const staticMethods = [];
            const fields = [];
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
                    let signature = `${method.name}`;
                    if (method.parameters && method.parameters.length) {
                        signature += '_';
                        for (const param of method.parameters) {
                            signature += `${param.type.basic}-`;
                        }
                        signature = signature.substring(0, signature.length - 1);
                    }
                    if (method.isStatic()) {
                        this.staticMethodSignatureMap[signature] = method;
                    }
                    else {
                        this.methodSignatureMap[signature] = method;
                    }
                }
            }
            for (const cons of entity.constructors) {
                let signature = `constructor`;
                if (cons.parameters && cons.parameters.length) {
                    signature += '_';
                    for (const param of cons.parameters) {
                        signature += `${param.type.basic}-`;
                    }
                    signature = signature.substring(0, signature.length - 1);
                }
                this.constructorSignatureMap[signature] = cons;
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
                constructors.push({
                    text: wrapItem(`${entity.name}(${params})`),
                    icon: LuaCard_5.LuaCard.getTypeIcon('object'),
                    id,
                    class: ['item-tree-item', 'java-class-constructor-item']
                });
            }
            // Static field(s)
            for (const name of fieldNames) {
                const field = entity.fields[name];
                if (field.isStatic()) {
                    const id = `java-class-${entity.name}-field-${field.name}`;
                    staticFields.push({
                        text: wrapItem(field.name),
                        icon: LuaCard_5.LuaCard.getTypeIcon(field.type.basic),
                        id,
                        class: ['item-tree-item', 'java-class-field-item']
                    });
                }
            }
            // Instance field(s)
            for (const name of fieldNames) {
                const field = entity.fields[name];
                if (!field.isStatic()) {
                    const id = `java-class-${entity.name}-field-${field.name}`;
                    fields.push({
                        text: wrapItem(field.name),
                        icon: LuaCard_5.LuaCard.getTypeIcon(field.type.basic),
                        id,
                        class: ['item-tree-item', 'java-class-field-item']
                    });
                }
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
                staticMethods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_5.LuaCard.getTypeIcon(method.returns.type.basic),
                    id,
                    class: ['item-tree-item', 'java-class-method-item']
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
                methods.push({
                    text: wrapItem(`${method.name}(${params})`),
                    icon: LuaCard_5.LuaCard.getTypeIcon(method.returns.type.basic),
                    id,
                    class: ['item-tree-item', 'java-class-method-item']
                });
            }
            const folderConstructors = {
                text: `${wrapFolderCount(`(${constructors.length})`)} Constructors`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassConstructor,
                expanded: _this.folderJavaClassConstructorOpen,
                nodes: constructors
            };
            const folderStaticFields = {
                text: `${wrapFolderCount(`(${staticFields.length})`)} Static Fields`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassStaticField,
                expanded: _this.folderJavaClassStaticFieldOpen,
                nodes: staticFields
            };
            const folderStaticMethods = {
                text: `${wrapFolderCount(`(${staticMethods.length})`)} Static Methods`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassStaticMethod,
                expanded: _this.folderJavaClassStaticMethodOpen,
                nodes: staticMethods
            };
            const folderFields = {
                text: `${wrapFolderCount(`(${fields.length})`)} Fields`,
                icon: "fa-solid fa-folder text-light mx-2",
                class: ['item-tree-folder', 'bg-secondary'],
                id: _this.idFolderJavaClassField,
                expanded: _this.folderJavaClassFieldOpen,
                nodes: fields
            };
            const folderMethods = {
                text: `${wrapFolderCount(`(${methods.length})`)} Methods`,
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
            if (fields.length)
                data.push(folderFields);
            if (methods.length)
                data.push(folderMethods);
            // @ts-ignore
            $treeLower.bstreeview({ data });
        }
    }
    exports.ItemTree = ItemTree;
});
define("src/asledgehammer/rosetta/component/ObjectTree", ["require", "exports", "src/asledgehammer/rosetta/component/lua/LuaCard", "src/asledgehammer/rosetta/util"], function (require, exports, LuaCard_6, util_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectTree = void 0;
    const CLASS_HEADER = 'obj-tree';
    function wrapFolderCount(count) {
        return `<strong class="font-monospace text-white">(${count})</strong>`;
    }
    function wrapItem(text) {
        return `<span class="font-monospace" style="position: relative; top: -2px; font-size: 12px;">${text}</span>`;
    }
    class ObjectTree {
        constructor(app, sidebar) {
            this.idFolderLuaClass = `${CLASS_HEADER}-folder-lua-class`;
            this.idFolderLuaTable = `${CLASS_HEADER}-folder-value`;
            this.idFolderJavaClass = `${CLASS_HEADER}-folder-function`;
            this.folderLuaClassOpen = true;
            this.folderLuaTableOpen = true;
            this.folderJavaClassOpen = true;
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
                console.log(`Selected object: ${_this.selectedID}`);
            });
            // Apply jQuery listeners next.
            $doc.on('click', '.object-tree-lua-class', function () {
                const name = this.id.substring('object-lua-class-'.length);
                _this.app.showLuaClass(_this.app.active.luaClasses[name]);
                // Update the class properties tree.
                const { itemTree } = _this.sidebar;
                itemTree.selected = undefined;
                itemTree.selectedID = undefined;
                itemTree.populate();
            });
            $doc.on('click', '.object-tree-java-class', function () {
                const name = this.id.substring('object-java-class-'.length);
                _this.app.showJavaClass(_this.app.active.javaClasses[name]);
                // Update the class properties tree.
                const { itemTree } = _this.sidebar;
                itemTree.selected = undefined;
                itemTree.selectedID = undefined;
                itemTree.populate();
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
            let $treeUpper = (0, util_9.$get)('tree-upper');
            $treeUpper.remove();
            const $sidebarContentUpper = (0, util_9.$get)('sidebar-content-upper');
            $sidebarContentUpper.append('<div id="tree-upper" class="rounded-0 bg-dark text-white"></div>');
            $treeUpper = (0, util_9.$get)('tree-upper');
            const luaClasses = [];
            for (const name of Object.keys(this.app.active.luaClasses)) {
                luaClasses.push({
                    id: `object-lua-class-${name}`,
                    text: wrapItem(name),
                    icon: LuaCard_6.LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-lua-class'],
                });
            }
            const luaTables = [];
            for (const name of Object.keys(this.app.active.luaTables)) {
                luaTables.push({
                    id: `object-lua-table-${name}`,
                    text: wrapItem(name),
                    icon: LuaCard_6.LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-lua-table'],
                });
            }
            const javaClasses = [];
            for (const name of Object.keys(this.app.active.javaClasses)) {
                javaClasses.push({
                    id: `object-java-class-${name}`,
                    text: wrapItem(name),
                    icon: LuaCard_6.LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-java-class'],
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
            const data = [];
            if (luaClasses.length)
                data.push(folderLuaClasses);
            if (luaTables.length)
                data.push(folderLuaTables);
            if (javaClasses.length)
                data.push(folderJavaClasses);
            // @ts-ignore
            $treeUpper.bstreeview({ data });
        }
    }
    exports.ObjectTree = ObjectTree;
});
define("src/asledgehammer/rosetta/component/Sidebar", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/component/ItemTree", "src/asledgehammer/rosetta/component/ObjectTree"], function (require, exports, util_10, Component_2, ItemTree_1, ObjectTree_1) {
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
                    
                    <!-- New Class -->
                    <button id="new-lua-class" class="btn btn-sm responsive-btn responsive-btn-success" title="New Class">
                        <div class="btn-pane">    
                            <i class="fa fa-file"></i>
                        </div>
                    </button>

                    <!-- Open -->
                    <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open Class">
                        <div class="btn-pane">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                    </button>

                    <!-- Save -->
                    <button id="save-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Save Class">
                        <div class="btn-pane">
                            <i class="fa fa-save"></i>
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
                            <li><a id="2btn-new-lua-value" class="dropdown-item" href="#">New Value</a></li>
                            <li><a id="2btn-new-lua-field" class="dropdown-item" href="#">New Field</a></li>
                            <li><a id="2btn-new-lua-function" class="dropdown-item" href="#">New Function</a></li>
                            <li><a id="2btn-new-lua-method" class="dropdown-item" href="#">New Method</a></li>
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
                <div class="p-1 border-top border-top-2 border-bottom border-bottom-2 border-black shadow">

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
            const { $titleName, $btnName, $inputName, modalName } = app;
            $doc.on('click', '#new-lua-class', () => {
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
                                app.loadJson(json);
                                app.renderCode();
                                _this.populateTrees();
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
            $doc.on('click', '#save-lua-class', async () => {
                try {
                    // @ts-ignore
                    const result = await showSaveFilePicker();
                    const json = this.app.saveJson();
                    const writable = await result.createWritable();
                    await writable.write(JSON.stringify(json, null, 2));
                    await writable.close();
                    app.toast.alert(`Saved LuaClass.`, 'info');
                }
                catch (e) {
                    app.toast.alert(`Failed to load LuaClass.`, 'error');
                    console.error(e);
                }
                return;
            });
            $doc.on('click', '#btn-new-lua-value', () => {
                try {
                    const { selectedCard: card } = app.active;
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
            $doc.on('click', '#btn-new-lua-field', () => {
                try {
                    const { selectedCard: card } = app.active;
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
            $doc.on('click', '#btn-new-lua-function', () => {
                try {
                    const { selectedCard: card } = app.active;
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
            $doc.on('click', '#btn-new-lua-method', () => {
                try {
                    const { selectedCard: card } = app.active;
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
            $doc.on('click', '#lua-wizard', () => {
                app.luaParser.parseFilePicker();
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
        // console.log(expression);
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
        let s = '';
        // Main line.
        s += `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
        return s;
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
    function statementToString(statement, options = { indent: 0 }) {
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
                case 'LocalStatement': {
                    s += `${statementToString(currStatement, options)}\n`;
                    break;
                }
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
    exports.stripCallParameters = void 0;
    /**
     * @param call The call to a function or class method.
     * @returns
     */
    function stripCallParameters(call) {
        // Param Check
        if (!call.length)
            return '';
        else if (call.indexOf('(') === -1 && call.indexOf(')') === -1)
            return `${call}`;
        let strippedCall = '';
        ///////////////
        // Sanity-check
        ///////////////
        let openings = 0;
        let closings = 0;
        for (const c of call) {
            if (c === '(')
                openings++;
            else if (c === ')')
                closings++;
        }
        if (openings !== closings) {
            throw new Error(`The known string has an uneven amount of '(' and ')'. (call: ${call})`);
        }
        ///////////////
        // Remove any parameters from the top-level down to match the string name.
        /** @type number Keeps track of the depth of parameters we're in. */
        let inParam = 0;
        for (let index = 0; index < call.length; index++) {
            let c0 = call[index + 0];
            if (inParam > 0) {
                if (c0 === ')') {
                    inParam--;
                    if (inParam === 0)
                        strippedCall += ')';
                }
                else if (c0 === '(')
                    inParam++;
                continue;
            }
            else if (c0 === '(') {
                inParam++;
                if (inParam === 1)
                    strippedCall += '(';
                continue;
            }
            strippedCall += c0;
        }
        return strippedCall;
    }
    exports.stripCallParameters = stripCallParameters;
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
            /** If true, the scope has a body that can return values. */
            this.hasBody = false;
            /** Any child scopes. This is helpful with {@link Scope.resolve resolving scopes}. */
            this.children = {};
            this.assignments = [];
            /** All discovered scopes that directly call or assign this scope. */
            this.references = [];
            this.types = [];
            /** (For table-type discovery) */
            this.keyTypes = [];
            /** (For table-type discovery) */
            this.valueType = [];
            /** For statements with multiple variables, this index helps with the initialization of Scopes. */
            this.index = 0;
            /** Generated or identified when constructing Scopes. */
            this.name = '';
            this.comments = [];
            /////////////////////////////
            // These are for children. //
            /////////////////////////////
            this._nextAssignmentID = 0;
            this._nextMemberExpressionID = 0;
            this._nextBreakID = 0;
            this._nextGotoID = 0;
            this._nextLabelID = 0;
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
            if (element && element.init) {
                element.init.scope = this;
            }
            this.index = index;
            // Assign the parent this new child.
            if (parent) {
                parent.addChild(this);
                this.addToRootMap(this);
            }
            if (element) {
                // Let the scope tell code that it has a body.
                switch (element.type) {
                    case 'ScopeFunction':
                    case 'ScopeForGenericBlock':
                    case 'ScopeForNumericBlock':
                    case 'ScopeDoBlock':
                    case 'ScopeWhileBlock':
                    case 'ScopeRepeatBlock':
                    case 'ScopeIfClauseBlock':
                    case 'ScopeConstructor': {
                        this.hasBody = true;
                    }
                }
                // Forward any types.
                if (element.types) {
                    for (const type of element.types) {
                        this.types.push(type);
                    }
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
            // console.log(`resolve(path: ${path})`);
            if (!path || !path.length)
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
                firstScope = split.pop().replace('()', '');
                pathSub = split.reverse().join();
            }
            else {
                // We have one scope. The path is the scope.
                return children[path.replace('()', '')];
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
                        case 'Identifier': return e.name;
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
                case 'ScopeReturn': return parent.nextReturnID();
                case 'ScopeGoto': return parent.nextGotoID();
                case 'ScopeBreak': return parent.nextBreakID();
                case 'ScopeLabel': return parent.nextLabelID();
                case 'ScopeAssignment': return parent.nextAssignmentID();
                case 'ScopeTable': return e.name;
                case 'ScopeClass': return e.name;
                case 'ScopeConstructor': return 'new';
                case 'ScopeKnownValue': return e.name;
                case 'ScopeKnownFunction': return e.name;
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
                    console.warn(expression);
                    throw new Error(`Unimplemented expression in 'Scope.getExpressionName(${expression.type}). (scope path: '${this.path} ') Check the line above for more info on the expression.`);
                }
            }
        }
        resetIDs() {
            this._nextAssignmentID = 0;
            this._nextMemberExpressionID = 0;
            this._nextCallID = 0;
            this._nextBreakID = 0;
            this._nextGotoID = 0;
            this._nextLabelID = 0;
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
        /**
         * @returns the next available scope that has a body.
         */
        getBodyScope() {
            if (this.hasBody)
                return this;
            if (!this.parent)
                return undefined;
            return this.parent.getBodyScope();
        }
        /**
         * @returns the next available scope that is a class.
         */
        getClassScope() {
            if (this.element && this.element.type === 'ScopeClass')
                return this;
            if (!this.parent)
                return undefined;
            return this.parent.getClassScope();
        }
        sortTypes() {
            this.types.sort((a, b) => a.localeCompare(b));
        }
        hasType(type) {
            return this.types.indexOf(type) !== -1;
        }
        /** NOTE: Must be called from sub-scope! */
        nextAssignmentID() {
            return `___assignment___${this._nextAssignmentID++}`;
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
        nextLabelID() {
            return `___label___${this._nextLabelID++}`;
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
define("src/asledgehammer/rosetta/lua/wizard/KnownTypes", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/LuaWizard", "src/asledgehammer/rosetta/lua/wizard/Scope"], function (require, exports, LuaWizard_1, Scope_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initKnownTypes = exports.isInitKnownTypes = exports.getKnownType = exports.knownTypes = void 0;
    exports.knownTypes = {
        'ipairs()': '*',
        'print()': 'void',
        'tostring()': 'string',
        'setmetatable()': 'table',
        'math.min()': 'number',
        'math.max()': 'number',
        'math.floor()': 'number',
        'math.ceil()': 'number',
        'math.round()': 'number',
        /* PZ Java API */
        // 'getCore()': 'Core',
        // 'getCore().getScreenWidth()': 'number',
        // 'getCore().getScreenHeight()': 'number',
        // 'getNumActivePlayers()': 'number',
        // 'getPlayerScreenLeft()': 'number',
        // 'getPlayerScreenTop()': 'number',
        // 'getPlayerScreenWidth()': 'number',
        // 'getPlayerScreenHeight()': 'number',
    };
    function getKnownType(known) {
        if (!known.length)
            return undefined;
        return exports.knownTypes[(0, LuaWizard_1.stripCallParameters)(known)];
    }
    exports.getKnownType = getKnownType;
    exports.isInitKnownTypes = false;
    function initKnownTypes(global) {
        console.log('init known types');
        if (exports.isInitKnownTypes)
            return;
        const javaAPI = window.known_types;
        const func = (types) => {
            console.log(`known types count: ${Object.keys(types).length}`);
            for (let key of Object.keys(types)) {
                const val = types[key];
                if (key.indexOf(':') !== -1) {
                    while (key.indexOf(':') !== -1)
                        key = key.replace(':', '.');
                }
                if (key.indexOf('.') !== -1) {
                    const split = key.split('.');
                    let scopeCurr = global;
                    for (let next of split) {
                        let type = 'ScopeKnownValue';
                        if (next.endsWith('()')) {
                            type = 'ScopeKnownFunction';
                            next = next.substring(0, next.length - 2);
                        }
                        let scopeNext = scopeCurr.resolve(next);
                        // Only create a new scope if one doesn't exist yet for the next known type scope.
                        if (!scopeNext) {
                            const knownType = {
                                type: type,
                                name: next,
                                knownType: val
                            };
                            scopeNext = new Scope_1.Scope(knownType, scopeCurr);
                            scopeNext.types.push(val);
                        }
                        scopeCurr = scopeNext;
                    }
                }
                else {
                    let next = key;
                    let type = 'ScopeKnownValue';
                    if (next.endsWith('()')) {
                        type = 'ScopeKnownFunction';
                        next = next.substring(0, next.length - 2);
                    }
                    let scopeNext = global.resolve(next);
                    // Only create a new scope if one doesn't exist yet for the next known type scope.
                    if (!scopeNext) {
                        const knownType = {
                            type: type,
                            name: next,
                            knownType: val
                        };
                        scopeNext = new Scope_1.Scope(knownType, global);
                        scopeNext.types.push(val);
                    }
                }
            }
        };
        func(exports.knownTypes);
        //func(javaAPI);
        exports.isInitKnownTypes = true;
    }
    exports.initKnownTypes = initKnownTypes;
});
define("src/asledgehammer/rosetta/lua/wizard/Discover", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/Scope", "src/asledgehammer/rosetta/lua/wizard/LuaWizard", "src/asledgehammer/rosetta/lua/wizard/String", "src/asledgehammer/rosetta/lua/wizard/KnownTypes"], function (require, exports, Scope_2, LuaWizard_2, String_2, KnownTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.discoverFile = exports.discoverStatement = exports.discoverForGenericStatement = exports.discoverForNumericStatement = exports.discoverRepeatStatement = exports.discoverDoStatement = exports.discoverWhileStatement = exports.discoverIfStatement = exports.discoverCallStatement = exports.discoverCallExpression = exports.discoverAssignmentStatement = exports.discoverLocalStatement = exports.discoverReturnStatement = exports.discoverGotoStatement = exports.discoverBreakStatement = exports.discoverLabelStatement = exports.discoverFunctionDeclaration = exports.discoverReturnType = exports.discoverBodyReturnTypes = exports.discoverType = exports.discoverRelationships = exports.discoverTableConstructorType = void 0;
    /**
     * TODO - Implement key -> value table type(s).
     *
     * @param ex
     * @param options
     *
     * @returns The proper lua annotation type for the table constructor.
     */
    function discoverTableConstructorType(ex, scope) {
        var _a;
        console.warn(ex);
        // Empty table constructor.
        if (!ex.fields.length)
            return 'table';
        let isArray = true;
        // Check to see if all fields are TableValue entries. If so, this is an array.
        for (const field of ex.fields) {
            if (field.type !== 'TableValue') {
                isArray = false;
                break;
            }
        }
        if (isArray) {
            // Discover & compile any discovered types in the array.
            const types = [];
            for (const field of ex.fields) {
                let type = (_a = discoverType(field.value, scope)) === null || _a === void 0 ? void 0 : _a.type;
                if (!type)
                    type = 'any';
                if (types.indexOf(type) === -1)
                    types.push(type);
            }
            if (types.length > 1) { // E.G: (string|number)[]
                return `(${types.join('|')})[]`;
            }
            else { // E.G: string[]
                return `${types[0]}[]`;
            }
        }
        return 'table';
    }
    exports.discoverTableConstructorType = discoverTableConstructorType;
    function discoverRelationships(expression, scope, index = 0) {
        switch (expression.type) {
            case 'Identifier': {
                // So if this is a direct reference, get the variable from the scope and
                // reference with the parameter variable slot and assignment.
                // Ignore prints.
                if (scope.path === '__G.print') {
                    break;
                }
                const scopeReference = scope.resolve(expression.name);
                if (!scopeReference) {
                    console.error(`Cannot find reference Scope for Identifier: ${expression.name} (Scope: ${scope.path})`);
                    break;
                }
                scope.references.push(scopeReference);
                scopeReference.assignments.push(scope);
                for (const type of scopeReference.types) {
                    if (scope.types.indexOf(type) === -1)
                        scope.types.push(type);
                }
                break;
            }
            case 'BinaryExpression': {
                let type;
                switch (expression.operator) {
                    // Arethmatic operators
                    case '+':
                    case '-':
                    case '*':
                    case '%':
                    case '^':
                    case '/': // Division
                    case '//': // Floor division
                    // Bitwise operators (>= Lua 5.3)
                    case '&':
                    case '|':
                    case '~':
                    case '<<':
                    case '>>': {
                        type = 'number';
                        break;
                    }
                    case '..': {
                        type = 'string';
                        break;
                    }
                    // Logical operators
                    case '~=':
                    case '==':
                    case '<':
                    case '<=':
                    case '>':
                    case '>=': {
                        type = 'boolean';
                    }
                }
                // console.warn(`${expressionToString(expression)} = ${type}`);
                // Try to establish types with relationships in embedded expressions for the parameter value(s). 
                discoverRelationships(expression.left, scope);
                discoverRelationships(expression.right, scope);
                break;
            }
            case 'UnaryExpression': {
                console.log(`UnaryExpression: ${(0, String_2.expressionToString)(expression)}`);
                switch (expression.operator) {
                    case '~':
                    case 'not': {
                        break;
                    }
                    case '-':
                    case '#': {
                        break;
                    }
                }
                break;
            }
            case 'MemberExpression': {
                console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${(0, String_2.expressionToString)(expression)}`);
                // TODO - Build reference link.
                break;
            }
            case 'IndexExpression': {
                //console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
                // TODO - Build reference link.
                break;
            }
            case 'CallExpression': {
                const path = (0, String_2.expressionToString)(expression);
                let stripped = (0, LuaWizard_2.stripCallParameters)(path);
                if (stripped.indexOf(':') !== -1) {
                    while (stripped.indexOf(':') !== -1)
                        stripped = stripped.replace(':', '.');
                }
                if (stripped.indexOf('()') !== -1) {
                    while (stripped.indexOf('()') !== -1)
                        stripped = stripped.replace('()', '');
                }
                let scope2, scope3;
                if (stripped.indexOf('self.') === 0) {
                    const classScope = scope.getClassScope();
                    if (!classScope) {
                        console.error(`Cannot find class scope with self reference. (${stripped})`);
                        return;
                    }
                    const stripped2 = stripped.replace('self.', '');
                    scope3 = classScope.resolve(stripped2);
                    if (!scope3) {
                        console.error(`Cannot find class field or method with self reference. (${stripped2})`);
                        return;
                    }
                    if (scope3.assignments.indexOf(scope) === -1)
                        scope3.assignments.push(scope);
                    if (scope.references.indexOf(scope3) === -1)
                        scope.references.push(scope3);
                    // Spread types from scope2 to scope.
                    if (scope3.types)
                        for (const t of scope3.types)
                            if (scope.types.indexOf(t) === -1)
                                scope.types.push(t);
                    // Spread types from scope to scope2.
                    if (scope.types)
                        for (const t of scope.types)
                            if (scope3.types.indexOf(t) === -1)
                                scope3.types.push(t);
                    // console.warn(`discoverType(scope: ${scope.path}) => classScope: ${classScope.path} scope3: ${scope3.path}`);
                    const funcDec = scope3.element.init;
                    if (!funcDec) {
                        console.error(`Function scope doesn't have assigned element of FunctionDeclaration: ${scope3.path}`);
                        break;
                    }
                    // Handle param(s).
                    for (let index = 0; index < funcDec.parameters.length; index++) {
                        const param = funcDec.parameters[index];
                        const arg = expression.arguments[index];
                        // Grab param name.
                        let paramName = '';
                        switch (param.type) {
                            case 'Identifier': {
                                paramName = param.name;
                                break;
                            }
                            case 'VarargLiteral': {
                                paramName = param.value;
                                break;
                            }
                        }
                        const scopeParam = scope3.resolve(paramName);
                        if (!scopeParam) {
                            console.error(`Cannot find Scope for parameter: ${paramName} (Scope: ${scope3.path})`);
                            break;
                        }
                        // console.warn(scopeParam);
                        // console.log(expressionToString(expression), expressionToString(arg), discoverType(arg, scopeParam));
                        if (arg) {
                            discoverRelationships(arg, scopeParam);
                        }
                    }
                }
                else {
                    // We don't assign to global.
                    if (scope.name === '__G') {
                        return;
                    }
                    if (stripped.indexOf('.') !== -1) {
                        let scopeCurr = scope;
                        for (const next of stripped.split('.')) {
                            let scopeNow = scopeCurr.resolve(next);
                            // console.log(`scopeCurr: ${next}`, scopeNow);
                            if (!scopeNow) {
                                console.error(`Cannot resolve scope-chain reference: ${stripped}`);
                                return;
                            }
                            const scopeInto = scope.resolve(scopeNow.types[0]);
                            if (scopeInto) {
                                scopeCurr = scopeInto;
                            }
                            else {
                                scopeCurr = scopeNow;
                            }
                        }
                        scope2 = scopeCurr;
                    }
                    else {
                        scope2 = scope.resolve(stripped);
                        if (!scope2) {
                            console.error(`Cannot find reference. (${stripped})`);
                            return;
                        }
                    }
                    if (scope2.assignments.indexOf(scope) === -1)
                        scope2.assignments.push(scope);
                    if (scope.references.indexOf(scope2) === -1)
                        scope.references.push(scope2);
                    // Spread types from scope2 to scope.
                    if (scope2.types)
                        for (const t of scope2.types)
                            if (scope.types.indexOf(t) === -1)
                                scope.types.push(t);
                    // Spread types from scope to scope2.
                    if (scope.types)
                        for (const t of scope.types)
                            if (scope2.types.indexOf(t) === -1)
                                scope2.types.push(t);
                    // console.warn(`discoverType() = (scope: ${scope.path}) => ${stripped}`);
                    const funcDec = scope2.element.init;
                    // if (!funcDec) {
                    //     console.error(`Function scope doesn't have assigned element of FunctionDeclaration: ${scope2.path}`);
                    //     break;
                    // }
                    if (funcDec) {
                        // Handle param(s).
                        for (let index = 0; index < funcDec.parameters.length; index++) {
                            const param = funcDec.parameters[index];
                            const arg = expression.arguments[index];
                            // Grab param name.
                            let paramName = '';
                            switch (param.type) {
                                case 'Identifier': {
                                    paramName = param.name;
                                    break;
                                }
                                case 'VarargLiteral': {
                                    paramName = param.value;
                                    break;
                                }
                            }
                            const scopeParam = scope2.resolve(paramName);
                            if (!scopeParam) {
                                console.error(`Cannot find Scope for parameter: ${paramName} (Scope: ${scope2.path})`);
                                break;
                            }
                            // console.warn(scopeParam);
                            // console.log(expressionToString(expression), expressionToString(arg), discoverType(arg, scopeParam));
                            discoverRelationships(arg, scopeParam);
                        }
                    }
                    else {
                        for (const arg of expression.arguments) {
                            discoverRelationships(arg, scope2);
                        }
                    }
                }
                break;
            }
            case 'TableCallExpression': {
                //console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
                // TODO - Build reference link.
                break;
            }
            case 'StringCallExpression': {
                // console.warn(`discoverType(${expression.type}) = (scope: ${scope.path}) => ${expressionToString(expression)}`);
                // TODO - Build reference link.
                break;
            }
            case 'FunctionDeclaration': {
                // TODO - Implement.
                break;
            }
            case 'TableConstructorExpression': {
                // TODO - Look at each assignment, assign to a ScopeTable, and evaluate assignments or call statements 
                //        and reference-map.
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
            }
        }
    }
    exports.discoverRelationships = discoverRelationships;
    function discoverType(expression, scope) {
        let type = undefined;
        let defaultValue = undefined;
        switch (expression.type) {
            // Simple type-reference.
            case 'Identifier': {
                // So if this is a direct reference, get the variable from the scope and
                // reference with the parameter variable slot and assignment.
                // Ignore prints.
                if (scope.path === '__G.print')
                    break;
                const scopeReference = scope.resolve(expression.name);
                if (!scopeReference) {
                    console.error(`Cannot find Scope for Identifier: ${expression.name} (Scope: ${scope.path})`);
                    break;
                }
                type = scopeReference.types.join('|');
                break;
            }
            case 'FunctionDeclaration':
                // TODO - Implement.
                type = 'fun';
                break;
            case 'StringLiteral': {
                type = 'string';
                defaultValue = `${expression.value}`;
                break;
            }
            case 'NumericLiteral': {
                type = 'number';
                defaultValue = `${expression.value}`;
                break;
            }
            case 'BooleanLiteral': {
                type = 'boolean';
                defaultValue = `${expression.value}`;
                break;
            }
            case 'NilLiteral': {
                type = 'nil';
                defaultValue = 'nil';
                break;
            }
            case 'VarargLiteral': {
                // TODO - Implement.
                type = `vararg`;
                defaultValue = expression.value;
                break;
            }
            case 'TableConstructorExpression':
                type = discoverTableConstructorType(expression, scope);
                break;
            case 'BinaryExpression': {
                type = 'number';
                break;
            }
            case 'LogicalExpression': {
                type = 'boolean';
                break;
            }
            case 'UnaryExpression': {
                switch (expression.operator) {
                    case '~':
                    case 'not': {
                        type = 'boolean';
                        break;
                    }
                    case '-':
                    case '#': {
                        type = 'number';
                        break;
                    }
                }
            }
        }
        // Lastly check for known API for types.
        if (!type) {
            const str = (0, String_2.expressionToString)(expression);
            type = (0, KnownTypes_1.getKnownType)(str);
        }
        return { type, defaultValue };
    }
    exports.discoverType = discoverType;
    function discoverBodyReturnTypes(body, scope) {
        let returnTypes = [];
        const into = (body) => {
            for (const x of body) {
                switch (x.type) {
                    // Ignore functions. This is a separate return body.
                    case 'FunctionDeclaration': {
                        break;
                    }
                    // Ignore simple statements which doesn't relate to returns directly.
                    case 'LabelStatement':
                    case 'BreakStatement':
                    case 'LocalStatement':
                    case 'AssignmentStatement':
                    case 'CallStatement': {
                        break;
                    }
                    case 'GotoStatement': {
                        break;
                    }
                    // What we're looking for.
                    case 'ReturnStatement': {
                        // Discover any immediately identifiable types here and add to the 
                        // function's return types.
                        for (const arg of x.arguments) {
                            const discoveredArgType = discoverType(arg, scope);
                            const { type: argType } = discoveredArgType;
                            if (argType && returnTypes.indexOf(argType) === -1) {
                                returnTypes.push(argType);
                            }
                        }
                        break;
                    }
                    // Loops to look into.
                    case 'WhileStatement':
                    case 'DoStatement':
                    case 'RepeatStatement':
                    case 'ForNumericStatement':
                    case 'ForGenericStatement': {
                        into(x.body);
                        break;
                    }
                    // If statements use clauses so same as above loops.
                    case 'IfStatement': {
                        for (const clause of x.clauses) {
                            into(clause.body);
                        }
                        break;
                    }
                }
            }
        };
        into(body);
        return returnTypes;
    }
    exports.discoverBodyReturnTypes = discoverBodyReturnTypes;
    function discoverReturnType(statement, scope) {
        const returnTypes = [];
        // Discover any immediately identifiable types here and add to the 
        // function's return types.
        for (const arg of statement.arguments) {
            const discoveredArgType = discoverType(arg, scope);
            const { type: argType } = discoveredArgType;
            if (argType && returnTypes.indexOf(argType) === -1) {
                returnTypes.push(argType);
            }
        }
        return returnTypes;
    }
    exports.discoverReturnType = discoverReturnType;
    function discoverFunctionDeclaration(globalInfo, expression, scope) {
        const { scope: __G } = globalInfo;
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
                    name = (0, String_2.memberExpressionToString)(expression.identifier);
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
        let func;
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
                        });
                        break;
                    }
                }
            }
            name = name.indexOf('.') !== -1 ? name.split('.').pop() : name;
            let selfAlias = 'self';
            let type = 'function';
            if (name === 'new') {
                type = 'constructor';
                selfAlias = '';
            }
            if (type === 'constructor') {
                func = {
                    type: 'ScopeConstructor',
                    init: expression,
                    params,
                    values: {},
                    selfAlias,
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
                    params,
                    values: {},
                    selfAlias,
                    returns,
                };
            }
            scopeFunc = new Scope_2.Scope(func, scopeToAssign);
            // Add our params to the constructor's scope as variable children.
            for (const param of params) {
                new Scope_2.Scope(param, scopeFunc);
                func.values[param.name] = param;
            }
        }
        // Handle body statements.
        for (const statement of expression.body) {
            discoverStatement(globalInfo, statement, scopeFunc);
        }
        // Handle return statements.
        func = scopeFunc.element;
        if (func.type === 'ScopeFunction') {
            const returnTypes = func.returns.types;
            for (const child of Object.values(scopeFunc.children)) {
                if (child.name.startsWith('___return')) {
                    if (child.types.length) {
                        for (const childType of child.types) {
                            if (returnTypes.indexOf(childType) === -1)
                                returnTypes.push(childType);
                        }
                    }
                }
            }
            // Forward types to Scope.
            for (const type of returnTypes) {
                if (scopeFunc.types.indexOf(type) === -1)
                    scopeFunc.types.push(type);
            }
        }
        return 0;
    }
    exports.discoverFunctionDeclaration = discoverFunctionDeclaration;
    function discoverLabelStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const labelBlock = {
            type: 'ScopeLabel',
            init: statement,
            name: statement.label.name,
        };
        new Scope_2.Scope(labelBlock, scope);
        return changes;
    }
    exports.discoverLabelStatement = discoverLabelStatement;
    function discoverBreakStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const breakBlock = {
            type: 'ScopeBreak',
            init: statement,
        };
        new Scope_2.Scope(breakBlock, scope);
        return changes;
    }
    exports.discoverBreakStatement = discoverBreakStatement;
    function discoverGotoStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const gotoBlock = {
            type: 'ScopeGoto',
            init: statement,
            label: statement.label.name,
        };
        new Scope_2.Scope(gotoBlock, scope);
        return changes;
    }
    exports.discoverGotoStatement = discoverGotoStatement;
    function discoverReturnStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        let bodyScope = scope.getBodyScope();
        // TODO - Implement ScopeFile and use this instead of global scope.
        const bodyScope2 = bodyScope ? bodyScope : __G;
        const returnBlock = {
            type: 'ScopeReturn',
            init: statement,
            types: discoverReturnType(statement, bodyScope2),
        };
        new Scope_2.Scope(returnBlock, scope);
        return changes;
    }
    exports.discoverReturnStatement = discoverReturnStatement;
    function discoverLocalStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        let changes = 0;
        // (Support for tuples)
        for (let index = 0; index < statement.variables.length; index++) {
            const name = statement.variables[index].name;
            // We already defined this local.
            if (scope.children[name]) {
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
            };
            // (Self-assigning)
            const lScope = new Scope_2.Scope(variable, scope, index, name);
            // Identify & link scopes for any relationships.
            discoverRelationships(init, lScope, index);
            // Attempt to get the type for the next initialized variable.
            const initTypes = discoverType(init, lScope);
            if (initTypes.type && types.indexOf(initTypes.type) === -1) {
                types.push(initTypes.type);
            }
            // Lastly check for known API for types.
            if (!types.length) {
                const str = (0, String_2.expressionToString)(init);
                const kType = (0, KnownTypes_1.getKnownType)(str);
                if (kType)
                    if (types.indexOf(kType) === -1)
                        types.push(kType);
            }
            // Push up to scope.
            for (const type of types) {
                if (lScope.types.indexOf(type) === -1)
                    lScope.types.push(type);
            }
            changes++;
        }
        return changes;
    }
    exports.discoverLocalStatement = discoverLocalStatement;
    function discoverAssignmentStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const assignmentBlock = {
            type: 'ScopeAssignment',
            init: statement,
        };
        const scopeAssignment = new Scope_2.Scope(assignmentBlock, scope);
        // (Tuple support)
        for (let index = 0; index < statement.variables.length; index++) {
            const variable = statement.variables[index];
            const init = statement.init[index];
            switch (variable.type) {
                case 'IndexExpression': {
                    const varIndex = variable.index;
                    const scopeBase = scope.resolve((0, String_2.expressionToString)(variable.base));
                    if (!scopeBase) {
                        console.warn(`Unresolved assignment IndexExpression.base: ${(0, String_2.expressionToString)(variable.base)} (Scope: ${scopeAssignment.path})`);
                        return 0;
                    }
                    const scopeIndex = scope.resolve((0, String_2.expressionToString)(varIndex));
                    if (!scopeIndex) {
                        console.warn(`Unresolved assignment IndexExpression.index: ${(0, String_2.expressionToString)(variable.index)} (Scope: ${scopeAssignment.path})`);
                        return 0;
                    }
                    const varType = discoverType(init, scope).type;
                    // At this point the resolved base scope MUST be a table.
                    if (scopeBase.types.indexOf('table') === -1)
                        scopeBase.types.push('table');
                    // If the indexer has a known type, add this to the key-types 
                    // for the base table.
                    if (scopeIndex.types.length) {
                        for (const type of scopeIndex.types) {
                            if (scopeBase.keyTypes.indexOf(type) === -1) {
                                scopeBase.keyTypes.push(type);
                            }
                        }
                    }
                    // Add the value-type to the table-scope.
                    if (varType && varType.length && scopeBase.valueType.indexOf(varType) === -1) {
                        scopeBase.valueType.push(varType);
                    }
                    break;
                }
                case 'MemberExpression': {
                    // Ignore PZ class declarations.
                    // if(variable.identifier.name === 'derive') {
                    // break;
                    // }
                    // throw new Error('Not implemented.');
                    break;
                }
                case 'Identifier': {
                    // Ignore PZ class declarations.
                    // if (init.type === 'CallExpression'
                    //     && init.base.type === 'MemberExpression'
                    //     && init.base.identifier.name === 'derive'
                    // ) {
                    //     break;
                    // }
                    // console.warn(variable);
                    // console.warn(statement);
                    // throw new Error('Not implemented.');
                    break;
                }
            }
        }
        return changes;
    }
    exports.discoverAssignmentStatement = discoverAssignmentStatement;
    function discoverCallExpression(globalInfo, expression, scope) {
        // This needs recursion.
        // For all expressions, use order proper.
        // If a sub-expression exists, use it. If unresolved type, discard it.
        // If reference to something, add reference.
        console.log(`Discovering relationships for CallExpression: ${(0, String_2.expressionToString)(expression)}`);
    }
    exports.discoverCallExpression = discoverCallExpression;
    function discoverCallStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        // What we can do in the future is take the parameters and try to match up literals or operations using references 
        // to build references to spread types. Otherwise this call is useless for our needs.
        console.log(`Discovering relationships for CallStatement: ${(0, String_2.statementToString)(statement)}`);
        discoverRelationships(statement.expression, scope);
        return changes;
    }
    exports.discoverCallStatement = discoverCallStatement;
    function discoverIfStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        // All content is in the clauses of the if block.
        for (const clause of statement.clauses) {
            const ifClause = {
                type: 'ScopeIfClauseBlock',
                init: clause,
                values: {}
            };
            const scopeClause = new Scope_2.Scope(ifClause, scope);
            // Try to discover any clause conditions like we do call-expression parameters.
            if (clause.type === 'IfClause' || clause.type === 'ElseifClause') {
                discoverRelationships(clause.condition, scope);
            }
            // Go through body of clause.
            for (const next of clause.body) {
                discoverStatement(globalInfo, next, scopeClause);
            }
        }
        return changes;
    }
    exports.discoverIfStatement = discoverIfStatement;
    function discoverWhileStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const whileBlock = {
            type: 'ScopeWhileBlock',
            init: statement,
            values: {}
        };
        const scopeIf = new Scope_2.Scope(whileBlock, scope);
        // Try to discover conditions like we do call-expression parameters.
        discoverRelationships(statement.condition, scope);
        // Go through body.
        for (const next of statement.body) {
            discoverStatement(globalInfo, next, scopeIf);
        }
        return changes;
    }
    exports.discoverWhileStatement = discoverWhileStatement;
    function discoverDoStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const doBlock = {
            type: 'ScopeDoBlock',
            init: statement,
            values: {}
        };
        const scopeIf = new Scope_2.Scope(doBlock, scope);
        // Go through body.
        for (const next of statement.body) {
            discoverStatement(globalInfo, next, scopeIf);
        }
        return changes;
    }
    exports.discoverDoStatement = discoverDoStatement;
    function discoverRepeatStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const doBlock = {
            type: 'ScopeRepeatBlock',
            init: statement,
            values: {}
        };
        const scopeIf = new Scope_2.Scope(doBlock, scope);
        // Try to discover conditions like we do call-expression parameters.
        discoverRelationships(statement.condition, scope);
        // Go through body.
        for (const next of statement.body) {
            discoverStatement(globalInfo, next, scopeIf);
        }
        return changes;
    }
    exports.discoverRepeatStatement = discoverRepeatStatement;
    function discoverForNumericStatement(globalInfo, statement, scope) {
        const { scope: __G } = globalInfo;
        const changes = 0;
        const forNumericBlock = {
            type: 'ScopeForNumericBlock',
            init: statement,
            values: {}
        };
        const scopeForNumeric = new Scope_2.Scope(forNumericBlock, scope);
        let scopeVariable;
        const { variable } = statement;
        if (variable) {
            const { name } = variable;
            let scopeVariable = scope.resolve(name);
            if (!scopeVariable) {
                const forVariable = {
                    type: 'ScopeVariable',
                    name,
                    init: variable,
                    index: 0,
                    types: ['number'],
                };
                scopeVariable = new Scope_2.Scope(forVariable, scopeForNumeric, 0, name);
            }
        }
        // Try to discover any relationships like we do call-expression parameters.
        if (scopeVariable) {
            discoverRelationships(statement.start, scope);
            discoverRelationships(statement.end, scope);
            if (statement.step)
                discoverRelationships(statement.step, scope);
        }
        // Go through body.
        for (const next of statement.body) {
            discoverStatement(globalInfo, next, scopeForNumeric);
        }
        return changes;
    }
    exports.discoverForNumericStatement = discoverForNumericStatement;
    function discoverForGenericStatement(globalInfo, statement, scope) {
        var _a, _b;
        const { scope: __G } = globalInfo;
        const changes = 0;
        const blockForGeneric = {
            type: 'ScopeForGenericBlock',
            init: statement,
            values: {}
        };
        const scopeForGeneric = new Scope_2.Scope(blockForGeneric, scope);
        const scopeVars = [];
        // Recognize any variables in the loop.
        for (let index = 0; index < statement.variables.length; index++) {
            const variable = statement.variables[index];
            const { name } = variable;
            let scopeVariable = scope.resolve(name);
            if (!scopeVariable) {
                const element = {
                    type: 'ScopeVariable',
                    name,
                    init: variable,
                    types: [],
                    index
                };
                scopeVars.push(new Scope_2.Scope(element, scopeForGeneric, index, name));
            }
        }
        // Hack: for key in pairs(table) do end
        if (statement.variables.length === 1 && statement.iterators.length === 1
            && statement.iterators[0].type === 'CallExpression'
            && statement.iterators[0].base.type === 'Identifier'
            && statement.iterators[0].base.name === 'pairs') {
            let type = (_a = discoverType(statement.iterators[0].arguments[0], scope).type) === null || _a === void 0 ? void 0 : _a.replace('[]', '');
            if (!type) {
                // if (type === 'table') {
                console.warn(`Unresolved table key-type for pairs(): ${(0, String_2.expressionToString)(statement.iterators[0].arguments[0])} (using 'any')`);
                // }
            }
            else {
                if (type === 'table') {
                    switch (statement.iterators[0].arguments[0].type) {
                        case 'Identifier': {
                            const scopeTable = scope.resolve(statement.iterators[0].arguments[0].name);
                            if (!scopeTable) {
                                console.error(`Table not found: ${statement.iterators[0].arguments[0].name} (Using value-type 'any')`);
                                type = 'any';
                                break;
                            }
                            type = scopeTable.valueType.join('|');
                            break;
                        }
                        default: {
                            console.error(`Unimplemented expression type for for-generic pairs() table arg: ${statement.iterators[0].arguments[0].type} (Using value-type 'any')`);
                            type = 'any';
                            break;
                        }
                    }
                }
                if (scopeVars[0].types.indexOf(type) === -1)
                    scopeVars[0].types.push(type);
                const element = scopeVars[0].element;
                if (element.types.indexOf(type) === -1)
                    element.types.push(type);
            }
        }
        // Hack: for index, value in ipairs(table) do end
        else if (statement.variables.length === 2 && statement.iterators.length === 1
            && statement.iterators[0].type === 'CallExpression'
            && statement.iterators[0].base.type === 'Identifier'
            && statement.iterators[0].base.name === 'ipairs') {
            // First argument-type is always 'integer'.
            if (scopeVars[0].types.indexOf('integer') === -1)
                scopeVars[0].types.push('integer');
            let type = (_b = discoverType(statement.iterators[0].arguments[0], scope).type) === null || _b === void 0 ? void 0 : _b.replace('[]', '');
            if (!type) {
                // if (type === 'table') {
                console.warn(`Unresolved table value-type for ipairs(): ${(0, String_2.expressionToString)(statement.iterators[0].arguments[0])} (using 'any')`);
                // }
            }
            else {
                if (scopeVars[1].types.indexOf(type) === -1)
                    scopeVars[1].types.push(type);
                const element = scopeVars[1].element;
                if (element.types.indexOf(type) === -1)
                    element.types.push(type);
            }
        }
        // Misc generic returns. Look for tuple returns and if so assign the types.
        else {
            // TODO: Implement.
        }
        // Go through body.
        for (const next of statement.body) {
            discoverStatement(globalInfo, next, scopeForGeneric);
        }
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
        console.log(statements);
        for (let pass = 0; pass < 2; pass++) {
            for (const statement of statements) {
                discoverStatement(globalInfo, statement, globalInfo.scope);
            }
        }
    }
    exports.discoverFile = discoverFile;
});
define("src/asledgehammer/rosetta/lua/wizard/PZ", ["require", "exports", "src/asledgehammer/rosetta/lua/wizard/String", "src/asledgehammer/rosetta/lua/wizard/Scope", "src/asledgehammer/rosetta/lua/wizard/Discover", "src/asledgehammer/rosetta/lua/wizard/KnownTypes"], function (require, exports, String_3, Scope_3, Discover_1, KnownTypes_2) {
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
        };
        const scope = new Scope_3.Scope(scopeClass, global);
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
     * @param expression The statement to process.
     *
     * @returns
     */
    function getPZExecutable(global, clazz, expression) {
        // Check if assigned as a member declaration.
        if (expression.identifier == null)
            return undefined;
        if (expression.identifier.type !== 'MemberExpression')
            return undefined;
        // Verify that the base assignment table is the class.
        if (expression.identifier.base.type !== 'Identifier')
            return undefined;
        if (expression.identifier.base.name !== clazz)
            return undefined;
        // Grab the function / method name.
        if (expression.identifier.identifier.type !== 'Identifier')
            return undefined;
        const name = expression.identifier.identifier.name;
        let selfAlias = 'self';
        // Get type.
        let type = 'function';
        if (name === 'new') {
            type = 'constructor';
            // Grab the alias used to return in the constructor.
            selfAlias = '';
            for (let index = expression.body.length - 1; index >= 0; index--) {
                const next = expression.body[index];
                if (next.type !== 'ReturnStatement')
                    continue;
                // Sanity check for bad Lua code.
                if (!next.arguments.length) {
                    throw new Error(`class Constructor ${clazz}:new() has invalid return!`);
                }
                // Assign the constructor-alias for 'self'.
                const arg0 = next.arguments[0];
                selfAlias = (0, String_3.expressionToString)(arg0);
                break;
            }
            // Sanity check for bad Lua code.
            if (!selfAlias.length) {
                throw new Error(`Class constructor ${clazz}:new() has no alias for 'self'.`);
            }
        }
        else if (expression.identifier.indexer === ':') {
            type = 'method';
        }
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
                    });
                    break;
                }
            }
        }
        let scopeFunc;
        if (type === 'constructor') {
            scopeFunc = {
                type: 'ScopeConstructor',
                init: expression,
                params,
                values: {},
                selfAlias,
            };
        }
        else {
            scopeFunc = {
                type: 'ScopeFunction',
                init: expression,
                name,
                params,
                values: {},
                selfAlias,
                returns: {
                    type: 'ScopeReturn',
                    types: (0, Discover_1.discoverBodyReturnTypes)(expression.body, global),
                },
            };
        }
        const scope = new Scope_3.Scope(scopeFunc, global);
        // Add our params to the constructor's scope as variable children.
        for (const param of params) {
            new Scope_3.Scope(param, scope);
            scopeFunc.values[param.name] = param;
        }
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
                types.push('vararg');
                defaultValue = init0.value;
                break;
            }
            case 'TableConstructorExpression': {
                // TODO - Figure out how to assign table-like key-values as type-assigned.
                types.push('table');
                break;
            }
            case 'MemberExpression': {
                // TODO - Implement.
                break;
            }
            default: {
                break;
            }
        }
        const property = {
            type: 'ScopeVariable',
            name,
            types: [],
            init: statement,
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
        const scope = new Scope_3.Scope(property, scopeToAssign, 0, name);
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
        (0, KnownTypes_2.initKnownTypes)(global.scope);
        getPZClasses(global, statements);
    }
    exports.scanFile = scanFile;
});
define("src/asledgehammer/rosetta/lua/wizard/ScopeString", ["require", "exports", "luaparse", "src/asledgehammer/rosetta/lua/wizard/String"], function (require, exports, ast, String_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scopeChunkToString = exports.scopeStatementToString = exports.scopeExpressionToString = exports.scopeCallStatementToString = exports.scopeAssignmentStatementToString = exports.scopeTableConstructorExpressionToString = exports.scopeIfStatementToString = exports.scopeElseClauseToString = exports.scopeElseIfClauseToString = exports.scopeIfClauseToString = exports.scopeForGenericStatementToString = exports.scopeForNumericStatementToString = exports.scopeRepeatStatementToString = exports.scopeDoStatementToString = exports.scopeWhileStatementToString = exports.scopeFunctionDeclarationToString = exports.scopeBodyToString = exports.scopeParametersToString = exports.scopeVarargLiteralToString = exports.scopeLocalStatementToString = exports.scopeBreakStatementToString = exports.scopeLabelStatementToString = exports.scopeGotoStatementToString = exports.scopeReturnStatementToString = exports.scopeCallExpressionToString = exports.scopeMemberExpressionToString = exports.scopeArgsToString = exports.scopeBinaryExpressionToString = exports.scopeTableCallExpressionToString = exports.scopeStringCallExpressionToString = exports.scopeUnaryExpressionToString = exports.scopeLogicalExpressionToString = exports.scopeIndexExpressionToString = exports.scopeIdentifierToString = exports.scopeLiteralToString = exports.indent0 = exports.indent = void 0;
    // @ts-ignore
    const luaparse = ast.default;
    ;
    function indent(options) {
        return Object.assign(Object.assign({}, options), { indent: options.indent + 1 });
    }
    exports.indent = indent;
    function indent0(options) {
        return Object.assign(Object.assign({}, options), { indent: 0 });
    }
    exports.indent0 = indent0;
    function scopeLiteralToString(literal, options) {
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
    exports.scopeLiteralToString = scopeLiteralToString;
    function scopeIdentifierToString(identifier, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${identifier.name}`;
    }
    exports.scopeIdentifierToString = scopeIdentifierToString;
    function scopeIndexExpressionToString(expression, options) {
        return `${scopeExpressionToString(expression.base, indent0(options))}[${scopeExpressionToString(expression.index, indent0(options))}]`;
    }
    exports.scopeIndexExpressionToString = scopeIndexExpressionToString;
    function scopeLogicalExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${scopeExpressionToString(expression.left, indent0(options))} ${expression.operator} ${scopeExpressionToString(expression.right, indent0(options))}`;
    }
    exports.scopeLogicalExpressionToString = scopeLogicalExpressionToString;
    function scopeUnaryExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${expression.operator} ${scopeExpressionToString(expression.argument, indent0(options))}`;
    }
    exports.scopeUnaryExpressionToString = scopeUnaryExpressionToString;
    function scopeStringCallExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        const base = scopeExpressionToString(expression.base, indent0(options));
        const arg = scopeExpressionToString(expression.argument, indent0(options));
        console.log(expression);
        return `${i}${base} ${arg}`;
    }
    exports.scopeStringCallExpressionToString = scopeStringCallExpressionToString;
    function scopeTableCallExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        console.log(expression);
        throw new Error('Not implemented.');
    }
    exports.scopeTableCallExpressionToString = scopeTableCallExpressionToString;
    function scopeBinaryExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${scopeExpressionToString(expression.left, indent0(options))} ${expression.operator} ${scopeExpressionToString(expression.right, indent0(options))}`;
    }
    exports.scopeBinaryExpressionToString = scopeBinaryExpressionToString;
    function scopeArgsToString(args2, options) {
        const i = ' '.repeat(options.indent * 4);
        const args = [];
        for (const arg of args2)
            args.push(scopeExpressionToString(arg, indent0(options)));
        return `${i}${args.join(', ')}`;
    }
    exports.scopeArgsToString = scopeArgsToString;
    function scopeMemberExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${scopeExpressionToString(expression.base, indent0(options))}${expression.indexer}${expression.identifier.name}`;
    }
    exports.scopeMemberExpressionToString = scopeMemberExpressionToString;
    function scopeCallExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${scopeExpressionToString(expression.base, indent0(options))}(${scopeArgsToString(expression.arguments, indent0(options))})`;
    }
    exports.scopeCallExpressionToString = scopeCallExpressionToString;
    function scopeReturnStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const args = [];
        for (const arg of statement.arguments)
            args.push(scopeExpressionToString(arg, indent0(options)));
        return `${i}return${args.length ? ` ${args.join(', ')}` : ''}`;
    }
    exports.scopeReturnStatementToString = scopeReturnStatementToString;
    function scopeGotoStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}goto $${statement.label}`;
    }
    exports.scopeGotoStatementToString = scopeGotoStatementToString;
    function scopeLabelStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}::${statement.label}::`;
    }
    exports.scopeLabelStatementToString = scopeLabelStatementToString;
    function scopeBreakStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}break`;
    }
    exports.scopeBreakStatementToString = scopeBreakStatementToString;
    function scopeLocalStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        // The local name(s).
        const vars = [];
        for (const _var_ of statement.variables)
            vars.push(_var_.name);
        // The value(s) to set.
        const inits = [];
        for (const i of statement.init)
            inits.push((0, String_4.expressionToString)(i));
        let s = '';
        // Grab scopes.
        const scopes = [];
        for (let index = 0; index < inits.length; index++) {
            const varName = vars[index];
            const scopeVar = options.scope.resolve(varName);
            scopes.push(scopeVar);
        }
        s += `${i}--- @type `;
        for (let index = 0; index < scopes.length; index++) {
            const scopeInit = scopes[index];
            if (scopeInit) {
                if (scopeInit.types.length) {
                    for (let next of scopeInit.types) {
                        // If the table also has registered key-value 
                        // types, add them to the annotated type.
                        if (next === 'table' && scopeInit.keyTypes.length && scopeInit.valueType.length) {
                            next += `<${scopeInit.keyTypes.join('|')}, ${scopeInit.valueType.join('|')}>`;
                        }
                        s += `${next}|`;
                    }
                    s = s.substring(0, s.length - 1);
                    s += ', ';
                }
                else {
                    s += 'any, ';
                }
            }
            else {
                s += 'any, ';
            }
        }
        if (s[s.length - 2] === ',' && s[s.length - 1] === ' ')
            s = s.substring(0, s.length - 2);
        s += '\n';
        // Main line.
        s += `${i}local ${vars.join(', ')} = ${inits.join(', ')}`;
        return s;
    }
    exports.scopeLocalStatementToString = scopeLocalStatementToString;
    function scopeVarargLiteralToString(param, options) {
        const i = ' '.repeat(options.indent * 4);
        return `${i}${param.raw}`;
    }
    exports.scopeVarargLiteralToString = scopeVarargLiteralToString;
    function scopeParametersToString(params, options) {
        const ps = [];
        for (const param of params) {
            switch (param.type) {
                case 'Identifier': {
                    ps.push(scopeIdentifierToString(param, options));
                    break;
                }
                case 'VarargLiteral': {
                    ps.push(scopeVarargLiteralToString(param, options));
                    break;
                }
            }
        }
        return ps.join(', ');
    }
    exports.scopeParametersToString = scopeParametersToString;
    function scopeBodyToString(body, options) {
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
            s += `${leadingNewline ? '\n' : ''}${scopeStatementToString(currStatement, options)}${endingSemicolon ? ';' : ''}\n${endingNewline ? '\n' : ''}`;
        }
        // Remove the last newline. (If present)
        if (s.length)
            s = s.substring(0, s.length - 1);
        return s;
    }
    exports.scopeBodyToString = scopeBodyToString;
    /**
     * Renders a Lua function declaration as a string.
     *
     * @param func The function to render.
     * @param options Passed options on indenting the code.
     * @returns The function rendered as a string.
     */
    function scopeFunctionDeclarationToString(func, options) {
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
                    name = scopeMemberExpressionToString(func.identifier, indent0(options));
                    break;
                }
            }
        }
        const scopeFunc = options.scope.resolve(name);
        let s = '';
        if (scopeFunc) {
            options2.scope = scopeFunc;
            const elemFunc = scopeFunc.element;
            if (elemFunc) {
                s += '';
                // Generate params documentation.
                if (func.parameters.length) {
                    if (s.length)
                        s += `${i}---\n`;
                    for (const param of func.parameters) {
                        let paramName = '';
                        switch (param.type) {
                            case 'Identifier': {
                                paramName = param.name;
                                break;
                            }
                            case 'VarargLiteral': {
                                paramName = param.value;
                                break;
                            }
                        }
                        const scopeParam = scopeFunc.resolve(paramName);
                        if (scopeParam) {
                            s += `${i}--- @param ${paramName} ${scopeParam.types.length ? scopeParam.types.join('|') : 'any'}\n`;
                        }
                        else {
                            s += `${i}--- @param ${paramName} any\n`;
                        }
                    }
                }
                // Generate returns documentation.
                if (scopeFunc.types.length) {
                    if (s.length)
                        s += `${i}---\n`;
                    s += `${i}--- @return ${scopeFunc.types.join('|')}\n`;
                }
            }
        }
        /* (Build the function's declaration) */
        s += `${i}${func.isLocal ? 'local ' : ''}function${name && name.length ? ` ${name}` : ''}(${scopeParametersToString(func.parameters, indent0(options))})`;
        // Only render multi-line functions if its body is populated.
        if (func.body.length) {
            s += '\n';
            s += `${scopeBodyToString(func.body, options2)}\n`;
            s += `${i}end`;
        }
        else {
            s += ' end';
        }
        return s;
    }
    exports.scopeFunctionDeclarationToString = scopeFunctionDeclarationToString;
    function scopeWhileStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}while ${scopeExpressionToString(statement.condition, indent0(options))} do\n`;
        s += `${scopeBodyToString(statement.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.scopeWhileStatementToString = scopeWhileStatementToString;
    function scopeDoStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}do\n`;
        s += `${scopeBodyToString(statement.body, indent0(options)), options2}\n`;
        s += `${i}end`;
        return s;
    }
    exports.scopeDoStatementToString = scopeDoStatementToString;
    function scopeRepeatStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}repeat\n`;
        s += `${scopeBodyToString(statement.body, options2)}\n`;
        s += `${i}until ${statement.condition};`;
        return s;
    }
    exports.scopeRepeatStatementToString = scopeRepeatStatementToString;
    function scopeForNumericStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        // the numeric value can be a integer or float value, so use the type 'number'. 
        let s = `${i}--- @type number\n${i}for ${scopeIdentifierToString(statement.variable, indent0(options))} = ${scopeExpressionToString(statement.start, indent0(options))}, ${scopeExpressionToString(statement.end, indent0(options))}`;
        if (statement.step)
            s += `, ${scopeExpressionToString(statement.step, indent0(options))}`; // (Optional 3rd step argument)
        s += ` do\n${scopeBodyToString(statement.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.scopeForNumericStatementToString = scopeForNumericStatementToString;
    function scopeForGenericStatementToString(statement, options) {
        const scopeForGeneric = statement.scope;
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        const vars = [];
        for (const variable of statement.variables)
            vars.push(variable.name);
        const iterate = [];
        for (const iterator of statement.iterators) {
            iterate.push(scopeExpressionToString(iterator, indent0(options)));
        }
        let s = '';
        // Render parameter type-annotations. 
        for (const varName of vars) {
            const scopeVar = scopeForGeneric.resolve(varName);
            console.warn(scopeVar);
            let type = 'any';
            if (scopeVar && scopeVar.types.length)
                type = scopeVar.types.join('|');
            s += `${i}--- @param ${varName} ${type}\n`;
        }
        s += `${i}for ${vars.join(', ')} in ${iterate.join(', ')} do\n`;
        s += `${scopeBodyToString(statement.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.scopeForGenericStatementToString = scopeForGenericStatementToString;
    function scopeIfClauseToString(clause, isLastClause, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}if ${scopeExpressionToString(clause.condition, indent0(options))} then\n`;
        s += `${scopeBodyToString(clause.body, options2)}\n`;
        if (isLastClause)
            s += `${i}end`;
        return s;
    }
    exports.scopeIfClauseToString = scopeIfClauseToString;
    function scopeElseIfClauseToString(clause, isLastClause, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}elseif ${scopeExpressionToString(clause.condition, indent0(options))} then\n`;
        s += `${scopeBodyToString(clause.body, options2)}\n`;
        if (isLastClause)
            s += `${i}end`;
        return s;
    }
    exports.scopeElseIfClauseToString = scopeElseIfClauseToString;
    function scopeElseClauseToString(clause, options) {
        const i = ' '.repeat(options.indent * 4);
        const options2 = indent(options);
        let s = `${i}else\n`;
        s += `${scopeBodyToString(clause.body, options2)}\n`;
        s += `${i}end`;
        return s;
    }
    exports.scopeElseClauseToString = scopeElseClauseToString;
    function scopeIfStatementToString(statement, options) {
        let s = '';
        for (let index = 0; index < statement.clauses.length; index++) {
            const isLastClause = index === statement.clauses.length - 1;
            const clause = statement.clauses[index];
            switch (clause.type) {
                case 'IfClause': {
                    s += `${scopeIfClauseToString(clause, isLastClause, options)}`;
                    break;
                }
                case 'ElseifClause': {
                    s += `${scopeElseIfClauseToString(clause, isLastClause, options)}`;
                    break;
                }
                case 'ElseClause': {
                    s += `${scopeElseClauseToString(clause, options)}`;
                    break;
                }
            }
        }
        return s;
    }
    exports.scopeIfStatementToString = scopeIfStatementToString;
    function scopeTableConstructorExpressionToString(expression, options) {
        const i = ' '.repeat(options.indent * 4);
        // Empty table.
        if (!expression.fields.length)
            return `${i}{}`;
        const entries = [];
        for (const field of expression.fields) {
            switch (field.type) {
                case 'TableKey': {
                    entries.push(`${scopeExpressionToString(field.key, indent0(options))} = ${scopeExpressionToString(field.value, indent0(options))}`);
                    break;
                }
                case 'TableKeyString': {
                    entries.push(`${field.key.name} = ${scopeExpressionToString(field.value, indent0(options))}`);
                    break;
                }
                case 'TableValue': {
                    entries.push(scopeExpressionToString(field.value, indent0(options)));
                    break;
                }
            }
        }
        return `${i}{ ${entries.join(', ')} }`;
    }
    exports.scopeTableConstructorExpressionToString = scopeTableConstructorExpressionToString;
    function scopeAssignmentStatementToString(statement, options) {
        const i = ' '.repeat(options.indent * 4);
        // The local name(s).
        const vars = [];
        for (const _var_ of statement.variables) {
            switch (_var_.type) {
                case 'Identifier': {
                    vars.push(scopeIdentifierToString(_var_, indent0(options)));
                    break;
                }
                case 'IndexExpression': {
                    vars.push(scopeIndexExpressionToString(_var_, indent0(options)));
                    break;
                }
                case 'MemberExpression': {
                    vars.push(scopeMemberExpressionToString(_var_, indent0(options)));
                    break;
                }
            }
        }
        // The value(s) to set.
        const inits = [];
        for (const init of statement.init)
            inits.push(scopeExpressionToString(init, indent0(options)));
        return `${i}${vars.join(', ')} = ${inits.join(', ')}`;
    }
    exports.scopeAssignmentStatementToString = scopeAssignmentStatementToString;
    function scopeCallStatementToString(statement, options) {
        console.log(statement);
        switch (statement.expression.type) {
            case 'CallExpression': return scopeCallExpressionToString(statement.expression, options);
            case 'StringCallExpression': return scopeStringCallExpressionToString(statement.expression, options);
            case 'TableCallExpression': return scopeTableCallExpressionToString(statement.expression, options);
        }
    }
    exports.scopeCallStatementToString = scopeCallStatementToString;
    function scopeExpressionToString(arg, options) {
        switch (arg.type) {
            case 'BooleanLiteral': return scopeLiteralToString(arg, options);
            case 'NumericLiteral': return scopeLiteralToString(arg, options);
            case 'NilLiteral': return scopeLiteralToString(arg, options);
            case 'StringLiteral': return scopeLiteralToString(arg, options);
            case 'VarargLiteral': return scopeLiteralToString(arg, options);
            case 'Identifier': return scopeIdentifierToString(arg, options);
            case 'BinaryExpression': return scopeBinaryExpressionToString(arg, options);
            case 'CallExpression': return scopeCallExpressionToString(arg, options);
            case 'FunctionDeclaration': return scopeFunctionDeclarationToString(arg, options);
            // We.. might need to push 'options' instead. Not sure yet..
            case 'MemberExpression': return scopeMemberExpressionToString(arg, indent0(options));
            case 'IndexExpression': return scopeIndexExpressionToString(arg, indent0(options));
            case 'TableConstructorExpression': return scopeTableConstructorExpressionToString(arg, indent0(options));
            case 'LogicalExpression': return scopeLogicalExpressionToString(arg, indent0(options));
            case 'UnaryExpression': return scopeUnaryExpressionToString(arg, indent0(options));
            case 'StringCallExpression': return scopeStringCallExpressionToString(arg, indent0(options));
            case 'TableCallExpression': return scopeTableCallExpressionToString(arg, indent0(options));
        }
    }
    exports.scopeExpressionToString = scopeExpressionToString;
    function scopeStatementToString(statement, options) {
        switch (statement.type) {
            case 'LocalStatement': return scopeLocalStatementToString(statement, options);
            case 'CallStatement': return scopeCallStatementToString(statement, options);
            case 'AssignmentStatement': return scopeAssignmentStatementToString(statement, options);
            case 'FunctionDeclaration': return scopeFunctionDeclarationToString(statement, options);
            case 'ReturnStatement': return scopeReturnStatementToString(statement, options);
            case 'IfStatement': return scopeIfStatementToString(statement, options);
            case 'ForNumericStatement': return scopeForNumericStatementToString(statement, options);
            case 'ForGenericStatement': return scopeForGenericStatementToString(statement, options);
            case 'BreakStatement': return scopeBreakStatementToString(statement, options);
            case 'WhileStatement': return scopeWhileStatementToString(statement, options);
            case 'RepeatStatement': return scopeRepeatStatementToString(statement, options);
            case 'DoStatement': return scopeDoStatementToString(statement, options);
            case 'LabelStatement': return scopeLabelStatementToString(statement, options);
            case 'GotoStatement': return scopeGotoStatementToString(statement, options);
        }
    }
    exports.scopeStatementToString = scopeStatementToString;
    function scopeChunkToString(chunk, options) {
        let s = '';
        console.log({ chunk });
        for (let index = 0; index < chunk.body.length; index++) {
            const currStatement = chunk.body[index + 0];
            const nextStatement = chunk.body[index + 1];
            switch (currStatement.type) {
                case 'LocalStatement': {
                    s += `${scopeLocalStatementToString(currStatement, options)};\n`;
                    break;
                }
                case 'FunctionDeclaration': {
                    s += `\n${scopeStatementToString(currStatement, options)}\n\n`;
                    break;
                }
                case 'AssignmentStatement': {
                    s += `${scopeAssignmentStatementToString(currStatement, options)};\n`;
                    break;
                }
                case 'LabelStatement':
                case 'BreakStatement':
                case 'GotoStatement':
                case 'ReturnStatement': {
                    s += `${scopeStatementToString(currStatement, options)};\n`;
                    break;
                }
                case 'IfStatement':
                case 'WhileStatement':
                case 'DoStatement':
                case 'ForNumericStatement':
                case 'ForGenericStatement':
                case 'RepeatStatement': {
                    s += `${scopeStatementToString(currStatement, options)};\n\n`;
                    break;
                }
                case 'CallStatement': {
                    const callStatement = currStatement;
                    s += `${scopeStatementToString(callStatement, options)};\n`;
                    break;
                }
                default: {
                    s += `${(0, String_4.statementToString)(currStatement, options)};\n`;
                    break;
                }
            }
        }
        return s;
    }
    exports.scopeChunkToString = scopeChunkToString;
});
define("src/asledgehammer/rosetta/lua/wizard/LuaParser", ["require", "exports", "luaparse", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/lua/wizard/PZ", "src/asledgehammer/rosetta/lua/wizard/Scope", "src/asledgehammer/rosetta/lua/wizard/Discover", "src/asledgehammer/rosetta/lua/wizard/ScopeString", "src/asledgehammer/rosetta/lua/wizard/KnownTypes"], function (require, exports, ast, RosettaLuaClass_2, RosettaLuaConstructor_2, PZ_1, Scope_4, Discover_2, ScopeString_1, KnownTypes_3) {
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
                clazz = new RosettaLuaClass_2.RosettaLuaClass(className);
                clazz.extendz = superClassName;
                if (superClassName !== 'ISBaseObject')
                    clazz.extendz = superClassName;
                // At this point we absolutely know that this is a pz-class declaration.
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
                        varType = 'vararg';
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
                                varType = 'vararg';
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
                    }
                }
            };
            if (conzstructor) {
                handleConstructor(conzstructor);
            }
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
                        const globalScope = new Scope_4.Scope();
                        window.__G = globalScope;
                        const globalInfo = {
                            classes: {},
                            tables: {},
                            values: {},
                            funcs: {},
                            scope: globalScope
                        };
                        (0, KnownTypes_3.initKnownTypes)(globalScope);
                        (0, PZ_1.scanFile)(globalInfo, chunk.body);
                        (0, Discover_2.discoverFile)(globalInfo, chunk.body);
                        const outLua = (0, ScopeString_1.scopeChunkToString)(chunk, { indent: 0, scope: globalScope });
                        navigator.clipboard.writeText(outLua);
                        console.log("### LuaWizard ###");
                        console.log(globalInfo);
                        console.log(globalInfo.scope.map);
                        console.log(`__G.map.length = ${Object.keys(globalInfo.scope.map).length}`);
                        console.log({ lua: outLua });
                        ////////////////////
                        const clazz = _this.parse(chunk);
                        if (clazz) {
                            const card = app.showLuaClass(clazz);
                            app.renderCode();
                            app.sidebar.populateTrees();
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
define("src/asledgehammer/rosetta/java/JavaGenerator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateJavaClass = exports.generateJavaMethod = exports.generateJavaConstructor = exports.generateJavaParameterBody = exports.generateJavaField = void 0;
    function generateJavaField(field) {
        let s = '';
        // Description
        if (field.notes && field.notes.length) {
            const notes = field.notes.split('\n').join(' ');
            s += `${notes}\n`;
        }
        while (s.endsWith('\n'))
            s = s.substring(0, s.length - 1);
        return `--- @field ${field.name} ${field.type.basic} ${s.trim()}`;
    }
    exports.generateJavaField = generateJavaField;
    function generateJavaParameterBody(params) {
        let s = '';
        if (params.length) {
            for (const param of params) {
                s += `${param.name}, `;
            }
            s = s.substring(0, s.length - 2);
        }
        return `(${s})`;
    }
    exports.generateJavaParameterBody = generateJavaParameterBody;
    function generateJavaConstructor(className, methods) {
        if (!methods.length)
            return '';
        methods.sort((a, b) => a.parameters.length - b.parameters.length);
        let s = '';
        // Parameter(s).
        let maxParams = 0;
        const _paramNames = [];
        const _paramTypes = [];
        const _overloads = [];
        for (const method of methods) {
            const { parameters } = method;
            if (parameters.length > maxParams) {
                maxParams = parameters.length;
            }
            let _overload = `fun(`;
            let oParams = '';
            for (const param of method.parameters) {
                oParams += `${param.name}: ${param.type.basic}, `;
            }
            if (oParams.length)
                oParams = oParams.substring(0, oParams.length - 2);
            _overload += `${oParams}): ${className}`;
            _overloads.push(_overload);
        }
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
        // Documentation.
        let ds = '--- @public\n';
        if (methods.length > 1) {
            for (let index = 0; index < methods.length; index++) {
                const method = methods[index];
                let mds = '';
                if (method.notes) {
                    mds += '--- ### Description:';
                    mds += `\n   ${method.notes}`;
                }
                if (mds.length)
                    mds += '\n';
                mds += '--- ### Parameter(s):';
                if (method.parameters.length) {
                    for (let pIndex = 0; pIndex < method.parameters.length; pIndex++) {
                        const parameter = method.parameters[pIndex];
                        mds += `\n---   * **${parameter.type.basic}** *${parameter.name}*`;
                        if (parameter.notes) {
                            mds += ` - ${parameter.notes}`;
                        }
                    }
                }
                else {
                    mds += '\n--- * **(None)**';
                }
                if (mds.length) {
                    mds += '\n--- ---\n';
                    ds += mds;
                }
            }
            ds += `--- \n`;
            // Apply first method's notes.
            const method = methods[0];
            if (method.notes) {
                ds += `--- ${methods[0].notes}\n--- \n`;
            }
            // Apply parameter(s).
            for (let index = 0; index < _paramNames.length; index++) {
                ds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}\n`;
            }
            ds += `--- @return ${className}`;
            // Apply overload(s).
            if (_overloads.length > 1) {
                ds += '\n--- \n';
                for (let oIndex = 1; oIndex < methods.length; oIndex++) {
                    ds += `--- @overload ${_overloads[oIndex]}\n`;
                }
            }
        }
        else {
            const method = methods[0];
            let vds = '';
            if (method.notes) {
                vds += `--- ${methods[0].notes}\n--- `;
            }
            for (let index = 0; index < _paramNames.length; index++) {
                if (vds.length)
                    vds += '\n';
                vds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}`;
                if (method.parameters[index].notes) {
                    vds += ` ${method.parameters[index].notes}`;
                }
            }
            if (vds.length)
                vds += '\n--- ';
            vds += `\n--- @return ${className}\n`;
            ds += vds;
        }
        while (ds.indexOf('\n\n') !== -1) {
            ds = ds.replace('\n\n', '\n--- \n');
        }
        s += `${ds}function ${className}.new(${ps}) end`;
        return s;
    }
    exports.generateJavaConstructor = generateJavaConstructor;
    function generateJavaMethod(className, cluster) {
        if (!cluster.methods.length)
            return '';
        const methods = [...cluster.methods];
        methods.sort((a, b) => a.parameters.length - b.parameters.length);
        const isStatic = methods[0].isStatic();
        let s = '';
        // Parameter(s).
        let maxParams = 0;
        const _returns = [];
        const _paramNames = [];
        const _paramTypes = [];
        const _overloads = [];
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
            if (oParams.length)
                oParams = oParams.substring(0, oParams.length - 2);
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
        if (rs.length)
            rs = rs.substring(0, rs.length - 3);
        // Documentation.
        let ds = '--- @public\n';
        if (isStatic)
            ds += '--- @static\n';
        if (methods.length > 1) {
            for (let index = 0; index < methods.length; index++) {
                const method = methods[index];
                let mds = '';
                if (method.notes) {
                    mds += '--- ### Description:';
                    mds += `\n   ${method.notes}`;
                }
                if (mds.length)
                    mds += '\n';
                mds += '--- ### Parameter(s):';
                if (method.parameters.length) {
                    for (let pIndex = 0; pIndex < method.parameters.length; pIndex++) {
                        const parameter = method.parameters[pIndex];
                        mds += `\n---   * **${parameter.type.basic}** *${parameter.name}*`;
                        if (parameter.notes) {
                            mds += ` - ${parameter.notes}`;
                        }
                    }
                }
                else {
                    mds += '\n--- * **(None)**';
                }
                mds += '\n--- ### Returns:';
                const returns = method.returns;
                mds += `\n---   * ${returns.type.basic}`;
                if (returns.notes)
                    mds += ` ${returns.notes}`;
                if (mds.length) {
                    mds += '\n--- ---\n';
                    ds += mds;
                }
            }
            ds += `--- \n`;
            // Apply first method's notes.
            const method = methods[0];
            if (method.notes) {
                ds += `--- ${methods[0].notes}\n--- \n`;
            }
            // Apply parameter(s).
            for (let index = 0; index < _paramNames.length; index++) {
                ds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}\n`;
            }
            if (ds.length)
                ds += '--- \n';
            // Apply return.
            ds += `--- @return ${rs}\n--- \n`;
            // Apply overload(s).
            for (let oIndex = 1; oIndex < methods.length; oIndex++) {
                ds += `--- @overload ${_overloads[oIndex]}\n`;
            }
        }
        else {
            let vds = '';
            const method = methods[0];
            if (method.notes) {
                vds += `--- ${methods[0].notes}\n--- `;
            }
            for (let index = 0; index < _paramNames.length; index++) {
                if (vds.length)
                    vds += '\n';
                vds += `--- @param ${_paramNames[index]} ${_paramTypes[index]}`;
                if (method.parameters[index].notes) {
                    vds += ` ${method.parameters[index].notes}`;
                }
            }
            if (vds.length)
                vds += '\n';
            vds += `--- @return ${rs}`;
            if (method.returns.notes) {
                vds += ` ${method.returns.notes}`;
            }
            if (!vds.endsWith('\n'))
                vds += '\n';
            ds += vds;
        }
        while (ds.indexOf('\n\n') !== -1) {
            ds = ds.replace('\n\n', '\n--- \n');
        }
        s += `${ds}function ${className}${isStatic ? '.' : ':'}${cluster.name}(${ps}) end`;
        return s;
    }
    exports.generateJavaMethod = generateJavaMethod;
    function generateJavaClass(clazz) {
        let s = '';
        // If the class has a description.
        if (clazz.notes && clazz.notes.length > 0) {
            const notes = clazz.notes.split('\n').join('\n--- ');
            s += `--- ${notes}\n`;
            if (notes.endsWith('\n'))
                s += '--- \n';
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
                if (field.isStatic()) {
                    s += generateJavaField(field) + '\n';
                }
            }
            // Instance field(s) next.
            for (const fieldName of fieldNames) {
                const field = clazz.fields[fieldName];
                if (!field.isStatic()) {
                    s += generateJavaField(field) + '\n';
                }
            }
        }
        const methodClusterNames = Object.keys(clazz.methods);
        methodClusterNames.sort((a, b) => a.localeCompare(b));
        s += `${clazz.name} = {};\n\n`;
        const staticMethods = [];
        const methods = [];
        for (const clusterName of methodClusterNames) {
            const cluster = clazz.methods[clusterName];
            if (cluster.methods[0].isStatic()) {
                staticMethods.push(cluster);
            }
            else {
                methods.push(cluster);
            }
        }
        if (staticMethods.length) {
            s += `------------------------------------\n`;
            s += `---------- STATIC METHODS ----------\n`;
            s += `------------------------------------\n`;
            s += '\n';
            // Method Cluster(s)
            for (const cluster of staticMethods) {
                s += `${generateJavaMethod(clazz.name, cluster)}\n\n`;
            }
        }
        if (methods.length) {
            s += '------------------------------------\n';
            s += '------------- METHODS --------------\n';
            s += '------------------------------------\n';
            s += '\n';
            // Method Cluster(s)
            for (const cluster of methods) {
                s += `${generateJavaMethod(clazz.name, cluster)}\n\n`;
            }
        }
        if (clazz.constructors && clazz.constructors.length) {
            s += `------------------------------------\n`;
            s += `----------- CONSTRUCTOR ------------\n`;
            s += `------------------------------------\n`;
            s += '\n';
            s += `${generateJavaConstructor(clazz.name, clazz.constructors)}\n`;
        }
        return s;
    }
    exports.generateJavaClass = generateJavaClass;
});
define("src/asledgehammer/rosetta/component/java/JavaCard", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/CardComponent", "src/asledgehammer/Delta"], function (require, exports, hljs, util_11, CardComponent_2, Delta_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaCard = void 0;
    class JavaCard extends CardComponent_2.CardComponent {
        constructor(app, options) {
            super(options);
            this.app = app;
            this.idPreview = `${this.id}-preview`;
            this.idPreviewCode = `${this.id}-preview-code`;
            this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
        }
        listenEdit(entity, idBtnEdit, mode, title, nameSelected = undefined) {
            (0, util_11.$get)(idBtnEdit).on('click', () => {
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
            return (0, util_11.html) `
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
                entity.notes = markdown;
                this.update();
                this.app.renderCode();
            });
        }
        renderNotes(idNotes) {
            return (0, util_11.html) `
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <div id="${idNotes}" style="background-color: #222;"></div>
            </div>
        `;
        }
        listenDefaultValue(entity, idDefaultValue) {
            const $defaultValue = (0, util_11.$get)(idDefaultValue);
            $defaultValue.on('input', () => {
                entity.defaultValue = $defaultValue.val();
                this.update();
                this.app.renderCode();
            });
        }
        renderDefaultValue(defaultValue, idDefaultValue) {
            if (!defaultValue)
                defaultValue = '';
            return (0, util_11.html) `
            <div class="mb-3">
                <label for="${idDefaultValue}" class="form-label mb-2">Default Value</label>
                <textarea id="${idDefaultValue}" class="form-control responsive-input mt-1" spellcheck="false">${defaultValue}</textarea>
            </div>
        `;
        }
        listenParameters(entity, type) {
            const { parameters } = entity;
            for (const param of parameters) {
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;
                (0, Delta_2.createDeltaEditor)(idParamNotes, param.notes, (markdown) => {
                    param.notes = markdown;
                    this.update();
                    this.app.renderCode();
                });
                (0, util_11.$get)(idBtnDelete).on('click', () => {
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
            (0, util_11.$get)(idBtnAdd).on('click', () => {
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
            if (parameters && parameters.length) {
                for (const param of parameters) {
                    const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                    const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                    const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                    htmlParams += (0, util_11.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type.basic}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
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
                htmlParams += (0, util_11.html) `<h6 class="font-monospace mb-1">(None)</h6>`;
            }
            return (0, util_11.html) `
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
            const $pre = (0, util_11.$get)(idPreviewCode);
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
            (0, util_11.$get)(idBtnPreviewCopy).on('click', (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(this.onRenderPreview());
            });
        }
        renderPreview(show) {
            const { idPreview, idPreviewCode, idBtnPreviewCopy } = this;
            return (0, util_11.html) `
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
                    <pre id="${idPreviewCode}" class="w-100 h-100 p-2 m-0" style="background-color: #111; overflow: scroll; max-height: 512px;"></pre>
                </div>
            </div>
        `;
        }
        listenReturns(entity, idReturnType, idReturnNotes, idSelect) {
            (0, Delta_2.createDeltaEditor)(idReturnNotes, entity.returns.notes, (markdown) => {
                entity.returns.notes = markdown;
                this.update();
                this.app.renderCode();
            });
        }
        renderReturns(entity, idReturnType, idReturnNotes, show = false) {
            const { returns } = entity;
            let { notes } = returns;
            if (!notes)
                notes = '';
            const idCard = `${entity.name}-returns-card`;
            return (0, util_11.html) `
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
            const $select = (0, util_11.$get)(idType);
            const $customInput = (0, util_11.$get)(`${idSelect}-custom-input`);
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
        renderType(name, type) {
            const idTypeCard = `${name}-type-card`;
            return (0, util_11.html) `
            <div class="card responsive-subcard">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idTypeCard}" aria-expanded="true" aria-controls="${idTypeCard}">
                        Type
                    </button>   
                </div>
                <div id="${idTypeCard}" class="card-body py-2 collapse show">
                    <span><strong>${type}</strong></span>
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
            return (0, util_11.html) `
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
define("src/asledgehammer/rosetta/component/java/JavaClassCard", ["require", "exports", "src/asledgehammer/rosetta/java/JavaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/java/JavaCard"], function (require, exports, JavaGenerator_1, util_12, JavaCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaClassCard = void 0;
    class JavaClassCard extends JavaCard_1.JavaCard {
        onRenderPreview() {
            return (0, JavaGenerator_1.generateJavaClass)(this.options.entity);
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
            return (0, util_12.html) ` 
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
            return (0, util_12.html) `
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
define("src/asledgehammer/rosetta/component/java/JavaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/java/JavaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/java/JavaCard"], function (require, exports, JavaGenerator_2, util_13, JavaCard_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaFieldCard = void 0;
    class JavaFieldCard extends JavaCard_2.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
            this.idBtnEdit = `${this.id}-btn-edit`;
            this.idBtnDelete = `${this.id}-btn-delete`;
        }
        onRenderPreview() {
            if (!this.options)
                return '';
            const { entity } = this.options;
            return (0, JavaGenerator_2.generateJavaField)(entity);
        }
        onHeaderHTML() {
            var _a;
            const { idBtnEdit, idBtnDelete } = this;
            const { entity, isStatic } = this.options;
            const javaClass = (_a = this.app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
            let name = `${javaClass.name}.${entity.name}`;
            if (isStatic) {
                name = (0, util_13.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_13.html) ` 
            <div class="row">
            ${isStatic ?
                (0, util_13.html) `
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
            return (0, util_13.html) `
            <div>
                ${this.renderNotes(idNotes)}
                <hr>
                ${this.renderType(entity.name, entity.type.basic)}
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
            (0, util_13.$get)(idBtnDelete).on('click', () => {
                app.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
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
define("src/asledgehammer/rosetta/component/java/JavaMethodCard", ["require", "exports", "src/asledgehammer/rosetta/java/JavaGenerator", "src/asledgehammer/rosetta/java/RosettaJavaMethodCluster", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/java/JavaCard"], function (require, exports, JavaGenerator_3, RosettaJavaMethodCluster_2, util_14, JavaCard_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaMethodCard = void 0;
    class JavaMethodCard extends JavaCard_3.JavaCard {
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
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            const cluster = new RosettaJavaMethodCluster_2.RosettaJavaMethodCluster(entity.name);
            cluster.add(entity);
            return (0, JavaGenerator_3.generateJavaMethod)(className, cluster);
        }
        onHeaderHTML() {
            const { entity, isStatic } = this.options;
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            let params = '';
            for (const param of entity.parameters) {
                params += `${param.name}, `;
            }
            if (params.length)
                params = params.substring(0, params.length - 2);
            let name = `${className}${isStatic ? '.' : ':'}${entity.name}(${params})`;
            if (isStatic) {
                name = (0, util_14.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_14.html) ` 
            <div class="row">

            ${isStatic ?
                (0, util_14.html) `
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
            return (0, util_14.html) `
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
            const { app, idBtnDelete, idNotes, idReturnType, idReturnNotes } = this;
            const { entity, isStatic } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity, 'method');
            this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
            this.listenPreview();
            (0, util_14.$get)(idBtnDelete).on('click', () => {
                app.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
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
            const $paramContainer = (0, util_14.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters(entity, true));
            this.listenParameters(entity, isStatic ? 'function' : 'method');
        }
    }
    exports.JavaMethodCard = JavaMethodCard;
});
define("src/asledgehammer/rosetta/component/java/JavaConstructorCard", ["require", "exports", "src/asledgehammer/rosetta/java/JavaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/java/JavaCard"], function (require, exports, JavaGenerator_4, util_15, JavaCard_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaConstructorCard = void 0;
    class JavaConstructorCard extends JavaCard_4.JavaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idParamContainer = `${this.id}-parameter-container`;
        }
        onRenderPreview() {
            if (!this.options)
                return '';
            const { entity } = this.options;
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            return (0, JavaGenerator_4.generateJavaConstructor)(className, [entity]);
        }
        onHeaderHTML() {
            const { entity } = this.options;
            const classEntity = this.app.active.selectedCard.options.entity;
            const className = classEntity.name;
            let params = '';
            for (const param of entity.parameters) {
                params += `${param.name}, `;
            }
            if (params.length)
                params = params.substring(0, params.length - 2);
            let name = `${className}(${params})`;
            return (0, util_15.html) ` 
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
            return (0, util_15.html) `
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
            const $paramContainer = (0, util_15.$get)(idParamContainer);
            $paramContainer.empty();
            $paramContainer.html(this.renderParameters({ name: 'new', parameters: entity.parameters }, true));
            this.listenParameters({ name: 'new', parameters: entity.parameters }, 'constructor');
        }
    }
    exports.JavaConstructorCard = JavaConstructorCard;
});
define("src/app", ["require", "exports", "highlight.js", "src/asledgehammer/rosetta/component/lua/LuaClassCard", "src/asledgehammer/rosetta/component/lua/LuaConstructorCard", "src/asledgehammer/rosetta/component/lua/LuaFieldCard", "src/asledgehammer/rosetta/component/lua/LuaFunctionCard", "src/asledgehammer/rosetta/component/Sidebar", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/lua/wizard/LuaParser", "src/asledgehammer/rosetta/java/RosettaJavaClass", "src/asledgehammer/rosetta/component/java/JavaClassCard", "src/asledgehammer/rosetta/java/JavaGenerator", "src/asledgehammer/rosetta/component/java/JavaFieldCard", "src/asledgehammer/rosetta/component/java/JavaMethodCard", "src/asledgehammer/rosetta/component/java/JavaConstructorCard"], function (require, exports, hljs, LuaClassCard_1, LuaConstructorCard_1, LuaFieldCard_1, LuaFunctionCard_1, Sidebar_1, LuaGenerator_5, RosettaLuaClass_3, RosettaLuaConstructor_3, util_16, LuaParser_1, RosettaJavaClass_2, JavaClassCard_1, JavaGenerator_5, JavaFieldCard_1, JavaMethodCard_1, JavaConstructorCard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = exports.Toast = exports.Active = void 0;
    class Active {
        constructor(app) {
            this.luaClasses = {};
            this.luaTables = {};
            this.javaClasses = {};
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
            // Wipe active selections.
            this.selected = undefined;
            this.selectedCard = undefined;
            // Clear the screen container.
            this.app.$screenContent.empty();
        }
    }
    exports.Active = Active;
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
            const $toast = (0, util_16.$get)(idToastSimple);
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
            this.active = new Active(this);
            this.sidebar = new Sidebar_1.Sidebar(this);
            this.toast = new Toast(this);
            this.luaParser = new LuaParser_1.LuaParser(this);
            this.eSidebarContainer = document.getElementById('screen-sidebar-container');
            this.$screenContent = $('#screen-content-end-container');
            // @ts-ignore This modal is for new items and editing their names.
            this.modalName = new bootstrap.Modal('#modal-name', {});
            this.$titleName = (0, util_16.$get)('title-name');
            this.$inputName = (0, util_16.$get)('input-name');
            this.$btnName = (0, util_16.$get)('btn-name-create');
            // @ts-ignore This modal is for confirming actions.
            this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
            this.$titleConfirm = (0, util_16.$get)('title-confirm');
            this.$bodyConfirm = (0, util_16.$get)('body-confirm');
            this.$btnConfirm = (0, util_16.$get)('btn-confirm');
            this.confirmSuccess = undefined;
            this.nameMode = null;
        }
        async init() {
            this.createSidebar();
        }
        loadJson(json) {
            this.active.reset();
            if (json.luaClasses) {
                for (const name of Object.keys(json.luaClasses)) {
                    const entity = new RosettaLuaClass_3.RosettaLuaClass(name, json.luaClasses[name]);
                    this.active.luaClasses[name] = entity;
                }
            }
            if (json.namespaces) {
                for (const name of Object.keys(json.namespaces)) {
                    const namespace = new RosettaJavaClass_2.RosettaJavaNamespace(name, json.namespaces[name]);
                    for (const className of Object.keys(namespace.classes)) {
                        this.active.javaClasses[className] = namespace.classes[className];
                    }
                }
            }
            this.sidebar.populateTrees();
        }
        saveJson() {
            let keys;
            // Lua Classes
            let luaClasses = undefined;
            keys = Object.keys(this.active.luaClasses);
            if (keys.length) {
                luaClasses = {};
                for (const name of keys) {
                    luaClasses[name] = this.active.luaClasses[name].toJSON();
                }
            }
            // Lua Tables
            let luaTables = undefined;
            keys = Object.keys(this.active.luaTables);
            if (keys.length) {
                luaTables = {};
                for (const name of keys) {
                    luaTables[name] = this.active.luaTables[name].toJSON();
                }
            }
            // Java Classes
            let namespaces = undefined;
            keys = Object.keys(this.active.javaClasses);
            if (keys.length) {
                namespaces = {};
                for (const name of keys) {
                    const javaClass = this.active.javaClasses[name];
                    const namespace = javaClass.namespace;
                    if (!namespaces[namespace.name]) {
                        namespaces[namespace.name] = {};
                    }
                    namespaces[namespace.name][name] = this.active.javaClasses[name].toJSON();
                }
            }
            return {
                $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
                luaClasses,
                luaTables,
                namespaces
            };
        }
        showLuaClass(entity) {
            this.$screenContent.empty();
            // this.selected = entity.name;
            this.active.selected = entity;
            this.active.selectedCard = new LuaClassCard_1.LuaClassCard(this, { entity });
            this.$screenContent.append(this.active.selectedCard.render());
            this.active.selectedCard.listen();
            this.active.selectedCard.update();
            this.renderCode();
            return this.active.selectedCard;
        }
        showLuaClassConstructor(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaLuaClass_3.RosettaLuaClass))
                return null;
            if (!entity)
                entity = new RosettaLuaConstructor_3.RosettaLuaConstructor(selected);
            this.$screenContent.empty();
            const card = new LuaConstructorCard_1.LuaConstructorCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.renderCode();
            return card;
        }
        showLuaClassField(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaLuaClass_3.RosettaLuaClass))
                return null;
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showLuaClassValue(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaLuaClass_3.RosettaLuaClass))
                return null;
            this.$screenContent.empty();
            const card = new LuaFieldCard_1.LuaFieldCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showLuaClassMethod(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaLuaClass_3.RosettaLuaClass))
                return null;
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: false });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showLuaClassFunction(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaLuaClass_3.RosettaLuaClass))
                return null;
            this.$screenContent.empty();
            const card = new LuaFunctionCard_1.LuaFunctionCard(this, { entity, isStatic: true });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showJavaClass(entity) {
            this.$screenContent.empty();
            // this.selected = entity.name;
            this.active.selected = entity;
            this.active.selectedCard = new JavaClassCard_1.JavaClassCard(this, { entity });
            this.$screenContent.append(this.active.selectedCard.render());
            this.active.selectedCard.listen();
            this.active.selectedCard.update();
            this.renderCode();
            return this.active.selectedCard;
        }
        showJavaClassConstructor(entity) {
            const { selected } = this.active;
            console.log(`showJavaClassConstructor(${entity})`);
            if (!(selected instanceof RosettaJavaClass_2.RosettaJavaClass))
                return null;
            console.log('a');
            if (!entity)
                return null;
            console.log('b');
            this.$screenContent.empty();
            const card = new JavaConstructorCard_1.JavaConstructorCard(this, { entity });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            this.renderCode();
            return card;
        }
        showJavaClassField(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaJavaClass_2.RosettaJavaClass))
                return null;
            this.$screenContent.empty();
            const card = new JavaFieldCard_1.JavaFieldCard(this, { entity, isStatic: entity.isStatic() });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        showJavaClassMethod(entity) {
            const { selected } = this.active;
            if (!(selected instanceof RosettaJavaClass_2.RosettaJavaClass))
                return null;
            this.$screenContent.empty();
            const card = new JavaMethodCard_1.JavaMethodCard(this, { entity, isStatic: entity.isStatic() });
            this.$screenContent.append(card.render());
            card.listen();
            card.update();
            return card;
        }
        renderCode() {
            const $renderPane = (0, util_16.$get)('code-preview');
            $renderPane.empty();
            if (!this.active.selectedCard)
                return;
            const { selected } = this.active;
            let highlightedCode = '';
            if (selected instanceof RosettaLuaClass_3.RosettaLuaClass) {
                highlightedCode = hljs.default.highlightAuto((0, LuaGenerator_5.generateLuaClass)(selected), ['lua']).value;
            }
            else if (selected instanceof RosettaJavaClass_2.RosettaJavaClass) {
                highlightedCode = hljs.default.highlightAuto((0, JavaGenerator_5.generateJavaClass)(selected), ['lua']).value;
            }
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
                setTimeout(() => this.$inputName.val((0, util_16.validateLuaVariableName)(this.$inputName.val())), 1);
            });
            this.$btnName.on('click', () => {
                var _a;
                const clazz = (_a = this.active.selectedCard) === null || _a === void 0 ? void 0 : _a.options.entity;
                const name = (0, util_16.validateLuaVariableName)(this.$inputName.val()).trim();
                const nameOld = this.nameSelected;
                switch (this.nameMode) {
                    case 'new_class': {
                        try {
                            const entity = new RosettaLuaClass_3.RosettaLuaClass((0, util_16.validateLuaVariableName)(this.$inputName.val()).trim());
                            this.showLuaClass(entity);
                            this.sidebar.populateTrees();
                            this.toast.alert('Created Lua Class.', 'success');
                        }
                        catch (e) {
                            this.toast.alert(`Failed to create Lua Class.`, 'error');
                            console.error(e);
                        }
                        break;
                    }
                    case 'edit_class': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                clazz.name = name;
                                this.showLuaClass(clazz);
                                this.toast.alert('Edited Lua Class.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Class.`, 'error');
                                console.error(e);
                            }
                        }
                        else if (clazz instanceof RosettaJavaClass_2.RosettaJavaClass) {
                            throw new Error('Cannot modify name of Java class. (Read-Only)');
                        }
                        break;
                    }
                    case 'new_field': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const field = clazz.createField(name);
                                this.showLuaClassField(field);
                                this.sidebar.populateTrees();
                                this.toast.alert('Created Lua Field.', 'success');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to create Lua Field.`, 'error');
                                console.error(e);
                            }
                        }
                        else if (clazz instanceof RosettaJavaClass_2.RosettaJavaClass) {
                            throw new Error('Cannot add field in Java class. (Not implemented)');
                        }
                        break;
                    }
                    case 'edit_field': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const field = clazz.fields[nameOld];
                                field.name = name;
                                clazz.fields[name] = field;
                                delete clazz.fields[nameOld];
                                this.showLuaClassField(field);
                                this.sidebar.populateTrees();
                                this.toast.alert('Edited Lua Field.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Field.`, 'error');
                                console.error(e);
                            }
                        }
                        else if (clazz instanceof RosettaJavaClass_2.RosettaJavaClass) {
                            throw new Error('Cannot modify name of Java field. (Read-Only)');
                        }
                        break;
                    }
                    case 'new_value': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const value = clazz.createValue(name);
                                this.showLuaClassValue(value);
                                this.sidebar.populateTrees();
                                this.toast.alert('Created Lua Value.', 'success');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to create Lua Value.`, 'error');
                                console.error(e);
                            }
                        }
                        else if (clazz instanceof RosettaJavaClass_2.RosettaJavaClass) {
                            throw new Error('Values are not supported in Java.');
                        }
                        break;
                    }
                    case 'edit_value': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const value = clazz.values[nameOld];
                                value.name = name;
                                clazz.values[name] = value;
                                delete clazz.values[nameOld];
                                this.showLuaClassValue(value);
                                this.sidebar.populateTrees();
                                this.toast.alert('Edited Lua value.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Value.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'new_function': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const func = clazz.createFunction(name);
                                this.showLuaClassFunction(func);
                                this.sidebar.populateTrees();
                                this.toast.alert('Created Lua Function.', 'success');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to create Lua Function.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'edit_function': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const func = clazz.functions[nameOld];
                                func.name = name;
                                clazz.functions[name] = func;
                                delete clazz.functions[nameOld];
                                this.showLuaClassFunction(func);
                                this.sidebar.populateTrees();
                                this.toast.alert('Edited Lua Function.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Function.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'new_method': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const method = clazz.createMethod(name);
                                this.showLuaClassMethod(method);
                                this.sidebar.populateTrees();
                                this.toast.alert('Created Lua Method.', 'success');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to create Lua Method.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'edit_method': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
                            try {
                                const method = clazz.methods[nameOld];
                                method.name = name;
                                clazz.methods[name] = method;
                                delete clazz.methods[nameOld];
                                this.showLuaClassMethod(method);
                                this.sidebar.populateTrees();
                                this.toast.alert('Edited Lua Method.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Method.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'new_parameter': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
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
                                    this.showLuaClassConstructor(func);
                                }
                                else if (type === 'function') {
                                    this.showLuaClassFunction(func);
                                }
                                else {
                                    this.showLuaClassMethod(func);
                                }
                                this.renderCode();
                                this.toast.alert('Created Lua Parameter.', 'success');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to create Lua Parameter.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                    case 'edit_parameter': {
                        if (clazz instanceof RosettaLuaClass_3.RosettaLuaClass) {
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
                                    this.showLuaClassConstructor(func);
                                }
                                else if (type === 'function') {
                                    this.showLuaClassFunction(func);
                                }
                                else if (type === 'method') {
                                    this.showLuaClassMethod(func);
                                }
                                this.renderCode();
                                this.sidebar.populateTrees();
                                this.toast.alert('Edited Lua Parameter.');
                            }
                            catch (e) {
                                this.toast.alert(`Failed to edit Lua Parameter.`, 'error');
                                console.error(e);
                            }
                        }
                        break;
                    }
                }
                this.nameSelected = undefined;
                this.modalName.hide();
            });
            const $btnCopy = (0, util_16.$get)('btn-code-preview-copy');
            const $container = (0, util_16.$get)('screen-content-container');
            const $cardPreview = (0, util_16.$get)('screen-content-end-container');
            const $codePreview = (0, util_16.$get)('code-preview');
            const $btnCardCode = (0, util_16.$get)('btn-card-code');
            const $iconCard = (0, util_16.$get)('icon-card');
            const $iconCode = (0, util_16.$get)('icon-code');
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
define("src/asledgehammer/rosetta/RosettaFileInfo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/asledgehammer/rosetta/RosettaFile", ["require", "exports", "src/asledgehammer/rosetta/Rosetta", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaTable", "src/asledgehammer/rosetta/lua/RosettaLuaTableField", "src/asledgehammer/rosetta/lua/RosettaLuaClass"], function (require, exports, Rosetta_1, RosettaEntity_16, RosettaLuaFunction_3, RosettaLuaTable_2, RosettaLuaTableField_2, RosettaLuaClass_4) {
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
                    const table = new RosettaLuaTable_2.RosettaLuaTable(name, rawTable);
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
                    const luaClass = new RosettaLuaClass_4.RosettaLuaClass(name, rawLuaClass);
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
            const luaClass = new RosettaLuaClass_4.RosettaLuaClass(name);
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
            const luaTable = new RosettaLuaTable_2.RosettaLuaTable(name);
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
define("src/asledgehammer/rosetta/component/LabelComponent", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component"], function (require, exports, util_17, Component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelComponent = void 0;
    class LabelComponent extends Component_3.Component {
        constructor(options) {
            super(options);
        }
        onRender() {
            return (0, util_17.html) ``;
        }
    }
    exports.LabelComponent = LabelComponent;
});
define("src/asledgehammer/rosetta/component/SidebarPanelButton", ["require", "exports", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/util"], function (require, exports, Component_4, util_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanelButton = void 0;
    class SidebarPanelButton extends Component_4.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            (0, util_18.$get)(this.id).on('click', () => {
                if (this.options && this.options.onclick) {
                    this.options.onclick();
                }
            });
        }
        onRender() {
            const { label } = this.options;
            return (0, util_18.html) `
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