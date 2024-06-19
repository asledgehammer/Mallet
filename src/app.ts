import hljs = require('highlight.js');
import { generateLuaClass, generateLuaTable } from './asledgehammer/rosetta/lua/LuaLuaGenerator';
import { RosettaLuaClass } from './asledgehammer/rosetta/lua/RosettaLuaClass';
import { RosettaLuaConstructor } from './asledgehammer/rosetta/lua/RosettaLuaConstructor';
import { RosettaLuaField } from './asledgehammer/rosetta/lua/RosettaLuaField';
import { RosettaLuaFunction } from './asledgehammer/rosetta/lua/RosettaLuaFunction';
import { $get } from './asledgehammer/rosetta/util';
import { RosettaJavaClass } from './asledgehammer/rosetta/java/RosettaJavaClass';
import { generateJavaClass } from './asledgehammer/rosetta/java/JavaLuaGenerator2';
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
import { Catalog } from './asledgehammer/mallet/Catalog';
import { javaClassToTS } from './asledgehammer/rosetta/typescript/JavaTypeScriptGenerator';
import { luaClassToTS, luaTableToTS } from './asledgehammer/rosetta/typescript/LuaTypeScriptGenerator';
import { CodeLanguage } from './asledgehammer/mallet/component/CodeLanguage';
import { RosettaLuaTable } from './asledgehammer/rosetta/lua/RosettaLuaTable';
import { LuaTableCard } from './asledgehammer/mallet/component/lua/LuaTableCard';
import { RosettaLuaTableField } from './asledgehammer/rosetta/lua/RosettaLuaTableField';
import { LuaGlobalFunctionCard } from './asledgehammer/mallet/component/lua/LuaGlobalFunctionCard';
import { LuaGlobalFieldCard } from './asledgehammer/mallet/component/lua/LuaGlobalFieldCard';
import { JavaGlobalMethodCard } from './asledgehammer/mallet/component/java/JavaGlobalMethodCard';

export class App {

    readonly catalog: Catalog;
    readonly sidebar: Sidebar;
    readonly toast: Toast;
    readonly eSidebarContainer: HTMLElement;
    readonly $screenContent: JQuery<HTMLElement>;

    readonly modalName: ModalName;
    readonly modalConfirm: ModalConfirm;
    previewCode: string = '';

    readonly idBtnLanguageLua = `app-btn-language-lua`;
    readonly idBtnLanguageTypeScript = `app-btn-language-typescript`;
    readonly idBtnLanguageJSON = `app-btn-language-json`;
    languageMode: CodeLanguage = 'lua';

    constructor() {
        this.catalog = new Catalog(this);
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

    public hideCard() {
        this.$screenContent.empty();
        this.catalog.selected = undefined;
        this.catalog.selectedCard = undefined;
        this.sidebar.itemTree.selected = undefined;
        this.sidebar.itemTree.selectedID = undefined;
        this.sidebar.objTree.selected = undefined;
        this.sidebar.objTree.selectedID = undefined;
        this.sidebar.populateTrees();
    }

    public showGlobalLuaField(entity: RosettaLuaField): LuaGlobalFieldCard | null {
        this.catalog.selected = undefined;
        this.catalog.selectedCard = undefined;
        this.sidebar.objTree.globalSelected = true;

        this.$screenContent.empty();
        const card = new LuaGlobalFieldCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        // this.sidebar.itemTree.selectedID = `global-lua-field-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showGlobalLuaFunction(entity: RosettaLuaFunction): LuaGlobalFunctionCard | null {
        this.catalog.selected = undefined;
        this.catalog.selectedCard = undefined;
        this.sidebar.objTree.globalSelected = true;

        this.$screenContent.empty();
        const card = new LuaGlobalFunctionCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        // this.sidebar.itemTree.selectedID = `global-lua-function-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showGlobalJavaMethod(entity: RosettaJavaMethod): JavaGlobalMethodCard | null {
        this.catalog.selected = undefined;
        this.catalog.selectedCard = undefined;
        this.sidebar.objTree.globalSelected = true;

        this.$screenContent.empty();
        const card = new JavaGlobalMethodCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        // this.sidebar.itemTree.selectedID = `global-java-method-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaClass(entity: RosettaLuaClass): LuaClassCard {
        this.$screenContent.empty();

        // For new object-selections, unselect prior items.
        if (this.catalog.selected !== entity) {
            this.sidebar.itemTree.selectedID = undefined;
        }

        this.catalog.selected = entity;
        this.catalog.selectedCard = new LuaClassCard(this, { entity });
        this.$screenContent.append(this.catalog.selectedCard.render());
        this.catalog.selectedCard.listen();
        this.catalog.selectedCard.update();
        this.sidebar.objTree.globalSelected = false;
        this.sidebar.populateTrees();
        this.renderCode();

        return this.catalog.selectedCard;
    }

    public showLuaClassConstructor(entity: RosettaLuaConstructor | undefined): LuaConstructorCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.catalog.selected = selected;
        if (!entity) entity = new RosettaLuaConstructor(selected);
        this.$screenContent.empty();
        const card = new LuaConstructorCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaClassField(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-field-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaClassValue(entity: RosettaLuaField): LuaFieldCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-value-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaClassMethod(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: false });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        // this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-method-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaClassFunction(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        // this.sidebar.itemTree.selectedID = `lua-class-${selected.name}-function-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaTable(entity: RosettaLuaTable): LuaTableCard {
        this.$screenContent.empty();

        // For new object-selections, unselect prior items.
        if (this.catalog.selected !== entity) {
            this.sidebar.itemTree.selectedID = undefined;
        }

        this.catalog.selected = entity;
        this.catalog.selectedCard = new LuaTableCard(this, { entity });
        this.$screenContent.append(this.catalog.selectedCard.render());
        this.catalog.selectedCard.listen();
        this.catalog.selectedCard.update();
        this.sidebar.objTree.globalSelected = false;
        this.sidebar.populateTrees();
        this.renderCode();
        return this.catalog.selectedCard;
    }

    public showLuaTableField(entity: RosettaLuaTableField): LuaFieldCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaTable)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFieldCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `lua-table-${selected.name}-field-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showLuaTableFunction(entity: RosettaLuaFunction): LuaFunctionCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaLuaTable)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new LuaFunctionCard(this, { entity, isStatic: true });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `lua-table-${selected.name}-function-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showJavaClass(entity: RosettaJavaClass): JavaClassCard {
        this.$screenContent.empty();

        // For new object-selections, unselect prior items.
        if (this.catalog.selected !== entity) {
            this.sidebar.itemTree.selectedID = undefined;
        }

        this.catalog.selected = entity;
        this.catalog.selectedCard = new JavaClassCard(this, { entity });
        this.$screenContent.append(this.catalog.selectedCard.render());
        this.catalog.selectedCard.listen();
        this.catalog.selectedCard.update();
        this.sidebar.populateTrees();
        this.sidebar.objTree.globalSelected = false;
        this.renderCode();
        return this.catalog.selectedCard;
    }

    public showJavaClassConstructor(entity: RosettaJavaConstructor | undefined): JavaConstructorCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaJavaClass)) return null;
        if (!entity) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new JavaConstructorCard(this, { entity });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `java-class-${selected.name}-constructor-${entity.getSignature()}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showJavaClassField(entity: RosettaJavaField): JavaFieldCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaJavaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new JavaFieldCard(this, { entity, isStatic: entity.isStatic() });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `java-class-${selected.name}-field-${entity.name}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    public showJavaClassMethod(entity: RosettaJavaMethod): JavaMethodCard | null {
        const { selected } = this.catalog;
        if (!(selected instanceof RosettaJavaClass)) return null;
        this.catalog.selected = selected;
        this.$screenContent.empty();
        const card = new JavaMethodCard(this, { entity, isStatic: entity.isStatic() });
        this.$screenContent.append(card.render());
        card.listen();
        card.update();
        this.sidebar.itemTree.selectedID = `java-class-${selected.name}-method-${entity.getSignature()}`;
        this.sidebar.populateTrees();
        this.renderCode();
        return card;
    }

    renderCode() {
        const $renderPane = $get('code-preview');
        $renderPane.empty();

        let highlightedCode = '';

        if (this.sidebar.objTree.globalSelected) {
            switch (this.languageMode) {
                case 'lua': {
                    this.previewCode = this.catalog.toLuaTypings();
                    break;
                }
                case 'typescript': {
                    this.previewCode = this.catalog.toTypeScript();
                    break;
                }
                case 'json': {
                    this.previewCode = JSON.stringify(this.catalog.toJSON(), null, 2);
                    break;
                }
            }
        } else {

            /* (Keep empty if nothing renders) */
            if (!this.catalog.selectedCard) {
                this.previewCode = '';
                return;
            }

            const { selected } = this.catalog;

            if (selected instanceof RosettaLuaClass) {
                switch (this.languageMode) {
                    case 'lua': {
                        this.previewCode = '--- @meta\n\n' + generateLuaClass(selected);
                        break;
                    }
                    case 'typescript': {
                        this.previewCode = luaClassToTS(selected, true);
                        break;
                    }
                    case 'json': {
                        this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                        break;
                    }
                }
            } else if (selected instanceof RosettaLuaTable) {
                switch (this.languageMode) {
                    case 'lua': {
                        this.previewCode = '--- @meta\n\n' + generateLuaTable(selected);
                        break;
                    }
                    case 'typescript': {
                        this.previewCode = luaTableToTS(selected, true);
                        break;
                    }
                    case 'json': {
                        this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                        break;
                    }
                }
            } else if (selected instanceof RosettaJavaClass) {
                switch (this.languageMode) {
                    case 'lua': {
                        this.previewCode = '--- @meta\n\n' + generateJavaClass(selected);
                        break;
                    }
                    case 'typescript': {
                        this.previewCode = javaClassToTS(selected, true, true);
                        break;
                    }
                    case 'json': {
                        this.previewCode = JSON.stringify(selected.toJSON(), null, 2);
                        break;
                    }
                }
            }
        }

        highlightedCode = hljs.default.highlightAuto(this.previewCode, [this.languageMode]).value;

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
        let cog = false;
        let hideCog = () => {
            cog = false;
            $('#btns-code-left').hide();
        }
        let showCog = () => {
            cog = true;
            $('#btns-code-left').show();
        };

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
                $('#btn-code-preview-cog').show(150);

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
                $('#btns-code-left').hide();
                $('#btn-code-preview-cog').hide(150);
                hideCog();
                mode = 'card';
            }
        });

        $('#btn-code-preview-cog').on('click', () => {
            if (cog) {
                hideCog();
            } else {
                showCog();
            }
        });

        $('#app-btn-language-lua').on('click', () => {
            this.languageMode = 'lua';
            this.renderCode();
        });

        $('#app-btn-language-typescript').on('click', () => {
            this.languageMode = 'typescript';
            this.renderCode();
        });

        $('#app-btn-language-json').on('click', () => {
            this.languageMode = 'json';
            this.renderCode();
        });


        /* (For copying the preview code) */
        $btnCopy.on('click', () => {
            if (!this.previewCode.length) {
                this.toast.alert('No code to copy.', 'error');
                return;
            }
            this.copy(this.previewCode);
            this.toast.alert('Copied code.', 'info');
        });
    }

    copy(text: string) {
        navigator.clipboard.writeText(text);
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
