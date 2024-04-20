import { App } from '../../../app';
import { $get, html } from '../util';
import { Component, ComponentOptions } from './Component';
import { LuaCard } from './LuaCard';
import { LuaFunctionCard } from './LuaFunctionCard';
import { SidebarPanel } from './SidebarPanel';
import { SidebarPanelButton } from './SidebarPanelButton';

export class Sidebar extends Component<SidebarOptions> {

    private readonly panel: SidebarPanel;

    private readonly app: App;

    constructor(app: App) {
        super({
            classes: ['vs-bg-6', 'shadow-lg', 'border', 'border-1'],
            style: {
                'border-color': 'var(--vscode-color-2) !important',
                width: '100%',
                height: '100%',
            },
        });

        this.app = app;

        const buttons: SidebarPanelButton[] = [];

        const result = document.getElementById('result')! as any;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            console.log('load!');
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
                        app.sidebar.populateItemTree();

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
    }

    protected onRender(): string {
        return html`

            <div class="bg-dark p-1 border-bottom border-bottom-1 border-info shadow">

                <!-- New Class -->
                <button class="btn btn-sm btn-success rounded-0 me-1" style="width: 32px; height: 32px" title="New Class">
                    <i class="fa fa-file" style="position: relative; top: -1px"></i>
                </button>
                
                <!-- Open Class -->
                <button class="btn btn-sm btn-primary rounded-0" style="width: 32px; height: 32px" title="Open Class">
                    <i class="fa-solid fa-folder-open" style="position: relative; top: -1px"></i>
                </button>

                <!-- Save Class -->
                <button class="btn btn-sm btn-primary rounded-0 me-1" style="width: 32px; height: 32px" title="Save Class">
                    <i class="fa fa-save" style="position: relative; top: -1px"></i>
                </button>
                
                <!-- New Field -->
                <button class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Field">
                    <i class="fa-solid fa-hashtag" style="position: relative; top: -1px"></i>
                </button>

                <!-- New Method -->
                <button class="btn btn-sm btn-info rounded-0" style="width: 32px; height: 32px" title="New Method">
                    <i class="fa-solid fa-terminal" style="position: relative; top: -1px"></i>
                </button>

            </div>

            <div class="bg-dark" style="height: 100%; overflow-y: auto;">${this.panel.render()}
                <div id="sidebar-content" style="position: absolute; bottom: 0; left: calc(-2.5rem + 2px); width: calc(100% + 2.5rem - 3px); height: calc(100% - 44px); overflow-y: auto;">
                    <div id="tree" class="rounded-0 bg-dark text-white"></div>
                </div>
            </div>

            <!-- Fancy border to sit above everything -->
            <div class="border border-1 border-primary" style="pointer-events: none; position: absolute; background-color: transparent; top: 0; left: 0; width: 100%; height: 100%;"></div>
        `;
    }

    populateItemTree() {

        const listenTree = () => {
            const { card: luaClass } = this.app;
            if (!luaClass) return;

            const entity = luaClass.options!.entity!;
            if (!entity) return;

            const fieldNames = Object.keys(entity.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            for (const fieldName of Object.keys(entity.fields)) {
                const field = entity.fields[fieldName];
                const id = `lua-class-${entity.name}-field-${field.name}`;

                const $fieldNode = $get(id);
                $fieldNode.on('click', () => {
                    console.log(`Clicked ${id}!`);
                });
            }

            let lastSelected: string | null = null;
            const _this = this;

            $('.lua-field-item').on('click', function () {

                const fieldName = this.id.split('field-')[1].trim();

                // Prevent wasteful selection code executions here.
                if (lastSelected === fieldName) return;

                const field = entity.fields[fieldName];
                if (!field) return;

                _this.app.showField(field);

                // Let the editor know we last selected the field.
                lastSelected = fieldName;
            });

            $('.lua-method-item').on('click', function () {

                const methodName = this.id.split('method-')[1].trim();

                // Prevent wasteful selection code executions here.
                if (lastSelected === methodName) return;

                const method = entity.methods[methodName];
                if (!method) return;

                _this.app.showMethod(method);

                // Let the editor know we last selected the method.
                lastSelected = methodName;
            });
        };

        const getTree = () => {
            const { card: luaClass } = this.app;
            if (!luaClass) return [];

            const entity = luaClass.options!.entity!;
            if (!entity) return [];

            const fieldNames = Object.keys(entity.fields);
            fieldNames.sort((a, b) => a.localeCompare(b));
            const fields = [];
            for (const fieldName of Object.keys(entity.fields)) {
                const field = entity.fields[fieldName];
                const id = `lua-class-${entity.name}-field-${field.name}`;
                fields.push({
                    text: field.name,
                    icon: LuaCard.getTypeIcon(field.type),
                    id,
                    class: ['lua-field-item']
                });
            }

            const methodNames = Object.keys(entity.methods);
            methodNames.sort((a, b) => a.localeCompare(b));
            const methods = [];
            for (const methodName of Object.keys(entity.methods)) {
                const method = entity.methods[methodName];
                const id = `lua-class-${entity.name}-method-${method.name}`;
                methods.push({
                    text: html`<i class="fa-solid fa-xmark me-2" title="${method.returns.type}"></i>${method.name}`,
                    icon: 'fa-solid fa-terminal text-success mx-2',
                    id,
                    class: ['lua-method-item'],
                    title: 'ee'
                });
            }

            // Some logic to retrieve, or generate tree structure
            return [
                {
                    text: "Class Properties",
                    icon: LuaCard.getTypeIcon('class'),
                },
                {
                    text: "Constructor",
                    icon: LuaCard.getTypeIcon('constructor'),
                },
                {
                    text: "Fields",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['bg-secondary'],
                    // expanded: true,
                    nodes: fields
                },
                {
                    text: "Methods",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['bg-secondary'],
                    // expanded: true,
                    nodes: methods
                },
            ];
        }

        let $tree = $get('tree');
        $tree.remove();

        $get('sidebar-content').append('<div id="tree" class="rounded-0 bg-dark text-white"></div>');
        $tree = $get('tree');

        const data = getTree();
        console.log({ data });

        // @ts-ignore
        $tree.bstreeview({ data });

        listenTree();

    }

    listen(): void {
        this.panel.listen();
        this.populateItemTree();
    }



};

export type SidebarOptions = ComponentOptions & {};
