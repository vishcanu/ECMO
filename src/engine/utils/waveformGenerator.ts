import type { ECGRhythm, WaveformPoint } from '../../types';

// ─── Canvas Dimensions ────────────────────────────────────────────────────────

const WIDTH = 1200;
const HEIGHT = 100;
const MIDLINE = HEIGHT / 2; // 50px

// Viewport = 10 seconds at 120px/s (2px/frame × 60fps)
const VIEWPORT_SECONDS = 10;

/** How many full cardiac cycles fit in the 10-second viewport */
function cyclesForHR(hr: number): number {
  return Math.max(2, Math.round((Math.max(20, hr) * VIEWPORT_SECONDS) / 60));
}

// ─── Math Helpers ─────────────────────────────────────────────────────────────

/** Normalised Gaussian: peaks at 1.0 when x === mu */
function gauss(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
}

/** Smooth cosine ramp 0→1 over [0,1] */
function cosRamp(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/** Clamp y to stay inside the SVG canvas */
function clampY(y: number): number {
  return Math.max(2, Math.min(HEIGHT - 2, y));
}

// ─── ECG Waveform Generator ───────────────────────────────────────────────────

/**
 * Generates SVG path data for ECG waveforms.
 * Returns an array of points that can be used to build polyline/path elements.
 */
// ─── ECG ─────────────────────────────────────────────────────────────────────
//
// Based on McSharry et al. 2003 IEEE Trans Biomed Eng — summed Gaussian model.
// Lead-II morphology. Amplitudes in normalised mV; ECG_SCALE converts to px.
// Timing fractions within one RR cycle (AHA proportions):
//   P  center 11%  sigma 2.2%
//   Q  center 23%  sigma 0.7% × qrsNorm
//   R  center 26%  sigma 0.6% × qrsNorm
//   S  center 30%  sigma 0.9% × qrsNorm
//   T  center 50%  sigma 5.5%

const ECG_SCALE = 36; // px per mV

function sinusAmp(t: number, stMm: number, qrsNorm: number): number {
  const p  =  0.15 * gauss(t, 0.110, 0.022);
  const q  = -0.07 * gauss(t, 0.230, 0.007 * qrsNorm);
  const r  =  1.00 * gauss(t, 0.260, 0.006 * qrsNorm);
  const s  = -0.22 * gauss(t, 0.295, 0.009 * qrsNorm);
  const st =  stMm * 0.055;
  const tw = (0.28 + stMm * 0.05) * gauss(t, 0.500, 0.055);
  return p + q + r + s + st + tw;
}

function pacedAmp(t: number, qrsNorm: number): number {
  const spike =  1.60 * gauss(t, 0.220, 0.002);
  const qrsR  =  0.70 * gauss(t, 0.280, 0.012 * qrsNorm);
  const qrsS  = -0.35 * gauss(t, 0.340, 0.014 * qrsNorm);
  const tw    =  0.20 * gauss(t, 0.520, 0.060);
  return spike + qrsR + qrsS + tw;
}

function vtAmp(t: number): number {
  return  1.00 * gauss(t, 0.35, 0.085)
        - 0.50 * gauss(t, 0.56, 0.060);
}

function afAmp(t: number, ci: number): number {
  const fib = 0.08 * Math.sin(t * Math.PI * 14 + ci * 2.3)
            + 0.05 * Math.sin(t * Math.PI * 22 + ci * 3.7);
  const qrsPos = 0.32 + 0.06 * Math.sin(ci * 1.4);
  const qrs =  0.90 * gauss(t, qrsPos,         0.007)
             - 0.18 * gauss(t, qrsPos + 0.032, 0.008);
  const tw  =  0.14 * gauss(t, qrsPos + 0.190, 0.040);
  return fib + qrs + tw;
}

function vfAmp(x: number): number {
  return 0.60 * Math.sin(x * 0.180 + 0.40)
       + 0.38 * Math.sin(x * 0.413 + 1.80)
       + 0.25 * Math.sin(x * 0.731 + 3.20)
       + 0.15 * Math.sin(x * 1.093 + 0.90)
       + 0.10 * Math.sin(x * 1.570 + 2.10);
}

export function generateECGPoints(
  hr: number,
  rhythm: ECGRhythm,
  stChanges: number,
  qrsWidth: number,
): WaveformPoint[] {
  const pts: WaveformPoint[] = [];
  const qrsNorm = Math.max(0.5, qrsWidth / 80);
  const effectiveHR = rhythm === 'bradycardia' ? Math.min(hr, 44) : hr;
  const cycles  = cyclesForHR(effectiveHR);
  const cycleW  = WIDTH / cycles;

  for (let xi = 0; xi <= WIDTH; xi += 3) {
    const ci = Math.floor(xi / cycleW);
    const t  = (xi % cycleW) / cycleW;
    let amp = 0;

    switch (rhythm) {
      case 'sinus':
      case 'svt':
      case 'bradycardia':
        amp = sinusAmp(t, stChanges, qrsNorm);
        break;

      case 'heart-block-2':
        amp = ci % 3 === 2
          ? 0.15 * gauss(t, 0.11, 0.022)   // dropped beat — P only
          : sinusAmp(t, stChanges, qrsNorm);
        break;

      case 'heart-block-3': {
        const p1     = 0.12 * gauss(t, 0.10, 0.022);
        const p2     = 0.12 * gauss(t, 0.55, 0.022);
        const escape = ci % 2 === 0
          ? (0.85 * gauss(t, 0.38, 0.006 * qrsNorm)
           - 0.20 * gauss(t, 0.42, 0.009 * qrsNorm)
           + 0.22 * gauss(t, 0.62, 0.055))
          : 0;
        amp = p1 + p2 + escape;
        break;
      }

      case 'af':
        amp = afAmp(t, ci);
        break;

      case 'vt':
        amp = vtAmp(t);
        break;

      case 'vf':
        amp = vfAmp(xi) * 0.85;
        break;

      case 'paced':
        amp = pacedAmp(t, qrsNorm);
        break;

      default:
        amp = sinusAmp(t, stChanges, qrsNorm);
    }

    pts.push({ x: xi, y: clampY(MIDLINE - amp * ECG_SCALE) });
  }
  return pts;
}

// ─── Arterial Line ────────────────────────────────────────────────────────────
//
// Ref: Nichols & O'Rourke "McDonald's Blood Flow in Arteries" 6th ed.
// Classic ABP morphology sampled continuously every 4px.
// Pressure→pixel: 0–220 mmHg mapped to full canvas height.

const ART_MAX_MMHG = 220;

function artPtoY(mmHg: number): number {
  const frac = Math.max(0, Math.min(1, mmHg / ART_MAX_MMHG));
  return clampY((HEIGHT - 5) - frac * (HEIGHT - 10));
}

/** Normalised ABP shape [0=DBP, 1=SBP] */
function artNorm(t: number, hasDicroticNotch: boolean): number {
  if (t < 0.08) return cosRamp(t / 0.08);          // anacrotic upstroke
  if (t < 0.20) return 1.0 - ((t - 0.08) / 0.12) * 0.42; // systolic descent
  if (t < 0.32) {                                   // dicrotic notch zone
    const nt    = (t - 0.20) / 0.12;
    const base  = 0.58 - nt * 0.12;
    const notch = hasDicroticNotch ? 0.10 * Math.sin(Math.PI * nt) : 0;
    return base + notch;
  }
  // Diastolic runoff: exponential decay
  return 0.46 * Math.exp(-((t - 0.32) / 0.68) * 2.1);
}

export function generateArtLinePoints(
  sbp: number,
  dbp: number,
  hr: number,
  hasDicroticNotch: boolean,
  respiratoryVariation: number,
): WaveformPoint[] {
  const pts: WaveformPoint[] = [];
  const cycles = cyclesForHR(hr);
  const cycleW = WIDTH / cycles;
  const pp     = sbp - dbp;

  for (let xi = 0; xi <= WIDTH; xi += 4) {
    const ci = Math.floor(xi / cycleW);
    const t  = (xi % cycleW) / cycleW;
    const rv = (respiratoryVariation / 100) * pp * 0.3
             * Math.sin((ci / Math.max(1, cycles)) * Math.PI * 2);
    const norm = artNorm(t, hasDicroticNotch);
    pts.push({ x: xi, y: artPtoY(dbp + norm * (sbp + rv - dbp)) });
  }
  return pts;
}

// ─── CVP ─────────────────────────────────────────────────────────────────────
//
// Ref: Darovic "Hemodynamic Monitoring" 3rd ed.
// a–c–x–v–y waveform components via summed Gaussians around mean CVP.
// Pressure→pixel: −5 to 30 mmHg.

const CVP_MIN_MMHG = -5;
const CVP_MAX_MMHG =  30;

function cvpPtoY(mmHg: number): number {
  const frac = Math.max(0, Math.min(1,
    (mmHg - CVP_MIN_MMHG) / (CVP_MAX_MMHG - CVP_MIN_MMHG)));
  return clampY((HEIGHT - 5) - frac * (HEIGHT - 10));
}

export function generateCVPPoints(
  meanCVP: number,
  aWaveAmp: number,
  vWaveAmp: number,
  hr = 80,
): WaveformPoint[] {
  const pts: WaveformPoint[] = [];
  const cycleW = WIDTH / cyclesForHR(hr);

  for (let xi = 0; xi <= WIDTH; xi += 4) {
    const t = (xi % cycleW) / cycleW;
    const delta =
        aWaveAmp * gauss(t, 0.18, 0.038)   // a wave  — atrial contraction
      + 0.8      * gauss(t, 0.28, 0.018)   // c wave  — tricuspid closure
      - 1.6      * gauss(t, 0.40, 0.048)   // x descent
      + vWaveAmp * gauss(t, 0.58, 0.048)   // v wave  — venous filling
      - 1.3      * gauss(t, 0.72, 0.038);  // y descent
    pts.push({ x: xi, y: cvpPtoY(meanCVP + delta) });
  }
  return pts;
}

// ─── SpO2 Pleth ───────────────────────────────────────────────────────────────
//
// Ref: Kamal et al. "Skin photoplethysmography — a review" (1989)
// Peripheral PPG: slower upstroke, rounded peak, softer dicrotic notch.

function spo2Norm(t: number): number {
  if (t < 0.15) return cosRamp(t / 0.15);              // slower upstroke
  if (t < 0.30) return 1.0 - ((t - 0.15) / 0.15) * 0.35;
  if (t < 0.40) {                                       // soft dicrotic notch
    const nt = (t - 0.30) / 0.10;
    return (0.65 - nt * 0.07) + 0.07 * Math.sin(Math.PI * nt);
  }
  return 0.58 * Math.exp(-((t - 0.40) / 0.60) * 1.85); // long runoff
}

export function generateSpO2Points(
  spo2: number,
  amplitude: number,
  hr: number,
): WaveformPoint[] {
  const pts: WaveformPoint[] = [];
  const cycleW   = WIDTH / cyclesForHR(hr);
  const perf     = Math.min(Math.max((spo2 - 70) / 30, 0.05), 1.0);
  const ampPx    = amplitude * perf * 0.58;
  const baseline = HEIGHT - 12;

  for (let xi = 0; xi <= WIDTH; xi += 4) {
    const t = (xi % cycleW) / cycleW;
    pts.push({ x: xi, y: clampY(baseline - spo2Norm(t) * ampPx) });
  }
  return pts;
}

// ─── Pulmonary Artery Pressure ────────────────────────────────────────────────
//
// Ref: West "Respiratory Physiology" 10th ed.
// Similar to ART but lower pressures, prominent pulmonic valve closure notch,
// slower diastolic runoff.
// Pressure→pixel: 0–80 mmHg.

const PAP_MAX_MMHG = 80;

function papPtoY(mmHg: number): number {
  const frac = Math.max(0, Math.min(1, mmHg / PAP_MAX_MMHG));
  return clampY((HEIGHT - 5) - frac * (HEIGHT - 10));
}

function papNorm(t: number): number {
  if (t < 0.10) return cosRamp(t / 0.10);
  if (t < 0.22) return 1.0 - ((t - 0.10) / 0.12) * 0.50;
  if (t < 0.34) {                                   // pulmonic valve closure
    const nt    = (t - 0.22) / 0.12;
    const base  = 0.50 - nt * 0.09;
    const notch = 0.09 * Math.sin(Math.PI * nt);
    return base + notch;
  }
  return 0.41 * Math.exp(-((t - 0.34) / 0.66) * 1.60); // slower decay
}

export function generatePAPPoints(sys: number, dia: number, hr = 80): WaveformPoint[] {
  const pts: WaveformPoint[] = [];
  const cycleW = WIDTH / cyclesForHR(hr);

  for (let xi = 0; xi <= WIDTH; xi += 4) {
    const t = (xi % cycleW) / cycleW;
    pts.push({ x: xi, y: papPtoY(dia + papNorm(t) * (sys - dia)) });
  }
  return pts;
}

// ─── Point Array to SVG Polyline ─────────────────────────────────────────────

export function pointsToSVGPolyline(points: WaveformPoint[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}
