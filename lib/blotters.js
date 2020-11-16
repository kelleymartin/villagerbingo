const fancyBlotterSets = require("../data/blotter-sets.json");

const RANDOM_BLOTTER_BY_INDEX = [
  7,
  2,
  0,
  2,
  1,
  6,
  3,
  5,
  7,
  3,
  3,
  5,
  3,
  5,
  6,
  0,
  7,
  1,
  3,
  4,
  4,
  5,
  2,
  6,
  5,
];

function pickRandomBlotter(index) {
  return RANDOM_BLOTTER_BY_INDEX[index];
}

function createBlotterSet(setId, name, itemList) {
  const items = new Map(
    itemList.slice(0, 8).map(([itemId, item]) => {
      return [
        itemId,
        {
          id: itemId,
          setId,
          ...item,
          forIndex(/* index */) {
            // Always return the current blotter, no matter which index the
            // tile is at.
            return this;
          },
        },
      ];
    })
  );

  // Add item for random blotter:
  const randomId = `${setId}Random`;
  items.set(randomId, {
    id: randomId,
    setId,
    name: `${name} (random)`,
    icon: "/Blotters/QuestionMarkCropped.png",
    forIndex(index) {
      // Cycle through all ids in the list of "real" blotters:
      const itemId = itemList[pickRandomBlotter(index)][0];
      return items.get(itemId);
    },
  });

  return {
    id: setId,
    name,
    items,
  };
}

const BLOTTER_SETS = new Map(
  Object.entries(fancyBlotterSets).map(([setId, blotterSet]) => {
    return [
      setId,
      createBlotterSet(
        setId,
        blotterSet.name,
        Object.entries(blotterSet.items)
      ),
    ];
  })
);

const ALL_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
];

BLOTTER_SETS.set(
  "color",
  createBlotterSet(
    "color",
    "Solid circles",
    ALL_COLORS.map((color) => {
      return [
        color,
        {
          name: color,
          className: color,
        },
      ];
    })
  )
);

exports.BLOTTER_SETS = BLOTTER_SETS;

const BLOTTER_BY_ID = new Map(
  Array.from(BLOTTER_SETS.values(), (blotterSet) =>
    Array.from(blotterSet.items)
  ).flat()
);

exports.BLOTTER_BY_ID = BLOTTER_BY_ID;

const OPACITIES = ["100%", "80%", "60%", "40%", "20%", "0%"];

exports.OPACITIES = OPACITIES;
