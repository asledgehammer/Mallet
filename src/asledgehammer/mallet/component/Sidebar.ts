import { App } from '../../../app';
import { generateJavaClass } from '../../rosetta/java/JavaLuaGenerator2';
import { RosettaJavaClass } from '../../rosetta/java/RosettaJavaClass';
import { generateLuaClass, generateLuaTable } from '../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaClass } from '../../rosetta/lua/RosettaLuaClass';
import { RosettaLuaTable } from '../../rosetta/lua/RosettaLuaTable';
import { html } from '../../rosetta/util';
import { Component, ComponentOptions } from './Component';
import { ItemTree } from './ItemTree';
import { ObjectTree } from './ObjectTree';

export class Sidebar extends Component<SidebarOptions> {

    private readonly app: App;
    readonly itemTree: ItemTree;
    readonly objTree: ObjectTree;

    listening: boolean = false;

    readonly idLuaClassDropdown = 'btn-lua-class-dropdown';

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

        this.objTree = new ObjectTree(app, this);
        this.itemTree = new ItemTree(app, this);
    }

    protected onRender(): string {
        return html`
        <div class="bg-dark" style="position: relative; top: 0; left: 0; width: 100%; height: 100%;">
            <div style="position: relative; top: 0; left: 0; width: 100%; height: 30%;">
                <div class="p-1 border-bottom border-bottom-2 border-black shadow">
                    
                    <!-- New dropdown -->
                    <div id="new-dropdown" class="dropdown" style="display: inline;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Create a new object.">
                        <div class="btn-pane">     
                            <i class="fa fa-file"></i>
                        </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-new-lua-class" class="dropdown-item" href="#">Lua Class</a></li>
                            <li><a id="btn-new-lua-table" class="dropdown-item" href="#">Lua Table</a></li>
                        </ul>
                    </div>

                    <!-- Open -->
                    <button id="open-lua-class" class="btn btn-sm responsive-btn responsive-btn-info" title="Open JSON File">
                        <div class="btn-pane">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                    </button>

                    <!-- Save dropdown -->
                    <div id="save-file-dropdown" class="dropdown" style="display: inline;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Save Catalog">
                        <div class="btn-pane">     
                        <i class="fa fa-save"></i>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-save-json" class="dropdown-item" href="#">JSON Catalog</a></li>
                            <li><a id="btn-save-json-compressed" class="dropdown-item" href="#">JSON Catalog (Compressed)</a></li>
                            <li><a id="btn-save-lua" class="dropdown-item" href="#">Lua Typings</a></li>
                            <li><a id="btn-save-typescript" class="dropdown-item" href="#">TypeScript Declarations</a></li>
                        </ul>
                    </div>

                </div>

                <div class="bg-dark" style="height: 100%; overflow-y: auto;">
                    <div id="sidebar-content-upper" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                        <div id="tree-upper" class="rounded-0 bg-dark text-white"></div>
                    </div>
                </div>
            </div>
            <div style="position: absolute; top: 30%; left: 0; width: 100%; height: 70%;">
                <div 
                    class="p-1 border-top border-top-2 border-bottom border-bottom-2 border-black shadow"
                    style="height: 41px;">
                    
                    
                    <!-- Save dropdown -->
                    <div id="save-object-dropdown" class="dropdown" style="display: none;">
                        <button class="btn btn-sm responsive-btn responsive-btn-success" style="width: 32px; height: 32px" data-bs-toggle="dropdown" aria-expanded="false" title="Save Object">
                        <div class="btn-pane">     
                            <i class="fa fa-save"></i>
                        </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a id="btn-save-object-json" class="dropdown-item" href="#">JSON Object</a></li>
                            <li><a id="btn-save-object-json-compressed" class="dropdown-item" href="#">JSON Object (Compressed)</a></li>
                            <li><a id="btn-save-object-lua" class="dropdown-item" href="#">Lua Typings</a></li>
                            <li><a id="btn-save-object-typescript" class="dropdown-item" href="#">TypeScript Declarations</a></li>
                        </ul>
                    </div>
                    
                    <!-- New Properties -->
                    <div id="${this.idLuaClassDropdown}" class="dropdown" style="position: absolute; top: 5px; right: 5px; display: none">
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
                    <div id="sidebar-content-lower" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                        <div id="tree-lower" class="rounded-0 bg-dark text-white"></div>
                    </div>
                </div>

            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-black" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        </div>
        `;
    }

    listen(): void {

        if (this.listening) return;

        this.objTree.listen();
        this.itemTree.listen();
        this.populateTrees();

        const { app } = this;
        const _this = this;
        const $doc = $(document);
        const { $titleName, $btnName, $inputName, modalName } = app.modalName;

        $doc.on('click', '#btn-new-lua-class', () => {
            try {
                $titleName.html('New Lua Class');
                $btnName.html('Create');
                $btnName.removeClass('btn-primary');
                $btnName.addClass('btn-success');
                $inputName.val('');
                app.modalName.nameMode = 'new_lua_class';
                app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create LuaClass.`, 'error');
                console.error(e);
            }
        });


        $doc.on('click', '#btn-new-lua-table', () => {
            try {
                $titleName.html('New Lua Table');
                $btnName.html('Create');
                $btnName.removeClass('btn-primary');
                $btnName.addClass('btn-success');
                $inputName.val('');
                app.modalName.nameMode = 'new_lua_table';
                app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create LuaTable.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#open-lua-class', () => {
            const dFileLoad = document.getElementById('load-file') as any;
            const onchange = () => {
                try {
                    const file = dFileLoad.files[0];
                    const textType = 'application/json';
                    if (file.type.match(textType)) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            const json = JSON.parse(reader.result as string);
                            app.catalog.fromJSON(json);
                            app.renderCode();
                            _this.populateTrees();
                        }
                        reader.readAsText(file);
                    }
                    app.toast.alert(`Loaded JSON file.`, 'success');
                } catch (e) {
                    if (e instanceof DOMException) {
                        console.warn(e.name);
                    }
                    app.toast.alert(`Failed to load JSON file.`, 'error');
                    console.error(e);
                }
            };
            dFileLoad.onchange = onchange;
            dFileLoad.click();
        });

        $doc.on('click', '#btn-save-lua', async () => {
            try {
                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-lua',
                    types: [
                        {
                            description: "Lua file",
                            accept: { "text/x-lua": [".lua"] },
                        },
                    ],
                });
                const { catalog } = this.app;
                const lua = catalog.toLuaTypings();

                const writable = await result.createWritable();
                await writable.write(lua);
                await writable.close();

                app.toast.alert(`Saved Lua typings file.`, 'info');
            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save Lua typings.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-save-object-lua', async () => {
            try {
                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-lua',
                    types: [
                        {
                            description: "Lua file",
                            accept: { "text/x-lua": [".lua"] },
                        },
                    ],
                });
                const { selected } = this.app.catalog;
                let lua = '--- @meta\n\n';
                if (selected instanceof RosettaLuaClass) {
                    lua += generateLuaClass(selected);
                } else if (selected instanceof RosettaLuaTable) {
                    lua += generateLuaTable(selected);
                } else if (selected instanceof RosettaJavaClass) {
                    lua += generateJavaClass(selected);
                }

                const writable = await result.createWritable();
                await writable.write(lua);
                await writable.close();

                app.toast.alert(`Saved Lua typings file.`, 'info');
            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save Lua typings.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-save-typescript', async () => {
            try {
                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-typescript',
                    types: [
                        {
                            description: "TypeScript Declarations file",
                            accept: { "application/typescript": [".d.ts"] },
                        },
                    ],
                });
                const { catalog } = this.app;
                const lua = catalog.toTypeScript();

                const writable = await result.createWritable();
                await writable.write(lua);
                await writable.close();

                app.toast.alert(`Saved Lua typings file.`, 'info');
            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save Lua typings.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-save-object-lua', async () => {
            try {

                if (!this.app.catalog.selected) {
                    return;
                }

                const { selected } = this.app.catalog;

                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-lua',
                    types: [
                        {
                            description: "Lua file",
                            accept: { "text/x-lua": [".lua"] },
                            suggestedName: `${selected.name}.lua`,
                        },
                    ],
                });
                const { catalog } = this.app;
                const lua = catalog.toLuaTypings();

                const writable = await result.createWritable();
                await writable.write(lua);
                await writable.close();

                app.toast.alert(`Saved Lua typings file.`, 'info');
            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save Lua typings.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-save-json', async () => {
            try {
                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-json',
                    types: [
                        {
                            description: "JSON file",
                            accept: { "application/json": [".json"] },
                        }
                    ],
                });
                const { catalog } = this.app;
                const json = catalog.toJSON();

                const writable = await result.createWritable();
                await writable.write(JSON.stringify(json, null, 2));
                await writable.close();

                app.toast.alert(`Saved JSON file.`, 'info');

            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save JSON file.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-save-json-compressed', async () => {
            try {
                // @ts-ignore
                const result = await showSaveFilePicker({
                    id: 'mallet-save-json',
                    types: [
                        {
                            description: "JSON file",
                            accept: { "application/json": [".json"] },
                        }
                    ],
                });
                const { catalog } = this.app;
                const json = catalog.toJSON();

                const writable = await result.createWritable();
                await writable.write(JSON.stringify(json));
                await writable.close();

                app.toast.alert(`Saved JSON file.`, 'info');

            } catch (e) {
                /* (Ignore aborted dialogs) */
                if (e instanceof DOMException && e.name === 'AbortError') return;
                app.toast.alert(`Failed to save JSON file.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-new-lua-value', () => {
            try {
                const { selectedCard: card } = app.catalog;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;

                this.app.modalName.nameMode = 'new_value';
                $titleName.html('Create Lua Value');
                $inputName.val('');
                $btnName.val('Create');
                this.app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create Lua Value.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-new-lua-field', () => {
            try {
                const { selectedCard: card } = app.catalog;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;

                this.app.modalName.nameMode = 'new_field';
                $titleName.html('Create Lua Field');
                $inputName.val('');
                $btnName.val('Create');
                this.app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create Lua Field.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-new-lua-function', () => {
            try {
                const { selectedCard: card } = app.catalog;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;

                this.app.modalName.nameMode = 'new_function';
                $titleName.html('Create Lua Function');
                $inputName.val('');
                $btnName.val('Create');
                this.app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create Lua Function.`, 'error');
                console.error(e);
            }
        });

        $doc.on('click', '#btn-new-lua-method', () => {
            try {
                const { selectedCard: card } = app.catalog;
                if (!card) return;
                const clazz = card.options!.entity;
                if (!clazz) return;

                this.app.modalName.nameMode = 'new_method';
                $titleName.html('Create Lua Method');
                $inputName.val('');
                $btnName.val('Create');
                this.app.modalName.show(true);
            } catch (e) {
                app.toast.alert(`Failed to create Lua Method.`, 'error');
                console.error(e);
            }
        });

        this.listening = true;
    }

    populateTrees() {
        this.objTree.populate();
        this.itemTree.populate();
    }
};

export type SidebarOptions = ComponentOptions & {};
