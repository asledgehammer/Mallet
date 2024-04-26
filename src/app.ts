// import bootstrap = require('bootstrap');
import { LuaClassCard } from './asledgehammer/rosetta/component/LuaClassCard';
import { LuaConstructorCard } from './asledgehammer/rosetta/component/LuaConstructorCard';
import { LuaFieldCard } from './asledgehammer/rosetta/component/LuaFieldCard';
import { LuaFunctionCard } from './asledgehammer/rosetta/component/LuaFunctionCard';
import { NameModeType } from './asledgehammer/rosetta/component/NameModeType';
import { Sidebar } from './asledgehammer/rosetta/component/Sidebar';
import { generateLuaClass } from './asledgehammer/rosetta/lua/LuaGenerator';
import { RosettaLuaClass } from './asledgehammer/rosetta/lua/RosettaLuaClass';
import { RosettaLuaConstructor } from './asledgehammer/rosetta/lua/RosettaLuaConstructor';
import { RosettaLuaField } from './asledgehammer/rosetta/lua/RosettaLuaField';
import { RosettaLuaFunction } from './asledgehammer/rosetta/lua/RosettaLuaFunction';
import { $get, validateLuaVariableName } from './asledgehammer/rosetta/util';

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
    selected: string | undefined;
    nameSelected: string | undefined;
    nameMode: NameModeType;

    card: LuaClassCard | null = null;

    constructor() {
        this.sidebar = new Sidebar(this);
        this.toast = new Toast(this);
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

    public loadLuaClass(json: any): LuaClassCard {

        this.$screenContent.empty();

        // Always get first class
        const name = Object.keys(json.luaClasses)[0];
        const entity = new RosettaLuaClass(name, json.luaClasses[name]);
        this.card = new LuaClassCard(this, { entity: entity });
        this.$screenContent.append(this.card.render());
        this.card.listen();
        this.card.update();
        this.renderCode();
        this.sidebar.itemTree.populate();
        return this.card;
    }

    public showClass(entity: RosettaLuaClass): LuaClassCard {
        this.$screenContent.empty();
        this.card = new LuaClassCard(this, { entity });
        this.$screenContent.append(this.card.render());
        this.card.listen();
        this.card.update();
        this.renderCode();
        return this.card;
    }

    public showConstructor(entity: RosettaLuaConstructor | undefined): LuaConstructorCard {
        const clazz = this.card?.options!.entity!;
        if (!entity) entity = new RosettaLuaConstructor(clazz);
        this.$screenContent.empty();
        const card = new LuaConstructorCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.renderCode();
        return card;
    }

    public showField(entity: RosettaLuaField): LuaFieldCard {
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showValue(entity: RosettaLuaField): LuaFieldCard {
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showMethod(entity: RosettaLuaFunction): LuaFunctionCard {
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showFunction(entity: RosettaLuaFunction): LuaFunctionCard {
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    renderCode() {
        const $renderPane = $get('code-preview');
        $renderPane.empty();
        if (!this.card) return;

        // @ts-ignore
        const highlightedCode = hljs.highlight(
            generateLuaClass(this.card.options!.entity),
            { language: 'lua' }
        ).value;

        $renderPane.append(highlightedCode);
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
            const clazz = this.card?.options!.entity!;
            const name = validateLuaVariableName(this.$inputName.val()!).trim();
            const nameOld = this.nameSelected!;
            switch (this.nameMode) {
                case 'new_class': {
                    try {
                        const entity = new RosettaLuaClass(validateLuaVariableName(this.$inputName.val()!).trim());
                        this.showClass(entity);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Created Lua Class.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Class.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_class': {
                    try {
                        clazz.name = name;
                        this.showClass(clazz);
                        this.toast.alert('Edited Lua Class.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Class.`, 'error');
                        console.error(e);
                    }

                    break;
                }
                case 'new_field': {
                    try {
                        const field = clazz.createField(name);
                        this.showField(field);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Created Lua Field.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Field.`, 'error');
                        console.error(e);
                    }

                    break;
                }
                case 'edit_field': {
                    try {
                        const field = clazz.fields[nameOld];
                        field.name = name;
                        clazz.fields[name] = field;
                        delete clazz.fields[nameOld];
                        this.showField(field);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Edited Lua Field.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Field.`, 'error');
                        console.error(e);
                    }

                    break;
                }
                case 'new_value': {
                    try {
                        const value = clazz.createValue(name);
                        this.showValue(value);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Created Lua Value.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Value.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_value': {
                    try {
                        const value = clazz.values[nameOld];
                        value.name = name;
                        clazz.values[name] = value;
                        delete clazz.values[nameOld];
                        this.showValue(value);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Edited Lua value.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Value.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'new_function': {
                    try {
                        const func = clazz.createFunction(name);
                        this.showFunction(func);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Created Lua Function.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Function.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_function': {
                    try {
                        const func = clazz.functions[nameOld];
                        func.name = name;
                        clazz.functions[name] = func;
                        delete clazz.functions[nameOld];
                        this.showFunction(func);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Edited Lua Function.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Function.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'new_method': {
                    try {
                        const method = clazz.createMethod(name);
                        this.showMethod(method);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Created Lua Method.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Method.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_method': {
                    try {
                        const method = clazz.methods[nameOld];
                        method.name = name;
                        clazz.methods[name] = method;
                        delete clazz.methods[nameOld];
                        this.showMethod(method);
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Edited Lua Method.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Method.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'new_parameter': {
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
                            this.showConstructor(func as RosettaLuaConstructor);
                        } else if (type === 'function') {
                            this.showFunction(func as RosettaLuaFunction);
                        } else {
                            this.showMethod(func as RosettaLuaFunction);
                        }
                        this.renderCode();
                        this.toast.alert('Created Lua Parameter.', 'success');
                    } catch (e) {
                        this.toast.alert(`Failed to create Lua Parameter.`, 'error');
                        console.error(e);
                    }
                    break;
                }
                case 'edit_parameter': {
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
                            this.showConstructor(func as RosettaLuaConstructor);
                        } else if (type === 'function') {
                            this.showFunction(func as RosettaLuaFunction);
                        } else if (type === 'method') {
                            this.showMethod(func as RosettaLuaFunction);
                        }
                        this.renderCode();
                        this.sidebar.itemTree.populate();
                        this.toast.alert('Edited Lua Parameter.');
                    } catch (e) {
                        this.toast.alert(`Failed to edit Lua Parameter.`, 'error');
                        console.error(e);
                    }
                    break;
                }
            }
            this.nameSelected = undefined;
            this.modalName.hide();
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
