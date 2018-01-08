// Functions to convert string gameIDs (game codes) to numbers.
// And vice versa.
// @flow

const ASCII_A = 65;
const ASCII_Z = 90;
const NUM_VALS = ASCII_Z - ASCII_A + 1;
const MAX_CODE_LEN = 6;
const IDEAL_CODE_LEN = 4;

/**
 * Convert the game code (base 26) to an ID number.
 * Characters A-Z have values 0-25.
 * The right-most character is the least significant.
 * Game codes are case insensitive.
 */
export const gameCodeToID = (
  code: string,
): number => {
  code = code.toUpperCase();
  let ID = 0;

  for (let i = 0; i < code.length; ++i) {
    const ascii = code.charCodeAt(code.length - i - 1);

    if (ascii >= ASCII_A && ascii <= ASCII_Z) {

      ID += (ascii - ASCII_A) * (NUM_VALS ** i);

    } else {

      throw Error('Invalid game code');

    }
  }

  return ID;
};

/**
 * Get the game code from the ID.
 * Leading zeroes (A's) are not shown except for if the code is 'A'.
 */
export const IDToGameCode = (
  IDNumber: number,
): string => {
  if (IDNumber >= NUM_VALS ** MAX_CODE_LEN || IDNumber < 0) {
    throw Error(`Invalid game ID number ${IDNumber}`);
  }

  let code = '';
  for (let i = MAX_CODE_LEN - 1; i >= 0; --i) {
    const pow = NUM_VALS ** i;
    const val = Math.floor(IDNumber / pow);

    if (val > 0 || code != '') {
      code += String.fromCharCode(val + ASCII_A);
      IDNumber %= pow;
    }
  }

  if (code == '') {
    code = 'A';
  }

  return code;
}


/**
 * Get a random valid game id.
 */
export const randValidGameID = (
  maxCodeLen: ?number,
): number => {
  if (!maxCodeLen) {
    maxCodeLen = IDEAL_CODE_LEN;
  }

  if (maxCodeLen <= 0 || maxCodeLen > MAX_CODE_LEN) {
    throw Error('Invalid game code length');
  }

  // Return a number from 0 up to but not including NUM_VALS ** maxCodeLen.
  return Math.floor(Math.random() * NUM_VALS ** maxCodeLen);
}
