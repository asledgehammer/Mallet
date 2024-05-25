import { App } from "../../../app";
import { LuaCard } from "./lua/LuaCard";
import { $get } from "../util";
import { Sidebar } from "./Sidebar";

const CLASS_HEADER = 'obj-tree';

export class ObjectTree {

    readonly app: App;
    readonly sidebar: Sidebar;
    readonly idFolderLuaClass = `${CLASS_HEADER}-folder-lua-class`;
    readonly idFolderLuaTable = `${CLASS_HEADER}-folder-value`;
    readonly idFolderJavaClass = `${CLASS_HEADER}-folder-function`;

    folderLuaClassOpen: boolean = false;
    folderLuaTableOpen: boolean = false;
    folderJavaClassOpen: boolean = false;

    constructor(app: App, sidebar: Sidebar) {
        this.app = app;
        this.sidebar = sidebar;
    }

    populate() {
        const _this = this;

        const { selectedCard: luaClass } = this.app.active;
        if (!luaClass) return;
        const entity = luaClass.options!.entity!;
        if (!entity) return;

        let $treeUpper = $get('tree-upper');
        $treeUpper.remove();

        const $sidebarContentUpper = $get('sidebar-content-upper');
        $sidebarContentUpper.append('<div id="tree-upper" class="rounded-0 bg-dark text-white"></div>');
        $treeUpper = $get('tree-upper');

        const luaClasses = [
            {
                id: `object-lua-class-${entity.name}`,
                text: entity.name,
                icon: LuaCard.getTypeIcon('class'),
                class: ['item-tree-item', 'object-tree-lua-class'],
            }
        ];

        // @ts-ignore
        $treeUpper.bstreeview({
            data: [
                {
                    text: "Lua Classes",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaClass,
                    expanded: _this.folderLuaClassOpen,
                    nodes: luaClasses
                },
                {
                    text: "Lua Tables",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderLuaTable,
                    expanded: _this.folderLuaTableOpen,
                    nodes: []
                },
                {
                    text: "Java Classes",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderJavaClass,
                    expanded: _this.folderJavaClassOpen,
                    nodes: []
                },
            ]
        });

        // Apply jQuery listeners next.
        $('.object-tree-lua-class').on('click', function () {
            // Prevent wasteful selection code executions here.
            if (_this.app.selected === 'class') return;
            _this.app.showClass(entity);
            // Let the editor know we last selected the class.
            _this.app.selected = 'class';
        });

        // Preserve the state of folders.
        $get(this.idFolderLuaClass).on('click', () => this.folderLuaClassOpen = !this.folderLuaClassOpen);
        $get(this.idFolderLuaTable).on('click', () => this.folderLuaTableOpen = !this.folderLuaTableOpen);
        $get(this.idFolderJavaClass).on('click', () => this.folderJavaClassOpen = !this.folderJavaClassOpen);
    }
}