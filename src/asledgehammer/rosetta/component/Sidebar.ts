import { App } from '../../../app';
import { $get, html } from '../util';
import { Component, ComponentOptions } from './Component';
import { ItemTree } from './ItemTree';
import { SidebarPanel } from './SidebarPanel';
import { SidebarPanelButton } from './SidebarPanelButton';

export class Sidebar extends Component<SidebarOptions> {

    private readonly panel: SidebarPanel;
    private readonly app: App;
    readonly itemTree: ItemTree;

    constructor(app: App) {
        super({
            classes: ['vs-bg-6', 'shadow-lg', 'border', 'border-1'],
            style: {
                width: '100%',
                height: '100%',
            },
        });

        this.app = app;
        const buttons: SidebarPanelButton[] = [];
        const result = document.getElementById('result')! as any;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            result.innerHTML = reader.result;
        });

        const funcLoad = () => {
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
                        app.sidebar.itemTree.populate();

                    }
                    reader.readAsText(file);
                }
            };

            dFileLoad.onchange = onchange;
            dFileLoad.click();
        };

        const funcSave = async () => {
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
        };

        buttons.push(new SidebarPanelButton({
            classes: ['mb-2'],
            label: 'Load',
            onclick: () => funcLoad()
        }));

        buttons.push(new SidebarPanelButton({
            classes: ['mb-2'],
            label: 'Save',
            onclick: () => funcSave()
        }));

        this.panel = new SidebarPanel({
            buttons
        });

        this.itemTree = new ItemTree(app);
    }

    protected onRender(): string {
        return html`
            <div class="bg-dark p-1 border-bottom border-bottom-2 border-black shadow">
                ${this.itemTree.render()}
            </div>

            <div class="bg-dark" style="height: 100%; overflow-y: auto;">${this.panel.render()}
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
    }

    listen(): void {
        this.panel.listen();
        this.itemTree.listen();
        this.itemTree.populate();

        const { app } = this;

        $get('btn-new-lua-value').on('click', () => {
            const { card } = app;
            if(!card) return;
            const clazz = card.options!.entity;
            if(!clazz) return;

            this.app.nameMode = 'new_value';
            this.app.$titleName.html('Create Lua Value');
            this.app.$inputName.val('');
            this.app.modalName.show();
        });

        $get('btn-new-lua-field').on('click', () => {
            const { card } = app;
            if(!card) return;
            const clazz = card.options!.entity;
            if(!clazz) return;

            this.app.nameMode = 'new_field';
            this.app.$titleName.html('Create Lua Field');
            this.app.$inputName.val('');
            this.app.modalName.show();
        });

        $get('btn-new-lua-function').on('click', () => {
            const { card } = app;
            if(!card) return;
            const clazz = card.options!.entity;
            if(!clazz) return;

            this.app.nameMode = 'new_function';
            this.app.$titleName.html('Create Lua Function');
            this.app.$inputName.val('');
            this.app.modalName.show();
        });

        $get('btn-new-lua-method').on('click', () => {
            const { card } = app;
            if(!card) return;
            const clazz = card.options!.entity;
            if(!clazz) return;

            this.app.nameMode = 'new_method';
            this.app.$titleName.html('Create Lua Method');
            this.app.$inputName.val('');
            this.app.modalName.show();
        });
    }
};

export type SidebarOptions = ComponentOptions & {};
