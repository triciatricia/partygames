'use strict';

import * as GameCode from '../gameCode';

describe('gameCodeToID', () => {
  it('should convert game code strings to numbers', () => {
    expect(GameCode.gameCodeToID('A')).toBe(0);
    expect(GameCode.gameCodeToID('a')).toBe(0);
    expect(GameCode.gameCodeToID('Z')).toBe(25);
    expect(GameCode.gameCodeToID('BA')).toBe(26);
    expect(GameCode.gameCodeToID('DCZ'))
      .toBe(25 + (2 * 26) + (3 * 26 * 26));
    expect(() => GameCode.gameCodeToID('-notValid'))
      .toThrow(Error('Invalid game code'));
  });
});

describe('IDToGameCode', () => {
  it('should convert game ID numbers to strings', () => {
    expect(GameCode.IDToGameCode(0)).toBe('A');
    expect(GameCode.IDToGameCode(25)).toBe('Z');
    expect(GameCode.IDToGameCode(25 + (2 * 26) + (3 * 26 * 26))).toBe('DCZ');
    expect(GameCode.IDToGameCode(11881376)).toBe('BAAAAA');
    expect(() => GameCode.IDToGameCode(8031810176))
      .toThrow(Error('Invalid game ID number 8031810176'));
    expect(() => GameCode.IDToGameCode(-1))
      .toThrow(Error('Invalid game ID number -1'));
  });
});

describe('randValidGameID', () => {
  it('should return a valid number', () => {
    const gameID = GameCode.randValidGameID(4);
    expect(gameID >= 0).toBe(true);
    expect(gameID < 26 ** 4).toBe(true);
  });
});
