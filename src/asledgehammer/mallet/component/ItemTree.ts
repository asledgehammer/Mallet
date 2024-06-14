import { App } from "../../../app";
import { RosettaJavaClass } from "../../rosetta/java/RosettaJavaClass";
import { RosettaJavaConstructor } from "../../rosetta/java/RosettaJavaConstructor";
import { RosettaJavaMethod } from "../../rosetta/java/RosettaJavaMethod";
import { RosettaLuaClass } from "../../rosetta/lua/RosettaLuaClass";
import { RosettaLuaTable } from "../../rosetta/lua/RosettaLuaTable";
import { $get, html } from "../../rosetta/util";
import { Sidebar } from "./Sidebar";
import { LuaCard } from "./lua/LuaCard";

function wrapFolderCount(text: string): string {
    return `<strong class="font-monospace text-white">${text}</strong>`;
}

function wrapItem(text: string): string {
    return `<span class="font-monospace" style="position: relative; top: -2px; font-size: 12px;">${text}</span>`;
}

export class ItemTree {

    readonly app: App;
    readonly sidebar: Sidebar;

    /* Lua Class Folders */

    readonly idFolderLuaClassField = `item-tree-folder-lua-class-field`;
    readonly idFolderLuaClassValue = `item-tree-folder-lua-class-value`;
    readonly idFolderLuaClassFunction = `item-tree-folder-lua-class-function`;
    readonly idFolderLuaClassMethod = `item-tree-folder-lua-class-method`;
    folderLuaClassFieldOpen = true;
    folderLuaClassValueOpen = true;
    folderLuaClassFunctionOpen = true;
    folderLuaClassMethodOpen = true;

    /* Lua Table Folders */

    readonly idFolderLuaTableField = `item-tree-folder-lua-table-value`;
    readonly idFolderLuaTableFunction = `item-tree-folder-lua-table-function`;
    folderLuaTableFieldOpen = true;
    folderLuaTableFunctionOpen = true;

    /* Java Class Folders */

    readonly idFolderJavaClassConstructor = 'item-tree-folder-java-class-constructor';
    readonly idFolderJavaClassStaticField = 'item-tree-folder-java-class-static-field';
    readonly idFolderJavaClassStaticMethod = 'item-tree-folder-java-class-static-method';
    readonly idFolderJavaClassField = 'item-tree-folder-java-class-field';
    readonly idFolderJavaClassMethod = 'item-tree-folder-java-class-method';
    folderJavaClassConstructorOpen = true;
    folderJavaClassStaticFieldOpen = true;
    folderJavaClassStaticMethodOpen = true;
    folderJavaClassFieldOpen = true;
    folderJavaClassMethodOpen = true;

    listening: boolean = false;

    selected: string | undefined = undefined;
    selectedID: string | undefined = undefined;

    constructorSignatureMap: { [signature: string]: RosettaJavaConstructor } = {};
    methodSignatureMap: { [signature: string]: RosettaJavaMethod } = {};
    staticMethodSignatureMap: { [signature: string]: RosettaJavaMethod } = {};

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
            // console.log(`Selected item: ${_this.selectedID}`);
        });

        this.listenGlobal();
        this.listenLuaClass();
        this.listenLuaTable();
        this.listenJavaClass();

        this.listening = true;
    }

    listenGlobal() {

        const { app } = this;
        const { catalog } = app;
        const _this = this;
        const $doc = $(document);

        $doc.on('click', '.global-lua-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const field = catalog.fields[fieldName];
            if (!field) return;
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
            _this.selectedID = this.id;
            app.showGlobalLuaField(field);
        });

        $doc.on('click', '.global-lua-function-item', function () {
            const funcName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === funcName) return;
            const func = catalog.functions[funcName];
            if (!func) return;
            // Let the editor know we last selected the field.
            _this.selected = funcName;
            _this.selectedID = this.id;
            app.showGlobalLuaFunction(func);
        });

        $doc.on('click', '.global-java-method-item', function () {
            const signature = this.id.split('method-')[1].trim();

            // Prevent wasteful selection code executions here.
            if (_this.selected === signature) return;

            // This is lazy but it works.
            let method = _this.methodSignatureMap[signature];
            if (!method) return;

            // Let the editor know we last selected the field.
            _this.selected = signature;
            _this.selectedID = this.id;
            _this.app.showGlobalJavaMethod(method);
        });
    }

    listenLuaClass() {

        const _this = this;
        const $doc = $(document);

        $doc.on('click', '.lua-class-constructor-item', function () {
            // Prevent wasteful selection code executions here.
            if (_this.selected === 'constructor') return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            // Let the editor know we last selected the constructor.
            _this.selected = 'constructor';
            _this.selectedID = this.id;
            _this.app.showLuaClassConstructor(entity.conztructor);
        });

        $doc.on('click', '.lua-class-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const field = entity.fields[fieldName];
            if (!field) return;
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
            _this.selectedID = this.id;
            _this.app.showLuaClassField(field);
        });

        $doc.on('click', '.lua-class-value-item', function () {
            const valueName = this.id.split('value-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === valueName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const value = entity.values[valueName];
            if (!value) return;
            // Let the editor know we last selected the value.
            _this.selected = valueName;
            _this.selectedID = this.id;
            _this.app.showLuaClassValue(value);
        });

        $doc.on('click', '.lua-class-method-item', function () {
            const methodName = this.id.split('method-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === methodName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const method = entity.methods[methodName];
            if (!method) return;
            // Let the editor know we last selected the method.
            _this.selected = methodName;
            _this.selectedID = this.id;
            _this.app.showLuaClassMethod(method);
        });

        $doc.on('click', '.lua-class-function-item', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === functionName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const func = entity.functions[functionName];
            if (!func) return;
            // Let the editor know we last selected the function.
            _this.selected = functionName;
            _this.selectedID = this.id;
            _this.app.showLuaClassFunction(func);
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

        $doc.on('click', '.lua-table-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            console.log(this.id);
            console.log(fieldName);
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.catalog.selected as RosettaLuaTable;
            const field = entity.fields[fieldName];
            console.log(field);
            if (!field) return;
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
            _this.selectedID = this.id;
            _this.app.showLuaTableField(field);
        });

        $doc.on('click', '.lua-table-function-item', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === functionName) return;
            const entity = _this.app.catalog.selected as RosettaLuaTable;
            const func = entity.functions[functionName];
            if (!func) return;
            // Let the editor know we last selected the function.
            _this.selected = functionName;
            _this.selectedID = this.id;
            _this.app.showLuaTableFunction(func);
        });

        // Preserve the state of folders.
        $doc.on('click', '#' + this.idFolderLuaTableField, () => {
            this.folderLuaTableFieldOpen = !this.folderLuaTableFieldOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaTableFunction, () => {
            this.folderLuaTableFunctionOpen = !this.folderLuaTableFunctionOpen;
        });
    }

    listenJavaClass() {

        const _this = this;
        const $doc = $(document);

        $doc.on('click', '.java-class-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.catalog.selected as RosettaJavaClass;
            const field = entity.fields[fieldName];
            if (!field) return;
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
            _this.selectedID = this.id;
            _this.app.showJavaClassField(field);
        });

        $doc.on('click', '.java-class-method-item', function () {
            const signature = this.id.split('method-')[1].trim();

            // Prevent wasteful selection code executions here.
            if (_this.selected === signature) return;

            // This is lazy but it works.
            let method = _this.staticMethodSignatureMap[signature];
            if (!method) method = _this.methodSignatureMap[signature];
            if (!method) return;

            // Let the editor know we last selected the field.
            _this.selected = signature;
            _this.selectedID = this.id;
            _this.app.showJavaClassMethod(method);
        });

        $doc.on('click', '.java-class-constructor-item', function () {
            const signature = this.id.split('constructor-')[1].trim();

            // Prevent wasteful selection code executions here.
            if (_this.selected === signature) return;

            const conztructor = _this.constructorSignatureMap[signature];
            if (!conztructor) return;

            // Let the editor know we last selected the field.
            _this.selected = signature;
            _this.selectedID = this.id;
            _this.app.showJavaClassConstructor(conztructor);
        });

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

        if (this.sidebar.objTree.globalSelected) {
            this.populateGlobal();
            return;
        }

        const { selected } = this.app.catalog;
        if (!selected) return;
        if (selected instanceof RosettaLuaClass) {
            this.populateLuaClass(selected);
        } else if (selected instanceof RosettaLuaTable) {
            this.populateLuaTable(selected);
        } else if (selected instanceof RosettaJavaClass) {
            this.populateJavaClass(selected);
        }
    }

    populateGlobal() {
        const _this = this;
        const { catalog } = this.app;

        const fieldNames = Object.keys(catalog.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const fields = [];
        for (const fieldName of fieldNames) {
            const field = catalog.fields[fieldName];
            const id = `lua-global-field-${field.name}`;

            const classes: string[] = ['item-tree-item', 'global-lua-field-item'];
            if (id === this.selectedID) classes.push('selected');

            fields.push({
                text: field.name,
                icon: LuaCard.getTypeIcon(field.type),
                id,
                class: classes
            });
        }

        const functionNames = Object.keys(catalog.functions);
        functionNames.sort((a, b) => a.localeCompare(b));
        const functions = [];
        for (const functionName of functionNames) {
            const func = catalog.functions[functionName];
            const id = `lua-global-function-${func.name}`;

            const classes: string[] = ['item-tree-item', 'global-lua-function-item'];
            if (id === this.selectedID) classes.push('selected');

            functions.push({
                text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: classes
            });
        }

        this.methodSignatureMap = {};

        const clusterNames = Object.keys(catalog.methods);
        clusterNames.sort((a, b) => a.localeCompare(b));

        for (const clusterName of clusterNames) {
            const cluster = catalog.methods[clusterName];
            for (const method of cluster.methods) {
                this.methodSignatureMap[method.getSignature()] = method;
            }
        }

        // Global Method(s)
        const methods: any[] = [];
        const methodSignatures = Object.keys(this.methodSignatureMap);
        methodSignatures.sort((a, b) => a.localeCompare(b));

        for (const signature of methodSignatures) {
            const method = this.methodSignatureMap[signature];
            const id = `global-java-method-${signature}`;

            let params = '';
            for (const param of method.parameters) {
                params += `${param.name}, `;
            }
            if (params.length) params = params.substring(0, params.length - 2);

            const classes: string[] = ['item-tree-item', 'global-java-method-item'];
            if (id === this.selectedID) classes.push('selected');

            methods.push({
                text: wrapItem(`${method.name}(${params})`),
                icon: LuaCard.getTypeIcon(method.returns.type.basic),
                id,
                class: classes
            });
        }

        const folderFields = {
            text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassField,
            expanded: _this.folderLuaClassFieldOpen,
            nodes: fields
        };

        const folderFuncs = {
            text: `${wrapFolderCount(`(${functions.length})`)} Function(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassFunction,
            expanded: _this.folderLuaClassFunctionOpen,
            nodes: functions
        };

        const folderMethods = {
            text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassMethod,
            expanded: _this.folderJavaClassMethodOpen,
            nodes: methods
        };

        const data: any[] = [];

        if (fields.length) data.push(folderFields);
        if (methods.length) data.push(folderMethods);
        if (functions.length) data.push(folderFuncs);

        let $treeLower = $get('tree-lower');
        $treeLower.remove();

        const $sidebarContentLower = $get('sidebar-content-lower');
        $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
        $treeLower = $get('tree-lower');

        // @ts-ignore
        $treeLower.bstreeview({ data });
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

            const classes: string[] = ['item-tree-item', 'lua-class-field-item'];
            if (id === this.selectedID) classes.push('selected');

            fields.push({
                text: field.name,
                icon: LuaCard.getTypeIcon(field.type),
                id,
                class: classes
            });
        }

        const valueNames = Object.keys(entity.values);
        valueNames.sort((a, b) => a.localeCompare(b));
        const values = [];
        for (const valueName of valueNames) {
            const value = entity.values[valueName];
            const id = `lua-class-${entity.name}-value-${value.name}`;

            const classes: string[] = ['item-tree-item', 'lua-class-value-item'];
            if (id === this.selectedID) classes.push('selected');

            values.push({
                text: html`<span class="fst-italic">${value.name}</span>`,
                icon: LuaCard.getTypeIcon(value.type),
                id,
                class: classes
            });
        }

        const methodNames = Object.keys(entity.methods);
        methodNames.sort((a, b) => a.localeCompare(b));
        const methods = [];
        for (const methodName of methodNames) {
            const method = entity.methods[methodName];
            const id = `lua-class-${entity.name}-method-${method.name}`;

            const classes: string[] = ['item-tree-item', 'lua-class-method-item'];
            if (id === this.selectedID) classes.push('selected');

            methods.push({
                text: html`<i class="fa-solid fa-xmark me-2" title="${method.returns.type}"></i>${method.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: classes
            });
        }

        const functionNames = Object.keys(entity.functions);
        functionNames.sort((a, b) => a.localeCompare(b));
        const functions = [];
        for (const functionName of functionNames) {
            const func = entity.functions[functionName];
            const id = `lua-class-${entity.name}-function-${func.name}`;

            const classes: string[] = ['item-tree-item', 'lua-class-function-item'];
            if (id === this.selectedID) classes.push('selected');

            functions.push({
                text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: classes
            });
        }

        let $treeLower = $get('tree-lower');
        $treeLower.remove();

        const $sidebarContentLower = $get('sidebar-content-lower');
        $sidebarContentLower.append('<div id="tree-lower" class="rounded-0 bg-dark text-white"></div>');
        $treeLower = $get('tree-lower');

        const conzID = `lua-class-${entity.name}-constructor`;
        const conzClasses: string[] = ['item-tree-item', 'lua-class-constructor-item'];
        if (conzID === this.selectedID) conzClasses.push('selected');

        const folderFields = {
            text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassField,
            expanded: _this.folderLuaClassFieldOpen,
            nodes: fields
        };
        const folderValues = {
            text: `${wrapFolderCount(`(${values.length})`)} Value(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassValue,
            expanded: _this.folderLuaClassValueOpen,
            nodes: values
        };
        const folderMethods = {
            text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassMethod,
            expanded: _this.folderLuaClassMethodOpen,
            nodes: methods
        };
        const folderFuncs = {
            text: `${wrapFolderCount(`(${functions.length})`)} Function(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClassFunction,
            expanded: _this.folderLuaClassFunctionOpen,
            nodes: functions
        };

        const data: any[] = [{
            id: conzID,
            text: "Constructor",
            icon: LuaCard.getTypeIcon('constructor'),
            class: conzClasses
        }];

        if (fields.length) data.push(folderFields);
        if (values.length) data.push(folderValues);
        if (methods.length) data.push(folderMethods);
        if (functions.length) data.push(folderFuncs);

        // @ts-ignore
        $treeLower.bstreeview({ data });
    }

    populateLuaTable(entity: RosettaLuaTable) {
        if (!entity) return;

        const _this = this;

        const fieldNames = Object.keys(entity.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const fields = [];
        for (const fieldName of fieldNames) {
            const field = entity.fields[fieldName];
            const id = `lua-table-${entity.name}-field-${field.name}`;

            const classes: string[] = ['item-tree-item', 'lua-table-field-item'];
            if (id === this.selectedID) classes.push('selected');

            fields.push({
                text: field.name,
                icon: LuaCard.getTypeIcon(field.type),
                id,
                class: classes
            });
        }

        const functionNames = Object.keys(entity.functions);
        functionNames.sort((a, b) => a.localeCompare(b));
        const functions = [];
        for (const functionName of functionNames) {
            const func = entity.functions[functionName];
            const id = `lua-table-${entity.name}-function-${func.name}`;

            const classes: string[] = ['item-tree-item', 'lua-table-function-item'];
            if (id === this.selectedID) classes.push('selected');

            functions.push({
                text: html`<i class="fa-solid fa-xmark me-2" title="${func.returns.type}"></i>${func.name}`,
                icon: 'fa-solid fa-terminal text-success mx-2',
                id,
                class: classes
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
                    text: "Fields",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaTableField,
                    expanded: _this.folderLuaTableFieldOpen,
                    nodes: fields
                },
                {
                    text: "Functions",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaTableFunction,
                    expanded: _this.folderLuaTableFunctionOpen,
                    nodes: functions
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
        // const fields: any[] = [];
        const methods: any[] = [];
        const constructors: any[] = [];

        const fieldNames = Object.keys(entity.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));

        const clusterNames = Object.keys(entity.methods);
        clusterNames.sort((a, b) => a.localeCompare(b));

        this.constructorSignatureMap = {};
        this.methodSignatureMap = {};
        this.staticMethodSignatureMap = {};

        for (const clusterName of clusterNames) {
            const cluster = entity.methods[clusterName];
            for (const method of cluster.methods) {
                if (method.getVisibilityScope() !== 'public') continue;
                if (method.isStatic()) {
                    this.staticMethodSignatureMap[method.getSignature()] = method;
                } else {
                    this.methodSignatureMap[method.getSignature()] = method;
                }
            }
        }

        for (const cons of entity.constructors) {
            if (cons.getVisibilityScope() !== 'public') continue;
            this.constructorSignatureMap[cons.getSignature()] = cons;
        }

        // Constructor(s)
        const consSignatures = Object.keys(this.constructorSignatureMap);
        consSignatures.sort((a, b) => a.localeCompare(b));

        for (const signature of consSignatures) {
            const cons = this.constructorSignatureMap[signature];
            const id = `java-class-${entity.name}-constructor-${signature}`;

            let params = '';
            if (cons.parameters && cons.parameters.length) {
                for (const param of cons.parameters) {
                    params += `${param.name}, `;
                }
                if (params.length) params = params.substring(0, params.length - 2);
            }

            const classes: string[] = ['item-tree-item', 'java-class-constructor-item'];
            if (id === this.selectedID) classes.push('selected');

            constructors.push({
                text: wrapItem(`${entity.name}(${params})`),
                icon: LuaCard.getTypeIcon('object'),
                id,
                class: classes
            });
        }


        // Static field(s)
        for (const name of fieldNames) {
            const field = entity.fields[name];

            if (field.getVisibilityScope() !== 'public') continue;
            else if (!field.isStatic()) continue;
            else if (!field.isFinal()) continue;

            const id = `java-class-${entity.name}-field-${field.name}`;
            const classes: string[] = ['item-tree-item', 'java-class-field-item'];
            if (id === this.selectedID) classes.push('selected');

            staticFields.push({
                text: wrapItem(field.name),
                icon: LuaCard.getTypeIcon(field.type.basic),
                id,
                class: classes
            });
        }

        // Static method(s)

        const staticMethodSignatures = Object.keys(this.staticMethodSignatureMap);
        staticMethodSignatures.sort((a, b) => a.localeCompare(b));

        for (const signature of staticMethodSignatures) {
            const method = this.staticMethodSignatureMap[signature];
            const id = `java-class-${entity.name}-method-${signature}`;

            let params = '';
            for (const param of method.parameters) {
                params += `${param.name}, `;
            }
            if (params.length) params = params.substring(0, params.length - 2);

            const classes: string[] = ['item-tree-item', 'java-class-method-item'];
            if (id === this.selectedID) classes.push('selected');

            staticMethods.push({
                text: wrapItem(`${method.name}(${params})`),
                icon: LuaCard.getTypeIcon(method.returns.type.basic),
                id,
                class: classes
            });
        }

        // Instance method(s)

        const methodSignatures = Object.keys(this.methodSignatureMap);
        methodSignatures.sort((a, b) => a.localeCompare(b));

        for (const signature of methodSignatures) {
            const method = this.methodSignatureMap[signature];
            const id = `java-class-${entity.name}-method-${signature}`;

            let params = '';
            for (const param of method.parameters) {
                params += `${param.name}, `;
            }
            if (params.length) params = params.substring(0, params.length - 2);

            const classes: string[] = ['item-tree-item', 'java-class-method-item'];
            if (id === this.selectedID) classes.push('selected');

            methods.push({
                text: wrapItem(`${method.name}(${params})`),
                icon: LuaCard.getTypeIcon(method.returns.type.basic),
                id,
                class: classes
            });
        }

        const folderConstructors = {
            text: `${wrapFolderCount(`(${constructors.length})`)} Constructor(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassConstructor,
            expanded: _this.folderJavaClassConstructorOpen,
            nodes: constructors
        };

        const folderStaticFields = {
            text: `${wrapFolderCount(`(${staticFields.length})`)} Static Field(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassStaticField,
            expanded: _this.folderJavaClassStaticFieldOpen,
            nodes: staticFields
        };

        const folderStaticMethods = {
            text: `${wrapFolderCount(`(${staticMethods.length})`)} Static Method(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassStaticMethod,
            expanded: _this.folderJavaClassStaticMethodOpen,
            nodes: staticMethods
        };

        // const folderFields = {
        //     text: `${wrapFolderCount(`(${fields.length})`)} Field(s)`,
        //     icon: "fa-solid fa-folder text-light mx-2",
        //     class: ['item-tree-folder', 'bg-secondary'],
        //     id: _this.idFolderJavaClassField,
        //     expanded: _this.folderJavaClassFieldOpen,
        //     nodes: fields
        // };

        const folderMethods = {
            text: `${wrapFolderCount(`(${methods.length})`)} Method(s)`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassMethod,
            expanded: _this.folderJavaClassMethodOpen,
            nodes: methods
        };

        // Only add the folder if it is populated.
        const data: any[] = [];
        if (constructors.length) data.push(folderConstructors);
        if (staticFields.length) data.push(folderStaticFields);
        if (staticMethods.length) data.push(folderStaticMethods);
        // if (fields.length) data.push(folderFields);
        if (methods.length) data.push(folderMethods);

        // @ts-ignore
        $treeLower.bstreeview({ data });

        // if(this.selectedID != null) {
        //     document.getElementById(this.selectedID)!.scrollIntoView(true);
        // }
    }
}
