import { ScopeGlobal } from './LuaWizard';

/** @returns ScopeGlobal */
function createGlobal(): ScopeGlobal {
    return {
        scope: { name: '__G', raw: '__G', valueType: 'table' },
        type: 'ScopeGlobal',
        map: {},
        values: {},
        funcs: {},
        tables: {},
        classes: {}
    };
}
