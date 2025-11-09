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

    for(let i = 0; i < rows; i++)
    {
      for(let j = 0; j < cols; j++)
      {
        canvas.drawImage({
          x: startX + (j * 106),
          y: startY + (i * 128),
          w: 106, // Width correction
          h: 128,
          alpha:255,
          image: "blocks/grass.png"
        });
      }
    }


  },
  onDestroy() {
    logger.debug("page onDestroy invoked");
  },
});
