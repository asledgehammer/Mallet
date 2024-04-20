import { App } from "../../../app";
import { $get, html } from "../util";
import { LuaCard, LuaCardOptions } from "./LuaCard";

export abstract class LuaNotedCard<O extends LuaCardOptions> extends LuaCard<O> {

    idNotes: string;

    constructor(app: App, options: O) {
        super(app, options);
        this.idNotes = `${this.id}-notes`;
    }

    listenNotes(entity: { notes: string | undefined}): void {
        const $description = $get(this.idNotes);
        $description.on('input', () => {
            entity.notes = $description.val();
            this.app.renderCode();
        });
    }

    renderNotes(notes: string | undefined): string {
        if (!notes) notes = '';
        return html`
            <div class="mb-4">
                <label for="${this.idNotes}" class="form-label">Description</label>
                <textarea id="${this.idNotes}" class="form-control rounded-0" spellcheck="false">${notes}</textarea>
            </div>
        `;
    }
}
