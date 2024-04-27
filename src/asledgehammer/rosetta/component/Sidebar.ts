import { App } from '../../../app';
import { $get, html } from '../util';
import { Component, ComponentOptions } from './Component';
import { ItemTree } from './ItemTree';

export class Sidebar extends Component<SidebarOptions> {

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
        const result = document.getElementById('result')! as any;
        const reader = new FileReader();
        reader.addEventListener('load', () => (result.innerHTML = reader.result));

        this.itemTree = new ItemTree(app);
    }

    protected onRender(): string {
        return html`
            <div class="bg-dark p-1 border-bottom border-bottom-2 border-black shadow">
                <!-- New Class -->
                <button id="new-lua-class" class="btn btn-sm responsive-btn responsive-btn-success" title="New Class">
                    <div class="btn-pane">    
                        <i class="fa fa-file"></i>
                    </div>
                </button>
                
                <!-- Open Class -->
                <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open Class">
                    <div class="btn-pane">
                        <i class="fa-solid fa-folder-open"></i>
                    </div>
                </button>

                <!-- Save Class -->
                <button id="save-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Save Class">
                    <div class="btn-pane">
                        <i class="fa fa-save"></i>
                    </div>
                </button>

                <!-- Lua Wizard -->
                <button id="lua-wizard" class="btn btn-sm responsive-btn responsive-btn-info" title="Lua Wizard">
                    <div class="btn-pane">    
                        <i class="fa-solid fa-wand-sparkles"></i>
                    </div>
                </button>

                <!-- New Properties -->
                <div class="dropdown" style="position: absolute; top: 5px; right: 5px;">
                    <button class="btn btn-sm responsive-btn responsive-btn-success float-end" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Add Element">
                    <div class="btn-pane">     
                            <i class="fa-solid fa-plus"></i>
                        </div>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark">
                        <li><a id="btn-new-lua-value" class="dropdown-item" href="#">New Value</a></li>
                        <li><a id="btn-new-lua-field" class="dropdown-item" href="#">New Field</a></li>
                        <li><a id="btn-new-lua-function" class="dropdown-item" href="#">New Function</a></li>
                        <li><a id="btn-new-lua-method" class="dropdown-item" href="#">New Method</a></li>
                    </ul>
                </div>
            </div>

            <div class="bg-dark" style="height: 100%; overflow-y: auto;">
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
    }

    listen(): void {
        this.itemTree.populate();

        const { app } = this;
        const _this = this;
        const { $titleName, $btnName, $inputName, modalName } = app;

        $get('new-lua-class').on('click', () => {
            try {
                $titleName.html('New Lua Class');
                $btnName.html('Create');
                $btnName.removeClass('btn-primary');
                $btnName.addClass('btn-success');
                $inputName.val('');
                app.nameMode = 'new_class';
                modalName.show();
            } catch(e) {
                app.toast.alert(`Failed to create LuaClass.`, 'error');
                console.error(e);
            }
        });

        $get('open-lua-class').on('click', () => {
            const dFileLoad = document.getElementById('load-file') as any;
            const onchange = () => {
                try {
                    const file = dFileLoad.files[0];
                    const textType = 'application/json';
                    if (file.type.match(textType)) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            const json = JSON.parse(reader.result as string);
                            app.loadLuaClass(json);
                            app.renderCode();
                            _this.itemTree.populate();
                        }
                        reader.readAsText(file);
                    }
                    app.toast.alert(`Loaded LuaClass.`, 'success');
                } catch (e) {
                    app.toast.alert(`Failed to load LuaClass.`, 'error');
                    console.error(e);
                }
            };
            dFileLoad.onchange = onchange;
            dFileLoad.click();
        });

        $get('save-lua-class').on('click', async () => {
            try {
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

                app.toast.alert(`Saved LuaClass.`, 'info');
            } catch (e) {
                app.toast.alert(`Failed to load LuaClass.`, 'error');
                console.error(e);
            }

            return;
        });

        $get('btn-new-lua-value').on('click', () => {
            try {
                const { card } = app;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;
    
                this.app.nameMode = 'new_value';
                this.app.$titleName.html('Create Lua Value');
                this.app.$inputName.val('');
                this.app.modalName.show();
            } catch(e) {
                app.toast.alert(`Failed to create Lua Value.`, 'error');
                console.error(e);
            }
        });

        $get('btn-new-lua-field').on('click', () => {
            try {
                const { card } = app;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;
    
                this.app.nameMode = 'new_field';
                this.app.$titleName.html('Create Lua Field');
                this.app.$inputName.val('');
                this.app.modalName.show();
            } catch (e) {
                app.toast.alert(`Failed to create Lua Field.`, 'error');
                console.error(e);
            }
        });

        $get('btn-new-lua-function').on('click', () => {
            try {
                const { card } = app;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;
    
                this.app.nameMode = 'new_function';
                this.app.$titleName.html('Create Lua Function');
                this.app.$inputName.val('');
                this.app.modalName.show();
            } catch(e) {
                app.toast.alert(`Failed to create Lua Function.`, 'error');
                console.error(e);
            }
        });

        $get('btn-new-lua-method').on('click', () => {
            try {
                const { card } = app;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;
    
                this.app.nameMode = 'new_method';
                this.app.$titleName.html('Create Lua Method');
                this.app.$inputName.val('');
                this.app.modalName.show();
            } catch(e) {
                app.toast.alert(`Failed to create Lua Method.`, 'error');
                console.error(e);

            }
        });

        $('#lua-wizard').on('click', () => {
            app.luaParser.parseFilePicker();
        });
    }
};

export type SidebarOptions = ComponentOptions & {};
