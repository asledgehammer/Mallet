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
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            _this.app.showLuaClassConstructor(entity.conztructor);
            // Let the editor know we last selected the constructor.
            _this.selected = 'constructor';
        });

        $doc.on('click', '.lua-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const field = entity.fields[fieldName];
            if (!field) return;
            _this.app.showLuaClassField(field);
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
        });

        $doc.on('click', '.lua-value-item', function () {
            const valueName = this.id.split('value-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === valueName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const value = entity.values[valueName];
            if (!value) return;
            _this.app.showLuaClassValue(value);
            // Let the editor know we last selected the value.
            _this.selected = valueName;
        });

        $doc.on('click', '.lua-method-item', function () {
            const methodName = this.id.split('method-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === methodName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const method = entity.methods[methodName];
            if (!method) return;
            _this.app.showLuaClassMethod(method);
            // Let the editor know we last selected the method.
            _this.selected = methodName;
        });

        $doc.on('click', '.lua-function-item', function () {
            const functionName = this.id.split('function-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === functionName) return;
            const entity = _this.app.catalog.selected as RosettaLuaClass;
            const func = entity.functions[functionName];
            if (!func) return;
            _this.app.showLuaClassFunction(func);
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

        $doc.on('click', '.java-class-field-item', function () {
            const fieldName = this.id.split('field-')[1].trim();
            // Prevent wasteful selection code executions here.
            if (_this.selected === fieldName) return;
            const entity = _this.app.catalog.selected as RosettaJavaClass;
            const field = entity.fields[fieldName];
            if (!field) return;
            _this.app.showJavaClassField(field);
            // Let the editor know we last selected the field.
            _this.selected = fieldName;
        });

        $doc.on('click', '.java-class-method-item', function () {
            const signature = this.id.split('method-')[1].trim();

            // Prevent wasteful selection code executions here.
            if (_this.selected === signature) return;

            // This is lazy but it works.
            let method = _this.staticMethodSignatureMap[signature];
            if (!method) method = _this.methodSignatureMap[signature];
            if (!method) return;

            _this.app.showJavaClassMethod(method);
            // Let the editor know we last selected the field.
            _this.selected = signature;
        });

        $doc.on('click', '.java-class-constructor-item', function () {
            const signature = this.id.split('constructor-')[1].trim();

            console.log(`signature: ${signature}`);

            // Prevent wasteful selection code executions here.
            if (_this.selected === signature) return;

            const conztructor = _this.constructorSignatureMap[signature];
            if (!conztructor) return;

            _this.app.showJavaClassConstructor(conztructor);
            // Let the editor know we last selected the field.
            _this.selected = signature;
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

    populateLuaClass(entity: RosettaLuaClass) {

        if (!entity) return;

        const _this = this;

        const fieldNames = Object.keys(entity.fields);
        fieldNames.sort((a, b) => a.localeCompare(b));
        const fields = [];
        for (const fieldName of fieldNames) {
            const field = entity.fields[fieldName];
            const id = `lua-class-${entity.name}-field-${field.name}`;

            const classes: string[] = ['item-tree-item', 'lua-field-item'];
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

            const classes: string[] = ['item-tree-item', 'lua-value-item'];
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

            const classes: string[] = ['item-tree-item', 'lua-method-item'];
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

            const classes: string[] = ['item-tree-item', 'lua-function-item'];
            if(id === this.selectedID) classes.push('selected');

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
        const conzClasses: string[] = ['item-tree-item', 'lua-constructor-item'];
        if(conzID === this.selectedID) conzClasses.push('selected');

        // @ts-ignore
        $treeLower.bstreeview({
            data: [
                {
                    id: conzID,
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
                    class: conzClasses
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
                let signature = `${method.name}`;
                if (method.parameters && method.parameters.length) {
                    signature += '_';
                    for (const param of method.parameters) {
                        signature += `${param.type.basic}-`;
                    }
                    signature = signature.substring(0, signature.length - 1);
                }
                if (method.isStatic()) {
                    this.staticMethodSignatureMap[signature] = method;
                } else {
                    this.methodSignatureMap[signature] = method;
                }
            }
        }

        for (const cons of entity.constructors) {
            let signature = `constructor`;
            if (cons.parameters && cons.parameters.length) {
                signature += '_';
                for (const param of cons.parameters) {
                    signature += `${param.type.basic}-`;
                }
                signature = signature.substring(0, signature.length - 1);
            }
            this.constructorSignatureMap[signature] = cons;
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
            if (field.isStatic()) {
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
        }

        // Instance field(s)
        for (const name of fieldNames) {
            const field = entity.fields[name];
            if (!field.isStatic()) {
                const id = `java-class-${entity.name}-field-${field.name}`;

                const classes: string[] = ['item-tree-item', 'java-class-field-item'];
                if (id === this.selectedID) classes.push('selected');

                fields.push({
                    text: wrapItem(field.name),
                    icon: LuaCard.getTypeIcon(field.type.basic),
                    id,
                    class: classes
                });
            }
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
            text: `${wrapFolderCount(`(${constructors.length})`)} Constructors`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassConstructor,
            expanded: _this.folderJavaClassConstructorOpen,
            nodes: constructors
        };

        const folderStaticFields = {
            text: `${wrapFolderCount(`(${staticFields.length})`)} Static Fields`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassStaticField,
            expanded: _this.folderJavaClassStaticFieldOpen,
            nodes: staticFields
        };

        const folderStaticMethods = {
            text: `${wrapFolderCount(`(${staticMethods.length})`)} Static Methods`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassStaticMethod,
            expanded: _this.folderJavaClassStaticMethodOpen,
            nodes: staticMethods
        };

        const folderFields = {
            text: `${wrapFolderCount(`(${fields.length})`)} Fields`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClassField,
            expanded: _this.folderJavaClassFieldOpen,
            nodes: fields
        };

        const folderMethods = {
            text: `${wrapFolderCount(`(${methods.length})`)} Methods`,
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
        if (fields.length) data.push(folderFields);
        if (methods.length) data.push(folderMethods);

        // @ts-ignore
        $treeLower.bstreeview({ data });
    }
}
