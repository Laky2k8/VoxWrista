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

export function screen_pixel_to_tile(screenAbs, origin, options = {})
{
	if (!screenAbs || screenAbs.x === undefined || screenAbs.y === undefined)
	{
		throw new Error(`Invalid screenAbs: ${JSON.stringify(screenAbs)}`);
	}

	if (!origin)
	{
		throw new Error("origin required: { centerX, centerY, startX, startY }");
	}
	const { centerX = 0, centerY = 0, startX = 0, startY = 0 } = origin;

	const maxZ = (options.maxZ !== undefined) ? options.maxZ : 0;
	const neighbor_radius = (options.neighbor_radius !== undefined) ? options.neighbor_radius : 1;
	const worldBlocks = (options.worldBlocks !== undefined) ? options.worldBlocks : null;

	// Convert the event's absolute screen point back into the local coordinates
	const localX = screenAbs.x - centerX - startX;
	const localY = screenAbs.y - centerY - startY;

	// Helper to test whether a click lies inside a block at screen pos X and Y and world pos Z
	function click_inside_tile(tileX, tileY, tileZ)
	{
		const screen_pos = tile_to_screen({x: tileX, y: tileY});
		
		// Adjust for Z height
		const tileCenterX = screen_pos.x;
		const tileCenterY = screen_pos.y - (tileZ * (h / 2));

		const tileTopLeftX = tileCenterX - w / 2;
		const tileTopLeftY = tileCenterY - h;

		// Get click position relative to tile center
		const relX = localX - tileTopLeftX;
		const relY = localY - tileTopLeftY;

		// Check if between the sprite's bounds first
		if (relX < 0 || relX > w || relY < 0 || relY > h)
		{
			return false;
		}

		// Diamond hit test

		const centerRelX = relX - w / 2;
		const centerRelY = relY - h;

		const halfW = step_x;
		const halfH = step_y;

		// Transform to diamond-local coordinates
		const diamondX = Math.abs(centerRelX / halfW);
		const diamondY = Math.abs(centerRelY / halfH);

		// Point is inside if: |x/w| + |y/h| <= 1
		return (diamondX + diamondY) <= 1.5;
	}
	

	function block_exists(tileX, tileY, tileZ)
	{
		if (!worldBlocks) return true; // If no world data provided, assume it exists
		
		return worldBlocks.some(block => 
			block.x === tileX && block.y === tileY && block.z === tileZ
		);
	}

	for(let z = maxZ; z >= 0; z--)
	{
		// Get approximate tile coordinates
		const fracTile = screen_to_tile({ x: localX, y: localY + (z * (h / 2)) });
		const baseX = Math.round(fracTile.x);
		const baseY = Math.round(fracTile.y);

		// Check nearby tiles
		for(let relY = -neighbor_radius; relY <= neighbor_radius; relY++)
		{
			for(let relX = -neighbor_radius; relX <= neighbor_radius; relX++)
			{
				const tileX = baseX + relX;
				const tileY = baseY + relY;

				if(click_inside_tile(tileX, tileY, z) && block_exists(tileX, tileY, z))
				{
					return {x: tileX, y: tileY, z: z, frac: fracTile};
				}
			}
		}
	}

	// No hit found, return approximate base coordinates
	const fracTile = screen_to_tile({ x: localX, y: localY });
	return { x: Math.round(fracTile.x), y: Math.round(fracTile.y), z: 0, frac: fracTile };
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
