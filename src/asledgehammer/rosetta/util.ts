export const html = function (c: any, ...d: any) {
    let a = '';
    for (let b = 0; b < c.length - 1; b++) a += c[b] + d[b];
    return a + c[c.length - 1];
};

export const css = function (c: any, ...d: any) {
    let a = '';
    for (let b = 0; b < c.length - 1; b++) a += c[b] + d[b];
    return a + c[c.length - 1];
};

const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const randomString = (length: number): string => {
    if (length < 0) {
        throw new Error(`Length cannot be negative. (Given: ${length})`);
    } else if (length === 0) {
        return '';
    }

    let built = '';
    for (let index = 0; index < length; index++) {
        built += alphanumeric[Math.round(Math.random() * (alphanumeric.length - 1))];
    }

    return built;
};

export function combineArrays(options: CombineOptions, ...args: any[]): Array<any> {
    let a = [];
    for (let index = 0; index < args.length; index++) {
        for (const b of args[index]) {
            /* (Array Duplicate Policy Check) */
            if (a.indexOf(b) !== -1 && !options.allowArrayDuplicates) continue;

            a.push(b);
        }
    }
    return a;
}

export function combine<T extends any>(options: CombineOptions, ...args: any[]): T {
    let obj: any = {};

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (!arg) continue;
        const keys = Object.keys(arg);

        for (const key of keys) {
            const value = (arg as any)[key];

            if (!obj[key]) {
                obj[key] = value;
                continue;
            }

            if (Array.isArray(obj[key])) {
                obj[key] = combineArrays(options, [obj[key], value]);
            } else if (typeof obj[key] === 'object') {
                obj[key] = combine(options, [obj[key], value]);
            } else {
                obj[key] = value;
            }
        }
    }

    return obj;
}

export const validateLuaVariableName = (nameOriginal: string): string => {
    nameOriginal = nameOriginal.trim();
    let name = '';
    for (const c of nameOriginal) {
        if (name === '') {
            if (c === ' ') continue; // No leading spaces.
            else if (/[0-9]/.test(c)) continue; // No leading numbers.
        }
        if (!/'^(%a+_%a+)$'/.test(c)) name += c; // Only valid lua characters.
    }
    return name;
};

export type CombineOptions = {
    allowArrayDuplicates: boolean;
};

export function $get(id: string): JQuery<any> {
    return $(`#${id}`);
};

export function get(id: string): HTMLElement | null {
    return document.getElementById(id);
}
