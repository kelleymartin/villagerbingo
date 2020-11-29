"use strict";

const VILLAGERS = require("../data/villagers.json");
const SPECIES_DATA = require("../data/species.json");

const SPECIES_ITEMS = Array.from(new Set(VILLAGERS.map((v) => v.species)))
  .sort()
  .map((species, index) => {
    const colors = SPECIES_DATA[species.toLowerCase()];
    return {
      id: index + 1,
      name: species,
      imageUrl: `/Species/${species}.svg`,
      species,
      personality: species,
      bubbleColor: colors.lightBubbleColor,
      textColor: colors.lightTextColor,
      backgroundColor: colors.lightBackgroundColor,
      themes: {
        dark: {
          bubbleColor: colors.darkBubbleColor,
          textColor: colors.darkTextColor,
          backgroundColor: colors.darkBackgroundColor,
        },
        gray: {
          imageUrl: `/Species/gray${species}.svg`,
          backgroundColor: `black`,
        },
      },
    };
  });

const SPECIES_BY_NAME = new Map(
  SPECIES_ITEMS.map((item) => {
    return [item.species, item];
  })
);

exports.toSpeciesItem = (species) => {
  return SPECIES_BY_NAME.get(species);
};

exports.getSpeciesOnlyItems = () => {
  return SPECIES_ITEMS;
};
