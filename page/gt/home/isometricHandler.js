// These are the four numbers that define the transform, i-hat and j-hat
const i_x = 1;
const i_y = 0.5;
const j_x = -1;
const j_y = 0.5;

// Sprite size
export const w = 106;
export const h = 128;

const step_x = w / 2; 
const step_y = h / 2; 

export function tile_to_screen(tile) {
	if (!tile || tile.x === undefined || tile.y === undefined) 
	{
	  throw new Error(`Invalid grid position: ${JSON.stringify(tile)}`);
	}
	
	return {
	  x: tile.x * i_x * step_x + tile.y * j_x * step_x,
	  y: tile.x * i_y * step_y + tile.y * j_y * step_y,
	};
  }

export function screen_to_tile(screen)
{
	if (!screen || screen.x === undefined || screen.y === undefined)
		{
	  throw new Error(`Invalid screen position: ${JSON.stringify(screen)}`);
	}
  
	const a = i_x * step_x;      // 53
	const b = j_x * step_x;      // -53
	const c = i_y * step_y;      // 32
	const d = j_y * step_y;      // 32
  
	const inv = invertMatrix(a, b, c, d);
  
	return {
	  x: screen.x * inv.a + screen.y * inv.b,
	  y: screen.x * inv.c + screen.y * inv.d,
	};
  }

  export function tile_to_screen_pixels(tile) {
	const screenPos = tile_to_screen(tile);
	return {
	  x: Math.round(screenPos.x - w / 2),   // Convert center to top-left
	  y: Math.round(screenPos.y - h),       // Convert center to top-left
	};
  }

// Matrix inversion helper
function invertMatrix(a, b, c, d) {
	// Determinant
	const det = a * d - b * c;

	if (det === 0)
	{
	  throw new Error("Matrix is not invertible (determinant = 0).");
	}
	const invDet = 1 / det;
  
	return {
	  a: invDet * d,
	  b: invDet * -b,
	  c: invDet * -c,
	  d: invDet * a,
	};
  }

// Example usage:
// const tile = { x: 2, y: 3 };
// const screen = tile_to_screen(tile, true);
// const grid = toGridCoordinate(screen);
