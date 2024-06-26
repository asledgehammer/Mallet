import { App } from "../../../app";
import { $get } from "../../rosetta/1.0/util";

export class Toast {

    readonly app: App;
    readonly toastSimple: any;
    readonly idSimpleBody = 'toast-simple-body';
    readonly idToastSimple = 'toast-simple';

    constructor(app: App) {
        this.app = app;

        // @ts-ignore
        this.toastSimple = new bootstrap.Toast(document.getElementById('toast-simple')!, {});
    }

    alert(text: string, color: 'success' | 'info' | 'error' | undefined = undefined) {
        const { idSimpleBody, idToastSimple } = this;

        const $toast = $get(idToastSimple);

        // Set the background color.
        $toast.removeClass('bg-success');
        $toast.removeClass('bg-danger');
        $toast.removeClass('bg-info');
        if (color === 'success') $toast.addClass('bg-success');
        else if (color === 'error') $toast.addClass('bg-danger');
        else if (color === 'info') $toast.addClass('bg-info');

        // Set the text content.
        document.getElementById(idSimpleBody)!.innerHTML = text;

        // Show the toast to the user.
        this.toastSimple.show();
    }
}
