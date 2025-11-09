import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { TEXT_STYLE, CANVAS_STYLE } from "zosLoader:./index.page.[pf].layout.js";
import { getDeviceInfo } from "@zos/device";
import * as isoHandler from "./isometricHandler.js";
import { event } from '@zos/ui'

let touchedTile = null;


const logger = Logger.getLogger("VoxWrista");
Page({
	onInit() {
		logger.debug("page onInit invoked");
	},
	build() {
		logger.debug("page build invoked");
		 

		const { width, height} = getDeviceInfo();

		const centerX = Math.round(width / 2);   // 195
		const centerY = Math.round(height / 4);  // 113 (instead of 112.5)

		console.log("Device Width: " + width + " Height: " + height);

		const canvas = hmUI.createWidget(hmUI.widget.CANVAS, CANVAS_STYLE);

		let startX = 0, startY = isoHandler.h;
		let rows = 4, cols = 4;

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

			for(let i = 0; i < rows; i++)
			{
				for(let j = 0; j < cols; j++)
				{

					const tile_pos = {x: i, y: j};

					const orig_screen_pos = isoHandler.tile_to_screen_pixels(tile_pos);
					let screenX = startX + orig_screen_pos.x;
					let screenY = startY + orig_screen_pos.y;

					if((touchedTile != null) && (touchedTile.x === i) && (touchedTile.y === j))
					{
						screenY -= (isoHandler.h / 2) - 10;
					}

					drawCommands.push({
						depth: i + j,
						x: Math.round(screenX + centerX),
						y: Math.round(screenY + centerY),
						w: isoHandler.w,
						h: isoHandler.h
					});

					//console.log(`Tile(${i},${j}): final = (${Math.round(screenX + centerX)}, ${Math.round(screenY + centerY)})`);
				}
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
					alpha:255,
					image: "blocks/grass.png"
				});
			}
		}

		render();
		
		canvas.addEventListener(event.CLICK_UP, function cb(info) {
			console.log(`Touch at screen (${info.x}, ${info.y})`);

			const origin = {centerX, centerY, startX, startY};
			const hit = isoHandler.screen_pixel_to_tile({x: info.x, y: info.y}, origin);
			console.log("Fractional tile coords:", hit.frac, "Rounded ->", hit.x, hit.y);

			if (hit.x >= 0 && hit.x < rows && hit.y >= 0 && hit.y < cols)
			{
				touchedTile = { x: hit.x, y: hit.y };
			}
			else
			{
				touchedTile = null;
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
				text: `Tile: (${touchedTile ? `${touchedTile.x},${touchedTile.y}` : "none"})`,
			});

		})


	},
	onDestroy() {
		logger.debug("page onDestroy invoked");
	},
});
