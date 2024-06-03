import { App } from "../../../app";
import { $get } from "../../rosetta/util";
import { LuaCard } from "./lua/LuaCard";
import { Sidebar } from "./Sidebar";

const CLASS_HEADER = 'obj-tree';

function wrapFolderCount(count: number): string {
    return `<strong class="font-monospace text-white">(${count})</strong>`;
}

function wrapItem(text: string): string {
    return `<span class="font-monospace">${text}</span>`;
}

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
            // console.log(`Selected object: ${_this.selectedID}`);
        });

        // Apply jQuery listeners next.
        $doc.on('click', '.object-tree-lua-class', function () {
            const name = this.id.substring('object-lua-class-'.length);
            _this.app.showLuaClass(_this.app.catalog.luaClasses[name]);
            // Update the class properties tree.
            const { itemTree } = _this.sidebar;
            itemTree.selected = undefined;
            itemTree.selectedID = undefined;
            itemTree.populate();
            $(`#${_this.sidebar.idLuaClassDropdown}`).show();
        });

        $doc.on('click', '.object-tree-java-class', function () {
            const name = this.id.substring('object-java-class-'.length);
            _this.app.showJavaClass(_this.app.catalog.javaClasses[name]);
            // Update the class properties tree.
            const { itemTree } = _this.sidebar;
            itemTree.selected = undefined;
            itemTree.selectedID = undefined;
            itemTree.populate();
            $(`#${_this.sidebar.idLuaClassDropdown}`).hide();
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
        for (const name of Object.keys(this.app.catalog.luaClasses)) {
            const id = `object-lua-class-${name}`;
            const classes: string[] = ['object-tree-item', 'object-tree-lua-class'];
            if (this.selectedID === id) classes.push('selected');
            luaClasses.push(
                {
                    id,
                    text: wrapItem(name),
                    icon: LuaCard.getTypeIcon('class'),
                    class: classes
                }
            );
        }

        const luaTables = [];
        for (const name of Object.keys(this.app.catalog.luaTables)) {
            const id = `object-lua-table-${name}`;
            const classes: string[] = ['object-tree-item', 'object-tree-lua-table'];
            if (this.selectedID === id) classes.push('selected');
            luaTables.push(
                {
                    id,
                    text: wrapItem(name),
                    icon: LuaCard.getTypeIcon('class'),
                    class: classes,
                }
            );
        }

        const javaClasses = [];
        for (const name of Object.keys(this.app.catalog.javaClasses)) {
            const id = `object-java-class-${name}`;
            const classes: string[] = ['object-tree-item', 'object-tree-java-class'];
            if (this.selectedID === id) classes.push('selected');
            javaClasses.push(
                {
                    id,
                    text: wrapItem(name),
                    icon: LuaCard.getTypeIcon('class'),
                    class: classes,
                }
            );
        }

        const folderLuaClasses = {
            text: `${wrapFolderCount(luaClasses.length)} Lua Classes`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaClass,
            expanded: _this.folderLuaClassOpen,
            nodes: luaClasses
        };

        const folderLuaTables = {
            text: `${wrapFolderCount(luaTables.length)} Lua Tables`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderLuaTable,
            expanded: _this.folderLuaTableOpen,
            nodes: luaTables
        };

        const folderJavaClasses = {
            text: `${wrapFolderCount(javaClasses.length)} Java Classes`,
            icon: "fa-solid fa-folder text-light mx-2",
            class: ['item-tree-folder', 'bg-secondary'],
            id: _this.idFolderJavaClass,
            expanded: _this.folderJavaClassOpen,
            nodes: javaClasses
        };

        const data: any[] = [];

        if (luaClasses.length) data.push(folderLuaClasses);
        if (luaTables.length) data.push(folderLuaTables);
        if (javaClasses.length) data.push(folderJavaClasses);

        // @ts-ignore
        $treeUpper.bstreeview({ data });
    }
}