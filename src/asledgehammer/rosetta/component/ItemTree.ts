import { App } from "../../../app";
import { $get, html } from "../util";
import { LuaCard } from "./LuaCard";

export class ItemTree {

    readonly app: App;
    selectedItemID: string | undefined;


    readonly idItemClass: string;
    readonly idFolderField: string;
    readonly idFolderValue: string;
    readonly idFolderFunction: string;
    readonly idFolderMethod: string;

    folderFieldOpen: boolean = false;
    folderValueOpen: boolean = false;
    folderFunctionOpen: boolean = false;
    folderMethodOpen: boolean = false;

    constructor(app: App) {
        this.app = app;

        this.idItemClass = `item-tree-item-class`;
        this.idFolderField = `item-tree-folder-field`;
        this.idFolderValue = `item-tree-folder-value`;
        this.idFolderFunction = `item-tree-folder-function`;
        this.idFolderMethod = `item-tree-folder-method`;
    }

    listen() {

        const { app } = this;
        const _this = this;

        const { $titleName, $btnName, $inputName, modalName } = app;

        $get('new-lua-class').on('click', () => {
            $titleName.html('New Lua Class');
            $btnName.html('Create');
            $btnName.removeClass('btn-primary');
            $btnName.addClass('btn-success');
            $inputName.val('');
            app.nameMode = 'new_class';
            modalName.show();
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
    }

    render(): string {
        return html`
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
                text: html`<span class="fst-italic">${value.name}</span>`,
                icon: LuaCard.getTypeIcon(value.type),
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
                text: html`<i class="fa-solid fa-xmark me-2" title="${method.returns.type}"></i>${method.name}`,
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
                text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: ['item-tree-item', 'lua-function-item'],
            });
        }

        let $tree = $get('tree');
        $tree.remove();

        $get('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
        $tree = $get('tree');

        // If something isn't selected then the properties must be.
        const classClasses = ['item-tree-item', 'lua-class-item'];
        if (!_this.selectedItemID) classClasses.push('selected');

        // @ts-ignore
        $tree.bstreeview({
            data: [
                {
                    id: _this.idItemClass,
                    text: "Class Properties",
                    icon: LuaCard.getTypeIcon('class'),
                    class: classClasses
                },
                {
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
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
            if (_this.app.selected === 'class') return;
            _this.app.showClass(entity);
            // Let the editor know we last selected the class.
            _this.app.selected = 'class';
        });

        $('.lua-constructor-item').on('click', function () {
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === 'constructor') return;
            _this.app.showConstructor(entity.conztructor);
            // Let the editor know we last selected the constructor.
            _this.app.selected = 'constructor';
        });

        $('.lua-field-item').on('click', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === fieldName) return;
            const field = entity.fields[fieldName];
            if (!field) return;
            _this.app.showField(field);
            // Let the editor know we last selected the field.
            _this.app.selected = fieldName;
        });

        $('.lua-value-item').on('click', function () {
            const valueName = this.id.split('value-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === valueName) return;
            const value = entity.values[valueName];
            if (!value) return;
            _this.app.showValue(value);
            // Let the editor know we last selected the value.
            _this.app.selected = valueName;
        });

        $('.lua-method-item').on('click', function () {
            const methodName = this.id.split('method-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === methodName) return;
            const method = entity.methods[methodName];
            if (!method) return;
            _this.app.showMethod(method);
            // Let the editor know we last selected the method.
            _this.app.selected = methodName;
        });

        $('.lua-function-item').on('click', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === functionName) return;
            const func = entity.functions[functionName];
            if (!func) return;
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
        $get(this.idFolderField).on('click', () => this.folderFieldOpen = !this.folderFieldOpen);
        $get(this.idFolderValue).on('click', () => this.folderValueOpen = !this.folderValueOpen);
        $get(this.idFolderMethod).on('click', () => this.folderMethodOpen = !this.folderMethodOpen);
        $get(this.idFolderFunction).on('click', () => this.folderFunctionOpen = !this.folderFunctionOpen);

        // Re-apply selection for re-population.
        const $selectedItem = this.selectedItemID ? $(this.selectedItemID) : $(this.idItemClass);
        console.log($selectedItem);
        $selectedItem.addClass('selected');
    }
}
