import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { TEXT_STYLE, CANVAS_STYLE } from "zosLoader:./index.page.[pf].layout.js";
import { getDeviceInfo } from "@zos/device";
import * as isoHandler from "./isometricHandler.js";
import { event } from '@zos/ui'

let selectedTile = null;

let world = [];

let rows = 10, cols = 10;

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


			

			const drawCommands = [];

			/*for(let i = 0; i < rows; i++)
			{
				for(let j = 0; j < cols; j++)
				{

					let alpha = 255;

					const tile_pos = {x: i, y: j};

					const orig_screen_pos = isoHandler.tile_to_screen_pixels(tile_pos);
					let screenX = startX + orig_screen_pos.x;
					let screenY = startY + orig_screen_pos.y;

					if((selectedTile != null) && (selectedTile.x === i) && (selectedTile.y === j))
					{
						alpha = 128;
					}

					drawCommands.push({
						depth: i + j,
						x: Math.round(screenX + centerX),
						y: Math.round(screenY + centerY),
						w: isoHandler.w,
						h: isoHandler.h,
						alpha: alpha,
					});

					//console.log(`Tile(${i},${j}): final = (${Math.round(screenX + centerX)}, ${Math.round(screenY + centerY)})`);
				}
			}*/

			for(const block of world)
			{
				let alpha = 255;

				const tile_pos = {x: block.x, y: block.y};

				const orig_screen_pos = isoHandler.tile_to_screen_pixels(tile_pos);
				let screenX = startX + orig_screen_pos.x;
				let screenY = startY + orig_screen_pos.y - (block.z * (isoHandler.h / 2.5));

				if((selectedTile != null) && (selectedTile.x === block.x) && (selectedTile.y === block.y) && (selectedTile.z === block.z))
				{
					alpha = 128;
				}

				let drawnSprite = "";

				switch(block.type)
				{
					case "grass":
						drawnSprite = "blocks/grass.png";
						break;
					default:
						drawnSprite = "blocks/grid.png";
				}

				drawCommands.push({
					depth: block.x + block.y + block.z,
					x: Math.round(screenX + centerX),
					y: Math.round(screenY + centerY),
					w: isoHandler.w,
					h: isoHandler.h,
					alpha: alpha,
					sprite: drawnSprite
				});
			}

			drawCommands.sort((a,b) => a.depth - b.depth);



			for(const cmd of drawCommands)
			{
				console.log(`Drawing at (${cmd.x}, ${cmd.y}) size (${cmd.w}, ${cmd.h})`);
				canvas.drawImage({
					x: cmd.x,
					y: cmd.y,
					w: cmd.w, // Width correction
					h: cmd.h,
					alpha: cmd.alpha,
					image: cmd.sprite
				});
			}
		}

		render();

		canvas.drawText({
			x: 10,
			y: 260,
			text_size: 30,
			text: `Tile: (${selectedTile ? `${selectedTile.x},${selectedTile.y},${selectedTile.z}` : "none"})`,
		});

		
		canvas.addEventListener(event.CLICK_UP, function cb(info) {
			console.log(`Touch at screen (${info.x}, ${info.y})`);

			const origin = {centerX, centerY, startX, startY};
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

			canvas.drawText({
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
			});

		});

		placeBtn.addEventListener(hmUI.event.CLICK_UP, () => 
		{
			world.push({
				x: selectedTile.x,
				y: selectedTile.y,
				z: selectedTile.z + 1,
				type: "grass"
			});

			render();
		});

		breakBtn.addEventListener(hmUI.event.CLICK_UP, () => 
		{
			// Remove block at selected tile
			world = world.filter(b => !(b.x === selectedTile.x && b.y === selectedTile.y && b.z === selectedTile.z));

			render();
		});


	},

	onDestroy()
	{
		logger.debug("page onDestroy invoked");
	},
});
