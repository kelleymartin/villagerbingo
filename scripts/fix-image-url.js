"use strict";

const { writeFileSync } = require("fs");

const amiibo = require("../data/amiibo.json");

for (const item of amiibo) {
  const padded = `${item.id}`.padStart(3, "0");
  item.imageUrl = `/Amiibo/${padded}.png`;
}

writeFileSync("data/amiibo.json", JSON.stringify(amiibo, null, 2));
