import hljs = require('highlight.js');
import { generateLuaClass } from './asledgehammer/rosetta/lua/LuaGenerator';
import { RosettaLuaClass } from './asledgehammer/rosetta/lua/RosettaLuaClass';
import { RosettaLuaConstructor } from './asledgehammer/rosetta/lua/RosettaLuaConstructor';
import { RosettaLuaField } from './asledgehammer/rosetta/lua/RosettaLuaField';
import { RosettaLuaFunction } from './asledgehammer/rosetta/lua/RosettaLuaFunction';
import { $get } from './asledgehammer/rosetta/util';
import { RosettaJavaClass, RosettaJavaNamespace } from './asledgehammer/rosetta/java/RosettaJavaClass';
import { generateJavaClass } from './asledgehammer/rosetta/java/JavaGenerator';
import { RosettaJavaField } from './asledgehammer/rosetta/java/RosettaJavaField';
import { RosettaJavaMethod } from './asledgehammer/rosetta/java/RosettaJavaMethod';
import { RosettaJavaConstructor } from './asledgehammer/rosetta/java/RosettaJavaConstructor';
import { LuaClassCard } from './asledgehammer/mallet/component/lua/LuaClassCard';
import { JavaClassCard } from './asledgehammer/mallet/component/java/JavaClassCard';
import { Sidebar } from './asledgehammer/mallet/component/Sidebar';
import { LuaConstructorCard } from './asledgehammer/mallet/component/lua/LuaConstructorCard';
import { LuaFieldCard } from './asledgehammer/mallet/component/lua/LuaFieldCard';
import { LuaFunctionCard } from './asledgehammer/mallet/component/lua/LuaFunctionCard';
import { JavaConstructorCard } from './asledgehammer/mallet/component/java/JavaConstructorCard';
import { JavaFieldCard } from './asledgehammer/mallet/component/java/JavaFieldCard';
import { JavaMethodCard } from './asledgehammer/mallet/component/java/JavaMethodCard';
import { ModalName } from './asledgehammer/mallet/modal/ModalName';
import { ModalConfirm } from './asledgehammer/mallet/modal/ModalConfirm';
import { Toast } from './asledgehammer/mallet/component/Toast';
import { Active } from './asledgehammer/mallet/Active';

export class App {

    readonly active: Active;
    readonly sidebar: Sidebar;
    readonly toast: Toast;
    readonly eSidebarContainer: HTMLElement;
    readonly $screenContent: JQuery<HTMLElement>;

    readonly modalName: ModalName;
    readonly modalConfirm: ModalConfirm;

    constructor() {

        this.active = new Active(this);
        this.sidebar = new Sidebar(this);
        this.toast = new Toast(this);
        this.modalName = new ModalName(this);
        this.modalConfirm = new ModalConfirm(this);
        this.eSidebarContainer = document.getElementById('screen-sidebar-container')!;
        this.$screenContent = $('#screen-content-end-container');
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

    public showLuaClassConstructor(entity: RosettaLuaConstructor | undefined): LuaConstructorCard | null {
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

    public showLuaClassField(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaClassValue(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaClassMethod(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showLuaClassFunction(entity: RosettaLuaFunction): LuaFunctionCard | null {
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

    public showJavaClassConstructor(entity: RosettaJavaConstructor | undefined): JavaConstructorCard | null {
        const { selected } = this.active;
        console.log(`showJavaClassConstructor(${entity})`);
        if (!(selected instanceof RosettaJavaClass)) return null;
        console.log('a');
        if (!entity) return null;
        console.log('b');

        this.$screenContent.empty();
        const card = new JavaConstructorCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.renderCode();
        return card;
    }

    public showJavaClassField(entity: RosettaJavaField): JavaFieldCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaJavaClass)) return null;
        this.$screenContent.empty();
        const card = new JavaFieldCard(this, { entity, isStatic: entity.isStatic() });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
    }

    public showJavaClassMethod(entity: RosettaJavaMethod): JavaMethodCard | null {
        const { selected } = this.active;
        if (!(selected instanceof RosettaJavaClass)) return null;
        this.$screenContent.empty();
        const card = new JavaMethodCard(this, { entity, isStatic: entity.isStatic() });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        return card;
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
        this.modalName.listen();
        this.modalConfirm.listen();

        const _this = this;

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
