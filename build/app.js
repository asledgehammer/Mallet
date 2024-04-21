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
            const method = new RosettaLuaFunction_1.RosettaLuaFunction(name);
            // (Only check for the file instance)
            if (this.methods[method.name]) {
                throw new Error(`A method already exists: ${method.name}`);
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
            const func = new RosettaLuaFunction_1.RosettaLuaFunction(name);
            // (Only check for the file instance)
            if (this.functions[func.name]) {
                throw new Error(`A function already exists: ${func.name}`);
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
            return json;
        }
    }
    exports.RosettaLuaClass = RosettaLuaClass;
});
define("src/asledgehammer/rosetta/lua/LuaGenerator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateLuaClass = exports.generateLuaMethod = exports.generateLuaParameterBody = exports.generateLuaValue = exports.generateLuaField = void 0;
    const generateLuaField = (field) => {
        return `--- @field ${field.name} ${field.type} ${field.notes ? field.notes : ''}`;
    };
    exports.generateLuaField = generateLuaField;
    const generateLuaValue = (containerName, field) => {
        return `${containerName}.${field.name} = ${field.defaultValue != null ? field.defaultValue : 'nil'};`;
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
    const generateLuaClass = (clazz) => {
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
                s += (0, exports.generateLuaField)(field) + '\n';
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
                s += (0, exports.generateLuaMethod)(clazz.name, method) + '\n\n';
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
define("src/asledgehammer/rosetta/component/LuaCard", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/CardComponent"], function (require, exports, util_3, CardComponent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaCard = void 0;
    const formatDeltaToMarkdown = (ops) => {
        let notes = '';
        for (const op of ops) {
            // console.log(next);
            if (op.insert) {
                let bold = false;
                let italic = false;
                let underline = false;
                let link = undefined;
                const attributes = op.attributes;
                if (attributes) {
                    if (attributes.bold)
                        bold = attributes.bold;
                    if (attributes.italic)
                        italic = attributes.italic;
                    if (attributes.underline)
                        underline = attributes.underline;
                    if (attributes.link)
                        link = attributes.link;
                }
                // ATTRIBUTES
                if (bold) {
                    if (italic)
                        notes += "***";
                    else
                        notes += '**';
                }
                else if (italic)
                    notes += "*";
                // CONTENTS
                notes += link ? `[${op.insert}](${link})` : op.insert;
                // ATTRIBUTES
                if (bold) {
                    if (italic)
                        notes += "***";
                    else
                        notes += '**';
                }
                else if (italic)
                    notes += "*";
            }
        }
        notes = notes.trim();
        if (notes.endsWith('\n'))
            notes = notes.substring(0, notes.length - 1);
        console.log(`"${notes}"`);
        return notes;
    };
    class LuaCard extends CardComponent_1.CardComponent {
        constructor(app, options) {
            super(options);
            this.app = app;
            this.idPreview = `${this.id}-preview`;
        }
        listenNotes(entity, idNotes) {
            const toolbarOptions = [['bold', 'italic', 'link']];
            const options = {
                theme: 'snow',
                modules: {
                    toolbar: toolbarOptions,
                    QuillMarkdown: {}
                }
            };
            // @ts-ignore
            const editor = new Quill(`#${idNotes}`, options);
            // @ts-ignore
            new QuillMarkdown(editor, {});
            editor.on('text-change', () => {
                const { ops } = editor.editor.getContents(0, 99999999);
                entity.notes = formatDeltaToMarkdown(ops);
                this.update();
                this.app.renderCode();
            });
            // @ts-ignore
            window.editor = editor;
            setTimeout(() => {
                editor.editor.insertText('', '');
            }, 1);
        }
        renderNotes(notes, idNotes) {
            if (!notes)
                notes = '';
            return (0, util_3.html) `
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <div id="${idNotes}" style="background-color: #222;">${notes}</div>
                <!-- <textarea id="${idNotes}" class="form-control responsive-input mt-1" spellcheck="false">${notes}</textarea> -->
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
        listenParameters(entity) {
            const { parameters } = entity;
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const $description = (0, util_3.$get)(idParamNotes);
                $description.on('input', () => {
                    param.notes = $description.val();
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
            }
        }
        renderParameters2(entity) {
            const { parameters } = entity;
            const idAccordion = `${entity.name}-parameters-accordion`;
            let htmlParams = '';
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                htmlParams += (0, util_3.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" id="headingTwo">
                        
                        <div class="p-2">
                            
                            <button class="border-0 accordion-button collapsed rounded-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                    <!-- <button class="accordion-button collapsed rounded-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}"><h6 class="font-monospace mb-1"><span class="text-warning bg-dark rounded-pill px-2">${param.type}</span> ${param.name}</h6></button> -->
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-secondary">
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
                            </div>

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <textarea id="${idParamNotes}" class="form-control responsive-input" spellcheck="false">${param.notes}</textarea>
                            </div>    
                        </div>
                    </div>
                </div>
            `;
            }
            return (0, util_3.html) `
        <h6 class="mb-2">Parameters</h6>
        <div class="accordion rounded-0 mb-4" id="${idAccordion}">
            ${htmlParams}
        </div>
            
        `;
        }
        renderParameters(entity, show = false) {
            const { parameters } = entity;
            const idAccordion = `${entity.name}-parameters-accordion`;
            let htmlParams = '';
            for (const param of parameters) {
                const idParamType = `${entity.name}-parameter-${param.name}-type`;
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                htmlParams += (0, util_3.html) `
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" id="headingTwo">
                        
                        <div class="p-2">
                            
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                    <!-- <button class="accordion-button collapsed rounded-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}"><h6 class="font-monospace mb-1"><span class="text-warning bg-dark rounded-pill px-2">${param.type}</span> ${param.name}</h6></button> -->
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-dark">
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
                            </div>

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <textarea id="${idParamNotes}" class="form-control responsive-input" spellcheck="false">${param.notes}</textarea>
                            </div>    
                        </div>
                    </div>
                </div>
            `;
            }
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
            const $description = (0, util_3.$get)(idReturnNotes);
            $description.on('input', () => {
                returns.notes = $description.val();
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
                        <textarea id="${idReturnNotes}" class="form-control responsive-input" spellcheck="false">${notes}</textarea>
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
                case 'class': return 'fa-solid fa-box-archive text-light mx-2';
                case 'constructor': return 'fa-solid fa-copyright text-light mx-2';
                case 'nil': return 'fa-solid fa-ban fa-danger mx-2';
                case 'void': return 'fa-solid fa-xmark mx-2';
                case 'number': return 'fa-solid fa-hashtag text-warning mx-2';
                case 'string': return 'fa-solid fa-quote-left text-light mx-2';
                case 'boolean': return 'fa-solid fa-flag text-info mx-2';
                // Uknown or other.
                case 'any': return 'fa-solid fa-question text-danger mx-2';
                // Objects
                default: return 'fa-solid fa-box text-success mx-2';
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
        }
        onHeaderHTML() {
            const { entity } = this.options;
            return (0, util_4.html) ` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2"><strong>Lua Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { notes } = this.options.entity;
            return (0, util_4.html) `
            <div>
                ${this.renderNotes(notes, this.idNotes)}
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
        }
    }
    exports.LuaClassCard = LuaClassCard;
});
define("src/asledgehammer/rosetta/component/LuaFieldCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_2, util_5, LuaCard_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFieldCard = void 0;
    class LuaFieldCard extends LuaCard_2.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idDefaultValue = `${this.id}-default-value`;
            this.idNotes = `${this.id}-notes`;
            this.idType = `${this.id}-type`;
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
                return `${(0, LuaGenerator_2.generateLuaField)(entity)}\n\n${(0, LuaGenerator_2.generateLuaValue)(name, entity)}`;
            }
            let s = (0, LuaGenerator_2.generateLuaField)(entity);
            if (defaultValue) {
                s += `\n\n--- (Example of initialization of field) ---\nself.${entity.name} = ${defaultValue};`;
            }
            return s;
        }
        onHeaderHTML() {
            const { entity, isStatic } = this.options;
            let name = entity.name;
            if (isStatic) {
                name = (0, util_5.html) `<span class="fst-italic">${entity.name}</span>`;
            }
            return (0, util_5.html) ` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-info px-2"><strong>Lua ${isStatic ? 'Property' : 'Field'}</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idDefaultValue, idNotes, idType } = this;
            const { entity } = this.options;
            return (0, util_5.html) `
            <div>
                ${this.renderNotes(entity.notes, idNotes)}
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
            const { idDefaultValue, idNotes, idType } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenDefaultValue(entity, idDefaultValue);
            this.listenType(entity, idType, idType);
        }
    }
    exports.LuaFieldCard = LuaFieldCard;
});
define("src/asledgehammer/rosetta/component/LuaFunctionCard", ["require", "exports", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/LuaCard"], function (require, exports, LuaGenerator_3, util_6, LuaCard_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LuaFunctionCard = void 0;
    class LuaFunctionCard extends LuaCard_3.LuaCard {
        constructor(app, options) {
            super(app, options);
            this.idNotes = `${this.id}-notes`;
            this.idReturnType = `${this.id}-return-type`;
            this.idReturnNotes = `${this.id}-return-notes`;
        }
        onRenderPreview() {
            if (!this.options)
                return '';
            const { entity } = this.options;
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            return (0, LuaGenerator_3.generateLuaMethod)(className, entity);
        }
        onHeaderHTML() {
            const { entity, isStatic } = this.options;
            const classEntity = this.app.card.options.entity;
            const className = classEntity.name;
            let name = `${className}${isStatic ? '.' : ':'}${entity.name}( )`;
            if (isStatic) {
                name = (0, util_6.html) `<span class="fst-italic">${name}</span>`;
            }
            return (0, util_6.html) ` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="responsive-badge px-2"><strong>Lua ${isStatic ? 'Function' : 'Method'}</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
        }
        onBodyHTML() {
            const { idNotes, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            return (0, util_6.html) `
            ${this.renderNotes(entity.notes, idNotes)}
            
            <hr>
            
            ${this.renderParameters(entity)}
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            
            <hr>
            
            ${this.renderPreview(false)}
            
        `;
        }
        listen() {
            super.listen();
            const { idNotes, idReturnType, idReturnNotes } = this;
            const { entity } = this.options;
            this.listenNotes(entity, idNotes);
            this.listenParameters(entity);
            this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
        }
    }
    exports.LuaFunctionCard = LuaFunctionCard;
});
define("src/asledgehammer/rosetta/component/SidebarPanelButton", ["require", "exports", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/util"], function (require, exports, Component_2, util_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPanelButton = void 0;
    class SidebarPanelButton extends Component_2.Component {
        constructor(options) {
            super(options);
        }
        listen() {
            (0, util_7.$get)(this.id).on('click', () => {
                if (this.options && this.options.onclick) {
                    this.options.onclick();
                }
            });
        }
        onRender() {
            const { label } = this.options;
            return (0, util_7.html) `
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
define("src/asledgehammer/rosetta/component/Sidebar", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component", "src/asledgehammer/rosetta/component/LuaCard", "src/asledgehammer/rosetta/component/SidebarPanel", "src/asledgehammer/rosetta/component/SidebarPanelButton"], function (require, exports, util_8, Component_4, LuaCard_4, SidebarPanel_1, SidebarPanelButton_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sidebar = void 0;
    class Sidebar extends Component_4.Component {
        constructor(app) {
            super({
                classes: ['vs-bg-6', 'shadow-lg', 'border', 'border-1'],
                style: {
                    'border-color': 'var(--vscode-color-2) !important',
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
                            app.sidebar.populateItemTree();
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
        }
        onRender() {
            return (0, util_8.html) `

            <div class="bg-dark p-1 border-bottom border-bottom-1 border-info shadow">

                <!-- New Class -->
                <button class="btn btn-sm btn-success rounded-0 me-1" style="width: 32px; height: 32px" title="New Class">
                    <i class="fa fa-file" style="position: relative; top: -1px"></i>
                </button>
                
                <!-- Open Class -->
                <button class="btn btn-sm btn-primary rounded-0" style="width: 32px; height: 32px" title="Open Class">
                    <i class="fa-solid fa-folder-open" style="position: relative; top: -1px"></i>
                </button>

                <!-- Save Class -->
                <button class="btn btn-sm btn-primary rounded-0 me-1" style="width: 32px; height: 32px" title="Save Class">
                    <i class="fa fa-save" style="position: relative; top: -1px"></i>
                </button>
                
                <!-- New Field -->
                <button class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Field">
                    <i class="fa-solid fa-hashtag" style="position: relative; top: -1px"></i>
                </button>

                <!-- New Method -->
                <button class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Method">
                    <i class="fa-solid fa-terminal" style="position: relative; top: -1px"></i>
                </button>

            </div>

            <div class="bg-dark" style="height: 100%; overflow-y: auto;">${this.panel.render()}
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-primary" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
        }
        populateItemTree() {
            const listenTree = () => {
                const { card: luaClass } = this.app;
                if (!luaClass)
                    return;
                const entity = luaClass.options.entity;
                if (!entity)
                    return;
                const fieldNames = Object.keys(entity.fields);
                fieldNames.sort((a, b) => a.localeCompare(b));
                for (const fieldName of Object.keys(entity.fields)) {
                    const field = entity.fields[fieldName];
                    const id = `lua-class-${entity.name}-field-${field.name}`;
                    const $fieldNode = (0, util_8.$get)(id);
                    $fieldNode.on('click', () => {
                        console.log(`Clicked ${id}!`);
                    });
                }
                let lastSelected = null;
                const _this = this;
                $('.lua-field-item').on('click', function () {
                    const fieldName = this.id.split('field-')[1].trim();
                    // Prevent wasteful selection code executions here.
                    if (lastSelected === fieldName)
                        return;
                    const field = entity.fields[fieldName];
                    if (!field)
                        return;
                    _this.app.showField(field);
                    // Let the editor know we last selected the field.
                    lastSelected = fieldName;
                });
                $('.lua-value-item').on('click', function () {
                    const valueName = this.id.split('value-')[1].trim();
                    // Prevent wasteful selection code executions here.
                    if (lastSelected === valueName)
                        return;
                    const value = entity.values[valueName];
                    if (!value)
                        return;
                    _this.app.showValue(value);
                    // Let the editor know we last selected the value.
                    lastSelected = valueName;
                });
                $('.lua-method-item').on('click', function () {
                    const methodName = this.id.split('method-')[1].trim();
                    // Prevent wasteful selection code executions here.
                    if (lastSelected === methodName)
                        return;
                    const method = entity.methods[methodName];
                    if (!method)
                        return;
                    _this.app.showMethod(method);
                    // Let the editor know we last selected the method.
                    lastSelected = methodName;
                });
                $('.lua-function-item').on('click', function () {
                    const functionName = this.id.split('function-')[1].trim();
                    // Prevent wasteful selection code executions here.
                    if (lastSelected === functionName)
                        return;
                    const func = entity.functions[functionName];
                    if (!func)
                        return;
                    _this.app.showFunction(func);
                    // Let the editor know we last selected the function.
                    lastSelected = functionName;
                });
            };
            const getTree = () => {
                const { card: luaClass } = this.app;
                if (!luaClass)
                    return [];
                const entity = luaClass.options.entity;
                if (!entity)
                    return [];
                const fieldNames = Object.keys(entity.fields);
                fieldNames.sort((a, b) => a.localeCompare(b));
                const fields = [];
                for (const fieldName of Object.keys(entity.fields)) {
                    const field = entity.fields[fieldName];
                    const id = `lua-class-${entity.name}-field-${field.name}`;
                    fields.push({
                        text: field.name,
                        icon: LuaCard_4.LuaCard.getTypeIcon(field.type),
                        id,
                        class: ['lua-field-item']
                    });
                }
                const valueNames = Object.keys(entity.values);
                valueNames.sort((a, b) => a.localeCompare(b));
                const values = [];
                for (const valueName of Object.keys(entity.values)) {
                    const value = entity.values[valueName];
                    const id = `lua-class-${entity.name}-value-${value.name}`;
                    values.push({
                        text: (0, util_8.html) `<span class="fst-italic">${value.name}</span>`,
                        icon: LuaCard_4.LuaCard.getTypeIcon(value.type),
                        id,
                        class: ['lua-value-item']
                    });
                }
                const methodNames = Object.keys(entity.methods);
                methodNames.sort((a, b) => a.localeCompare(b));
                const methods = [];
                for (const methodName of Object.keys(entity.methods)) {
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
                for (const functionName of Object.keys(entity.functions)) {
                    const func = entity.functions[functionName];
                    const id = `lua-class-${entity.name}-function-${func.name}`;
                    functions.push({
                        text: (0, util_8.html) `<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                        icon: 'fa-solid fa-terminal text-success mx-2',
                        id,
                        class: ['lua-function-item'],
                    });
                }
                // Some logic to retrieve, or generate tree structure
                return [
                    {
                        text: "Class Properties",
                        icon: LuaCard_4.LuaCard.getTypeIcon('class'),
                    },
                    {
                        text: "Constructor",
                        icon: LuaCard_4.LuaCard.getTypeIcon('constructor'),
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
                ];
            };
            let $tree = (0, util_8.$get)('tree');
            $tree.remove();
            (0, util_8.$get)('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
            $tree = (0, util_8.$get)('tree');
            const data = getTree();
            console.log({ data });
            // @ts-ignore
            $tree.bstreeview({ data });
            listenTree();
        }
        listen() {
            this.panel.listen();
            this.populateItemTree();
        }
    }
    exports.Sidebar = Sidebar;
    ;
});
define("src/app", ["require", "exports", "src/asledgehammer/rosetta/component/LuaClassCard", "src/asledgehammer/rosetta/component/LuaFieldCard", "src/asledgehammer/rosetta/component/LuaFunctionCard", "src/asledgehammer/rosetta/component/Sidebar", "src/asledgehammer/rosetta/lua/LuaGenerator", "src/asledgehammer/rosetta/lua/RosettaLuaClass", "src/asledgehammer/rosetta/util"], function (require, exports, LuaClassCard_1, LuaFieldCard_1, LuaFunctionCard_1, Sidebar_1, LuaGenerator_4, RosettaLuaClass_1, util_9) {
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
            this.$screenContent = $('#screen-content-container');
        }
        async init() {
            this.createSidebar();
        }
        loadLuaClass(json) {
            this.$screenContent.empty();
            // Always get first class
            const name = Object.keys(json.luaClasses)[0];
            const entity = new RosettaLuaClass_1.RosettaLuaClass(name, json.luaClasses[name]);
            this.card = new LuaClassCard_1.LuaClassCard(this, { entity: entity });
            this.$screenContent.append(this.card.render());
            this.card.listen();
            this.card.update();
            return this.card;
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
            const $renderPane = (0, util_9.$get)('screen-content-render');
            $renderPane.empty();
            if (!this.card)
                return;
            // @ts-ignore
            const highlightedCode = hljs.highlight((0, LuaGenerator_4.generateLuaClass)(this.card.options.entity), { language: 'lua' }).value;
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
        // // Load debug Rosetta JSON.
        const json = await load('http://localhost:8080/assets/rosetta/patches/jab/json/client/isui/ISUIElement.json');
        app.loadLuaClass(json);
        app.sidebar.listen();
        app.renderCode();
        // @ts-ignore
        window.app = app;
    }
    init();
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
define("src/asledgehammer/rosetta/RosettaFile", ["require", "exports", "src/asledgehammer/rosetta/Rosetta", "src/asledgehammer/rosetta/RosettaEntity", "src/asledgehammer/rosetta/lua/RosettaLuaFunction", "src/asledgehammer/rosetta/lua/RosettaLuaTable", "src/asledgehammer/rosetta/lua/RosettaLuaTableField", "src/asledgehammer/rosetta/lua/RosettaLuaClass"], function (require, exports, Rosetta_1, RosettaEntity_9, RosettaLuaFunction_3, RosettaLuaTable_1, RosettaLuaTableField_2, RosettaLuaClass_2) {
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
                    const luaClass = new RosettaLuaClass_2.RosettaLuaClass(name, rawLuaClass);
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
            const luaClass = new RosettaLuaClass_2.RosettaLuaClass(name);
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
define("src/asledgehammer/rosetta/component/LabelComponent", ["require", "exports", "src/asledgehammer/rosetta/util", "src/asledgehammer/rosetta/component/Component"], function (require, exports, util_10, Component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelComponent = void 0;
    class LabelComponent extends Component_5.Component {
        constructor(options) {
            super(options);
        }
        onRender() {
            return (0, util_10.html) `
            
        `;
        }
    }
    exports.LabelComponent = LabelComponent;
});
//# sourceMappingURL=app.js.map