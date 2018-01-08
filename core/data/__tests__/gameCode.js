'use strict';

import * as GameCode from '../gameCode';

describe('gameCodeToID', () => {
  it('should convert game code strings to numbers', () => {
    expect(GameCode.gameCodeToID('0')).toBe(0);
    expect(GameCode.gameCodeToID('1')).toBe(1);
    expect(GameCode.gameCodeToID('A')).toBe(10);
    expect(GameCode.gameCodeToID('a')).toBe(10);
    expect(GameCode.gameCodeToID('Z')).toBe(35);
    expect(GameCode.gameCodeToID('10')).toBe(36);
    expect(GameCode.gameCodeToID('A15Z'))
      .toBe(35 + (5 * 36) + (1 * 36 * 36) + (10 * 36 * 36 * 36));
    expect(() => GameCode.gameCodeToID('-notValid'))
      .toThrow(Error('Invalid game code'));
  });
});

describe('IDToGameCode', () => {
  it('should convert game ID numbers to strings', () => {
    expect(GameCode.IDToGameCode(0)).toBe('0');
    expect(GameCode.IDToGameCode(1)).toBe('1');
    expect(GameCode.IDToGameCode(10)).toBe('A');
    expect(GameCode.IDToGameCode(35)).toBe('Z');
    expect(GameCode.IDToGameCode(468071)).toBe('A15Z');
    expect(GameCode.IDToGameCode(60466176)).toBe('100000');
    expect(() => GameCode.IDToGameCode(2176782336))
      .toThrow(Error('Invalid game ID number 2176782336'));
    expect(() => GameCode.IDToGameCode(-1))
      .toThrow(Error('Invalid game ID number -1'));
  });
});

describe('randValidGameID', () => {
  it('should return a valid number', () => {
    const gameID = GameCode.randValidGameID(4);
    expect(gameID >= 0).toBe(true);
    expect(gameID < 36 ** 4).toBe(true);
  });
});
