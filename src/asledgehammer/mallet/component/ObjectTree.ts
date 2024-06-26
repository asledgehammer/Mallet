import { App } from "../../../app";
import { RosettaJavaClass } from "../../rosetta/1.0/java/RosettaJavaClass";
import { RosettaLuaClass } from "../../rosetta/1.0/lua/RosettaLuaClass";
import { RosettaLuaTable } from "../../rosetta/1.0/lua/RosettaLuaTable";
import { $get } from "../../rosetta/1.0/util";
import { LuaCard } from "./lua/LuaCard";
import { LuaClassCard } from "./lua/LuaClassCard";
import { LuaTableCard } from "./lua/LuaTableCard";
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

    globalSelected = false;

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
        });

        // Apply jQuery listeners next.
        $doc.on('click', '.object-tree-lua-class', function () {
            _this.globalSelected = false;
            const name = this.id.substring('object-lua-class-'.length);
            _this.app.showLuaClass(_this.app.catalog.luaClasses[name]);
            $(`#btn-new-lua-value`).show();
            $(`#btn-new-lua-field`).show();
            $(`#btn-new-lua-function`).show();
            $(`#btn-new-lua-method`).show();
            $(`#btn-lua-class-dropdown`).show();
            $(`#save-object-dropdown`).css({ 'display': 'inline' });
        });

        $doc.on('click', '.object-tree-lua-table', function () {
            _this.globalSelected = false;
            const name = this.id.substring('object-lua-table-'.length);
            _this.app.showLuaTable(_this.app.catalog.luaTables[name]);
            $(`#btn-new-lua-value`).hide();
            $(`#btn-new-lua-field`).show();
            $(`#btn-new-lua-function`).show();
            $(`#btn-new-lua-method`).hide();
            $(`#btn-lua-class-dropdown`).show();
            $(`#save-object-dropdown`).css({ 'display': 'inline' });
        });

        $doc.on('click', '.object-tree-java-class', function () {
            _this.globalSelected = false;
            const name = this.id.substring('object-java-class-'.length);
            _this.app.showJavaClass(_this.app.catalog.javaClasses[name]);
            $(`#btn-lua-class-dropdown`).hide();
            $(`#save-object-dropdown`).css({ 'display': 'inline' });
        });

        $doc.on('click', '.object-tree-global', () => {
            this.globalSelected = true;
            this.sidebar.itemTree.selected = undefined;
            this.sidebar.itemTree.selectedID = undefined;
            $(`#btn-new-lua-value`).hide();
            $(`#btn-new-lua-field`).show();
            $(`#btn-new-lua-function`).show();
            $(`#btn-new-lua-method`).hide();
            $(`#btn-lua-class-dropdown`).show();
            this.app.hideCard();
            this.app.renderCode();
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

        const { selected } = this.app.catalog;
        if (!this.globalSelected) {
            if (selected instanceof RosettaLuaClass) {
                this.selectedID = `object-lua-class-${selected.name}`;
            } else if (selected instanceof RosettaLuaTable) {
                this.selectedID = `object-lua-table-${selected.name}`;
            } else if (selected instanceof RosettaJavaClass) {
                this.selectedID = `object-java-class-${selected.name}`;
            } else {
                this.selectedID = undefined;
            }
        }

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

        const itemGlobal = {
            id: 'object-global',
            text: wrapItem('Global'),
            icon: 'fa-solid fa-globe text-light mx-2 desaturate',
            class: ['object-tree-item', 'object-tree-global']
        };
        if (this.globalSelected) {
            itemGlobal.class.push('selected');
        }

        const data: any[] = [
            itemGlobal
        ];

        if (luaClasses.length) data.push(folderLuaClasses);
        if (luaTables.length) data.push(folderLuaTables);
        if (javaClasses.length) data.push(folderJavaClasses);

        // @ts-ignore
        $treeUpper.bstreeview({ data });

        // if(this.selectedID != null) {
        //     document.getElementById(this.selectedID)!.scrollIntoView(true);
        // }
    }
}