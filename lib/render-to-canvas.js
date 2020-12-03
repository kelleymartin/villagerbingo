"use strict";

function getBounds(row, column) {
  const left = 5 + column * 125;
  const top = 5 + row * 125;
  return {
    row,
    column,
    left,
    top,
    width: 120,
    height: 120,
    bottom: top + 120,
    right: left + 120,
    centerX: left + 60,
    centerY: top + 60,
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} bounds
 * @param {*} imageUrl
 */
async function prepareImage(imageUrl) {
  const img = document.createElement("img");
  img.src = imageUrl;
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} bounds
 * @param {*} villager
 * @param {*} checked
 */
async function renderTile(ctx, bounds, villager, checked) {
  const img = await prepareImage(villager.imageUrl);

  ctx.save();

  // Rounded rect clip:
  ctx.beginPath();
  ctx.arc(bounds.left + 10, bounds.top + 10, 10, Math.PI * 1.0, Math.PI * 1.5);
  ctx.lineTo(bounds.right - 10, bounds.top);
  ctx.arc(bounds.right - 10, bounds.top + 10, 10, Math.PI * 1.5, Math.PI * 2.0);
  ctx.lineTo(bounds.right, bounds.bottom - 10);
  ctx.arc(
    bounds.right - 10,
    bounds.bottom - 10,
    10,
    Math.PI * 2.0,
    Math.PI * 0.5
  );
  ctx.lineTo(bounds.left + 10, bounds.bottom);
  ctx.arc(
    bounds.left + 10,
    bounds.bottom - 10,
    10,
    Math.PI * 0.5,
    Math.PI * 1.0
  );
  ctx.lineTo(bounds.left, bounds.top + 10);
  ctx.clip();

  ctx.fillStyle = villager.backgroundColor ? villager.backgroundColor : `#fff`;
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

  ctx.drawImage(
    img,
    bounds.left,
    bounds.top,
    bounds.width,
    villager.species === villager.name ? 98 : bounds.height
  );

  if (checked) {
    ctx.fillStyle = "#3fd8e0";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bounds.centerX, bounds.centerY - 11, 45, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Name label:
  ctx.font = "18px proxima-soft, sans-serif";
  const nameSize = ctx.measureText(villager.name);
  ctx.fillStyle = villager.bubbleColor;
  const bubbleTextX = bounds.centerX - nameSize.width / 2;
  const bubbleTextY = bounds.bottom - 22;
  ctx.fillRect(bubbleTextX, bubbleTextY, nameSize.width, 22);

  // Left rounded side:
  ctx.beginPath();
  ctx.arc(bubbleTextX, bubbleTextY + 11, 11, 0, 2 * Math.PI);
  ctx.fill();
  // Right rounded side:
  ctx.beginPath();
  ctx.arc(bubbleTextX + nameSize.width, bubbleTextY + 11, 11, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = villager.textColor;
  ctx.fillText(villager.name, bubbleTextX, bubbleTextY + 16, nameSize.width);

  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {*} gameState
 */
exports.renderToCanvas = async (canvas, gameState) => {
  canvas.style.width = "630px";
  canvas.style.height = "630px";

  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const clientRect = canvas.getBoundingClientRect();
  canvas.width = clientRect.width * dpr;
  canvas.height = clientRect.height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const gradient = ctx.createLinearGradient(630,630, 0,0);

  gradient.addColorStop(0, '#DB6161');
  gradient.addColorStop(0.145, '#FFAA3B');
  gradient.addColorStop(0.29, '#FFD00D');
  gradient.addColorStop(0.43, '#78DD62');
  gradient.addColorStop(0.575, '#3FD8E0');
  gradient.addColorStop(0.72, '#7FA9FF');
  gradient.addColorStop(0.86, '#A06FCE');
  gradient.addColorStop(1, '#F993CE');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 630, 630);

  let column = 0;
  let row = 0;

  let pending = [];

  for (const villager of gameState.boardVillagers) {
    const bounds = getBounds(row, column);
    pending.push(
      renderTile(
        ctx,
        bounds,
        villager,
        gameState.selectedVillagers.includes(villager)
      )
    );

    ++row;
    if (row >= 5) {
      row = 0;
      ++column;
    }

    if (column === 2 && row === 2) {
      // Render board center
      ++row;
    }
  }

  await Promise.all(pending);
};
