import fs from 'fs';
import jpeg from 'jpeg-js';

const jpegData = fs.readFileSync('public/background.jpg');
const rawImageData = jpeg.decode(jpegData, { useTps: true });

const width = rawImageData.width;
const height = rawImageData.height;
const data = rawImageData.data;

console.log(`Scanning left menu region for white/translucent shapes...`);

const points = [];
for (let y = Math.round(height * 0.40); y < Math.round(height * 0.90); y++) {
  for (let x = Math.round(width * 0.05); x < Math.round(width * 0.30); x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // White/translucent glassmorphic shapes in this peach/pink background
    // Peach background is around RGB(254, 235, 214) (chroma ~40)
    // A white translucent shape will be closer to pure white, so R, G, B will be higher and chroma will be lower.
    // Let's check for very high brightness: R > 250, G > 240, B > 230
    if (r > 248 && g > 240 && b > 235) {
      points.push({ x, y });
    }
  }
}

console.log(`Found ${points.length} bright pixels.`);

// Cluster them
function clusterPoints(points, maxDist = 20) {
  const clusters = [];
  for (const pt of points) {
    let foundCluster = false;
    for (const c of clusters) {
      const dx = pt.x - c.cx;
      const dy = pt.y - c.cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < maxDist) {
        c.pts.push(pt);
        c.cx = c.pts.reduce((sum, p) => sum + p.x, 0) / c.pts.length;
        c.cy = c.pts.reduce((sum, p) => sum + p.y, 0) / c.pts.length;
        foundCluster = true;
        break;
      }
    }
    if (!foundCluster) {
      clusters.push({
        cx: pt.x,
        cy: pt.y,
        pts: [pt]
      });
    }
  }
  return clusters;
}

const clusters = clusterPoints(points, 25);
const validClusters = clusters.filter(c => c.pts.length >= 10);
validClusters.sort((a, b) => a.cy - b.cy);

console.log(`Detected ${validClusters.length} bright shapes:`);
validClusters.forEach((c, i) => {
  const pctX = ((c.cx / width) * 100).toFixed(2);
  const pctY = ((c.cy / height) * 100).toFixed(2);
  console.log(`Bright Shape #${i+1}: Pos: (${c.cx.toFixed(1)}, ${c.cy.toFixed(1)}), Pct: (left: '${pctX}%', top: '${pctY}%'), Size: ${c.pts.length}`);
});
