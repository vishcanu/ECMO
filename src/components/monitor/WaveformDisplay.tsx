import React, { useEffect, useRef } from 'react';
import styles from './WaveformDisplay.module.css';
import {
  generateECGPoints,
  generateArtLinePoints,
  generateCVPPoints,
  generateSpO2Points,
  generatePAPPoints,
  pointsToSVGPolyline,
} from '../../engine/utils/waveformGenerator';
import { useDifficultyGates } from '../../hooks/useDifficultyGates';
import type { Vitals, WaveformConfig } from '../../types';

interface WaveformChannel {
  id: string;
  label: string;
  color: string;
  unit: string;
  value: string;
  points: string;
}

interface WaveformDisplayProps {
  vitals: Vitals;
  waveforms: WaveformConfig;
  animated?: boolean;
}

const WAVEFORM_WIDTH = 1200;
const WAVEFORM_HEIGHT = 100; // must match HEIGHT constant in waveformGenerator.ts

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ vitals, waveforms, animated = true }) => {
  const { showCVP, showPAP } = useDifficultyGates();
  const animRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const [animOffset, setAnimOffset] = React.useState(0);

  useEffect(() => {
    if (!animated) return;
    const speed = 2; // pixels per frame
    const animate = () => {
      offsetRef.current = (offsetRef.current + speed) % WAVEFORM_WIDTH;
      setAnimOffset(offsetRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animated]);

  const ecgPoints = generateECGPoints(
    vitals.hr,
    waveforms.ecg.rhythm,
    waveforms.ecg.stChanges,
    waveforms.ecg.qrsWidth
  );
  const artPoints = generateArtLinePoints(
    vitals.sbp,
    vitals.dbp,
    vitals.hr,
    waveforms.arterialLine.dicroticNotch,
    waveforms.arterialLine.respiratoryVariation
  );
  const cvpPoints = generateCVPPoints(
    vitals.cvp,
    waveforms.cvp.aWaveAmplitude,
    waveforms.cvp.vWaveAmplitude,
    vitals.hr
  );
  const spo2Points = generateSpO2Points(
    vitals.spo2,
    waveforms.spo2Pleth.amplitude,
    vitals.hr
  );
  const papPoints = generatePAPPoints(vitals.pap.sys, vitals.pap.dia, vitals.hr);

  const channels: WaveformChannel[] = [
    {
      id: 'ecg',
      label: 'ECG II',
      color: '#00E676',
      unit: 'mV',
      value: `${vitals.hr} bpm`,
      points: pointsToSVGPolyline(ecgPoints),
    },
    {
      id: 'art',
      label: 'ART',
      color: '#FF5252',
      unit: 'mmHg',
      value: `${vitals.sbp}/${vitals.dbp} (${vitals.map})`,
      points: pointsToSVGPolyline(artPoints),
    },
    ...(showCVP ? [{
      id: 'cvp',
      label: 'CVP',
      color: '#40C4FF',
      unit: 'mmHg',
      value: `${vitals.cvp}`,
      points: pointsToSVGPolyline(cvpPoints),
    }] : []),
    {
      id: 'spo2',
      label: 'SpO2 Pleth',
      color: '#FFD740',
      unit: '%',
      value: `${vitals.spo2}%`,
      points: pointsToSVGPolyline(spo2Points),
    },
    ...(showPAP ? [{
      id: 'pap',
      label: 'PAP',
      color: '#CE93D8',
      unit: 'mmHg',
      value: `${vitals.pap.sys}/${vitals.pap.dia} (${vitals.pap.mean})`,
      points: pointsToSVGPolyline(papPoints),
    }] : []),
  ];

  return (
    <div className={styles.monitor}>
      <div className={styles.channels}>
        {channels.map((ch) => (
          <div key={ch.id} className={styles.channel}>
            <div className={styles.channelHeader}>
              <span className={styles.channelLabel} style={{ color: ch.color }}>
                {ch.label}
              </span>
              <span className={styles.channelValue} style={{ color: ch.color }}>
                {ch.value}
              </span>
            </div>
            <div className={styles.svgWrapper}>
              <svg
                className={styles.waveformSvg}
                viewBox={`0 0 ${WAVEFORM_WIDTH} ${WAVEFORM_HEIGHT}`}
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1={0}
                    y1={WAVEFORM_HEIGHT * frac}
                    x2={WAVEFORM_WIDTH}
                    y2={WAVEFORM_HEIGHT * frac}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={0.5}
                  />
                ))}
                {/* Waveform */}
                <polyline
                  points={ch.points}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Scan line (animated sweep) */}
                {animated && (
                  <>
                    <rect
                      x={animOffset - 40}
                      y={0}
                      width={40}
                      height={WAVEFORM_HEIGHT}
                      fill="url(#scanGrad)"
                    />
                    <line
                      x1={animOffset}
                      y1={0}
                      x2={animOffset}
                      y2={WAVEFORM_HEIGHT}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                    <defs>
                      <linearGradient id="scanGrad" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#0A0F1A" stopOpacity="0" />
                        <stop offset="100%" stopColor="#0A0F1A" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                  </>
                )}
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
