'use strict';

const Base64 = require('base64-arraybuffer');
const UrlBase64 = require('url-safe-base64');

const VILLAGERS = require('../data/villagers.json');

const ALL_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gold",
];
exports.ALL_COLORS = ALL_COLORS;

/**
 * This packs the villager ids as 9-bit unsigned integers.
 * To make the bit magic a bit easier, the data is organized as:
 * - [overflow]: A byte that contains the 8-bit overflow for the
 *               following 8 bytes.
 * - [ids]: The first 8 bits of the villager id.
 * The list is split into segments of 8 villagers, encoded as blocks
 * of (up to) 9 bytes.
 *
 * Example:
 *   ids = [256, 1, 2, 259]
 *   out = [1 << 0 | 1 << 3, 256 & 0xff, 1 & 0xff, 2 & 0xff, 259 & 0xff]
 *       = [9, 1, 1, 2, 4]
 *
 * This works because villager ids fall between 1 and 391 which falls
 * snuggly in the 0..511 range of a 9-bit unsigned integer.
 */
function villagersToString(villagerList) {
  if (villagerList.length < 0) {
    return undefined;
  }
  const allBytes = [];
  villagerList.forEach((villager, idx) => {
    if (idx % 8 === 0) {
      allBytes.push(0);
    }
    const segmentIdx = Math.floor(idx / 8);
    const markerByte = segmentIdx * 9;
    if (villager.id > 0xff) {
      allBytes[markerByte] |= 1 << (idx % 8);
    }
    allBytes.push(villager.id & 0xff);
  });
  return UrlBase64.encode(Base64.encode(Uint8Array.from(allBytes)));
}

function extractVillagers(queryValue) {
  if (!queryValue) {
    return [];
  }

  const buffer = Base64.decode(UrlBase64.decode(queryValue));
  const arr = new Uint8Array(buffer);

  let markerByte = 0;
  let markerOffset = 0;

  let result = [];

  arr.forEach((byte, idx) => {
    if (idx % 9 === 0) {
      markerOffset += 1;
      markerByte = byte;
      return;
    }

    const flag = 1 << ((idx - markerOffset) % 8);
    const isMarked = (markerByte & flag) === flag;
    const id = isMarked ? byte + 256 : byte;
    const villager = VILLAGERS.find(v => v.id === id);
    if (villager) {
      result.push(villager);
    }
  });

  return result;
}

const QS_LABEL = 'l';
const QS_EXCLUDE = 'e';
const QS_BOARD = 'b';
const QS_SELECTED = 's';
const QS_FREE_PLOT = 'f';
const QS_COLOR = 'c';

exports.encodeState = function encodeState(currentURL, state) {
  const excludeUrl = villagersToString(state.excludedVillagers);
  const boardUrl = villagersToString(state.boardVillagers);
  const selectionUrl = villagersToString(state.selectedVillagers);

  const url = new URL(currentURL);
  url.search = '';
  if (state.boardLabel) url.searchParams.set(QS_LABEL, state.boardLabel);
  if (excludeUrl) url.searchParams.set(QS_EXCLUDE, excludeUrl);
  if (boardUrl) url.searchParams.set(QS_BOARD, boardUrl);
  if (selectionUrl) url.searchParams.set(QS_SELECTED, selectionUrl);
  if (state.selectedColor) url.searchParams.set(QS_COLOR, state.selectedColor);
  if (state.selectedFreePlot) url.searchParams.set(QS_FREE_PLOT, '1');
  return url.href;
}

exports.decodeState = function decodeState(urlString, randomColor) {
  const url = new URL(urlString);
  let queryColor = url.searchParams.get(QS_COLOR);
  if (!ALL_COLORS.includes(queryColor)) {
    queryColor = null;
  }
  return {
    boardLabel: url.searchParams.get(QS_LABEL) || '',
    excludedVillagers: extractVillagers(url.searchParams.get(QS_EXCLUDE)),
    boardVillagers: extractVillagers(url.searchParams.get(QS_BOARD)),
    selectedVillagers: extractVillagers(url.searchParams.get(QS_SELECTED)),
    selectedColor: queryColor || randomColor,
    selectedFreePlot: url.searchParams.get(QS_FREE_PLOT) === '1',
    villagerSet: 'standard',
  };
}
