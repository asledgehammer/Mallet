import { App } from "../../../app";
import { $get, html } from "../util";
import { Sidebar } from "./Sidebar";
import { LuaCard } from "./lua/LuaCard";

export class ItemTree {

    readonly app: App;
    readonly sidebar: Sidebar;
    readonly idItemClass: string;
    readonly idFolderField: string;
    readonly idFolderValue: string;
    readonly idFolderFunction: string;
    readonly idFolderMethod: string;

    folderFieldOpen: boolean = false;
    folderValueOpen: boolean = false;
    folderFunctionOpen: boolean = false;
    folderMethodOpen: boolean = false;

    constructor(app: App, sidebar: Sidebar) {
        this.app = app;
        this.sidebar = sidebar;

        this.idItemClass = `item-tree-item-class`;
        this.idFolderField = `item-tree-folder-field`;
        this.idFolderValue = `item-tree-folder-value`;
        this.idFolderFunction = `item-tree-folder-function`;
        this.idFolderMethod = `item-tree-folder-method`;
    }

    populate() {

        const _this = this;

        const { selectedCard: luaClass } = this.app.active;
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

        let $treeLower = $get('tree-lower');
        $treeLower.remove();

        const $sidebarContentLower = $get('sidebar-content-lower');
        $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
        $treeLower = $get('tree-lower');

        // @ts-ignore
        $treeLower.bstreeview({
            data: [
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

        // Preserve the state of folders.
        $get(this.idFolderField).on('click', () => this.folderFieldOpen = !this.folderFieldOpen);
        $get(this.idFolderValue).on('click', () => this.folderValueOpen = !this.folderValueOpen);
        $get(this.idFolderMethod).on('click', () => this.folderMethodOpen = !this.folderMethodOpen);
        $get(this.idFolderFunction).on('click', () => this.folderFunctionOpen = !this.folderFunctionOpen);
    }
}
