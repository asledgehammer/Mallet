import { App } from "../../../app";
import { RosettaJavaClass } from "../../rosetta/java/RosettaJavaClass";
import { RosettaJavaConstructor } from "../../rosetta/java/RosettaJavaConstructor";
import { RosettaJavaMethod } from "../../rosetta/java/RosettaJavaMethod";
import { RosettaJavaParameter } from "../../rosetta/java/RosettaJavaParameter";
import { RosettaLuaClass } from "../../rosetta/lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../../rosetta/lua/RosettaLuaConstructor";
import { RosettaLuaFunction } from "../../rosetta/lua/RosettaLuaFunction";
import { RosettaLuaTable } from "../../rosetta/lua/RosettaLuaTable";
import { $get, validateLuaVariableName } from "../../rosetta/util";
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

    listen() {

        const { app, $inputName, $btnName } = this;
        const { catalog: active, sidebar, toast } = app;

        this.$inputName.on('input', () => {
            setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val()!)), 1);
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
            const entity = active.selectedCard?.options!.entity!;
            const name = validateLuaVariableName($inputName.val()!).trim();
            const nameOld = this.nameSelected!;
            switch (this.nameMode) {
                case 'new_class': {
                    try {
                        const entity = new RosettaLuaClass(validateLuaVariableName($inputName.val()!).trim());
                        app.showLuaClass(entity);
                        app.sidebar.populateTrees();
                        toast.alert('Created Lua Class.', 'success');
                    } catch (e) {
                        toast.alert(`Failed to create Lua Class.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_class': {
                    if (entity instanceof RosettaLuaClass) {
                        try {

                            // Modify the dictionary.
                            delete active.luaClasses[entity.name];
                            entity.name = name;
                            active.luaClasses[name] = entity;

                            app.showLuaClass(entity);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Class.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Class.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify name of Java class. (Read-Only)');
                    }
                    break;
                }
                case 'new_field': {
                    if (entity instanceof RosettaLuaClass) {
                        try {
                            const field = entity.createField(name);
                            app.showLuaClassField(field);
                            sidebar.populateTrees();
                            toast.alert('Created Lua Class Field.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Class Field.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const field = entity.createField(name);
                            app.showLuaTableField(field);
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
                            toast.alert('Created Lua Function.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Function.`, 'error');
                            console.error(e);
                        }
                    } else if (entity instanceof RosettaLuaTable) {
                        try {
                            const func = entity.createFunction(name);
                            app.showLuaClassFunction(func);
                            sidebar.populateTrees();
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
                            const func = entity.functions[nameOld];
                            func.name = name;
                            entity.functions[name] = func;
                            delete entity.functions[nameOld];
                            app.showLuaClassFunction(func);
                            sidebar.populateTrees();
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
                            app.showLuaClassFunction(func);
                            sidebar.populateTrees();
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
                            sidebar.populateTrees();
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
                            const method = entity.methods[nameOld];
                            method.name = name;
                            entity.methods[name] = method;
                            delete entity.methods[nameOld];
                            app.showLuaClassMethod(method);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Method.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Method.`, 'error');
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
                                func = entity.conztructor;
                            } else if (type === 'function') {
                                func = entity.functions[funcName];
                            } else {
                                func = entity.methods[funcName];
                            }

                            func!.addParameter(name, 'any');

                            if (type === 'constructor') {
                                app.showLuaClassConstructor(func as RosettaLuaConstructor);
                            } else if (type === 'function') {
                                app.showLuaClassFunction(func as RosettaLuaFunction);
                            } else {
                                app.showLuaClassMethod(func as RosettaLuaFunction);
                            }
                            app.renderCode();
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

                            app.showLuaClassFunction(func as RosettaLuaFunction);
                            app.renderCode();

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
                            let func = null;
                            let param = null;
                            // Could be the constructor.
                            if (funcName === 'new') {
                                func = entity.conztructor;
                                type = 'constructor';
                            } else {
                                // First, check methods.
                                for (const methodName of Object.keys(entity.methods)) {
                                    if (methodName === funcName) {
                                        func = entity.methods[methodName];
                                        type = 'method';
                                        break;
                                    }
                                }
                                // Second, check functions.
                                if (!func) {
                                    for (const methodName of Object.keys(entity.functions)) {
                                        if (methodName === funcName) {
                                            func = entity.functions[methodName];
                                            type = 'function';
                                            break;
                                        }
                                    }
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
                            app.renderCode();
                            sidebar.populateTrees();
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

                            app.showLuaClassFunction(func as RosettaLuaFunction);
                            app.renderCode();
                            sidebar.populateTrees();
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
                            app.renderCode();
                            sidebar.populateTrees();
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
            this.nameSelected = undefined;
            this.modalName.hide();
        });
    }

    hide() {
        this.modalName.hide();
    }
}
