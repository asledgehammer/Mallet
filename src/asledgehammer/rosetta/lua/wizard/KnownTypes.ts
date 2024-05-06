import { ScopeKnownFunction, ScopeKnownValue, stripCallParameters } from "./LuaWizard";
import { Scope } from "./Scope";

export const knownTypes: { [path: string]: string } = {

    'print()': 'void',
    'tostring()': 'string',
    'setmetatable()': 'table',

    'math.min()': 'number',
    'math.max()': 'number',
    'math.floor()': 'number',
    'math.ceil()': 'number',
    'math.round()': 'number',

    /* PZ Java API */
    // 'getCore()': 'Core',
    // 'getCore().getScreenWidth()': 'number',
    // 'getCore().getScreenHeight()': 'number',
    // 'getNumActivePlayers()': 'number',
    // 'getPlayerScreenLeft()': 'number',
    // 'getPlayerScreenTop()': 'number',
    // 'getPlayerScreenWidth()': 'number',
    // 'getPlayerScreenHeight()': 'number',
};

export function getKnownType(known: string): string | undefined {
    if (!known.length) return undefined;
    return knownTypes[stripCallParameters(known)];
}

export let isInitKnownTypes = false;
export function initKnownTypes(global: Scope): void {
    console.log('init known types');
    if (isInitKnownTypes) return;

    const javaAPI = (window as any).known_types as { [path: string]: string };

    const func = (types: { [path: string]: string }) => {
        console.log(`known types count: ${Object.keys(types).length}`);
        for (let key of Object.keys(types)) {

            const val = types[key];

            if (key.indexOf(':') !== -1) {
                while (key.indexOf(':') !== -1) key = key.replace(':', '.');
            }

            if (key.indexOf('.') !== -1) {
                const split: string[] = key.split('.');
                let scopeCurr = global;

                for (let next of split) {

                    let type = 'ScopeKnownValue';
                    if (next.endsWith('()')) {
                        type = 'ScopeKnownFunction';
                        next = next.substring(0, next.length - 2);
                    }

                    let scopeNext = scopeCurr.resolve(next);

                    // Only create a new scope if one doesn't exist yet for the next known type scope.
                    if (!scopeNext) {
                        const knownType: ScopeKnownFunction | ScopeKnownValue = {
                            type: type as any,
                            name: next,
                            knownType: val
                        };
                        scopeNext = new Scope(knownType, scopeCurr);
                        scopeNext.types.push(val);
                    }
                    scopeCurr = scopeNext;
                }
            } else {
                let next = key;
                let type = 'ScopeKnownValue';
                if (next.endsWith('()')) {
                    type = 'ScopeKnownFunction';
                    next = next.substring(0, next.length - 2);
                }

                let scopeNext = global.resolve(next);

                // Only create a new scope if one doesn't exist yet for the next known type scope.
                if (!scopeNext) {
                    const knownType: ScopeKnownFunction | ScopeKnownValue = {
                        type: type as any,
                        name: next,
                        knownType: val
                    }
                    scopeNext = new Scope(knownType, global);
                    scopeNext.types.push(val);
                }
            }
        }
    };

    func(knownTypes);
    func(javaAPI);

    isInitKnownTypes = true;
}