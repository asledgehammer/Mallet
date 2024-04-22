import { App } from "../../../app";
import { RosettaLuaClass } from "../lua/RosettaLuaClass";
import { $get, html } from "../util";
import { LuaCard } from "./LuaCard";

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

    nameMode: 'new_class' | 'new_field' | 'new_value' | 'new_function' | 'new_method' | 'edit_class' | 'edit_field' | 'edit_value' | 'edit_function' | 'edit_method' | null;

    private selected: string | undefined;

    constructor(app: App) {
        this.app = app;

        // This modal is for new items and editing their names.
        // @ts-ignore
        this.modalName = new bootstrap.Modal('#modal-name', {});
        this.$titleName = $get('title-name');
        this.$inputName = $get('input-name');
        this.$btnName = $get('btn-name-create');

        this.nameMode = null;
    }

    listen() {

        const { app } = this;
        const _this = this;

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

        $get('new-lua-field').on('click', () => {

        });

        $get('new-lua-value').on('click', () => {

        });

        $get('new-lua-method').on('click', () => {

        });

        $get('new-lua-function').on('click', () => {

        });

        this.$inputName.on('input', () => {
            setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val()!)), 1);
        });

        this.$btnName.on('click', () => {
            const name = validateLuaVariableName(this.$inputName.val()!).trim();
            switch (this.nameMode) {
                case 'new_class': {
                    const entity = new RosettaLuaClass(validateLuaVariableName(this.$inputName.val()!).trim());
                    app.showClass(entity);
                    this.modalName.hide();
                    break;
                }
                case 'edit_class': {
                    const entity = app.card?.options!.entity!;
                    entity.name = name;
                    app.showClass(entity);
                    this.modalName.hide();
                    break;
                }
            }
        });
    }

    render(): string {
        return html`
            <!-- New Class -->
            <button id="new-lua-class" class="btn btn-sm btn-success rounded-0 me-1" style="width: 32px; height: 32px" title="New Class">
                <i class="fa fa-file" style="position: relative; top: -1px"></i>
            </button>
            
            <!-- Open Class -->
            <button id="open-lua-class" class="btn btn-sm btn-primary rounded-0" style="width: 32px; height: 32px" title="Open Class">
                <i class="fa-solid fa-folder-open" style="position: relative; top: -1px"></i>
            </button>

            <!-- Save Class -->
            <button id="save-lua-class" class="btn btn-sm btn-primary rounded-0 me-1" style="width: 32px; height: 32px" title="Save Class">
                <i class="fa fa-save" style="position: relative; top: -1px"></i>
            </button>
            
            <!-- New Field -->
            <button id="new-lua-field" class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Lua Field">
                <i class="fa-solid fa-hashtag" style="position: relative; top: -1px"></i>
            </button>

            <!-- New Value -->
            <button id="new-lua-value" class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Lua Value">
                <i class="fa-solid fa-hashtag" style="position: relative; top: -1px"></i>
            </button>

            <!-- New Method -->
            <button id="new-lua-method" class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Lua Method">
                <i class="fa-solid fa-terminal" style="position: relative; top: -1px"></i>
            </button>

            <!-- New Function -->
            <button id="new-lua-function" class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Lua Function">
                <i class="fa-solid fa-terminal" style="position: relative; top: -1px"></i>
            </button>
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
        for (const fieldName of Object.keys(entity.fields)) {
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
        for (const valueName of Object.keys(entity.values)) {
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
        for (const methodName of Object.keys(entity.methods)) {
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
        for (const functionName of Object.keys(entity.functions)) {
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
                },
                {
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
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

        fieldNames.sort((a, b) => a.localeCompare(b));
        for (const fieldName of Object.keys(entity.fields)) {
            const field = entity.fields[fieldName];
            const id = `lua-class-${entity.name}-field-${field.name}`;
            const $fieldNode = $get(id);
            $fieldNode.on('click', () => {
                console.log(`Clicked ${id}!`);
            });
        }

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
