import { Point } from '@/types/whiteboard';

export function dedupePoints(points: Point[]): Point[] {
  return points.filter((point, index, array) => {
    if (index === 0) return true;
    const previous = array[index - 1];
    return previous.x !== point.x || previous.y !== point.y;
  });
}

export function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) {
    return '';
  }

  if (points.length === 2) {
    const [p0, p1] = points;
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
  }

  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    // Reduce tension for smoother curves and prevent excessive overshoot
    const tension = 0.3; // Reduced from 1/6 to prevent curve overshoot
    
    const cp1 = {
      x: p1.x + (p2.x - p0.x) * tension,
      y: p1.y + (p2.y - p0.y) * tension,
    };

    const cp2 = {
      x: p2.x - (p3.x - p1.x) * tension,
      y: p2.y - (p3.y - p1.y) * tension,
    };

    segments.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p2.x} ${p2.y}`);
  }

  return segments.join(' ');
}

// Calculate bounds that include bezier curve overshoot
export function calculateCurveBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Math.min(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y));
  let maxX = Math.max(...points.map(p => p.x));
  let maxY = Math.max(...points.map(p => p.y));

  // For curves with more than 2 points, account for control point overshoot
  if (points.length > 2) {
    const tension = 0.3;
    
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;

      const cp1 = {
        x: p1.x + (p2.x - p0.x) * tension,
        y: p1.y + (p2.y - p0.y) * tension,
      };

      const cp2 = {
        x: p2.x - (p3.x - p1.x) * tension,
        y: p2.y - (p3.y - p1.y) * tension,
      };

      // Include control points in bounds calculation
      minX = Math.min(minX, cp1.x, cp2.x);
      minY = Math.min(minY, cp1.y, cp2.y);
      maxX = Math.max(maxX, cp1.x, cp2.x);
      maxY = Math.max(maxY, cp1.y, cp2.y);
    }
  }

  return { minX, minY, maxX, maxY };
}

