const fancyBlotterSets = require("../data/blotter-sets.json");

const BLOTTER_SETS = new Map(
  Object.entries(fancyBlotterSets).map(([setId, blotterSet]) => {
    return [
      setId,
      {
        id: setId,
        name: blotterSet.name,
        items: new Map(
          Object.entries(blotterSet.items).map(([itemId, item]) => {
            return [itemId, { id: itemId, setId, ...item }];
          })
        ),
      },
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
  "gold",
];

BLOTTER_SETS.set("color", {
  id: "color",
  name: "Solid circles",
  items: new Map(
    ALL_COLORS.map((color) => {
      return [
        color,
        {
          id: color,
          setId: "color",
          name: color,
          className: color,
        },
      ];
    })
  ),
});

exports.BLOTTER_SETS = BLOTTER_SETS;

const BLOTTER_BY_ID = new Map(
  Array.from(BLOTTER_SETS.values(), (blotterSet) =>
    Array.from(blotterSet.items)
  ).flat()
);

exports.BLOTTER_BY_ID = BLOTTER_BY_ID;

const OPACITIES = [
  "100%",
  "80%",
  "60%",
  "40%",
  "20%",
  "0%",
];

exports.OPACITIES = OPACITIES;