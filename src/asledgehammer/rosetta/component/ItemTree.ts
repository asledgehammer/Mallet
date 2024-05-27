import { App } from "../../../app";
import { RosettaJavaClass } from "../java/RosettaJavaClass";
import { RosettaLuaClass } from "../lua/RosettaLuaClass";
import { RosettaLuaTable } from "../lua/RosettaLuaTable";
import { $get, html } from "../util";
import { Sidebar } from "./Sidebar";
import { LuaCard } from "./lua/LuaCard";

export class ItemTree {

    readonly app: App;
    readonly sidebar: Sidebar;

    /* Lua Class Folders */

    readonly idFolderLuaClassField = `item-tree-folder-lua-class-field`;
    readonly idFolderLuaClassValue = `item-tree-folder-lua-class-value`;
    readonly idFolderLuaClassFunction = `item-tree-folder-lua-class-function`;
    readonly idFolderLuaClassMethod = `item-tree-folder-lua-class-method`;
    folderLuaClassFieldOpen = false;
    folderLuaClassValueOpen = false;
    folderLuaClassFunctionOpen = false;
    folderLuaClassMethodOpen = false;

    /* Lua Table Folders */

    readonly idFolderLuaTableValue = `item-tree-folder-lua-table-value`;
    readonly idFolderLuaTableFunction = `item-tree-folder-lua-table-function`;
    folderLuaTableValueOpen = false;
    folderLuaTableFunctionOpen = false;

    /* Java Class Folders */

    readonly idFolderJavaClassStaticField = 'item-tree-folder-java-class-static-field';
    readonly idFolderJavaClassStaticMethod = 'item-tree-folder-java-class-static-method';
    readonly idFolderJavaClassField = 'item-tree-folder-java-class-field';
    readonly idFolderJavaClassMethod = 'item-tree-folder-java-class-method';
    folderJavaClassStaticFieldOpen = false;
    folderJavaClassStaticMethodOpen = false;
    folderJavaClassFieldOpen = false;
    folderJavaClassMethodOpen = false;

    listening: boolean = false;

    selected: string | undefined = undefined;
    selectedID: string | undefined = undefined;

    constructor(app: App, sidebar: Sidebar) {
        this.app = app;
        this.sidebar = sidebar;
    }

    listen() {

        if (this.listening) return;

        const _this = this;
        const $doc = $(document);

        $doc.on('click', '.item-tree-item', function () {
            const $this = $(this);
            $('.item-tree-item.selected').removeClass('selected');
            $this.addClass('selected');
            _this.selectedID = this.id;
            console.log(`Selected item: ${_this.selectedID}`);
        });

        this.listenLuaClass();
        this.listenLuaTable();
        this.listenJavaClass();

        this.listening = true;
    }

    listenLuaClass() {

        const _this = this;
        const $doc = $(document);

        $doc.on('click', '.lua-constructor-item', function () {
            // Prevent wasteful selection code executions here.
            if (_this.selected === 'constructor') return;
            const entity = _this.app.active.selected as RosettaLuaClass;
            _this.app.showLuaConstructor(entity.conztructor);
            // Let the editor know we last selected the constructor.
            _this.selected = 'constructor';
        });

        $doc.on('click', '.lua-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.active.selected as RosettaLuaClass;
            const field = entity.fields[fieldName];
            if (!field) return;
            _this.app.showLuaField(field);
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
        });

        $doc.on('click', '.lua-value-item', function () {
            const valueName = this.id.split('value-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === valueName) return;
            const entity = _this.app.active.selected as RosettaLuaClass;
            const value = entity.values[valueName];
            if (!value) return;
            _this.app.showLuaValue(value);
            // Let the editor know we last selected the value.
            _this.selected = valueName;
        });

        $doc.on('click', '.lua-method-item', function () {
            const methodName = this.id.split('method-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === methodName) return;
            const entity = _this.app.active.selected as RosettaLuaClass;
            const method = entity.methods[methodName];
            if (!method) return;
            _this.app.showLuaMethod(method);
            // Let the editor know we last selected the method.
            _this.selected = methodName;
        });

        $doc.on('click', '.lua-function-item', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === functionName) return;
            const entity = _this.app.active.selected as RosettaLuaClass;
            const func = entity.functions[functionName];
            if (!func) return;
            _this.app.showLuaFunction(func);
            // Let the editor know we last selected the function.
            _this.selected = functionName;
        });

        // Preserve the state of folders.
        $doc.on('click', '#' + this.idFolderLuaClassField, () => {
            this.folderLuaClassFieldOpen = !this.folderLuaClassFieldOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaClassValue, () => {
            this.folderLuaClassValueOpen = !this.folderLuaClassValueOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaClassMethod, () => {
            this.folderLuaClassMethodOpen = !this.folderLuaClassMethodOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaClassFunction, () => {
            this.folderLuaClassFunctionOpen = !this.folderLuaClassFunctionOpen;
        });
    }

    listenLuaTable() {

        const _this = this;
        const $doc = $(document);

        $doc.on('click', '#' + this.idFolderLuaTableValue, () => {
            this.folderLuaTableValueOpen = !this.folderLuaTableValueOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaTableFunction, () => {
            this.folderLuaTableFunctionOpen = !this.folderLuaTableFunctionOpen;
        });
    }

    listenJavaClass() {

        const _this = this;
        const $doc = $(document);

        // Preserve the state of folders.
        $doc.on('click', '#' + this.idFolderJavaClassStaticField, () => {
            this.folderJavaClassStaticFieldOpen = !this.folderJavaClassStaticFieldOpen;
        });
        $doc.on('click', '#' + this.idFolderJavaClassStaticMethod, () => {
            this.folderJavaClassStaticMethodOpen = !this.folderJavaClassStaticMethodOpen;
        });
        $doc.on('click', '#' + this.idFolderJavaClassField, () => {
            this.folderJavaClassFieldOpen = !this.folderJavaClassFieldOpen;
        });
        $doc.on('click', '#' + this.idFolderJavaClassMethod, () => {
            this.folderJavaClassMethodOpen = !this.folderJavaClassMethodOpen;
        });
    }

    populate() {
        const { selected } = this.app.active;
        if (!selected) return;
        if (selected instanceof RosettaLuaClass) {
            this.populateLuaClass(selected);
        } else if (selected instanceof RosettaLuaTable) {
            this.populateLuaTable(selected);
        } else if (selected instanceof RosettaJavaClass) {
            this.populateJavaClass(selected);
        }
    }

    populateLuaClass(entity: RosettaLuaClass) {

        if (!entity) return;

        const _this = this;

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
                    id: _this.idFolderLuaClassField,
                    expanded: _this.folderLuaClassFieldOpen,
                    nodes: fields
                },
                {
                    text: "Values",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassValue,
                    expanded: _this.folderLuaClassValueOpen,
                    nodes: values
                },
                {
                    text: "Methods",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassMethod,
                    expanded: _this.folderLuaClassMethodOpen,
                    nodes: methods
                },
                {
                    text: "Functions",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassFunction,
                    expanded: _this.folderLuaClassFunctionOpen,
                    nodes: functions
                },
            ]
        });

        // Apply jQuery listeners next.

    }

    populateLuaTable(entity: RosettaLuaTable) {
        if (!entity) return;

        const _this = this;

        const funcs: any[] = [];
        const values: any[] = [];

        // @ts-ignore
        $treeLower.bstreeview({
            data: [
                {
                    text: "Values",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaTableValue,
                    expanded: _this.folderLuaTableValueOpen,
                    nodes: values
                },
                {
                    text: "Functions",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaTableFunction,
                    expanded: _this.folderLuaTableFunctionOpen,
                    nodes: funcs
                }
            ]
        });
    }

    populateJavaClass(entity: RosettaJavaClass) {
        if (!entity) return;

        const _this = this;

        let $treeLower = $get('tree-lower');
        $treeLower.remove();

        const $sidebarContentLower = $get('sidebar-content-lower');
        $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
        $treeLower = $get('tree-lower');

        const staticFields: any[] = [];
        const staticMethods: any[] = [];
        const fields: any[] = [];
        const methods: any[] = [];

        const fieldNames = Object.keys(entity.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));

        const methodNames = Object.keys(entity.methods);
        methodNames.sort((a, b) => a.localeCompare(b));

        // Static field(s)
        for (const name of fieldNames) {
            const field = entity.fields[name];
            if (field.isStatic()) {
                const id = `java-class-${entity.name}-field-${field.name}`;
                staticFields.push({
                    text: field.name,
                    icon: LuaCard.getTypeIcon(field.type.basic),
                    id,
                    class: ['item-tree-item', 'java-class-field-item']
                });
            }
        }

        // Instance field(s)
        for (const name of fieldNames) {
            const field = entity.fields[name];
            if (!field.isStatic()) {
                const id = `java-class-${entity.name}-field-${field.name}`;
                fields.push({
                    text: field.name,
                    icon: LuaCard.getTypeIcon(field.type.basic),
                    id,
                    class: ['item-tree-item', 'java-class-field-item']
                });
            }
        }

        // @ts-ignore
        $treeLower.bstreeview({
            data: [
                {
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
                    class: ['item-tree-item', 'java-class-constructor-item']
                },
                {
                    text: "Static Fields",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassField,
                    expanded: _this.folderLuaClassFieldOpen,
                    nodes: staticFields
                },
                {
                    text: "Static Methods",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassFunction,
                    expanded: _this.folderLuaClassFunctionOpen,
                    nodes: staticMethods
                },
                {
                    text: "Fields",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassValue,
                    expanded: _this.folderLuaClassValueOpen,
                    nodes: fields
                },
                {
                    text: "Methods",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClassMethod,
                    expanded: _this.folderLuaClassMethodOpen,
                    nodes: methods
                },
            ]
        });
    }
}
