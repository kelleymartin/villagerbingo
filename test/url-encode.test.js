'use strict';

const {expect} = require('chai');

const {encodeState, decodeState} = require('../lib/url-encode');
const VILLAGERS = require('../data/villagers.json');

describe('state url encoding', () => {
  it('can roundtrip', () => {
    const original = {
      excludedVillagers: VILLAGERS.slice(0, 9),
      boardVillagers: VILLAGERS.slice(9, 9 + 24),
      selectedVillagers: VILLAGERS.slice(14, 14 + 3),
      selectedColor: 'purple',
      selectedFreePlot: true,
    };
    const url = encodeState('http://example/', original);
    expect(url).a('string');
    const after = decodeState(url);
    expect(after).deep.equal(original);
  });
});
