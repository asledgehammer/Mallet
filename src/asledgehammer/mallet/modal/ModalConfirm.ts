import { App } from "../../../app";
import { $get } from "../../rosetta/util";

export class ModalConfirm {

    readonly app: App;

    // This modal is for confirming actions.
    readonly modalConfirm: any;
    readonly $btnConfirm: JQuery<HTMLButtonElement> | undefined;
    readonly $titleConfirm: JQuery<HTMLHeadingElement>;
    readonly $bodyConfirm: JQuery<HTMLHeadingElement>;

    confirmSuccess: (() => void) | undefined;

    constructor(app: App) {
        this.app = app;

        // @ts-ignore This modal is for confirming actions.
        this.modalConfirm = new bootstrap.Modal('#modal-confirm', {});
        this.$titleConfirm = $get('title-confirm')!;
        this.$bodyConfirm = $get('body-confirm')!;
        this.$btnConfirm = $get('btn-confirm')!;
        this.confirmSuccess = undefined;
    }

    listen() {
        this.$btnConfirm!.on('click', () => {
            this.hide();
            if (this.confirmSuccess) {
                this.confirmSuccess();
                this.confirmSuccess = undefined;
            }
        });
    }

    show(onSuccess: () => void, title: string = 'Confirm', body: string = 'Are you sure?') {
        this.$titleConfirm.html(title);
        this.$bodyConfirm.html(body);
        this.confirmSuccess = onSuccess;
        this.modalConfirm.show();
    }

    hide() {
        this.modalConfirm.hide();
    }
}
