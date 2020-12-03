"use strict";

const Base64 = require("base64-arraybuffer");
const UrlBase64 = require("url-safe-base64");
const { getSpeciesOnlyItems } = require("./species-item");

// const VILLAGERS = require("../data/villagers.json");

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
      allBytes[markerByte] |= 1 << idx % 8;
    }
    allBytes.push(villager.id & 0xff);
  });
  return UrlBase64.encode(Base64.encode(Uint8Array.from(allBytes)));
}

function extractVillagers(queryValue, allVillagers) {
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

    const flag = 1 << (idx - markerOffset) % 8;
    const isMarked = (markerByte & flag) === flag;
    const id = isMarked ? byte + 256 : byte;
    const villager = allVillagers.find((v) => v.id === id);
    if (villager) {
      result.push(villager);
    }
  });

  return result;
}

function extractAmiiboSeriesId(queryValue) {
  if (typeof queryValue !== "string") return 1;

  const intValue = parseInt(`${queryValue}`, 10);
  if (intValue >= 1 && intValue <= 5) {
    return intValue;
  }
  return 1;
}

const QS_AMIIBO_SERIES = "a";
const QS_BOARD = "b";
const QS_CHANGED_SETTINGS = "c";
const QS_EXCLUDE = "e";
const QS_FREE_PLOT = "f";
const QS_LABEL = "l";
const QS_AMIIBO_FRACTION = "n"; // *N*PC fraction
const QS_PRESELECTED = "p";
const QS_SELECTED = "s";
const QS_VILLAGER_SET = "v";

const KNOWN_VILLAGER_SETS = ["standard", "species-only"];

exports.encodeState = function encodeState(currentURL, state) {
  const excludeUrl = villagersToString(state.excludedVillagers);
  const preselectedUrl = villagersToString(state.preselectedVillagers);
  const boardUrl = villagersToString(state.boardVillagers);
  const selectionUrl = villagersToString(state.selectedVillagers);

  const url = new URL(currentURL);
  url.search = "";
  if (state.boardLabel) url.searchParams.set(QS_LABEL, state.boardLabel);
  if (excludeUrl) url.searchParams.set(QS_EXCLUDE, excludeUrl);
  if (preselectedUrl) url.searchParams.set(QS_PRESELECTED, preselectedUrl);
  if (boardUrl) url.searchParams.set(QS_BOARD, boardUrl);
  if (selectionUrl) url.searchParams.set(QS_SELECTED, selectionUrl);
  if (state.selectedFreePlot) url.searchParams.set(QS_FREE_PLOT, "1");
  if (state.changedSettings) url.searchParams.set(QS_CHANGED_SETTINGS, "1");
  if (state.amiiboSeriesId !== 1)
    url.searchParams.set(QS_AMIIBO_SERIES, state.amiiboSeriesId);
  if (state.amiiboNPCFraction !== 3)
    url.searchParams.set(QS_AMIIBO_FRACTION, state.amiiboNPCFraction);
  if (state.villagerSet !== "standard")
    url.searchParams.set(QS_VILLAGER_SET, state.villagerSet);
  return url.href;
};

exports.decodeState = function decodeState(urlString, allVillagers) {
  const url = new URL(urlString);

  const villagerSet = KNOWN_VILLAGER_SETS.includes(
    url.searchParams.get(QS_VILLAGER_SET)
  )
    ? url.searchParams.get(QS_VILLAGER_SET)
    : "standard";

  let boardItems = allVillagers;
  if (villagerSet === "species-only") {
    boardItems = getSpeciesOnlyItems();
  }

  return {
    boardLabel: url.searchParams.get(QS_LABEL) || "",
    excludedVillagers: extractVillagers(
      url.searchParams.get(QS_EXCLUDE),
      allVillagers
    ),
    preselectedVillagers: extractVillagers(
      url.searchParams.get(QS_PRESELECTED),
      allVillagers
    ),
    boardVillagers: extractVillagers(
      url.searchParams.get(QS_BOARD),
      boardItems
    ),
    selectedVillagers: extractVillagers(
      url.searchParams.get(QS_SELECTED),
      boardItems
    ),
    selectedFreePlot: url.searchParams.get(QS_FREE_PLOT) === "1",
    changedSettings: url.searchParams.get(QS_CHANGED_SETTINGS) === "1",
    villagerSet,
    amiiboSeriesId: extractAmiiboSeriesId(
      url.searchParams.get(QS_AMIIBO_SERIES)
    ),
    amiiboNPCFraction: url.searchParams.get(QS_AMIIBO_FRACTION) === "6" ? 6 : 3,
  };
};
