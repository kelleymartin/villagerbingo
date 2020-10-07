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

function villagersToString(villagerList) {
  if (villagerList.length < 0) {
    return undefined;
  }
  const arr = Uint16Array.from(villagerList, (villager) => {
    return villager.id;
  });
  return UrlBase64.encode(Base64.encode(arr.buffer));
}

function extractVillagers(queryValue) {
  if (!queryValue) {
    return [];
  }

  const buffer = Base64.decode(UrlBase64.decode(queryValue));
  const arr = new Uint16Array(buffer);

  return Array.from(arr, (villagerId) => {
    return VILLAGERS.find(v => v.id === villagerId);
  }).filter(Boolean);
}

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
  if (excludeUrl) url.searchParams.set(QS_EXCLUDE, excludeUrl);
  if (boardUrl) url.searchParams.set(QS_BOARD, boardUrl);
  if (selectionUrl) url.searchParams.set(QS_SELECTED, selectionUrl);
  url.searchParams.set(QS_COLOR, state.selectedColor);
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
    excludedVillagers: extractVillagers(url.searchParams.get(QS_EXCLUDE)),
    boardVillagers: extractVillagers(url.searchParams.get(QS_BOARD)),
    selectedVillagers: extractVillagers(url.searchParams.get(QS_SELECTED)),
    selectedColor: queryColor || randomColor,
    selectedFreePlot: url.searchParams.get(QS_FREE_PLOT) === '1',
  };
}
