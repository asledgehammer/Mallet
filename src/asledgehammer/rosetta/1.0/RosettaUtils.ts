
export const RESERVED_FUNCTION_NAMES = ['toString', 'valueOf'];
export const RESERVED_WORDS = [
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while',

  // NOTE: This is a technical issue involving YAML interpreting
  //       this as a BOOLEAN not a STRING value.
  'on',
  'off',
  'yes',
  'no',
];

export const formatName = (name: string): string => {
  for (const reservedWord of RESERVED_WORDS) {
    if (name.toLowerCase() === reservedWord) return '__' + name + '__';
  }
  for (const reservedFunctionName of RESERVED_FUNCTION_NAMES) {
    if (name === reservedFunctionName) return '__' + name + '__';
  }
  return name;
};

export const isEmptyObject = (object: any): boolean => {
  return object === undefined || Object.keys(object).length <= 0;
};
