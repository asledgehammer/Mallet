import { LuaClassCard } from './asledgehammer/rosetta/component/LuaClassCard';
import { LuaFieldCard } from './asledgehammer/rosetta/component/LuaFieldCard';
import { LuaFunctionCard } from './asledgehammer/rosetta/component/LuaFunctionCard';
import { Sidebar } from './asledgehammer/rosetta/component/Sidebar';
import { generateLuaClass } from './asledgehammer/rosetta/lua/LuaGenerator';
import { RosettaLuaClass } from './asledgehammer/rosetta/lua/RosettaLuaClass';
import { RosettaLuaField } from './asledgehammer/rosetta/lua/RosettaLuaField';
import { RosettaLuaFunction } from './asledgehammer/rosetta/lua/RosettaLuaFunction';
import { $get } from './asledgehammer/rosetta/util';

async function load(url: string) {
    return await fetch(url).then((response) => response.json());
};

export class App {

    readonly sidebar: Sidebar;
    readonly eSidebarContainer: HTMLElement;
    readonly $screenContent: JQuery<HTMLElement>;

    card: LuaClassCard | null = null;

    constructor() {
        this.sidebar = new Sidebar(this);
        this.eSidebarContainer = document.getElementById('screen-sidebar-container')!;
        this.$screenContent = $('#screen-content-container');
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

        return this.card;
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

        const $renderPane = $get('screen-content-render');

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
}

async function init() {

    // @ts-ignore
    Quill.register('modules/QuillMarkdown', QuillMarkdown, true)

    const app = new App();
    app.init();

    // // Load debug Rosetta JSON.
    const json = await load('http://localhost:8080/assets/rosetta/patches/jab/json/client/isui/ISUIElement.json');

    app.loadLuaClass(json);
    app.sidebar.listen();
    app.renderCode();

    // @ts-ignore
    window.app = app;
}

init();
