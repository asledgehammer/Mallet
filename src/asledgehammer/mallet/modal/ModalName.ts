import { App } from "../../../app";
import { RosettaJavaClass } from "../../rosetta/java/RosettaJavaClass";
import { RosettaJavaConstructor } from "../../rosetta/java/RosettaJavaConstructor";
import { RosettaJavaMethod } from "../../rosetta/java/RosettaJavaMethod";
import { RosettaJavaParameter } from "../../rosetta/java/RosettaJavaParameter";
import { RosettaLuaClass } from "../../rosetta/lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../../rosetta/lua/RosettaLuaConstructor";
import { RosettaLuaField } from "../../rosetta/lua/RosettaLuaField";
import { RosettaLuaFunction } from "../../rosetta/lua/RosettaLuaFunction";
import { RosettaLuaFunctionCluster } from "../../rosetta/lua/RosettaLuaFunctionCluster";
import { RosettaLuaTable } from "../../rosetta/lua/RosettaLuaTable";
import { $get, isNameValid, validateLuaVariableName } from "../../rosetta/util";
import { NameModeType } from "../component/NameModeType";

export class ModalName {

    readonly app: App;

    // This modal is for new items and editing their names.
    readonly modalName: any;
    readonly $inputName: JQuery<HTMLInputElement>;
    readonly $btnName: JQuery<HTMLButtonElement>;
    readonly $titleName: JQuery<HTMLHeadingElement>;

    // Temporary fields for editing.
    javaMethod: RosettaJavaMethod | undefined = undefined;
    javaConstructor: RosettaJavaMethod | undefined = undefined;
    javaParameter: RosettaJavaParameter | undefined = undefined;
    javaCallback: ((name: string) => void) | undefined = undefined;

    luaClass: RosettaLuaClass | undefined = undefined;
    luaTable: RosettaLuaTable | undefined = undefined;
    luaConstructor: RosettaLuaConstructor | undefined = undefined;
    luaFunction: RosettaLuaFunction | undefined = undefined;
    luaMethod: RosettaLuaFunction | undefined = undefined;
    luaField: RosettaLuaField | undefined = undefined;

    globalLuaFunction: RosettaLuaFunction | undefined = undefined;
    globalLuaField: RosettaLuaField | undefined = undefined;

    nameSelected: string | undefined;
    nameMode: NameModeType;

    constructor(app: App) {
        this.app = app;

        // @ts-ignore This modal is for new items and editing their names.
        this.modalName = new bootstrap.Modal('#modal-name', {});
        this.$titleName = $get('title-name');
        this.$inputName = $get('input-name');
        this.$btnName = $get('btn-name-create');
        this.nameMode = null;
    }

    onGlobalCreate() {
        const { $inputName, app } = this;
        const { catalog, toast } = app;
        const name = validateLuaVariableName($inputName.val()!).trim();
        const nameOld = this.nameSelected!;
        switch (this.nameMode) {
            case 'new_field': {
                try {
                    const field = new RosettaLuaField(name);
                    catalog.fields[field.name] = field;
                    app.showGlobalLuaField(field);
                    toast.alert('Created Global Lua Field.', 'success');
                } catch (e) {
                    toast.alert(`Failed to create Global Lua Field.`, 'error');
                    console.error(e);
                }
                break;
            }
            case 'edit_field': {
                try {
                    const field = catalog.fields[nameOld];
                    field.name = name;
                    catalog.fields[name] = field;
                    delete catalog.fields[nameOld];
                    app.showLuaClassField(field);
                    toast.alert('Edited Global Lua Field.');
                } catch (e) {
                    toast.alert(`Failed to edit Global Lua Field.`, 'error');
                    console.error(e);
                }
                break;
            }
            case 'new_function': {
                try {
                    const func = new RosettaLuaFunction(name, { returns: { type: 'void' } });
                    catalog.functions[func.name] = func;
                    app.showGlobalLuaFunction(func);
                    toast.alert('Created Global Lua Function.', 'success');
                } catch (e) {
                    toast.alert(`Failed to create Global Lua Function.`, 'error');
                    console.error(e);
                }
                break;
            }
            case 'edit_function': {
                try {
                    const funcName = nameOld;
                    const name = validateLuaVariableName($inputName.val()!).trim();
                    const func = catalog.functions[funcName];
                    func.name = name;
                    catalog.functions[name] = func;
                    delete catalog.functions[nameOld];
                    app.showGlobalLuaFunction(func);
                    toast.alert('Created Global Lua Function.', 'success');
                } catch (e) {
                    toast.alert(`Failed to create Global Lua Function.`, 'error');
                    console.error(e);
                }
                break;
            }
            case 'new_parameter': {
                try {
                    const split = nameOld.split('-');
                    const type = split[0];
                    const funcName = split[1];

                    let func: RosettaLuaFunction | RosettaJavaMethod | undefined = undefined;

                    if (type === 'function') {
                        func = catalog.functions[funcName];
                    } else {
                        throw new Error('Creating parameters for Java Methods is not supported.');
                    }

                    if (!func) {
                        toast.alert('Unknown function: ' + funcName, 'error');
                        return;
                    }

                    func.addParameter(name, 'any');
                    app.showGlobalLuaFunction(func);

                    toast.alert('Created Global Lua Function Parameter.', 'success');
                } catch (e) {
                    toast.alert(`Failed to create Global Lua Function Parameter.`, 'error');
                    console.error(e);
                }
                break;
            }
            case 'edit_parameter': {
                try {
                    const split = nameOld.split('-');
                    const funcName = split[0];
                    const paramName = split[1];
                    let type: 'method' | 'function' | null = null;
                    let func: RosettaJavaMethod | RosettaLuaFunction | undefined = undefined;
                    let param = null;
                    // First, check methods.
                    func = this.javaMethod;
                    // Second, check functions.
                    if (!func) {
                        for (const methodName of Object.keys(catalog.functions)) {
                            if (methodName === funcName) {
                                func = catalog.functions[methodName];
                                type = 'function';
                                break;
                            }
                        }
                    }
                    if (!func) {
                        console.warn(`Unknown function / method: _G.${funcName}!`);
                        break;
                    }
                    for (const next of func.parameters) {
                        if (next.name === paramName) {
                            param = next;
                            break;
                        }
                    }
                    if (!param) {
                        console.warn(`Unknown parameter: _G.${funcName}#${paramName}!`);
                        break;
                    }
                    param.name = name;
                    if (type === 'function') {
                        app.showGlobalLuaFunction(func as RosettaLuaFunction);
                        toast.alert('Edited Global Lua Function Parameter.');
                    } else if (type === 'method') {
                        app.showGlobalJavaMethod(func as RosettaJavaMethod);
                        toast.alert('Edited Global Java Method Parameter.');
                    }
                } catch (e) {
                    toast.alert(`Failed to edit Parameter.`, 'error');
                    console.error(e);
                }
                break;
            }
            default: {
                throw new Error('Unsupported Global name-mode: ' + this.nameMode);
            }
        }

        this.globalLuaField = undefined;
        this.globalLuaFunction = undefined;
        this.nameSelected = undefined;
        this.modalName.hide();
    }

    listen() {

        const { app, $inputName, $btnName } = this;
        const { catalog: active, toast } = app;

        this.$inputName.on('input', () => {
            const val = $inputName.val()!;
            const isValid = isNameValid(val);
            $btnName.prop('disabled', !isValid);
            if (isValid) {
                $inputName.removeClass('is-invalid');
                $inputName.addClass('is-valid');
            } else {
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

            // Handle global creation elsewhere.
            if (this.app.sidebar.objTree.globalSelected) {
                this.onGlobalCreate();
                return;
            }

            const entity = active.selectedCard?.options!.entity!;
            const name = validateLuaVariableName($inputName.val()!).trim();
            const nameOld = this.nameSelected!;
            switch (this.nameMode) {
                case 'new_lua_class': {
                    try {
                        const entity = new RosettaLuaClass(validateLuaVariableName($inputName.val()!).trim());
                        app.catalog.luaClasses[entity.name] = entity;
                        app.showLuaClass(entity);
                        toast.alert('Created Lua Class.', 'success');
                    } catch (e) {
                        toast.alert(`Failed to create Lua Class.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'new_lua_table': {
                    try {
                        const entity = new RosettaLuaTable(validateLuaVariableName($inputName.val()!).trim());
                        app.catalog.luaTables[entity.name] = entity;
                        app.showLuaTable(entity);
                        toast.alert('Created Lua Table.', 'success');
                    } catch (e) {
                        toast.alert(`Failed to create Lua Table.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_lua_class': {
                    if (entity instanceof RosettaLuaClass) {
                        try {

                            // Modify the dictionary.
                            delete active.luaClasses[entity.name];
                            entity.name = name;
                            active.luaClasses[name] = entity;

                            app.showLuaClass(entity);
                            toast.alert('Edited Lua Class.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua class.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        throw new Error('Cannot modify Lua class-name of Lua table.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify Lua class-name of Java class.');
                    }
                    break;
                }
                case 'edit_lua_table': {
                    if (entity instanceof RosettaLuaTable) {
                        try {
                            // Modify the dictionary.
                            delete active.luaTables[entity.name];
                            entity.name = name;
                            active.luaTables[name] = entity;

                            app.showLuaTable(entity);
                            toast.alert('Edited Lua table.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua table.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaClass) {
                        throw new Error('Cannot modify Lua table-name of Lua class.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify Lua table-name of Java class.');
                    }
                    break;
                }
                case 'new_field': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const field = entity.createField(name);
                            app.showLuaClassField(field);
                            toast.alert('Created Lua Class Field.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Class Field.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const field = entity.createField(name);
                            app.showLuaTableField(field);
                            toast.alert('Created Lua Table Field.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Table Field.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Cannot add field in Java class. (Not implemented)');
                    }
                    break;
                }
                case 'edit_field': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const field = entity.fields[nameOld];
                            field.name = name;
                            entity.fields[name] = field;
                            delete entity.fields[nameOld];
                            app.showLuaClassField(field);
                            toast.alert('Edited Lua Class Field.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Class Field.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const field = entity.fields[nameOld];
                            field.name = name;
                            entity.fields[name] = field;
                            delete entity.fields[nameOld];
                            app.showLuaTableField(field);
                            toast.alert('Edited Lua Table Field.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Table Field.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify name of Java field. (Read-Only)');
                    }
                    break;
                }
                case 'new_value': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const value = entity.createValue(name);
                            app.showLuaClassValue(value);
                            toast.alert('Created Lua Value.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Value.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        throw new Error('Values are not supported in Lua Tables.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Values are not supported in Java.');
                    }
                    break;
                }
                case 'edit_value': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const value = entity.values[nameOld];
                            value.name = name;
                            entity.values[name] = value;
                            delete entity.values[nameOld];
                            app.showLuaClassValue(value);
                            toast.alert('Edited Lua value.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Value.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        throw new Error('Values are not supported in Lua Tables.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Values are not supported in Java.');
                    }
                    break;
                }
                case 'new_function': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const func = entity.createFunction(name);
                            app.showLuaClassFunction(func);
                            toast.alert('Created Lua Function.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Function.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const func = entity.createFunction(name);
                            app.showLuaTableFunction(func);
                            toast.alert('Created Lua Function.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Function.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Functions are not supported in Java.');
                    }
                    break;
                }
                case 'edit_function': {
                    if (entity instanceof RosettaLuaClass) {

                        try {
                            const func = this.luaFunction!;
                            const nameOld = func.name;
                            func.name = name;

                            // Grab the old cluster and remove the function.
                            let cluster = entity.functions[nameOld];
                            cluster.functions.splice(
                                cluster.functions.indexOf(func),
                                1
                            );

                            // Remove cluster if empty.
                            if (cluster.functions.length === 0) {
                                delete entity.functions[nameOld];
                            }

                            // Grab the new-named cluster.
                            cluster = entity.functions[name];
                            // Create the cluster if not present.
                            if (!cluster) {
                                cluster = new RosettaLuaFunctionCluster(name);
                                entity.functions[name] = cluster;
                            }
                            // Add the function to this cluster.
                            cluster.add(func);

                            delete entity.functions[nameOld];
                            app.showLuaClassFunction(func);
                            toast.alert('Edited Lua Class Function.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Class Function.`, 'error');
                            console.error(e);
                        }

                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const func = entity.functions[nameOld];
                            func.name = name;
                            entity.functions[name] = func;
                            delete entity.functions[nameOld];
                            app.showLuaTableFunction(func);
                            toast.alert('Edited Lua Table Function.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Table Function.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Functions are not supported in Java.');
                    }
                    break;
                }
                case 'new_method': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const method = entity.createMethod(name);
                            app.showLuaClassMethod(method);
                            toast.alert('Created Lua Method.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Method.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        throw new Error('Methods are not supported in Lua Tables.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Adding Methods are not supported in Java.');
                    }
                    break;
                }
                case 'edit_method': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const func = this.luaMethod!;
                            const nameOld = func.name;
                            func.name = name;

                            // Grab the old cluster and remove the function.
                            let cluster = entity.methods[nameOld];
                            cluster.functions.splice(
                                cluster.functions.indexOf(func),
                                1
                            );

                            // Remove cluster if empty.
                            if (cluster.functions.length === 0) {
                                delete entity.methods[nameOld];
                            }

                            // Grab the new-named cluster.
                            cluster = entity.methods[name];
                            // Create the cluster if not present.
                            if (!cluster) {
                                cluster = new RosettaLuaFunctionCluster(name);
                                entity.methods[name] = cluster;
                            }
                            // Add the function to this cluster.
                            cluster.add(func);

                            app.showLuaClassMethod(func);
                            toast.alert('Edited Lua Class Method.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Class Method.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        throw new Error('Methods are not supported in Lua Tables.');
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Editing Methods are not supported in Java.');
                    }
                    break;
                }
                case 'new_parameter': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const split = nameOld.split('-');
                            const type = split[0];
                            const funcName = split[1];

                            let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
                            if (type === 'constructor') {
                                func = this.luaConstructor!;
                            } else if (type === 'function') {
                                func = this.luaFunction!;
                            } else {
                                func = this.luaMethod!;
                            }

                            func!.addParameter(name, 'any');

                            if (type === 'constructor') {
                                app.showLuaClassConstructor(func as RosettaLuaConstructor);
                            } else if (type === 'function') {
                                app.showLuaClassFunction(func as RosettaLuaFunction);
                            } else {
                                app.showLuaClassMethod(func as RosettaLuaFunction);
                            }
                            toast.alert('Created Lua Parameter.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const split = nameOld.split('-');
                            const type = split[0];
                            const funcName = split[1];

                            let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
                            if (type === 'constructor') {
                                throw new Error('Constructors are not supported in Lua Tables.');
                            } else if (type === 'function') {
                                func = entity.functions[funcName];
                            } else {
                                throw new Error('Methods are not supported in Lua Tables.');
                            }

                            func!.addParameter(name, 'any');

                            app.showLuaTableFunction(func as RosettaLuaFunction);

                            toast.alert('Created Lua Parameter.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Adding parameters are not supported in Java.');
                    }
                    break;
                }
                case 'edit_parameter': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const split = nameOld.split('-');
                            const funcName = split[0];
                            const paramName = split[1];
                            let type: 'constructor' | 'method' | 'function' | null = null;
                            let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
                            let param = null;
                            // Could be the constructor.
                            if (funcName === 'new') {
                                func = this.luaConstructor!;
                                type = 'constructor';
                            } else {
                                if (this.luaMethod) {
                                    func = this.luaMethod!;
                                    type = 'method';
                                } else if (this.luaFunction) {
                                    func = this.luaFunction!;
                                    type = 'function';
                                }
                            }
                            if (!func) {
                                console.warn(`Unknown function / method / constructor: ${entity.name}.${funcName}!`);
                                break;
                            }
                            for (const next of func.parameters) {
                                if (next.name === paramName) {
                                    param = next;
                                    break;
                                }
                            }
                            if (!param) {
                                console.warn(`Unknown parameter: ${entity.name}.${funcName}#${paramName}!`);
                                break;
                            }
                            param.name = name;
                            if (type === 'constructor') {
                                app.showLuaClassConstructor(func as RosettaLuaConstructor);
                            } else if (type === 'function') {
                                app.showLuaClassFunction(func as RosettaLuaFunction);
                            } else if (type === 'method') {
                                app.showLuaClassMethod(func as RosettaLuaFunction);
                            }
                            toast.alert('Edited Lua Parameter.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const split = nameOld.split('-');
                            const funcName = split[0];
                            const paramName = split[1];
                            let func = null;
                            let param = null;
                            for (const methodName of Object.keys(entity.functions)) {
                                if (methodName === funcName) {
                                    func = entity.functions[methodName];
                                    break;
                                }
                            }
                            if (!func) {
                                console.warn(`Unknown function: ${entity.name}.${funcName}!`);
                                break;
                            }
                            for (const next of func.parameters) {
                                if (next.name === paramName) {
                                    param = next;
                                    break;
                                }
                            }
                            if (!param) {
                                console.warn(`Unknown parameter: ${entity.name}.${funcName}#${paramName}!`);
                                break;
                            }
                            param.name = name;

                            app.showLuaTableFunction(func as RosettaLuaFunction);
                            toast.alert('Edited Lua Parameter.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        try {
                            const split = nameOld.split('-');
                            const funcName = split[0];
                            const paramName = split[1];
                            let type: 'constructor' | 'method' | null = null;
                            let method: RosettaJavaConstructor | RosettaJavaMethod | undefined = undefined;
                            let param = this.javaParameter;
                            if (funcName === 'new') {
                                method = this.javaConstructor;
                                type = 'constructor';
                            } else {
                                method = this.javaMethod;
                            }
                            if (!method) {
                                console.warn(`Unknown function / method / constructor: ${entity.name}.${funcName}!`);
                                break;
                            }
                            if (!param) {
                                console.warn(`Unknown parameter: ${entity.name}.${funcName}#${paramName}!`);
                                break;
                            }
                            param.name = name;
                            if (type === 'constructor') {
                                app.showJavaClassConstructor((method as any) as RosettaJavaConstructor);
                            } else if (type === 'method') {
                                app.showJavaClassMethod((method as any) as RosettaJavaMethod);
                            }
                            toast.alert('Edited Lua Parameter.');

                            if (this.javaCallback) this.javaCallback(name);

                            // Reset.
                            this.javaConstructor = undefined;
                            this.javaMethod = undefined;
                            this.javaParameter = undefined;
                            this.javaCallback = undefined;
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
            }

            /* (Global Types) */
            this.globalLuaField = undefined;
            this.globalLuaFunction = undefined;

            /* (Lua Types) */
            this.luaClass = undefined;
            this.luaConstructor = undefined;
            this.luaField = undefined;
            this.luaFunction = undefined;
            this.luaMethod = undefined;
            this.luaTable = undefined;

            /* (Java Types) */
            this.javaConstructor = undefined;
            this.javaMethod = undefined;
            this.javaParameter = undefined;
            this.javaCallback = undefined;

            this.nameSelected = undefined;
            this.modalName.hide();
        });
    }

    show(disableBtn: boolean) {
        this.$btnName.prop('disabled', disableBtn);
        this.modalName.show();
    }

    hide() {
        this.modalName.hide();
    }
}
