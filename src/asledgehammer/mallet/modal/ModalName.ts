import { App } from "../../../app";
import { RosettaJavaClass } from "../../rosetta/java/RosettaJavaClass";
import { RosettaLuaClass } from "../../rosetta/lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../../rosetta/lua/RosettaLuaConstructor";
import { RosettaLuaFunction } from "../../rosetta/lua/RosettaLuaFunction";
import { $get, validateLuaVariableName } from "../../rosetta/util";
import { NameModeType } from "../component/NameModeType";

export class ModalName {

    readonly app: App;

    // This modal is for new items and editing their names.
    readonly modalName: any;
    readonly $inputName: JQuery<HTMLInputElement>;
    readonly $btnName: JQuery<HTMLButtonElement>;
    readonly $titleName: JQuery<HTMLHeadingElement>;

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

        const { app, $inputName, $titleName, $btnName } = this;
        const { active, sidebar, toast } = app;

        this.$inputName.on('input', () => {
            setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val()!)), 1);
        });

        this.$btnName.on('click', () => {
            const clazz = active.selectedCard?.options!.entity!;
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
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            
                            // Modify the dictionary.
                            delete active.luaClasses[clazz.name];
                            clazz.name = name;
                            active.luaClasses[name] = clazz;

                            app.showLuaClass(clazz);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Class.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Class.`, 'error');
                            console.error(e);
                        }
                    } else if (clazz instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify name of Java class. (Read-Only)');
                    }
                    break;
                }
                case 'new_field': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const field = clazz.createField(name);
                            app.showLuaClassField(field);
                            sidebar.populateTrees();
                            toast.alert('Created Lua Field.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Field.`, 'error');
                            console.error(e);
                        }
                    } else if (clazz instanceof RosettaJavaClass) {
                        throw new Error('Cannot add field in Java class. (Not implemented)');
                    }
                    break;
                }
                case 'edit_field': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const field = clazz.fields[nameOld];
                            field.name = name;
                            clazz.fields[name] = field;
                            delete clazz.fields[nameOld];
                            app.showLuaClassField(field);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Field.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Field.`, 'error');
                            console.error(e);
                        }
                    } else if (clazz instanceof RosettaJavaClass) {
                        throw new Error('Cannot modify name of Java field. (Read-Only)');
                    }
                    break;
                }
                case 'new_value': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const value = clazz.createValue(name);
                            app.showLuaClassValue(value);
                            sidebar.populateTrees();
                            toast.alert('Created Lua Value.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Value.`, 'error');
                            console.error(e);
                        }
                    } else if (clazz instanceof RosettaJavaClass) {
                        throw new Error('Values are not supported in Java.');
                    }
                    break;
                }
                case 'edit_value': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const value = clazz.values[nameOld];
                            value.name = name;
                            clazz.values[name] = value;
                            delete clazz.values[nameOld];
                            app.showLuaClassValue(value);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua value.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Value.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'new_function': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const func = clazz.createFunction(name);
                            app.showLuaClassFunction(func);
                            sidebar.populateTrees();
                            toast.alert('Created Lua Function.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Function.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'edit_function': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const func = clazz.functions[nameOld];
                            func.name = name;
                            clazz.functions[name] = func;
                            delete clazz.functions[nameOld];
                            app.showLuaClassFunction(func);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Function.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Function.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'new_method': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const method = clazz.createMethod(name);
                            app.showLuaClassMethod(method);
                            sidebar.populateTrees();
                            toast.alert('Created Lua Method.', 'success');
                        } catch (e) {
                            toast.alert(`Failed to create Lua Method.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'edit_method': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const method = clazz.methods[nameOld];
                            method.name = name;
                            clazz.methods[name] = method;
                            delete clazz.methods[nameOld];
                            app.showLuaClassMethod(method);
                            sidebar.populateTrees();
                            toast.alert('Edited Lua Method.');
                        } catch (e) {
                            toast.alert(`Failed to edit Lua Method.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'new_parameter': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const split = nameOld.split('-');
                            const type = split[0];
                            const funcName = split[1];

                            let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
                            if (type === 'constructor') {
                                func = clazz.conztructor;
                            } else if (type === 'function') {
                                func = clazz.functions[funcName];
                            } else {
                                func = clazz.methods[funcName];
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
                    }
                    break;
                }
                case 'edit_parameter': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const split = nameOld.split('-');
                            const funcName = split[0];
                            const paramName = split[1];
                            let type: 'constructor' | 'method' | 'function' | null = null;
                            let func = null;
                            let param = null;
                            // Could be the constructor.
                            if (funcName === 'new') {
                                func = clazz.conztructor;
                                type = 'constructor';
                            } else {
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
