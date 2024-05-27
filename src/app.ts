// import bootstrap = require('bootstrap');
import hljs = require('highlight.js');
import { LuaClassCard } from './asledgehammer/rosetta/component/lua/LuaClassCard';
import { LuaConstructorCard } from './asledgehammer/rosetta/component/lua/LuaConstructorCard';
import { LuaFieldCard } from './asledgehammer/rosetta/component/lua/LuaFieldCard';
import { LuaFunctionCard } from './asledgehammer/rosetta/component/lua/LuaFunctionCard';
import { NameModeType } from './asledgehammer/rosetta/component/NameModeType';
import { Sidebar } from './asledgehammer/rosetta/component/Sidebar';
import { generateLuaClass } from './asledgehammer/rosetta/lua/LuaGenerator';
import { RosettaLuaClass } from './asledgehammer/rosetta/lua/RosettaLuaClass';
import { RosettaLuaConstructor } from './asledgehammer/rosetta/lua/RosettaLuaConstructor';
import { RosettaLuaField } from './asledgehammer/rosetta/lua/RosettaLuaField';
import { RosettaLuaFunction } from './asledgehammer/rosetta/lua/RosettaLuaFunction';
import { $get, validateLuaVariableName } from './asledgehammer/rosetta/util';
import { LuaParser } from './asledgehammer/rosetta/lua/wizard/LuaParser';
import { RosettaLuaTable } from './asledgehammer/rosetta/lua/RosettaLuaTable';
import { RosettaJavaClass, RosettaJavaNamespace } from './asledgehammer/rosetta/java/RosettaJavaClass';
import { JavaClassCard } from './asledgehammer/rosetta/component/java/JavaClassCard';
import { generateJavaClass } from './asledgehammer/rosetta/java/JavaGenerator';

export class Active {

    readonly app: App;

    readonly luaClasses: { [name: string]: RosettaLuaClass } = {};
    readonly luaTables: { [name: string]: RosettaLuaTable } = {};
    readonly javaClasses: { [name: string]: RosettaJavaClass } = {};

    selected: RosettaLuaClass | RosettaLuaTable | RosettaJavaClass | undefined = undefined;
    selectedCard: LuaClassCard | JavaClassCard | undefined = undefined;

    constructor(app: App) {
        this.app = app;
    }

    reset() {

        // Wipe all content from the dictionaries.
        for (const name of Object.keys(this.luaClasses)) {
            delete this.luaClasses[name];
        }
        for (const name of Object.keys(this.luaTables)) {
            delete this.luaTables[name];
        }
        for (const name of Object.keys(this.javaClasses)) {
            delete this.javaClasses[name];
        }

        // Wipe active selections.
        this.selected = undefined;
        this.selectedCard = undefined;

        // Clear the screen container.
        this.app.$screenContent.empty();
    }
}

export class Toast {

    readonly app: App;
    readonly toastSimple: any;
    readonly idSimpleBody = 'toast-simple-body';
    readonly idToastSimple = 'toast-simple';

    constructor(app: App) {
        this.app = app;

        // @ts-ignore
        this.toastSimple = new bootstrap.Toast(document.getElementById('toast-simple')!, {});
    }

    alert(text: string, color: 'success' | 'info' | 'error' | undefined = undefined) {
        const { idSimpleBody, idToastSimple } = this;

        const $toast = $get(idToastSimple);

        // Set the background color.
        $toast.removeClass('bg-success');
        $toast.removeClass('bg-danger');
        $toast.removeClass('bg-info');
        if (color === 'success') $toast.addClass('bg-success');
        else if (color === 'error') $toast.addClass('bg-danger');
        else if (color === 'info') $toast.addClass('bg-info');

        // Set the text content.
        document.getElementById(idSimpleBody)!.innerHTML = text;

        // Show the toast to the user.
        this.toastSimple.show();
    }
}

export class App {

    readonly active: Active;
    readonly sidebar: Sidebar;
    readonly toast: Toast;
    readonly eSidebarContainer: HTMLElement;
    readonly $screenContent: JQuery<HTMLElement>;

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

    // card: LuaClassCard | null = null;

    readonly luaParser: LuaParser;

    constructor() {

        this.active = new Active(this);
        this.sidebar = new Sidebar(this);
        this.toast = new Toast(this);
        this.luaParser = new LuaParser(this);
        this.eSidebarContainer = document.getElementById('screen-sidebar-container')!;
        this.$screenContent = $('#screen-content-end-container');

        // @ts-ignore This modal is for new items and editing their names.
        this.modalName = new bootstrap.Modal('#modal-name', {});
        this.$titleName = $get('title-name');
        this.$inputName = $get('input-name');
        this.$btnName = $get('btn-name-create');

        // @ts-ignore This modal is for confirming actions.
        this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
        this.$titleConfirm = $get('title-confirm')!;
        this.$bodyConfirm = $get('body-confirm')!;
        this.$btnConfirm = $get('btn-confirm')!;
        this.confirmSuccess = undefined;

        this.nameMode = null;
    }

    async init() {
        this.createSidebar();
    }

    public loadJson(json: any): void {
        this.active.reset();

        if (json.luaClasses) {
            for (const name of Object.keys(json.luaClasses)) {
                const entity = new RosettaLuaClass(name, json.luaClasses[name]);
                this.active.luaClasses[name] = entity;
            }
        }

        if (json.namespaces) {
            for (const name of Object.keys(json.namespaces)) {
                const namespace = new RosettaJavaNamespace(name, json.namespaces[name]);
                for (const className of Object.keys(namespace.classes)) {
                    this.active.javaClasses[className] = namespace.classes[className];
                }
            }
        }

        this.sidebar.populateTrees();
    }

    public saveJson(): any {
        let keys: string[];

        // Lua Classes
        let luaClasses: any = undefined;
        keys = Object.keys(this.active.luaClasses);
        if (keys.length) {
            luaClasses = {};
            for (const name of keys) {
                luaClasses[name] = this.active.luaClasses[name].toJSON();
            }
        }

        // Lua Tables
        let luaTables: any = undefined;
        keys = Object.keys(this.active.luaTables);
        if (keys.length) {
            luaTables = {};
            for (const name of keys) {
                luaTables[name] = this.active.luaTables[name].toJSON();
            }
        }

        // Java Classes
        let namespaces: any = undefined;
        keys = Object.keys(this.active.javaClasses);
        if (keys.length) {
            namespaces = {};
            for (const name of keys) {
                const javaClass = this.active.javaClasses[name];
                const namespace = javaClass.namespace;
                if (!namespaces[namespace.name]) {
                    namespaces[namespace.name] = {};
                }
                namespaces[namespace.name][name] = this.active.javaClasses[name].toJSON();
            }
        }

        return {
            $schema: 'https://raw.githubusercontent.com/asledgehammer/PZ-Rosetta-Schema/main/rosetta-schema.json',
            luaClasses,
            luaTables,
            namespaces
        };
    }

    public showLuaClass(entity: RosettaLuaClass): LuaClassCard {
        this.$screenContent.empty();
        // this.selected = entity.name;
        this.active.selected = entity;
        this.active.selectedCard = new LuaClassCard(this, { entity });
        this.$screenContent.append(this.active.selectedCard.render());
        this.active.selectedCard.listen();
        this.active.selectedCard.update();
        this.renderCode();
        return this.active.selectedCard;
    }

    public showLuaConstructor(entity: RosettaLuaConstructor | undefined): LuaConstructorCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        if (!entity) entity = new RosettaLuaConstructor(selected);
        this.$screenContent.empty();
        const card = new LuaConstructorCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.renderCode();
        return card;
    }

    public showLuaField(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaValue(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaMethod(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaFunction(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showJavaClass(entity: RosettaJavaClass): JavaClassCard {
        this.$screenContent.empty();
        // this.selected = entity.name;
        this.active.selected = entity;
        this.active.selectedCard = new JavaClassCard(this, { entity });
        this.$screenContent.append(this.active.selectedCard.render());
        this.active.selectedCard.listen();
        this.active.selectedCard.update();
        this.renderCode();
        return this.active.selectedCard;
    }

    renderCode() {
        const $renderPane = $get('code-preview');
        $renderPane.empty();
        if (!this.active.selectedCard) return;

        const { selected } = this.active;

        let highlightedCode = '';
        if (selected instanceof RosettaLuaClass) {
            highlightedCode = hljs.default.highlightAuto(generateLuaClass(selected), ['lua']).value;
        } else if (selected instanceof RosettaJavaClass) {
            highlightedCode = hljs.default.highlightAuto(generateJavaClass(selected), ['lua']).value;
        }
        $renderPane.html(highlightedCode);
    }

    private createSidebar() {
        const { eSidebarContainer, sidebar } = this;
        eSidebarContainer.innerHTML = sidebar.render();
    }

    listen() {
        this.sidebar.listen();

        const _this = this;

        this.$btnConfirm!.on('click', () => {
            this.modalConfirm.hide();
            if (this.confirmSuccess) {
                this.confirmSuccess();
                this.confirmSuccess = undefined;
            }
        });

        this.$inputName.on('input', () => {
            setTimeout(() => this.$inputName.val(validateLuaVariableName(this.$inputName.val()!)), 1);
        });

        this.$btnName.on('click', () => {
            const clazz = this.active.selectedCard?.options!.entity!;
            const name = validateLuaVariableName(this.$inputName.val()!).trim();
            const nameOld = this.nameSelected!;
            switch (this.nameMode) {
                case 'new_class': {
                    try {
                        const entity = new RosettaLuaClass(validateLuaVariableName(this.$inputName.val()!).trim());
                        this.showLuaClass(entity);
                        this.sidebar.populateTrees();
                        this.toast.alert('Created Lua Class.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Class.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_class': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            clazz.name = name;
                            this.showLuaClass(clazz);
                            this.toast.alert('Edited Lua Class.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Class.`, 'error');
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
                            this.showLuaField(field);
                            this.sidebar.populateTrees();
                            this.toast.alert('Created Lua Field.', 'success');
                        } catch (e) {
                            this.toast.alert(`Failed to create Lua Field.`, 'error');
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
                            this.showLuaField(field);
                            this.sidebar.populateTrees();
                            this.toast.alert('Edited Lua Field.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Field.`, 'error');
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
                            this.showLuaValue(value);
                            this.sidebar.populateTrees();
                            this.toast.alert('Created Lua Value.', 'success');
                        } catch (e) {
                            this.toast.alert(`Failed to create Lua Value.`, 'error');
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
                            this.showLuaValue(value);
                            this.sidebar.populateTrees();
                            this.toast.alert('Edited Lua value.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Value.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'new_function': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const func = clazz.createFunction(name);
                            this.showLuaFunction(func);
                            this.sidebar.populateTrees();
                            this.toast.alert('Created Lua Function.', 'success');
                        } catch (e) {
                            this.toast.alert(`Failed to create Lua Function.`, 'error');
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
                            this.showLuaFunction(func);
                            this.sidebar.populateTrees();
                            this.toast.alert('Edited Lua Function.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Function.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
                case 'new_method': {
                    if (clazz instanceof RosettaLuaClass) {
                        try {
                            const method = clazz.createMethod(name);
                            this.showLuaMethod(method);
                            this.sidebar.populateTrees();
                            this.toast.alert('Created Lua Method.', 'success');
                        } catch (e) {
                            this.toast.alert(`Failed to create Lua Method.`, 'error');
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
                            this.showLuaMethod(method);
                            this.sidebar.populateTrees();
                            this.toast.alert('Edited Lua Method.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Method.`, 'error');
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
                                this.showLuaConstructor(func as RosettaLuaConstructor);
                            } else if (type === 'function') {
                                this.showLuaFunction(func as RosettaLuaFunction);
                            } else {
                                this.showLuaMethod(func as RosettaLuaFunction);
                            }
                            this.renderCode();
                            this.toast.alert('Created Lua Parameter.', 'success');
                        } catch (e) {
                            this.toast.alert(`Failed to create Lua Parameter.`, 'error');
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
                                this.showLuaConstructor(func as RosettaLuaConstructor);
                            } else if (type === 'function') {
                                this.showLuaFunction(func as RosettaLuaFunction);
                            } else if (type === 'method') {
                                this.showLuaMethod(func as RosettaLuaFunction);
                            }
                            this.renderCode();
                            this.sidebar.populateTrees();
                            this.toast.alert('Edited Lua Parameter.');
                        } catch (e) {
                            this.toast.alert(`Failed to edit Lua Parameter.`, 'error');
                            console.error(e);
                        }
                    }
                    break;
                }
            }
            this.nameSelected = undefined;
            this.modalName.hide();
        });

        const $btnCopy = $get('btn-code-preview-copy');
        const $container = $get('screen-content-container');
        const $cardPreview = $get('screen-content-end-container');
        const $codePreview = $get('code-preview');
        const $btnCardCode = $get('btn-card-code');
        const $iconCard = $get('icon-card');
        const $iconCode = $get('icon-code');

        let mode: 'code' | 'card' = 'card';

        $btnCardCode.on('click', () => {
            if (mode === 'card') {
                $container.removeClass('p-4');
                $container.addClass('p-0');
                $cardPreview.hide();
                $codePreview.css({ 'overflow': 'scroll' });
                $codePreview.show(150);
                $iconCode.hide();
                $iconCard.show();
                $btnCardCode.css({ 'right': '2rem' });
                $btnCopy.show(150);
                mode = 'code';
            } else if (mode === 'code') {
                $container.removeClass('p-0');
                $container.addClass('pt-4');
                $codePreview.hide(150, () => {
                    $container.removeClass('pt-4');
                    $container.addClass('p-4');
                    $codePreview.css({ 'overflow': 'none' });
                });
                $cardPreview.slideDown(150);
                $iconCard.hide();
                $iconCode.show();
                $btnCardCode.css({ 'right': '1rem' });
                $btnCopy.hide(150);
                mode = 'card';
            }
        });
    }

    askConfirm(onSuccess: () => void, title: string = 'Confirm', body: string = 'Are you sure?') {
        this.$titleConfirm.html(title);
        this.$bodyConfirm.html(body);
        this.confirmSuccess = onSuccess;
        this.modalConfirm.show();
    }
}

async function init() {
    // @ts-ignore
    Quill.register('modules/QuillMarkdown', QuillMarkdown, true)

    const app = new App();
    app.init();
    app.listen();
    // @ts-ignore
    const greet = new bootstrap.Modal('#modal-greet', {});
    greet.show();

    // @ts-ignore
    window.app = app;
}

$(() => init());
