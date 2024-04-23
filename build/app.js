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
                console.log('string: ' + d);
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
        s += `${clazz.name} = ISBaseObject:derive("${clazz.name}");\n\n`;
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
    exports.get = exports.$get = exports.combine = exports.combineArrays = exports.randomString = exports.css = exports.html = void 0;
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
            if (!keys.length) {
                return '';
            }
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
    // @ts-ignore
    window.fromDelta = fromDelta;
    // @ts-ignore
    window.toDelta = toDelta;
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
        editor.on('text-change', () => {
            const { ops } = editor.editor.getContents(0, 99999999);
            const markdown = fromDelta(ops);
            onChange(markdown);
        });
        // Apply markdown as delta.
        if (markdown && markdown.length) {
            setTimeout(() => editor.editor.insertContents(0, toDelta(markdown)), 1);
        }
    };
    exports.createDeltaEditor = createDeltaEditor;
});
define("src/asledgehammer/rosetta/component/LuaCard", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/CardComponent", "src/asledgehammer/Delta"], function (require, exports, util_3, CardComponent_1, Delta_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaCard = void 0;
    class LuaCard extends CardComponent_1.CardComponent {
        constructor(app, options) {
            super(options);
            this.app = app;
            this.idPreview = `${this.id}-preview`;
        }
        listenEdit(entity, idBtnEdit, mode, title, nameSelected = undefined) {
            (0, util_3.$get)(idBtnEdit).on('click', () => {
                const { modalName, $btnName, $titleName, $inputName } = this.app.sidebar.itemTree;
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
                this.app.sidebar.itemTree.nameMode = mode;
                if (!nameSelected)
                    nameSelected = entity.name;
                this.app.sidebar.itemTree.nameSelected = nameSelected;
                modalName.show();
            });
        }
        renderEdit(idBtnEdit) {
            return (0, util_3.html) `
            <!-- Edit Button -->
            <div style="position: absolute; padding: 0; right: 0; top: 0">
                <button id="${idBtnEdit}" class="btn btn-sm responsive-icon-btn float-end" style="position: relative; top: 5px; right: 5px;" title="Edit Name">
                <i class="fa-solid fa-pen"></i>
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
                    param.type = $customInput.val();
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
                    this.app.sidebar.itemTree.askConfirm(() => {
                        console.log('delete');
                        entity.parameters.splice(entity.parameters.indexOf(param), 1);
                        // TODO: Clean up.
                        if (type === 'constructor') {
                            this.app.showConstructor(entity);
                        }
                        else if (type === 'function') {
                            this.app.showFunction(entity);
                        }
                        else if (type === 'method') {
                            this.app.showMethod(entity);
                        }
                    }, `Delete Parameter ${param.name}?`);
                });
                this.listenEdit({ name: param.name }, idBtnEdit, 'edit_parameter', 'Edit Parameter Name', `${entity.name}-${param.name}`);
            }
            const idBtnAdd = `btn-${entity.name}-parameter-add`;
            (0, util_3.$get)(idBtnAdd).on('click', () => {
                const { itemTree } = this.app.sidebar;
                const { modalName, $inputName, $titleName } = itemTree;
                itemTree.nameMode = 'new_parameter';
                itemTree.nameSelected = `${type}-${entity.name}`;
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
                    <div class="accordion-header" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
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
                            <div style="position: relative; width: 100%; height: 32px;">
                                <!-- Delete Button -->
                                <button id="${idBtnDelete}" class="btn btn-sm responsive-icon-btn text-danger float-end ms-1">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                                <!-- Edit Button -->
                                <button id="${idBtnEdit}" class="btn btn-sm responsive-icon-btn float-end">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
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
                </div>
                <div id="${idAccordion}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                    <div class="mt-3" style="position: relative; width: 100%; height: 32px;">
                        <!-- Add Button -->
                        <button id="${idBtnAdd}" class="btn btn-sm responsive-icon-btn text-success float-end ms-1">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        }
        update() {
            const { idPreview } = this;
            const $card = (0, util_3.$get)(idPreview);
            $card.empty();
            let text = this.onRenderPreview();
            if (text.endsWith('\n'))
                text = text.substring(0, text.length - 1);
            // @ts-ignore
            const highlightedCode = hljs.highlight(text, { language: 'lua' }).value;
            $card.append(highlightedCode);
        }
        renderPreview(show) {
            const { idPreview } = this;
            return (0, util_3.html) `
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idPreview}" aria-expanded="true" aria-controls="${idPreview}">
                        <strong>Preview</strong>
                    </button>
                </div>
                <pre id="${idPreview}" class="card-body mb-0 collapse${show ? ' show' : ''}" style="max-height: 512px"></pre>
            </div>
        `;
        }
        listenReturns(entity, idReturnType, idReturnNotes, idSelect) {
            const { returns } = entity;
            // const $description = $get(idReturnNotes);
            // $description.on('input', () => {
            //     returns.notes = $description.val();
            //     this.update();
            //     this.app.renderCode();
            // });
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
            const { idCheckMutable } = this;
            return (0, util_4.html) `
            <div>
                ${this.renderNotes(this.idNotes)}
                <div class="mb-3 form-check" title="Allows Lua to add custom properties to the class.">
                    <input id="${idCheckMutable}" type="checkbox" class="form-check-input" id="exampleCheck1">
                    <label class="form-check-label" for="exampleCheck1">Mutable</label>
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
            this.listenEdit(entity, idBtnEdit, 'edit_class', 'Edit Lua Class');
            this.listenNotes(entity, idNotes);
            const $checkMutable = (0, util_4.$get)(idCheckMutable);
            $checkMutable.on('change', function () {
                entity.mutable = this.checked;
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
            const { idNotes } = this;
            const { entity } = this.options;
            return (0, util_5.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            ${this.renderParameters({ name: 'new', parameters: entity.parameters })}
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
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-icon-btn text-danger float-end ms-1" title="Delete ${isStatic ? 'Value' : 'Field'}">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-icon-btn float-end" title="Edit Name">
                        <i class="fa-solid fa-pen"></i>
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
            (0, util_6.$get)(idBtnDelete).on('click', () => {
                app.sidebar.itemTree.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.values[entity.name];
                    }
                    else {
                        delete clazz.fields[entity.name];
                    }
                    app.showClass(clazz);
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
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-icon-btn text-danger float-end ms-1" title="Delete ${isStatic ? 'Function' : 'Method'}">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-icon-btn float-end" title="Edit Name">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_7.html) `
            ${this.renderNotes(idNotes)}
            <hr>
            ${this.renderParameters(entity)}
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
            (0, util_7.$get)(idBtnDelete).on('click', () => {
                app.sidebar.itemTree.askConfirm(() => {
                    var _a;
                    const clazz = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                    if (isStatic) {
                        delete clazz.functions[entity.name];
                    }
                    else {
                        delete clazz.methods[entity.name];
                    }
                    app.showClass(clazz);
                    app.sidebar.itemTree.populate();
                }, `Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`);
            });
        }
    }
    exports.LuaFunctionCard = LuaFunctionCard;
});
define("src/asledgehammer/rosetta/component/ItemTree", ["require", "exports", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, RosettaLuaClass_1, util_8, LuaCard_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemTree = void 0;
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
    class ItemTree {
        constructor(app) {
            this.app = app;
            // This modal is for new items and editing their names.
            // @ts-ignore
            this.modalName = new bootstrap.Modal('#modal-name', {});
            this.$titleName = (0, util_8.$get)('title-name');
            this.$inputName = (0, util_8.$get)('input-name');
            this.$btnName = (0, util_8.$get)('btn-name-create');
            // This modal is for confirming actions.
            // @ts-ignore
            this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
            this.$titleConfirm = (0, util_8.$get)('title-confirm');
            this.$bodyConfirm = (0, util_8.$get)('body-confirm');
            this.$btnConfirm = (0, util_8.$get)('btn-confirm');
            this.confirmSuccess = undefined;
            this.nameMode = null;
        }
        askConfirm(onSuccess, title = 'Confirm', body = 'Are you sure?') {
            this.$titleConfirm.html(title);
            this.$bodyConfirm.html(body);
            this.confirmSuccess = onSuccess;
            this.modalConfirm.show();
        }
        listen() {
            const { app } = this;
            const _this = this;
            this.$btnConfirm.on('click', () => {
                this.modalConfirm.hide();
                if (this.confirmSuccess) {
                    this.confirmSuccess();
                    this.confirmSuccess = undefined;
                }
            });
            (0, util_8.$get)('new-lua-class').on('click', () => {
                this.$titleName.html('New Lua Class');
                this.$btnName.html('Create');
                this.$btnName.removeClass('btn-primary');
                this.$btnName.addClass('btn-success');
                this.$inputName.val('');
                this.nameMode = 'new_class';
                this.modalName.show();
            });
            (0, util_8.$get)('open-lua-class').on('click', () => {
                const dFileLoad = document.getElementById('load-file');
                const onchange = () => {
                    const file = dFileLoad.files[0];
                    const textType = 'application/json';
                    if (file.type.match(textType)) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            const json = JSON.parse(reader.result);
                            app.loadLuaClass(json);
                            app.renderCode();
                            _this.populate();
                        };
                        reader.readAsText(file);
                    }
                };
                dFileLoad.onchange = onchange;
                dFileLoad.click();
            });
            (0, util_8.$get)('save-lua-class').on('click', async () => {
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
                return;
            });
            (0, util_8.$get)('new-lua-field').on('click', () => {
            });
            (0, util_8.$get)('new-lua-value').on('click', () => {
            });
            (0, util_8.$get)('new-lua-method').on('click', async () => {
            });
            (0, util_8.$get)('new-lua-function').on('click', () => {
            });
            this.$inputName.on('input', () => {
                setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val())), 1);
            });
            this.$btnName.on('click', () => {
                var _a;
                const clazz = (_a = app.card) === null || _a === void 0 ? void 0 : _a.options.entity;
                const name = validateLuaVariableName(this.$inputName.val()).trim();
                const nameOld = this.nameSelected;
                switch (this.nameMode) {
                    case 'new_class': {
                        const entity = new RosettaLuaClass_1.RosettaLuaClass(validateLuaVariableName(this.$inputName.val()).trim());
                        app.showClass(entity);
                        app.sidebar.itemTree.populate();
                        break;
                    }
                    case 'edit_class': {
                        clazz.name = name;
                        app.showClass(clazz);
                        break;
                    }
                    case 'new_field': {
                        const field = clazz.createField(name);
                        app.showField(field);
                        app.sidebar.itemTree.populate();
                        break;
                    }
                    case 'edit_field': {
                        const field = clazz.fields[nameOld];
                        field.name = name;
                        clazz.fields[name] = field;
                        delete clazz.fields[nameOld];
                        app.showField(field);
                        this.populate();
                        break;
                    }
                    case 'new_value': {
                        const value = clazz.createValue(name);
                        app.showValue(value);
                        app.sidebar.itemTree.populate();
                        break;
                    }
                    case 'edit_value': {
                        console.log(this.nameMode);
                        console.log(nameOld);
                        const value = clazz.values[nameOld];
                        value.name = name;
                        clazz.values[name] = value;
                        delete clazz.values[nameOld];
                        app.showValue(value);
                        this.populate();
                        break;
                    }
                    case 'new_function': {
                        const func = clazz.createFunction(name);
                        app.showFunction(func);
                        app.sidebar.itemTree.populate();
                        break;
                    }
                    case 'edit_function': {
                        const func = clazz.functions[nameOld];
                        func.name = name;
                        clazz.functions[name] = func;
                        delete clazz.functions[nameOld];
                        app.showFunction(func);
                        this.populate();
                        break;
                    }
                    case 'new_method': {
                        const method = clazz.createMethod(name);
                        app.showMethod(method);
                        app.sidebar.itemTree.populate();
                        break;
                    }
                    case 'edit_method': {
                        const method = clazz.methods[nameOld];
                        method.name = name;
                        clazz.methods[name] = method;
                        delete clazz.methods[nameOld];
                        app.showMethod(method);
                        this.populate();
                        break;
                    }
                    case 'new_parameter': {
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
                            app.showConstructor(func);
                        }
                        else if (type === 'function') {
                            app.showFunction(func);
                        }
                        else {
                            app.showMethod(func);
                        }
                        app.renderCode();
                    }
                    case 'edit_parameter': {
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
                            app.showConstructor(func);
                        }
                        else if (type === 'function') {
                            app.showFunction(func);
                        }
                        else if (type === 'method') {
                            app.showMethod(func);
                        }
                        this.populate();
                        app.renderCode();
                        break;
                    }
                }
                this.nameSelected = undefined;
                this.modalName.hide();
            });
        }
        render() {
            return (0, util_8.html) `
            <!-- New Class -->
            <button id="new-lua-class" class="btn btn-sm responsive-btn responsive-btn-success" title="New Class">
                <i class="fa fa-file"></i>
            </button>
            
            <!-- Open Class -->
            <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open Class">
                <i class="fa-solid fa-folder-open"></i>
            </button>

            <!-- Save Class -->
            <button id="save-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Save Class">
                <i class="fa fa-save"></i>
            </button>

            <div class="dropdown" style="position: absolute; top: 5px; right: 5px;">
                <button class="btn btn-sm responsive-btn responsive-btn-success float-end" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Add Element">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark">
                    <li><a id="btn-new-lua-value" class="dropdown-item" href="#">New Value</a></li>
                    <li><a id="btn-new-lua-field" class="dropdown-item" href="#">New Field</a></li>
                    <li><a id="btn-new-lua-function" class="dropdown-item" href="#">New Function</a></li>
                    <li><a id="btn-new-lua-method" class="dropdown-item" href="#">New Method</a></li>
                </ul>
            </div>

            <!-- New Function -->
            <!-- <button id="new-lua-function" class="btn btn-sm responsive-btn responsive-btn-success float-end" style="width: 32px; height: 32px" title="Add Element">
                <i class="fa-solid fa-plus"></i>
            </button> -->
        `;
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
                    class: ['lua-field-item']
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
                    class: ['lua-value-item']
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
                    class: ['lua-method-item'],
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
                    class: ['lua-function-item'],
                });
            }
            let $tree = (0, util_8.$get)('tree');
            $tree.remove();
            (0, util_8.$get)('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
            $tree = (0, util_8.$get)('tree');
            // @ts-ignore
            $tree.bstreeview({
                data: [
                    {
                        text: "Class Properties",
                        icon: LuaCard_5.LuaCard.getTypeIcon('class'),
                        class: ['lua-class-item']
                    },
                    {
                        text: "Constructor",
                        icon: LuaCard_5.LuaCard.getTypeIcon('constructor'),
                        class: ['lua-constructor-item']
                    },
                    {
                        text: "Fields",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['bg-secondary'],
                        // expanded: true,
                        nodes: fields
                    },
                    {
                        text: "Values",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['bg-secondary'],
                        // expanded: true,
                        nodes: values
                    },
                    {
                        text: "Methods",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['bg-secondary'],
                        // expanded: true,
                        nodes: methods
                    },
                    {
                        text: "Functions",
                        icon: "fa-solid fa-folder text-light mx-2",
                        class: ['bg-secondary'],
                        // expanded: true,
                        nodes: functions
                    },
                ]
            });
            // Apply jQuery listeners next.
            $('.lua-class-item').on('click', function () {
                // Prevent wasteful selection code executions here.
                if (_this.selected === 'class')
                    return;
                _this.app.showClass(entity);
                // Let the editor know we last selected the class.
                _this.selected = 'class';
            });
            $('.lua-constructor-item').on('click', function () {
                // Prevent wasteful selection code executions here.
                if (_this.selected === 'constructor')
                    return;
                _this.app.showConstructor(entity.conztructor);
                // Let the editor know we last selected the constructor.
                _this.selected = 'constructor';
            });
            $('.lua-field-item').on('click', function () {
                const fieldName = this.id.split('field-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === fieldName)
                    return;
                const field = entity.fields[fieldName];
                if (!field)
                    return;
                _this.app.showField(field);
                // Let the editor know we last selected the field.
                _this.selected = fieldName;
            });
            $('.lua-value-item').on('click', function () {
                const valueName = this.id.split('value-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === valueName)
                    return;
                const value = entity.values[valueName];
                if (!value)
                    return;
                _this.app.showValue(value);
                // Let the editor know we last selected the value.
                _this.selected = valueName;
            });
            $('.lua-method-item').on('click', function () {
                const methodName = this.id.split('method-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === methodName)
                    return;
                const method = entity.methods[methodName];
                if (!method)
                    return;
                _this.app.showMethod(method);
                // Let the editor know we last selected the method.
                _this.selected = methodName;
            });
            $('.lua-function-item').on('click', function () {
                const functionName = this.id.split('function-')[1].trim();
                // Prevent wasteful selection code executions here.
                if (_this.selected === functionName)
                    return;
                const func = entity.functions[functionName];
                if (!func)
                    return;
                _this.app.showFunction(func);
                // Let the editor know we last selected the function.
                _this.selected = functionName;
            });
        }
    }
    exports.ItemTree = ItemTree;
});
define("src/asledgehammer/rosetta/component/SidebarPanelButton", ["require", "exports", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/util"], function (require, exports, Component_2, util_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanelButton = void 0;
    class SidebarPanelButton extends Component_2.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            (0, util_9.$get)(this.id).on('click', () => {
                if (this.options && this.options.onclick) {
                    this.options.onclick();
                }
            });
        }
        onRender() {
            const { label } = this.options;
            return (0, util_9.html) `
            <button class="btn btn-primary col-12 rounded-0">${label}</button>
        `;
        }
    }
    exports.SidebarPanelButton = SidebarPanelButton;
});
define("src/asledgehammer/rosetta/component/SidebarPanel", ["require", "exports", "src/asledgehammer/rosetta/component/Component"], function (require, exports, Component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanel = void 0;
    class SidebarPanel extends Component_3.Component {
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
define("src/asledgehammer/rosetta/component/Sidebar", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/component/ItemTree", "src/asledgehammer/rosetta/component/SidebarPanel", "src/asledgehammer/rosetta/component/SidebarPanelButton"], function (require, exports, util_10, Component_4, ItemTree_1, SidebarPanel_1, SidebarPanelButton_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sidebar = void 0;
    class Sidebar extends Component_4.Component {
        constructor(app) {
            super({
                classes: ['vs-bg-6', 'shadow-lg', 'border', 'border-1'],
                style: {
                    width: '100%',
                    height: '100%',
                },
            });
            this.app = app;
            const buttons = [];
            const result = document.getElementById('result');
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                console.log('load!');
                result.innerHTML = reader.result;
            });
            const funcLoad = () => {
                const dFileLoad = document.getElementById('load-file');
                const onchange = () => {
                    const file = dFileLoad.files[0];
                    const textType = 'application/json';
                    if (file.type.match(textType)) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            const json = JSON.parse(reader.result);
                            app.loadLuaClass(json);
                            app.renderCode();
                            app.sidebar.itemTree.populate();
                        };
                        reader.readAsText(file);
                    }
                };
                dFileLoad.onchange = onchange;
                dFileLoad.click();
            };
            const funcSave = async () => {
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
            };
            buttons.push(new SidebarPanelButton_1.SidebarPanelButton({
                classes: ['mb-2'],
                label: 'Load',
                onclick: () => funcLoad()
            }));
            buttons.push(new SidebarPanelButton_1.SidebarPanelButton({
                classes: ['mb-2'],
                label: 'Save',
                onclick: () => funcSave()
            }));
            this.panel = new SidebarPanel_1.SidebarPanel({
                buttons
            });
            this.itemTree = new ItemTree_1.ItemTree(app);
        }
        onRender() {
            return (0, util_10.html) `

            <div class="bg-dark p-1 border-bottom border-bottom-2 border-black shadow">
                ${this.itemTree.render()}
            </div>

            <div class="bg-dark" style="height: 100%; overflow-y: auto;">${this.panel.render()}
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
        }
        listen() {
            this.panel.listen();
            this.itemTree.listen();
            this.itemTree.populate();
            const { app } = this;
            (0, util_10.$get)('btn-new-lua-value').on('click', () => {
                const { card } = app;
                if (!card)
                    return;
                const clazz = card.options.entity;
                if (!clazz)
                    return;
                this.itemTree.nameMode = 'new_value';
                this.itemTree.$titleName.html('Create Lua Value');
                this.itemTree.$inputName.val('');
                this.itemTree.modalName.show();
            });
            (0, util_10.$get)('btn-new-lua-field').on('click', () => {
                const { card } = app;
                if (!card)
                    return;
                const clazz = card.options.entity;
                if (!clazz)
                    return;
                this.itemTree.nameMode = 'new_field';
                this.itemTree.$titleName.html('Create Lua Field');
                this.itemTree.$inputName.val('');
                this.itemTree.modalName.show();
            });
            (0, util_10.$get)('btn-new-lua-function').on('click', () => {
                const { card } = app;
                if (!card)
                    return;
                const clazz = card.options.entity;
                if (!clazz)
                    return;
                this.itemTree.nameMode = 'new_function';
                this.itemTree.$titleName.html('Create Lua Function');
                this.itemTree.$inputName.val('');
                this.itemTree.modalName.show();
            });
            (0, util_10.$get)('btn-new-lua-method').on('click', () => {
                const { card } = app;
                if (!card)
                    return;
                const clazz = card.options.entity;
                if (!clazz)
                    return;
                this.itemTree.nameMode = 'new_method';
                this.itemTree.$titleName.html('Create Lua Method');
                this.itemTree.$inputName.val('');
                this.itemTree.modalName.show();
            });
        }
    }
    exports.Sidebar = Sidebar;
    ;
});
define("src/app", ["require", "exports", "src/asledgehammer/rosetta/component/LuaClassCard", "src/asledgehammer/rosetta/component/LuaConstructorCard", "src/asledgehammer/rosetta/component/LuaFieldCard", "src/asledgehammer/rosetta/component/LuaFunctionCard", "src/asledgehammer/rosetta/component/Sidebar", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/lua/RosettaLuaConstructor", "src/asledgehammer/rosetta/util"], function (require, exports, LuaClassCard_1, LuaConstructorCard_1, LuaFieldCard_1, LuaFunctionCard_1, Sidebar_1, LuaGenerator_5, RosettaLuaClass_2, RosettaLuaConstructor_2, util_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    async function load(url) {
        return await fetch(url).then((response) => response.json());
    }
    ;
    class App {
        constructor() {
            this.card = null;
            this.sidebar = new Sidebar_1.Sidebar(this);
            this.eSidebarContainer = document.getElementById('screen-sidebar-container');
            this.$screenContent = $('#screen-content-end-container');
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
                entity = new RosettaLuaConstructor_2.RosettaLuaConstructor(clazz);
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
            const $renderPane = (0, util_11.$get)('screen-content-render');
            $renderPane.empty();
            if (!this.card)
                return;
            // @ts-ignore
            const highlightedCode = hljs.highlight((0, LuaGenerator_5.generateLuaClass)(this.card.options.entity), { language: 'lua' }).value;
            $renderPane.append(highlightedCode);
        }
        createSidebar() {
            const { eSidebarContainer, sidebar } = this;
            eSidebarContainer.innerHTML = sidebar.render();
        }
    }
    exports.App = App;
    async function init() {
        // @ts-ignore
        Quill.register('modules/QuillMarkdown', QuillMarkdown, true);
        const app = new App();
        app.init();
        app.sidebar.listen();
        // // Load debug Rosetta JSON.
        // const json = await load('http://localhost:8080/assets/rosetta/patches/jab/json/client/isui/ISUIElement.json');
        // app.loadLuaClass(json);
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
define("src/asledgehammer/rosetta/component/LabelComponent", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component"], function (require, exports, util_12, Component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelComponent = void 0;
    class LabelComponent extends Component_5.Component {
        constructor(options) {
            super(options);
        }
        onRender() {
            return (0, util_12.html) `
            
        `;
        }
    }
    exports.LabelComponent = LabelComponent;
});
//# sourceMappingURL=app.js.map