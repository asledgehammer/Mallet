import { App } from "../../../app";
import { RosettaLuaClass } from "../lua/RosettaLuaClass";
import { RosettaLuaConstructor } from "../lua/RosettaLuaConstructor";
import { RosettaLuaFunction } from "../lua/RosettaLuaFunction";
import { $get, html } from "../util";
import { LuaCard } from "./LuaCard";
import { NameModeType } from "./NameModeType";

const validateLuaVariableName = (nameOriginal: string): string => {
    nameOriginal = nameOriginal.trim();
    let name = '';
    for (const c of nameOriginal) {
        if (name === '') {
            if (c === ' ') continue; // No leading spaces.
            else if (/[0-9]/.test(c)) continue; // No leading numbers.
        }
        if (!/'^(%a+_%a+)$'/.test(c)) name += c; // Only valid lua characters.
    }
    return name;
};

export class ItemTree {

    readonly app: App;

    // This modal is for new items and editing their names.
    readonly modalName: any;
    readonly $inputName: JQuery<HTMLInputElement>;
    readonly $btnName: JQuery<HTMLButtonElement>;
    readonly $titleName: JQuery<HTMLHeadingElement>;

    // This modal is for confirming actions.
    readonly modalConfirm: any;
    readonly $btnConfirm: JQuery<HTMLButtonElement> | undefined;
    readonly $titleConfirm: JQuery<HTMLHeadingElement>;
    readonly $bodyConfirm: JQuery<HTMLHeadingElement>;
    confirmSuccess: (() => void) | undefined;

    nameSelected: string | undefined;

    nameMode: NameModeType;

    private selected: string | undefined;

    constructor(app: App) {
        this.app = app;

        // This modal is for new items and editing their names.
        // @ts-ignore
        this.modalName = new bootstrap.Modal('#modal-name', {});
        this.$titleName = $get('title-name');
        this.$inputName = $get('input-name');
        this.$btnName = $get('btn-name-create');

        // This modal is for confirming actions.
        // @ts-ignore
        this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
        this.$titleConfirm = $get('title-confirm')!;
        this.$bodyConfirm = $get('body-confirm')!;
        this.$btnConfirm = $get('btn-confirm')!;
        this.confirmSuccess = undefined;

        this.nameMode = null;
    }

    askConfirm(onSuccess: () => void, title: string = 'Confirm', body: string = 'Are you sure?') {
        this.$titleConfirm.html(title);
        this.$bodyConfirm.html(body);
        this.confirmSuccess = onSuccess;
        this.modalConfirm.show();
    }

    listen() {

        const { app } = this;
        const _this = this;

        this.$btnConfirm!.on('click', () => {
            this.modalConfirm.hide();
            if (this.confirmSuccess) {
                this.confirmSuccess();
                this.confirmSuccess = undefined;
            }
        });

        $get('new-lua-class').on('click', () => {
            this.$titleName.html('New Lua Class');
            this.$btnName.html('Create');
            this.$btnName.removeClass('btn-primary');
            this.$btnName.addClass('btn-success');
            this.$inputName.val('');
            this.nameMode = 'new_class';
            this.modalName.show();
        });

        $get('open-lua-class').on('click', () => {
            const dFileLoad = document.getElementById('load-file') as any;
            const onchange = () => {
                const file = dFileLoad.files[0];
                const textType = 'application/json';
                if (file.type.match(textType)) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        const json = JSON.parse(reader.result as string);
                        app.loadLuaClass(json);
                        app.renderCode();
                        _this.populate();
                    }
                    reader.readAsText(file);
                }
            };
            dFileLoad.onchange = onchange;
            dFileLoad.click();
        });

        $get('save-lua-class').on('click', async () => {
            // @ts-ignore
            const result = await showSaveFilePicker();

            const entity = this.app.card!.options!.entity!;
            const luaClasses: any = {};
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

        this.$inputName.on('input', () => {
            setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val()!)), 1);
        });

        this.$btnName.on('click', () => {
            const clazz = app.card?.options!.entity!;
            const name = validateLuaVariableName(this.$inputName.val()!).trim();
            const nameOld = this.nameSelected!;
            switch (this.nameMode) {
                case 'new_class': {
                    const entity = new RosettaLuaClass(validateLuaVariableName(this.$inputName.val()!).trim());
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

                    let func: RosettaLuaConstructor | RosettaLuaFunction | null = null;
                    if (type === 'constructor') {
                        func = clazz.conztructor;
                    } else if (type === 'function') {
                        func = clazz.functions[funcName];
                    } else {
                        func = clazz.methods[funcName];
                    }

                    func.addParameter(name, 'any');

                    if (type === 'constructor') {
                        app.showConstructor(func as RosettaLuaConstructor);
                    } else if (type === 'function') {
                        app.showFunction(func as RosettaLuaFunction);
                    } else {
                        app.showMethod(func as RosettaLuaFunction);
                    }

                    app.renderCode();
                }
                case 'edit_parameter': {
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
                        app.showConstructor(func as RosettaLuaConstructor);
                    } else if (type === 'function') {
                        app.showFunction(func as RosettaLuaFunction);
                    } else if (type === 'method') {
                        app.showMethod(func as RosettaLuaFunction);
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

    render(): string {
        return html`
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
        `;
    }

    populate() {

        const _this = this;

        const { card: luaClass } = this.app;
        if (!luaClass) return;

        const entity = luaClass.options!.entity!;
        if (!entity) return;

        // Generate nodes first.

        const fieldNames = Object.keys(entity.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const fields = [];
        for (const fieldName of fieldNames) {
            const field = entity.fields[fieldName];
            const id = `lua-class-${entity.name}-field-${field.name}`;
            fields.push({
                text: field.name,
                icon: LuaCard.getTypeIcon(field.type),
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
                text: html`<span class="fst-italic">${value.name}</span>`,
                icon: LuaCard.getTypeIcon(value.type),
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
                text: html`<i class="fa-solid fa-xmark me-2" title="${method.returns.type}"></i>${method.name}`,
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
                text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: ['lua-function-item'],
            });
        }

        let $tree = $get('tree');
        $tree.remove();

        $get('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
        $tree = $get('tree');

        // @ts-ignore
        $tree.bstreeview({
            data: [
                {
                    text: "Class Properties",
                    icon: LuaCard.getTypeIcon('class'),
                    class: ['lua-class-item']
                },
                {
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
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
            if (_this.selected === 'class') return;
            _this.app.showClass(entity);
            // Let the editor know we last selected the class.
            _this.selected = 'class';
        });

        $('.lua-constructor-item').on('click', function () {
            // Prevent wasteful selection code executions here.
            if (_this.selected === 'constructor') return;
            _this.app.showConstructor(entity.conztructor);
            // Let the editor know we last selected the constructor.
            _this.selected = 'constructor';
        });

        $('.lua-field-item').on('click', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const field = entity.fields[fieldName];
            if (!field) return;
            _this.app.showField(field);
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
        });

        $('.lua-value-item').on('click', function () {
            const valueName = this.id.split('value-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === valueName) return;
            const value = entity.values[valueName];
            if (!value) return;
            _this.app.showValue(value);
            // Let the editor know we last selected the value.
            _this.selected = valueName;
        });

        $('.lua-method-item').on('click', function () {
            const methodName = this.id.split('method-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === methodName) return;
            const method = entity.methods[methodName];
            if (!method) return;
            _this.app.showMethod(method);
            // Let the editor know we last selected the method.
            _this.selected = methodName;
        });

        $('.lua-function-item').on('click', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === functionName) return;
            const func = entity.functions[functionName];
            if (!func) return;
            _this.app.showFunction(func);
            // Let the editor know we last selected the function.
            _this.selected = functionName;
        });
    }
}
