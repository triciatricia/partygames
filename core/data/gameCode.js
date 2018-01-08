// Functions to convert string gameIDs (game codes) to numbers.
// And vice versa.
// @flow

const ASCII_0 = 48;
const ASCII_9 = 57;
const ASCII_A = 65;
const ASCII_Z = 90;
const NUM_VALS = ASCII_Z - ASCII_A + 1 + ASCII_9 - ASCII_0 + 1;
const MAX_CODE_LEN = 6;
const IDEAL_CODE_LEN = 4;

/**
 * Convert the game code (base 36) to an ID number.
 * Characters 0-9 have their respective values. A-Z have values 10-35.
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

    if (ascii >= ASCII_0 && ascii <= ASCII_9) {

      ID += (ascii - ASCII_0) * (NUM_VALS ** i);

    } else if (ascii >= ASCII_A && ascii <= ASCII_Z) {

      ID += (ascii - ASCII_A + 10) * (NUM_VALS ** i);

    } else {

      throw Error('Invalid game code');

    }
  }

  return ID;
};

/**
 * Get the game code from the ID.
 * Leading zeroes are not shown except for if the code is '0'.
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
      const toAdd = val < 10 ? ASCII_0 : (ASCII_A - 10);
      code += String.fromCharCode(val + toAdd);
      IDNumber %= pow;
    }
  }

  if (code == '') {
    code = '0';
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
