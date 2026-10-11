import type { ChartCurve, ChartGradient, ChartTheme } from '@tanstack/charts'

/**
 * Shared RU Coach theme tokens for @tanstack/charts.
 * Automatically adapts to Light and Dark mode via CSS variables.
 */
export const ruCoachChartTheme: Partial<ChartTheme> = {
  foreground: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  grid: 'color-mix(in oklab, var(--border) 65%, transparent)',
  background: 'transparent',
  palette: [
    'var(--primary)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ],
  focusRing: {
    radius: 5,
    strokeWidth: 2.5,
    fill: 'var(--background)',
  },
}

/**
 * Creates a vertical linear gradient definition for area marks.
 */
export function createAreaGradient(
  id: string,
  color: string,
  topOpacity = 0.34,
  bottomOpacity = 0.02,
): ChartGradient {
  return {
    id,
    type: 'linear',
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
    stops: [
      { offset: 0, color, opacity: topOpacity },
      { offset: 1, color, opacity: bottomOpacity },
    ],
  }
}

/**
 * Compute Fritsch-Carlson monotone cubic tangents for 2D points.
 */
function computeMonotoneTangents(points: readonly (readonly [number, number])[]): number[] {
  const n = points.length
  if (n < 2) return new Array(n).fill(0)

  const dx: number[] = new Array(n - 1)
  const slopes: number[] = new Array(n - 1)

  for (let i = 0; i < n - 1; i++) {
    const deltaX = points[i + 1][0] - points[i][0]
    const deltaY = points[i + 1][1] - points[i][1]
    dx[i] = deltaX
    slopes[i] = Math.abs(deltaX) > 1e-6 ? deltaY / deltaX : 0
  }

  const tangents: number[] = new Array(n)
  tangents[0] = slopes[0]
  tangents[n - 1] = slopes[n - 2]

  for (let i = 1; i < n - 1; i++) {
    const s0 = slopes[i - 1]
    const s1 = slopes[i]
    if (s0 * s1 <= 0) {
      tangents[i] = 0
    } else {
      const dx0 = dx[i - 1]
      const dx1 = dx[i]
      const common = dx0 + dx1
      tangents[i] =
        common > 1e-6
          ? (3 * common) / ((common + dx1) / s0 + (common + dx0) / s1)
          : 0
    }
  }

  return tangents
}

function buildMonotonePathSegment(
  points: readonly (readonly [number, number])[],
  moveFirst: boolean,
): string {
  const n = points.length
  if (n === 0) return ''
  const [x0, y0] = points[0]
  let d = `${moveFirst ? 'M' : 'L'}${x0},${y0}`
  if (n === 1) return d
  if (n === 2) {
    return `${d}L${points[1][0]},${points[1][1]}`
  }

  const tangents = computeMonotoneTangents(points)
  for (let i = 0; i < n - 1; i++) {
    const [p0x, p0y] = points[i]
    const [p1x, p1y] = points[i + 1]
    const deltaX = (p1x - p0x) / 3
    const cp1x = p0x + deltaX
    const cp1y = p0y + tangents[i] * deltaX
    const cp2x = p1x - deltaX
    const cp2y = p1y - tangents[i + 1] * deltaX
    d += `C${cp1x},${cp1y},${cp2x},${cp2y},${p1x},${p1y}`
  }
  return d
}

/**
 * Monotone X cubic spline curve implementation for @tanstack/charts `lineY` and `areaY`.
 */
export const monotoneXCurve: ChartCurve = {
  line(points) {
    return buildMonotonePathSegment(points, true)
  },
  area(top, bottom) {
    if (top.length === 0 || bottom.length === 0) return ''
    const topPath = buildMonotonePathSegment(top, true)
    const reversedBottom = [...bottom].reverse()
    const bottomPath = buildMonotonePathSegment(reversedBottom, false)
    return `${topPath}${bottomPath}Z`
  },
}

/**
 * D3-compatible closed linear curve factory for polar radar polygons (`radialArea` / `radialLine`).
 */
export function closedLinearCurve(context: {
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  closePath(): void
}) {
  let pointState = 0
  return {
    areaStart() {},
    areaEnd() {},
    lineStart() {
      pointState = 0
    },
    lineEnd() {
      if (pointState) context.closePath()
    },
    point(x: number, y: number) {
      const px = +x
      const py = +y
      if (pointState) {
        context.lineTo(px, py)
      } else {
        pointState = 1
        context.moveTo(px, py)
      }
    },
  }
}

