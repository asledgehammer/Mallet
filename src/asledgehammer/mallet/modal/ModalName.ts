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
    javaClass: RosettaJavaClass | undefined = undefined;
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

    listen() {

        const { app, $inputName, $btnName } = this;
        const { catalog: active } = app;

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

            const name = validateLuaVariableName($inputName.val()!).trim();
            const nameOld = this.nameSelected!;

            // Handle global creation elsewhere.
            if (this.app.sidebar.objTree.globalSelected) {
                this.onGlobalListen(nameOld, name);
                return;
            }

            const entity = active.selectedCard?.options!.entity!;

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
                        this.onEditLuaClass(this.luaClass!, name);
                    }
                    break;
                }
                case 'edit_lua_table': {
                    if (this.luaTable) {
                        this.onEditLuaTable(this.luaTable!, name);
                    }
                    break;
                }
                case 'new_field': {
                    if (this.luaClass) {
                        this.onLuaClassNewField(this.luaClass!, name);
                    } else if (this.luaTable) {
                        this.onLuaTableNewField(this.luaTable!, name);
                    }
                    break;
                }
                case 'edit_field': {
                    if (this.luaClass) {
                        this.onLuaClassEditField(this.luaClass!, nameOld, name);
                    } else if (this.luaTable) {
                        this.onLuaTableEditField(this.luaTable!, nameOld, name);
                    }
                    break;
                }
                case 'new_value': {
                    if (this.luaClass) {
                        this.onLuaClassNewValue(this.luaClass!, name);
                    }
                    break;
                }
                case 'edit_value': {
                    if (this.luaClass) {
                        this.onLuaClassEditValue(this.luaClass!, nameOld, name);
                    }
                    break;
                }
                case 'new_function': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassNewFunction(entity, name);
                    } else if (entity instanceof RosettaLuaTable) {
                        this.onLuaTableNewFunction(entity, name);
                    }
                    break;
                }
                case 'edit_function': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassEditFunction(entity, this.luaFunction!, name);
                    } else if (entity instanceof RosettaLuaTable) {
                        this.onLuaTableEditFunction(entity, this.luaFunction!, name);
                    }
                    break;
                }
                case 'new_method': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassNewMethod(entity, name);
                    }
                    break;
                }
                case 'edit_method': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassEditMethod(entity, this.luaFunction!, name);
                    }
                    break;
                }
                case 'new_parameter': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassNewParameter(nameOld, name);
                    } else if (entity instanceof RosettaLuaTable) {
                        this.onLuaTableNewParameter(nameOld, name);
                    }
                    break;
                }
                case 'edit_parameter': {
                    if (entity instanceof RosettaLuaClass) {
                        this.onLuaClassEditParameter(entity, nameOld, name);
                    } else if (entity instanceof RosettaLuaTable) {
                        this.onLuaTableEditParameter(entity, nameOld, name);
                    } else if (entity instanceof RosettaJavaClass) {
                        this.onJavaClassEditParameter(entity, nameOld, name);
                    }
                    break;
                }
            }

            this.reset();
            this.modalName.hide();
        });
    }

    onGlobalListen(nameOld: string, name: string) {

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
                    this.onEditLuaClass(this.luaClass!, name);
                }
                break;
            }
            case 'edit_lua_table': {
                if (this.luaTable) {
                    this.onEditLuaTable(this.luaTable!, name);
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

    onGlobalNewField(name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {

            const field = new RosettaLuaField(name);
            catalog.fields[field.name] = field;

            app.showGlobalLuaField(field);
            toast.alert('Created Global Lua Field.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Global Lua Field.`, 'error');
            console.error(e);
        }
    }

    onGlobalEditField(nameOld: string, name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {

            const field = catalog.fields[nameOld];
            field.name = name;

            delete catalog.fields[nameOld];
            catalog.fields[name] = field;

            app.showGlobalLuaField(field);
            toast.alert('Edited Global Lua Field.');

        } catch (e) {
            toast.alert(`Failed to edit Global Lua Field.`, 'error');
            console.error(e);
        }
    }

    onGlobalNewFunction(name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {

            const func = new RosettaLuaFunction(name, { returns: { type: 'void' } });
            catalog.functions[func.name] = func;

            app.showGlobalLuaFunction(func);
            toast.alert('Created Global Lua Function.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Global Lua Function.`, 'error');
            console.error(e);
        }
    }

    onGlobalEditFunction(nameOld: string, name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {

            const func = catalog.functions[nameOld];
            func.name = name;

            delete catalog.functions[nameOld];
            catalog.functions[name] = func;

            app.showGlobalLuaFunction(func);
            toast.alert('Created Global Lua Function.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Global Lua Function.`, 'error');
            console.error(e);
        }
    }

    onGlobalNewParameter(nameOld: string, name: string) {

        const { app } = this;
        const { catalog, toast } = app;

        try {
            const split = nameOld.split('-');
            const type = split[0];
            const funcName = split[1];

            let func: RosettaLuaFunction | RosettaJavaMethod | undefined = undefined;

            if (type === 'global_function') {
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
    }

    onGlobalEditParameter(nameOld: string, name: string) {

        const { app } = this;
        const { catalog, toast } = app;

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
    }

    onNewLuaClass(name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {
        
            const entity = new RosettaLuaClass(name);
            catalog.luaClasses[entity.name] = entity;
        
            app.showLuaClass(entity);
            toast.alert('Created Lua Class.', 'success');
        
        } catch (e) {
            toast.alert(`Failed to create Lua Class.`, 'error');
            console.error(e);
        }
    }

    onNewLuaTable(name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {
        
            const entity = new RosettaLuaTable(name);
            catalog.luaTables[entity.name] = entity;
        
            app.showLuaTable(entity);
            toast.alert('Created Lua Table.', 'success');
        
        } catch (e) {
            toast.alert(`Failed to create Lua Table.`, 'error');
            console.error(e);
        }
    }

    onEditLuaClass(clazz: RosettaLuaClass, name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {

            // Modify the dictionary.
            delete catalog.luaClasses[clazz.name];
            clazz.name = name;
            catalog.luaClasses[name] = clazz;

            app.showLuaClass(clazz);
            toast.alert('Edited Lua Class.');

        } catch (e) {
            toast.alert(`Failed to edit Lua class.`, 'error');
            console.error(e);
        }
    }

    onEditLuaTable(table: RosettaLuaTable, name: string) {
        
        const { app } = this;
        const { catalog, toast } = app;
        
        try {
        
            // Modify the dictionary.
            delete catalog.luaTables[table.name];
            table.name = name;
            catalog.luaTables[name] = table;

            app.showLuaTable(table);
            toast.alert('Edited Lua table.');

        } catch (e) {
            toast.alert(`Failed to edit Lua table.`, 'error');
            console.error(e);
        }
    }

    onLuaClassNewField(clazz: RosettaLuaClass, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {
        
            const field = clazz.createField(name);
        
            app.showLuaClassField(field);
            toast.alert('Created Lua Class Field.', 'success');
        
        } catch (e) {
            toast.alert(`Failed to create Lua Class Field.`, 'error');
            console.error(e);
        }
    }

    onLuaTableNewField(table: RosettaLuaTable, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {
        
            const field = table.createField(name);
        
            app.showLuaTableField(field);
            toast.alert('Created Lua Table Field.', 'success');
        
        } catch (e) {
            toast.alert(`Failed to create Lua Table Field.`, 'error');
            console.error(e);
        }
    }

    onLuaClassEditField(clazz: RosettaLuaClass, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const field = clazz.fields[nameOld];
            field.name = name;

            delete clazz.fields[nameOld];
            clazz.fields[name] = field;

            app.showLuaClassField(field);
            toast.alert('Edited Lua Class Field.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Class Field.`, 'error');
            console.error(e);
        }
    }

    onLuaTableEditField(table: RosettaLuaTable, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const field = table.fields[nameOld];
            field.name = name;

            delete table.fields[nameOld];
            table.fields[name] = field;

            app.showLuaTableField(field);
            toast.alert('Edited Lua Table Field.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Table Field.`, 'error');
            console.error(e);
        }
    }

    onLuaClassNewValue(clazz: RosettaLuaClass, name: string) {
        
        console.log(`onLuaClassNewValue(${clazz.name}, ${name})`);

        const { app } = this;
        const { toast } = app;
        
        try {
        
            const value = clazz.createValue(name);
        
            app.showLuaClassValue(value);
            toast.alert('Created Lua Value.', 'success');
        
        } catch (e) {
            toast.alert(`Failed to create Lua Value.`, 'error');
            console.error(e);
        }
    }

    onLuaClassEditValue(clazz: RosettaLuaClass, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const value = clazz.values[nameOld];
            value.name = name;

            delete clazz.values[nameOld];
            clazz.values[name] = value;

            app.showLuaClassValue(value);
            toast.alert('Edited Lua value.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Value.`, 'error');
            console.error(e);
        }
    }

    onLuaClassNewFunction(clazz: RosettaLuaClass, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const func = clazz.createFunction(name);

            app.showLuaClassFunction(func);
            toast.alert('Created Lua Function.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Lua Function.`, 'error');
            console.error(e);
        }
    }

    onLuaTableNewFunction(table: RosettaLuaTable, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const func = table.createFunction(name);

            app.showLuaTableFunction(func);
            toast.alert('Created Lua Function.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Lua Function.`, 'error');
            console.error(e);
        }
    }

    onLuaClassEditFunction(clazz: RosettaLuaClass, func: RosettaLuaFunction, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {
        
            const nameOld = func.name;
            func.name = name;

            // Grab the old cluster and remove the function.
            let cluster = clazz.functions[nameOld];
            cluster.functions.splice(
                cluster.functions.indexOf(func),
                1
            );

            // Remove cluster if empty.
            if (cluster.functions.length === 0) {
                delete clazz.functions[nameOld];
            }

            // Grab the new-named cluster.
            cluster = clazz.functions[name];

            // Create the cluster if not present.
            if (!cluster) {
                cluster = new RosettaLuaFunctionCluster(name);
                clazz.functions[name] = cluster;
            }

            // Add the function to this cluster.
            cluster.add(func);

            app.showLuaClassFunction(func);
            toast.alert('Edited Lua Class Function.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Class Function.`, 'error');
            console.error(e);
        }
    }

    onLuaTableEditFunction(table: RosettaLuaTable, func: RosettaLuaFunction, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const nameOld = func.name;
            func.name = name;

            // Grab the old cluster and remove the function.
            let cluster = table.functions[nameOld];
            cluster.functions.splice(
                cluster.functions.indexOf(func),
                1
            );

            // Remove cluster if empty.
            if (cluster.functions.length === 0) {
                delete table.functions[nameOld];
            }

            // Grab the new-named cluster.
            cluster = table.functions[name];

            // Create the cluster if not present.
            if (!cluster) {
                cluster = new RosettaLuaFunctionCluster(name);
                table.functions[name] = cluster;
            }

            // Add the function to this cluster.
            cluster.add(func);

            app.showLuaTableFunction(func);

            toast.alert('Edited Lua Table Function.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Table Function.`, 'error');
            console.error(e);
        }
    }

    onLuaClassNewMethod(clazz: RosettaLuaClass, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const method = clazz.createMethod(name);

            app.showLuaClassMethod(method);
            toast.alert('Created Lua Method.', 'success');

        } catch (e) {
            toast.alert(`Failed to create Lua Method.`, 'error');
            console.error(e);
        }
    }

    onLuaClassEditMethod(clazz: RosettaLuaClass, func: RosettaLuaFunction, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {

            const nameOld = func.name;
            func.name = name;

            // Grab the old cluster and remove the function.
            let cluster = clazz.methods[nameOld];
            cluster.functions.splice(
                cluster.functions.indexOf(func),
                1
            );

            // Remove cluster if empty.
            if (cluster.functions.length === 0) {
                delete clazz.methods[nameOld];
            }

            // Grab the new-named cluster.
            cluster = clazz.methods[name];

            // Create the cluster if not present.
            if (!cluster) {
                cluster = new RosettaLuaFunctionCluster(name);
                clazz.methods[name] = cluster;
            }

            // Add the function to this cluster.
            cluster.add(func);

            app.showLuaClassMethod(func);
            toast.alert('Edited Lua Class Method.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Class Method.`, 'error');
            console.error(e);
        }
    }

    onLuaClassNewParameter(nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {
        
            const split = nameOld.split('-');
            const type = split[0];

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
    }

    onLuaTableNewParameter(nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
        try {
        
            const split = nameOld.split('-');
            const type = split[0];

            let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
            if (type === 'constructor') {
                func = this.luaConstructor!;
            } else if (type === 'function') {
                func = this.luaFunction!;
            } else {
                func = this.luaMethod!;
            }

            func!.addParameter(name, 'any');

            app.showLuaTableFunction(func as RosettaLuaFunction);

            toast.alert('Created Lua Parameter.', 'success');
        } catch (e) {
            toast.alert(`Failed to create Lua Parameter.`, 'error');
            console.error(e);
        }
    }

    onLuaClassEditParameter(clazz: RosettaLuaClass, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
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
    }

    onLuaTableEditParameter(table: RosettaLuaTable, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
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

            app.showLuaTableFunction(func as RosettaLuaFunction);

            toast.alert('Edited Lua Parameter.');

        } catch (e) {
            toast.alert(`Failed to edit Lua Parameter.`, 'error');
            console.error(e);
        }
    }

    onJavaClassEditParameter(clazz: RosettaJavaClass, nameOld: string, name: string) {
        
        const { app } = this;
        const { toast } = app;
        
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
                console.warn(`Unknown function / method / constructor: ${clazz.name}.${funcName}!`);
                return;
            }

            if (!param) {
                console.warn(`Unknown parameter: ${clazz.name}.${funcName}#${paramName}!`);
                return;
            }

            param.name = name;

            if (type === 'constructor') {
                app.showJavaClassConstructor((method as any) as RosettaJavaConstructor);
            } else if (type === 'method') {
                app.showJavaClassMethod((method as any) as RosettaJavaMethod);
            }
            toast.alert('Edited Lua Parameter.');

            if (this.javaCallback) this.javaCallback(name);

        } catch (e) {
            toast.alert(`Failed to edit Lua Parameter.`, 'error');
            console.error(e);
        }
    }

    show(disableBtn: boolean) {
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
