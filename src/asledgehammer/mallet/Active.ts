import { App } from "../../app";
import { RosettaJavaClass } from "../rosetta/java/RosettaJavaClass";
import { RosettaLuaClass } from "../rosetta/lua/RosettaLuaClass";
import { RosettaLuaTable } from "../rosetta/lua/RosettaLuaTable";
import { JavaClassCard } from "./component/java/JavaClassCard";
import { LuaClassCard } from "./component/lua/LuaClassCard";

export class Catalog {

    readonly app: App;

    readonly luaClasses: { [name: string]: RosettaLuaClass } = {};
    readonly luaTables: { [name: string]: RosettaLuaTable } = {};
    readonly javaClasses: { [name: string]: RosettaJavaClass } = {};

    selected: RosettaLuaClass | RosettaLuaTable | RosettaJavaClass | undefined = undefined;
    selectedCard: LuaClassCard | JavaClassCard | undefined = undefined;

    constructor(app: App) {
        this.app = app;
    }

    reset() {

        // Wipe all content from the dictionaries.
        for (const name of Object.keys(this.luaClasses)) {
            delete this.luaClasses[name];
        }
        for (const name of Object.keys(this.luaTables)) {
            delete this.luaTables[name];
        }
        for (const name of Object.keys(this.javaClasses)) {
            delete this.javaClasses[name];
        }

        // Wipe active selections.
        this.selected = undefined;
        this.selectedCard = undefined;

        // Clear the screen container.
        this.app.$screenContent.empty();
    }
}
