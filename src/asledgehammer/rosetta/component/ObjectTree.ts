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

    folderLuaClassOpen: boolean = true;
    folderLuaTableOpen: boolean = true;
    folderJavaClassOpen: boolean = true;

    listening: boolean = false;

    selected: string | undefined = undefined;
    selectedID: string | undefined = undefined;

    constructor(app: App, sidebar: Sidebar) {
        this.app = app;
        this.sidebar = sidebar;
    }

    listen() {

        if (this.listening) return;

        const $doc = $(document);
        const _this = this;

        $doc.on('click', '.object-tree-item', function () {
            const $this = $(this);
            $('.object-tree-item.selected').removeClass('selected');
            $this.addClass('selected');
            _this.selectedID = this.id;
            console.log(`Selected object: ${_this.selectedID}`);
        });

        // Apply jQuery listeners next.
        $doc.on('click', '.object-tree-lua-class', function () {
            const name = this.id.substring('object-lua-class-'.length);
            // Prevent wasteful selection code executions here.
            if (_this.selected === name) return;
            _this.app.showLuaClass(_this.app.active.luaClasses[name]);
            // Let the editor know we last selected the class.
            _this.selected = name;
            // Update the class properties tree.
            _this.sidebar.itemTree.selectedID = undefined;
            _this.sidebar.itemTree.populate();
        });

        $doc.on('click', '.object-tree-java-class', function () {
            const name = this.id.substring('object-java-class-'.length);
            // Prevent wasteful selection code executions here.
            if (_this.selected === name) return;
            _this.app.showJavaClass(_this.app.active.javaClasses[name]);
            // Let the editor know we last selected the class.
            _this.selected = name;
            // Update the class properties tree.
            _this.sidebar.itemTree.selectedID = undefined;
            _this.sidebar.itemTree.populate();
        });

        // Preserve the state of folders.
        $doc.on('click', '#' + this.idFolderLuaClass, () => {
            this.folderLuaClassOpen = !this.folderLuaClassOpen;
        });
        $doc.on('click', '#' + this.idFolderLuaTable, () => {
            this.folderLuaTableOpen = !this.folderLuaTableOpen;
        });
        $doc.on('click', '#' + this.idFolderJavaClass, () => {
            this.folderJavaClassOpen = !this.folderJavaClassOpen;
        });

        this.listening = true;
    }

    populate() {
        const _this = this;

        let $treeUpper = $get('tree-upper');
        $treeUpper.remove();

        const $sidebarContentUpper = $get('sidebar-content-upper');
        $sidebarContentUpper.append('<div id="tree-upper" class="rounded-0 bg-dark text-white"></div>');
        $treeUpper = $get('tree-upper');

        const luaClasses = [];
        for (const name of Object.keys(this.app.active.luaClasses)) {
            luaClasses.push(
                {
                    id: `object-lua-class-${name}`,
                    text: name,
                    icon: LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-lua-class'],
                }
            );
        }

        const luaTables = [];
        for (const name of Object.keys(this.app.active.luaTables)) {
            luaTables.push(
                {
                    id: `object-lua-table-${name}`,
                    text: name,
                    icon: LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-lua-table'],
                }
            );
        }

        const javaClasses = [];
        for (const name of Object.keys(this.app.active.javaClasses)) {
            javaClasses.push(
                {
                    id: `object-java-class-${name}`,
                    text: name,
                    icon: LuaCard.getTypeIcon('class'),
                    class: ['object-tree-item', 'object-tree-java-class'],
                }
            );
        }

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
                    nodes: luaTables
                },
                {
                    text: "Java Classes",
                    icon: "fa-solid fa-folder text-light mx-2",
                    class: ['item-tree-folder', 'bg-secondary'],
                    id: _this.idFolderJavaClass,
                    expanded: _this.folderJavaClassOpen,
                    nodes: javaClasses
                },
            ]
        });

    }
}