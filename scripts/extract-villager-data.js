/**
 * After editing this script, run it via:
 *
 * - npm run extract-villagers
 *   OR
 * - Click the play button for "extract-villagers"
 */
"use strict";

const { writeFileSync } = require("fs");

const AAAALL_DATA = require("../data/acnhapi-villagers.json");

const filteredData = Object.values(AAAALL_DATA)
  .map((villager) => {
    return {
      id: villager.id,
      key: villager["file-name"],
      name: villager.name["name-USen"],
      personality: villager.personality,
      species: villager.species,
      iconUrl: villager.icon_uri,
      imageUrl: villager.image_uri,
      bubbleColor: villager["bubble-color"],
      textColor: villager["text-color"],
      contrastColor: villager["contrast-color"],
    };
  })
  .sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

console.log(filteredData);
writeFileSync("data/villagers.json", JSON.stringify(filteredData));
