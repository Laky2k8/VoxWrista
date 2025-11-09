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
    const drawCommands = [];

    for(let i = 0; i < rows; i++)
    {
      for(let j = 0; j < cols; j++)
      {
        const tile_pos = {x: i, y: j};
        const orig_screen_pos = isoHandler.tile_to_screen(tile_pos);
        //console.log(`Tile(${i},${j}): screenPos = (${orig_screen_pos.x}, ${orig_screen_pos.y})`);

        let screenX = startX + orig_screen_pos.x - isoHandler.w / 2;
        let screenY = startY + orig_screen_pos.y - isoHandler.h;

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
    
    /*canvas.addEventListener(event.CLICK_UP, function cb(info) 
    {
      const touchX = info.x - startX;
      const touchY = info.y - startY;

      touchedTile = isoHandler.screen_to_tile({x: touchX, y: touchY});

      logger.debug(`Touch at screen (${evt.x}, ${evt.y}) -> tile frac (${touchedTile.x.toFixed(2)}, ${touchedTile.y.toFixed(2)})`);
    });*/

    canvas.addEventListener(event.CLICK_UP, function cb(info) {
      // Account for the centering offset applied during rendering
      const touchX = info.x - startX - centerX;
      const touchY = info.y - startY - centerY;
      
      const touchedTile_frac = isoHandler.screen_to_tile({x: touchX, y: touchY});
      
      const clickedI = Math.floor(touchedTile_frac.x + 0.00001);
      const clickedJ = Math.floor(touchedTile_frac.y + 0.00001);
      
      touchedTile = { x: clickedI, y: clickedJ };
      
      logger.debug(`tile (${clickedI}, ${clickedJ})`);
    })


  },
  onDestroy() {
    logger.debug("page onDestroy invoked");
  },
});
