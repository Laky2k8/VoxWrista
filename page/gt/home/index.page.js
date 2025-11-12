import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { TEXT_STYLE, CANVAS_STYLE } from "zosLoader:./index.page.[pf].layout.js";
import { getDeviceInfo } from "@zos/device";
import * as isoHandler from "./isometricHandler.js";
import { event } from '@zos/ui'

let selectedTile = null;

let world = [];

let rows = 10, cols = 10;

function computeBlocks()
{
	for (const block of world)
	{
		const block_pos = isoHandler.tile_to_screen_pixels({x: block.x, y: block.y});

		// store top-left pixel relative to tile (independent of pan)
		block.origX = block_pos.x; 
		block.origY = block_pos.y - (block.z * (isoHandler.h / 2.5));

		block.depth = block.x + block.y + block.z;

		block.sprite = (block.type === "grass") ? "blocks/grass.png" : "blocks/grid.png";
	}

	world.sort((a,b) => a.depth - b.depth);
}

const logger = Logger.getLogger("VoxWrista");
Page({



	onInit()
	{
		logger.debug("page onInit invoked");

		for(let x = 0; x < rows; x++)
		{
			for(let y = 0; y < cols; y++)
			{
				for(let z = 0; z < 1; z++)
				{
					world.push({
						x: x,
						y: y,
						z: z,
						type: "grid"
					});
				}
			}
		}

		computeBlocks();


	},

	build()
	{
		logger.debug("page build invoked");
		 

		const { width, height} = getDeviceInfo();

		const centerX = Math.round(width / 2);   // 195
		const centerY = Math.round(height / 4);  // 113 (instead of 112.5)

		console.log("Device Width: " + width + " Height: " + height);

		const canvas = hmUI.createWidget(hmUI.widget.CANVAS, CANVAS_STYLE);

		// Break and place buttons (bottom of screen)
		const breakBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
			x: 20,
			y: height - 80,
			w: 80,
			h: 60,
			text: "Break",
			text_size: 20,
			bg_color: 0xFF0000,
		});

		const placeBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
			x: width - 100,
			y: height - 80,
			w: 80,
			h: 60,
			text: "Place",
			text_size: 20,
			bg_color: 0xFF0000,
		});

		let startX = 0, startY = isoHandler.h;

		let pan = { x: startX, y: startY }; 
		let isPanning = false;
		let last_pointer = {x: 0, y: 0};
		let moved_since_down = false;
		let last_render_time = 0;



		/*for(let i = 0; i < 6; i++)
		{
			for(let j = 0; j < 7; j++)
			{
				canvas.drawImage({
					x: startX + (j * 53),
					y: startY + (i * 64),
					w: 53, // Width correction
					h: 64,
					alpha:255,
					image: "blocks/grass.png"
				});
			}
		}*/

		// Draw commands (so that we can sort by depth later)

		const render = () => {
		// local copies to avoid global lookups each iteration
		const cX = centerX, cY = centerY, W = width, H = height;
		const tileW = isoHandler.w, tileH = isoHandler.h;
		const pxPanX = pan.x, pxPanY = pan.y;

		// Iterate the already-sorted world; cull by bbox (cheap checks)
		for (let i = 0, n = world.length; i < n; ++i)
		{
			const b = world[i];

			// compute final screen pos (integer math using |0 is faster than Math.round)
			const sx = ((pxPanX + b.origX) + cX) | 0;
			const sy = ((pxPanY + b.origY) + cY) | 0;

			// cheap bounding box cull
			if (sx + tileW < 0 || sx > W || sy + tileH < 0 || sy > H) continue;

			// draw (avoid extra object allocations)
			canvas.drawImage({
				x: sx,
				y: sy,
				w: tileW,
				h: tileH,
				alpha: (selectedTile && selectedTile.x === b.x && selectedTile.y === b.y && selectedTile.z === b.z) ? 128 : 255,
				image: b.sprite
			});
		}
		};

		render();

		canvas.drawText({
			x: 10,
			y: 260,
			text_size: 30,
			text: `Tile: (${selectedTile ? `${selectedTile.x},${selectedTile.y},${selectedTile.z}` : "none"})`,
		});

		// Panning
		canvas.addEventListener(event.CLICK_DOWN, (info) => {
			isPanning = true;
			last_pointer.x = info.x;
			last_pointer.y = info.y;
			moved_since_down = false;
		});

		canvas.addEventListener(event.MOVE, (info) => {
			if (!isPanning) return;

			const dx = info.x - last_pointer.x;
			const dy = info.y - last_pointer.y;

			if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved_since_down = true;

			pan.x += dx;
			pan.y += dy;

			last_pointer.x = info.x;
			last_pointer.y = info.y;

			const now = Date.now();
			if (now - last_render_time > 33) // around 30FPS
			{
				canvas.clear({ x:0, y:0, w: width, h: height });
				render();
				last_render_time = now;
			}
		});

		
		canvas.addEventListener(event.CLICK_UP, function cb(info) {
			

			isPanning = false;

			if(!moved_since_down)
			{
				// Didn't move: tap

				console.log(`Touch at screen (${info.x}, ${info.y})`);

				const origin = {centerX, centerY, startX: pan.x, startY: pan.y};
				const maxZ = world.reduce((m, b) => Math.max(m, b.z), 0); // The highest Z value
	
				const hit = isoHandler.screen_pixel_to_tile({x: info.x - 10, y: info.y + 60}, origin, { maxZ, neighbourRadius: 1, worldBlocks: world });
				console.log("Fractional tile coords:", hit.frac, "Rounded ->", hit.x, hit.y, "z ->", hit.z);
	
				if (hit.x >= 0 && hit.x < rows && hit.y >= 0 && hit.y < cols && hit.z >= 0 && hit.z <= maxZ)
				{
					selectedTile = { x: hit.x, y: hit.y, z: hit.z };
				}
				else
				{
					selectedTile = null;
				}
	
	
				canvas.clear({x:0, y:0, w:width, h:height});
	
				render();
			}
			else
			{
				// Did move: pan
				canvas.clear({ x:0, y:0, w: width, h: height });
				render();
			}



			// DEBUG tile info
			/*canvas.drawText({
				x: 10,
				y: 160,
				text_size: 30,
				text: `Touch at (${info.x}, ${info.y})`,
			});

			canvas.drawText({
				x: 10,
				y: 260,
				text_size: 30,
				text: `Tile: (${selectedTile ? `${selectedTile.x},${selectedTile.y},${selectedTile.z}` : "none"})`,
			});*/

		});

		placeBtn.addEventListener(hmUI.event.CLICK_UP, () => 
		{
			world.push({
				x: selectedTile.x,
				y: selectedTile.y,
				z: selectedTile.z + 1,
				type: "grass"
			});

			computeBlocks();

			render();
		});

		breakBtn.addEventListener(hmUI.event.CLICK_UP, () => 
		{
			// Remove block at selected tile

			if(selectedTile.type !== "grid")
			{
				world = world.filter(b => !(b.x === selectedTile.x && b.y === selectedTile.y && b.z === selectedTile.z));
			}
			
			computeBlocks();

			render();
		});


	},

	onDestroy()
	{
		logger.debug("page onDestroy invoked");
	},
});
