import React from 'react';
import { ScoreSystemData, PaperTone } from '../types/library';

interface ScoreNotationCanvasProps {
  system: ScoreSystemData;
  paperTone: PaperTone;
  systemIndex: number;
}

export const ScoreNotationCanvas: React.FC<ScoreNotationCanvasProps> = ({
  system,
  paperTone,
  systemIndex,
}) => {
  const inkColor = paperTone === 'night' ? '#EAE6DF' : '#18181A';
  const mutedInk = paperTone === 'night' ? '#A19D95' : '#636059';
  const staffLineColor = paperTone === 'night' ? 'rgba(234, 230, 223, 0.35)' : 'rgba(24, 24, 26, 0.42)';
  const accentBronze = paperTone === 'night' ? '#D4A373' : '#8C6239';

  // Generate 5 horizontal staff lines at a given Y offset
  const renderStaffLines = (yStart: number) => {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      const y = yStart + i * 7.5;
      lines.push(
        <line
          key={`staff-${yStart}-${i}`}
          x1="44"
          y1={y}
          x2="760"
          y2={y}
          stroke={staffLineColor}
          strokeWidth="0.95"
        />
      );
    }
    return lines;
  };

  // Render musical phrases based on phraseVariant (1..4)
  const renderPhraseNotes = (variant: 1 | 2 | 3 | 4) => {
    // Barlines at x = 235, 415, 595, 760
    const barlines = [235, 415, 595, 760];

    // Coordinates for top staff (y: 35..65) and bottom staff (y: 105..135)
    const variantsConfig = {
      1: {
        // Expressive rising arpeggio and chordal response
        topNotes: [
          { x: 105, y: 61, stemUp: true, beamed: true },
          { x: 132, y: 54, stemUp: true, beamed: true },
          { x: 159, y: 46, stemUp: true, beamed: true },
          { x: 186, y: 39, stemUp: true, beamed: false },
          // Measure 2
          { x: 265, y: 42, stemUp: false, chordY: 54 },
          { x: 315, y: 46, stemUp: false, dotted: true },
          { x: 372, y: 50, stemUp: true },
          // Measure 3
          { x: 445, y: 57, stemUp: true, beamed: true },
          { x: 475, y: 50, stemUp: true, beamed: true },
          { x: 505, y: 42, stemUp: true, beamed: true },
          { x: 545, y: 35, stemUp: false, accent: 'sfz' },
          // Measure 4
          { x: 625, y: 42, stemUp: false, chordY: 50, hollow: true },
          { x: 700, y: 46, stemUp: false, hollow: true },
        ],
        bottomNotes: [
          { x: 105, y: 127, stemUp: true, chordY: 138 },
          { x: 186, y: 120, stemUp: true },
          // Measure 2
          { x: 265, y: 131, stemUp: true, beamed: true },
          { x: 295, y: 120, stemUp: true, beamed: true },
          { x: 325, y: 112, stemUp: true, beamed: true },
          { x: 365, y: 120, stemUp: true },
          // Measure 3
          { x: 445, y: 127, stemUp: true, hollow: true },
          { x: 530, y: 116, stemUp: false },
          // Measure 4
          { x: 625, y: 124, stemUp: true, chordY: 135, hollow: true },
          { x: 700, y: 131, stemUp: true, hollow: true },
        ],
        slurs: [
          'M 105 32 Q 150 14 190 29',
          'M 265 28 Q 320 15 375 34',
          'M 445 30 Q 500 12 550 24',
          'M 625 28 Q 665 18 705 31',
        ],
      },
      2: {
        // Rapid moto perpetuo / sixteenth-note cascade
        topNotes: [
          { x: 102, y: 57, stemUp: true, beamed: true },
          { x: 124, y: 50, stemUp: true, beamed: true },
          { x: 146, y: 42, stemUp: true, beamed: true },
          { x: 168, y: 50, stemUp: true, beamed: true },
          { x: 195, y: 39, stemUp: false },
          // Measure 2
          { x: 260, y: 35, stemUp: false, beamed: true },
          { x: 285, y: 42, stemUp: false, beamed: true },
          { x: 310, y: 50, stemUp: false, beamed: true },
          { x: 335, y: 42, stemUp: false, beamed: true },
          { x: 375, y: 54, stemUp: true, dotted: true },
          // Measure 3
          { x: 442, y: 50, stemUp: true, chordY: 61 },
          { x: 495, y: 46, stemUp: true, chordY: 57 },
          { x: 548, y: 39, stemUp: false, chordY: 50, accent: 'sf' },
          // Measure 4
          { x: 622, y: 42, stemUp: false, beamed: true },
          { x: 652, y: 46, stemUp: false, beamed: true },
          { x: 682, y: 54, stemUp: false, beamed: true },
          { x: 720, y: 57, stemUp: true, hollow: true },
        ],
        bottomNotes: [
          { x: 102, y: 131, stemUp: true },
          { x: 155, y: 124, stemUp: true },
          { x: 195, y: 116, stemUp: false },
          // Measure 2
          { x: 260, y: 120, stemUp: true, chordY: 131, hollow: true },
          { x: 355, y: 127, stemUp: true },
          // Measure 3
          { x: 442, y: 135, stemUp: true, beamed: true },
          { x: 472, y: 124, stemUp: true, beamed: true },
          { x: 502, y: 116, stemUp: true, beamed: true },
          { x: 548, y: 109, stemUp: false },
          // Measure 4
          { x: 622, y: 124, stemUp: true, hollow: true },
          { x: 705, y: 131, stemUp: true, chordY: 142, hollow: true },
        ],
        slurs: [
          'M 102 26 Q 150 10 198 25',
          'M 260 22 Q 320 12 378 32',
          'M 622 25 Q 675 14 725 36',
        ],
      },
      3: {
        // Solemn Chorale / Polyphonic Counterpoint
        topNotes: [
          { x: 110, y: 50, stemUp: true, chordY: 61, hollow: true },
          { x: 185, y: 46, stemUp: true, chordY: 57 },
          // Measure 2
          { x: 265, y: 42, stemUp: false, chordY: 54, dotted: true },
          { x: 345, y: 46, stemUp: true },
          { x: 382, y: 50, stemUp: true },
          // Measure 3
          { x: 448, y: 39, stemUp: false, chordY: 50, hollow: true },
          { x: 535, y: 42, stemUp: false, chordY: 54 },
          // Measure 4
          { x: 625, y: 50, stemUp: true, beamed: true },
          { x: 658, y: 46, stemUp: true, beamed: true },
          { x: 695, y: 54, stemUp: true, chordY: 65, hollow: true },
        ],
        bottomNotes: [
          { x: 110, y: 120, stemUp: false, chordY: 131, hollow: true },
          { x: 185, y: 116, stemUp: false, chordY: 127 },
          // Measure 2
          { x: 265, y: 112, stemUp: false, dotted: true },
          { x: 345, y: 120, stemUp: true },
          // Measure 3
          { x: 448, y: 124, stemUp: true, beamed: true },
          { x: 482, y: 116, stemUp: true, beamed: true },
          { x: 516, y: 120, stemUp: true, beamed: true },
          { x: 555, y: 127, stemUp: true },
          // Measure 4
          { x: 625, y: 120, stemUp: true },
          { x: 695, y: 131, stemUp: true, chordY: 142, hollow: true },
        ],
        slurs: [
          'M 110 30 Q 200 12 270 28',
          'M 448 25 Q 535 12 695 34',
        ],
      },
      4: {
        // Dramatic Fortissimo Syncopated Chords
        topNotes: [
          { x: 108, y: 35, stemUp: false, chordY: 46, accent: 'sf' },
          { x: 158, y: 39, stemUp: false, chordY: 50 },
          { x: 202, y: 35, stemUp: false, chordY: 46 },
          // Measure 2
          { x: 262, y: 31, stemUp: false, chordY: 42, accent: 'sfz' },
          { x: 318, y: 42, stemUp: true, beamed: true },
          { x: 346, y: 50, stemUp: true, beamed: true },
          { x: 376, y: 57, stemUp: true, beamed: true },
          // Measure 3
          { x: 445, y: 46, stemUp: true, chordY: 57, dotted: true },
          { x: 515, y: 39, stemUp: false, chordY: 50 },
          { x: 558, y: 35, stemUp: false, chordY: 46 },
          // Measure 4
          { x: 625, y: 39, stemUp: false, chordY: 50, hollow: true },
          { x: 705, y: 46, stemUp: true, chordY: 57, hollow: true },
        ],
        bottomNotes: [
          { x: 108, y: 135, stemUp: true, chordY: 146 },
          { x: 158, y: 127, stemUp: true, chordY: 138 },
          { x: 202, y: 120, stemUp: true, chordY: 131 },
          // Measure 2
          { x: 262, y: 112, stemUp: false, chordY: 124 },
          { x: 346, y: 127, stemUp: true },
          // Measure 3
          { x: 445, y: 131, stemUp: true, beamed: true },
          { x: 480, y: 120, stemUp: true, beamed: true },
          { x: 515, y: 112, stemUp: true, beamed: true },
          { x: 558, y: 124, stemUp: true },
          // Measure 4
          { x: 625, y: 127, stemUp: true, chordY: 138, hollow: true },
          { x: 705, y: 135, stemUp: true, chordY: 146, hollow: true },
        ],
        slurs: [
          'M 108 20 Q 160 8 205 20',
          'M 445 26 Q 515 12 562 22',
        ],
      },
    };

    const current = variantsConfig[variant];

    const renderNoteGroup = (
      notes: Array<{
        x: number;
        y: number;
        stemUp: boolean;
        beamed?: boolean;
        chordY?: number;
        dotted?: boolean;
        hollow?: boolean;
        accent?: string;
      }>,
      groupKey: string
    ) => {
      // Find consecutive beamed stretches
      const beamElements: React.ReactNode[] = [];
      let beamStart: { x: number; y: number; stemUp: boolean } | null = null;
      let beamEnd: { x: number; y: number; stemUp: boolean } | null = null;

      notes.forEach((n, idx) => {
        if (n.beamed) {
          if (!beamStart) beamStart = n;
          beamEnd = n;
        }
        if ((!n.beamed || idx === notes.length - 1) && beamStart && beamEnd && beamStart !== beamEnd) {
          const yOffset1 = beamStart.stemUp ? beamStart.y - 23 : beamStart.y + 23;
          const yOffset2 = beamEnd.stemUp ? beamEnd.y - 23 : beamEnd.y + 23;
          const xOffset1 = beamStart.stemUp ? beamStart.x + 4 : beamStart.x - 4;
          const xOffset2 = beamEnd.stemUp ? beamEnd.x + 4 : beamEnd.x - 4;
          beamElements.push(
            <g key={`beam-${groupKey}-${idx}`}>
              <line
                x1={xOffset1}
                y1={yOffset1}
                x2={xOffset2}
                y2={yOffset2}
                stroke={inkColor}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {variant === 2 && (
                <line
                  x1={xOffset1}
                  y1={yOffset1 + (beamStart.stemUp ? 5 : -5)}
                  x2={xOffset2}
                  y2={yOffset2 + (beamEnd.stemUp ? 5 : -5)}
                  stroke={inkColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
          beamStart = null;
          beamEnd = null;
        } else if (!n.beamed) {
          beamStart = null;
          beamEnd = null;
        }
      });

      return (
        <g>
          {beamElements}
          {notes.map((n, idx) => {
            const stemX = n.stemUp ? n.x + 4 : n.x - 4;
            const stemTopY = n.stemUp ? n.y - 24 : n.y;
            const stemBottomY = n.stemUp ? (n.chordY ?? n.y) : (n.chordY ?? n.y) + 24;

            return (
              <g key={`${groupKey}-note-${idx}`}>
                {/* Ledger line if outside staff */}
                {(n.y <= 31 || n.y >= 142 || (n.chordY && n.chordY >= 142)) && (
                  <line
                    x1={n.x - 8}
                    y1={n.y <= 31 ? 28 : 143}
                    x2={n.x + 8}
                    y2={n.y <= 31 ? 28 : 143}
                    stroke={inkColor}
                    strokeWidth="1.1"
                  />
                )}

                {/* Primary Notehead */}
                <ellipse
                  cx={n.x}
                  cy={n.y}
                  rx="4.7"
                  ry="3.4"
                  transform={`rotate(-22 ${n.x} ${n.y})`}
                  fill={n.hollow ? 'none' : inkColor}
                  stroke={inkColor}
                  strokeWidth={n.hollow ? '1.6' : '0.5'}
                />

                {/* Optional Chord Notehead */}
                {n.chordY && (
                  <ellipse
                    cx={n.x}
                    cy={n.chordY}
                    rx="4.7"
                    ry="3.4"
                    transform={`rotate(-22 ${n.x} ${n.chordY})`}
                    fill={n.hollow ? 'none' : inkColor}
                    stroke={inkColor}
                    strokeWidth={n.hollow ? '1.6' : '0.5'}
                  />
                )}

                {/* Stem */}
                <line
                  x1={stemX}
                  y1={stemTopY}
                  x2={stemX}
                  y2={stemBottomY}
                  stroke={inkColor}
                  strokeWidth="1.25"
                />

                {/* Rhythm Dot */}
                {n.dotted && (
                  <circle cx={n.x + 9} cy={n.y - 1} r="1.6" fill={inkColor} />
                )}

                {/* Dynamic Accent */}
                {n.accent && (
                  <text
                    x={n.x - 7}
                    y={n.y + 24}
                    fill={inkColor}
                    fontSize="10.5"
                    fontFamily="Cormorant Garamond, Georgia, serif"
                    fontStyle="italic"
                    fontWeight="700"
                  >
                    {n.accent}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      );
    };

    return (
      <g>
        {/* Measure Barlines spanning both Grand Staffs */}
        {barlines.map((bx, bIdx) => (
          <g key={`bar-${bx}`}>
            <line
              x1={bx}
              y1="35"
              x2={bx}
              y2="135"
              stroke={inkColor}
              strokeWidth={bIdx === barlines.length - 1 && systemIndex === 2 ? '2.2' : '1.05'}
            />
            {bIdx === barlines.length - 1 && systemIndex === 2 && (
              <line
                x1={bx - 4}
                y1="35"
                x2={bx - 4}
                y2="135"
                stroke={inkColor}
                strokeWidth="0.9"
              />
            )}
          </g>
        ))}

        {/* Expressive Slur Curves */}
        {current.slurs.map((pathD, sIdx) => (
          <path
            key={`slur-${sIdx}`}
            d={pathD}
            fill="none"
            stroke={inkColor}
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        ))}

        {renderNoteGroup(current.topNotes, 'top')}
        {renderNoteGroup(current.bottomNotes, 'bottom')}
      </g>
    );
  };

  return (
    <div className="my-3 select-none">
      {/* Measure & Tempo Header Row */}
      <div className="flex items-baseline justify-between px-2 mb-0.5">
        <div className="flex items-baseline gap-3">
          <span
            className="font-tabular text-[11px] tracking-tight"
            style={{ color: mutedInk }}
          >
            [{system.measureStart}]
          </span>
          {system.tempoText && (
            <span
              className="font-editorial text-sm sm:text-base font-bold tracking-tight"
              style={{ color: inkColor }}
            >
              {system.tempoText}
            </span>
          )}
        </div>
        {system.keySignatureName && (
          <span
            className="font-tabular text-[10px] uppercase tracking-widest"
            style={{ color: accentBronze }}
          >
            {system.keySignatureName}
          </span>
        )}
      </div>

      {/* SVG Engraved Grand Staff System */}
      <svg
        viewBox="0 0 780 165"
        className="w-full h-auto overflow-visible"
        aria-label={`Musical Score System Measure ${system.measureStart}`}
      >
        {/* Left Grand Staff Brace & Connecting Line */}
        <line
          x1="44"
          y1="35"
          x2="44"
          y2="135"
          stroke={inkColor}
          strokeWidth="1.6"
        />
        <path
          d="M 41 35 C 31 45, 39 75, 29 85 C 39 95, 31 125, 41 135"
          fill="none"
          stroke={inkColor}
          strokeWidth="1.7"
        />

        {/* Top & Bottom 5-Line Staves */}
        {renderStaffLines(35)}
        {renderStaffLines(105)}

        {/* Clef Symbols */}
        <text
          x="50"
          y="61"
          fill={inkColor}
          fontSize="34"
          fontFamily="Cormorant Garamond, Georgia, serif"
        >
          𝄞
        </text>
        <text
          x="50"
          y="129"
          fill={inkColor}
          fontSize="28"
          fontFamily="Cormorant Garamond, Georgia, serif"
        >
          {system.clefBottom === 'bass' ? '𝄢' : '𝄞'}
        </text>

        {/* Time Signature if present */}
        {system.timeSignature && (
          <g>
            <text
              x="76"
              y="49"
              fill={inkColor}
              fontSize="14"
              fontWeight="700"
              fontFamily="Cormorant Garamond, Georgia, serif"
              textAnchor="middle"
            >
              {system.timeSignature.split('/')[0]}
            </text>
            <text
              x="76"
              y="63"
              fill={inkColor}
              fontSize="14"
              fontWeight="700"
              fontFamily="Cormorant Garamond, Georgia, serif"
              textAnchor="middle"
            >
              {system.timeSignature.split('/')[1]}
            </text>
            <text
              x="76"
              y="119"
              fill={inkColor}
              fontSize="14"
              fontWeight="700"
              fontFamily="Cormorant Garamond, Georgia, serif"
              textAnchor="middle"
            >
              {system.timeSignature.split('/')[0]}
            </text>
            <text
              x="76"
              y="133"
              fill={inkColor}
              fontSize="14"
              fontWeight="700"
              fontFamily="Cormorant Garamond, Georgia, serif"
              textAnchor="middle"
            >
              {system.timeSignature.split('/')[1]}
            </text>
          </g>
        )}

        {/* Notes, Beams, Slurs & Measure Barlines */}
        {renderPhraseNotes(system.phraseVariant)}

        {/* Dynamic & Hairpin Marking Between Staves */}
        <text
          x="102"
          y="89"
          fill={inkColor}
          fontSize="13.5"
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontStyle="italic"
          fontWeight="600"
        >
          {system.dynamicMarking}
        </text>

        {/* Subtle Hairpin Crescendo Graphic */}
        <path
          d="M 295 85 L 395 81 M 295 85 L 395 89"
          stroke={inkColor}
          strokeWidth="1"
          fill="none"
          opacity="0.75"
        />

        {/* Editorial Expression Annotation Below System */}
        {system.expressionNote && (
          <text
            x="102"
            y="156"
            fill={mutedInk}
            fontSize="10.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontStyle="italic"
          >
            {system.expressionNote}
          </text>
        )}
      </svg>
    </div>
  );
};
