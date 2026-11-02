import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Music,
  CheckCircle2,
  Clock,
  Scissors,
} from 'lucide-react';

export default function ExportRangeSelector({
  duration,
  lyrics,
  exportStartSec,
  exportEndSec,
  onChangeStart,
  onChangeEnd,
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlay,
}) {
  const barRef = useRef(null);
  // Drag mode: 'left' | 'right' | 'window' | null
  const [dragMode, setDragMode] = useState(null);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, start: 0, end: 0 });

  const totalDur = Math.max(5, duration || 30);
  const selectedDur = Math.max(1, Number((exportEndSec - exportStartSec).toFixed(1)));

  const formatMMSS = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const clientXToSec = useCallback(
    (clientX) => {
      const el = barRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Number((ratio * totalDur).toFixed(1));
    },
    [totalDur]
  );

  // Pointer drag handling for Left Handle, Right Handle, or Moving the Whole Window
  useEffect(() => {
    if (!dragMode) return;

    const onMove = (e) => {
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const deltaSec = ((e.clientX - dragOrigin.x) / rect.width) * totalDur;

      if (dragMode === 'left') {
        const nextStart = Math.max(
          0,
          Math.min(dragOrigin.end - 1, Number((dragOrigin.start + deltaSec).toFixed(1)))
        );
        onChangeStart(nextStart);
        onSeek(nextStart);
      } else if (dragMode === 'right') {
        const nextEnd = Math.max(
          dragOrigin.start + 1,
          Math.min(totalDur, Number((dragOrigin.end + deltaSec).toFixed(1)))
        );
        onChangeEnd(nextEnd);
      } else if (dragMode === 'window') {
        const winLen = dragOrigin.end - dragOrigin.start;
        const nextStart = Math.max(
          0,
          Math.min(totalDur - winLen, Number((dragOrigin.start + deltaSec).toFixed(1)))
        );
        const nextEnd = Number((nextStart + winLen).toFixed(1));
        onChangeStart(nextStart);
        onChangeEnd(nextEnd);
      }
    };

    const onUp = () => setDragMode(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragMode, dragOrigin, totalDur, onChangeStart, onChangeEnd, onSeek]);

  // Preset 1: Full Song
  const selectFullSong = () => {
    onChangeStart(0);
    onChangeEnd(Number(totalDur.toFixed(1)));
    onSeek(0);
  };

  // Preset 2: All Lyrics Range
  const selectAllLyrics = () => {
    if (!lyrics.length) return selectFullSong();
    const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    const first = Math.max(0, Number(sorted[0].startTime.toFixed(1)));
    const last = Math.min(totalDur, Number(sorted[sorted.length - 1].endTime.toFixed(1)));
    onChangeStart(first);
    onChangeEnd(Math.max(first + 1, last));
    onSeek(first);
  };

  // Preset 3: Fixed TikTok Window (15s, 30s, 45s, 60s) starting from current exportStartSec (or 0)
  const selectFixedDuration = (seconds) => {
    const len = Math.min(totalDur, seconds);
    let start = exportStartSec;
    if (start + len > totalDur) {
      start = Math.max(0, Number((totalDur - len).toFixed(1)));
    }
    const end = Number((start + len).toFixed(1));
    onChangeStart(start);
    onChangeEnd(end);
    onSeek(start);
  };

  // Click on a Couplet Card to include it in the export range
  const handleClickCouplet = (item) => {
    const cStart = Number(item.startTime.toFixed(1));
    const cEnd = Number(Math.min(totalDur, item.endTime).toFixed(1));

    const isInside = cStart >= exportStartSec - 0.2 && cEnd <= exportEndSec + 0.2;
    const isOnlyThisCouplet =
      Math.abs(exportStartSec - cStart) < 0.3 && Math.abs(exportEndSec - cEnd) < 0.3;

    if (isOnlyThisCouplet) {
      // If clicking again on the single selected couplet, expand to all lyrics
      selectAllLyrics();
      return;
    }

    if (!isInside) {
      // Expand range to include this couplet (or if user holds Shift/clicks a second couplet)
      const newStart = Math.min(exportStartSec, cStart);
      const newEnd = Math.max(exportEndSec, cEnd);
      onChangeStart(newStart);
      onChangeEnd(newEnd);
      onSeek(newStart);
    } else {
      // Focus export specifically on this couplet
      onChangeStart(cStart);
      onChangeEnd(Math.max(cStart + 1, cEnd));
      onSeek(cStart);
    }
  };

  // Preview the selected export range
  const handlePreviewRange = () => {
    if (isPlaying) {
      onTogglePlay();
    } else {
      onSeek(exportStartSec);
      onTogglePlay();
    }
  };

  const leftPct = Math.max(0, Math.min(100, (exportStartSec / totalDur) * 100));
  const widthPct = Math.max(
    2,
    Math.min(100 - leftPct, ((exportEndSec - exportStartSec) / totalDur) * 100)
  );
  const playheadPct = Math.max(0, Math.min(100, (currentTime / totalDur) * 100));

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header + Summary Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-emerald-400" />
            Choisir la Partie à Exporter (Sélection Visuelle Facile)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cliquez sur une durée TikTok, sélectionnez vos couplets, ou glissez directement la zone verte.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-extrabold text-emerald-300 font-mono">
            {formatMMSS(exportStartSec)} → {formatMMSS(exportEndSec)}
          </span>
          <span className="text-xs font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-md">
            Durée : {selectedDur}s
          </span>
        </div>
      </div>

      {/* 1. ONE-CLICK QUICK PRESET BUTTONS */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Option A — Choix rapide en 1 clic :
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectFullSong}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              exportStartSec === 0 && Math.abs(exportEndSec - totalDur) < 0.5
                ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Toute la chanson ({Math.round(totalDur)}s)
          </button>

          <button
            onClick={selectAllLyrics}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tous les couplets
          </button>

          {[
            { label: '⚡ TikTok 15s', sec: 15 },
            { label: '🔥 TikTok 30s', sec: 30 },
            { label: '🎬 TikTok 45s', sec: 45 },
            { label: '📀 TikTok 60s', sec: 60 },
          ].map((preset) => (
            <button
              key={preset.sec}
              onClick={() => selectFixedDuration(preset.sec)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                Math.abs(selectedDur - preset.sec) < 0.4
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. INTERACTIVE VISUAL WAVEFORM & SLIDING WINDOW */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Option B — Glisser la fenêtre verte sur la musique :
          </span>
          <button
            onClick={handlePreviewRange}
            className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause aperçu
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Écouter cet extrait ({selectedDur}s)
              </>
            )}
          </button>
        </div>

        {/* Visual Track Box */}
        <div
          ref={barRef}
          onMouseDown={(e) => {
            const clickedSec = clientXToSec(e.clientX);
            onSeek(clickedSec);
          }}
          className="relative h-20 w-full rounded-2xl bg-slate-900 border border-slate-700/80 overflow-hidden select-none cursor-pointer"
        >
          {/* Decorative Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-30 pointer-events-none">
            {Array.from({ length: 90 }).map((_, i) => {
              const h = 25 + 45 * Math.abs(Math.sin(i * 0.55)) + 20 * Math.cos(i * 0.23);
              return (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-1 bg-slate-400 rounded-full"
                />
              );
            })}
          </div>

          {/* Lyric Blocks Mini-Map inside the Bar */}
          {lyrics.map((l, idx) => {
            const lLeft = (l.startTime / totalDur) * 100;
            const lWidth = ((l.endTime - l.startTime) / totalDur) * 100;
            return (
              <div
                key={l.id}
                style={{
                  left: `${Math.max(0, Math.min(100, lLeft))}%`,
                  width: `${Math.max(1, Math.min(100 - lLeft, lWidth))}%`,
                }}
                className="absolute top-2 bottom-2 rounded-md bg-slate-800/90 border border-slate-600/60 px-1.5 py-1 flex flex-col justify-between pointer-events-none overflow-hidden"
              >
                <span className="text-[9px] font-extrabold text-amber-300">#{idx + 1}</span>
                <span className="text-[10px] text-slate-300 truncate">
                  {l.text.replace(/\n/g, ' ').replace(/\*/g, '')}
                </span>
              </div>
            );
          })}

          {/* Darkened Unselected Left & Right Masks */}
          <div
            style={{ width: `${leftPct}%` }}
            className="absolute left-0 top-0 bottom-0 bg-slate-950/75 pointer-events-none"
          />
          <div
            style={{ left: `${leftPct + widthPct}%`, right: 0 }}
            className="absolute top-0 bottom-0 bg-slate-950/75 pointer-events-none"
          />

          {/* ACTIVE EXPORT WINDOW (Draggable Center + Left/Right Handles) */}
          <div
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragOrigin({ x: e.clientX, start: exportStartSec, end: exportEndSec });
              setDragMode('window');
            }}
            className="absolute top-0 bottom-0 bg-emerald-400/20 border-y-2 border-emerald-400 cursor-grab active:cursor-grabbing flex items-center justify-center group"
            title="Glisser au centre pour déplacer toute la fenêtre d'export"
          >
            <div className="px-2.5 py-1 rounded-full bg-slate-950/85 border border-emerald-400/60 text-[11px] font-extrabold text-emerald-300 shadow-lg pointer-events-none flex items-center gap-1.5">
              <span>⟷ Glisser l'extrait ({selectedDur}s)</span>
            </div>

            {/* Left Handle [ */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setDragOrigin({ x: e.clientX, start: exportStartSec, end: exportEndSec });
                setDragMode('left');
              }}
              className="absolute left-0 top-0 bottom-0 w-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex flex-col items-center justify-center cursor-ew-resize shadow-lg"
              title="Glisser pour ajuster le début"
            >
              <div className="w-1 h-7 bg-slate-950/70 rounded-full" />
            </div>

            {/* Right Handle ] */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setDragOrigin({ x: e.clientX, start: exportStartSec, end: exportEndSec });
                setDragMode('right');
              }}
              className="absolute right-0 top-0 bottom-0 w-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex flex-col items-center justify-center cursor-ew-resize shadow-lg"
              title="Glisser pour ajuster la fin"
            >
              <div className="w-1 h-7 bg-slate-950/70 rounded-full" />
            </div>
          </div>

          {/* Current Playhead Line */}
          <div
            style={{ left: `${playheadPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-20"
          />
        </div>
      </div>

      {/* 3. CLICKABLE COUPLETS SELECTOR (No need to know seconds!) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Option C — Ou cliquez directement sur les couplets à inclure :
          </span>
          <span className="text-[11px] text-slate-400">
            Cliquez sur un couplet pour l'ajouter ou cibler uniquement ce couplet
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
          {lyrics.map((item, idx) => {
            const isIncluded =
              item.endTime > exportStartSec + 0.2 && item.startTime < exportEndSec - 0.2;
            return (
              <button
                key={item.id}
                onClick={() => handleClickCouplet(item)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                  isIncluded
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isIncluded
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Couplet #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatMMSS(item.startTime)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold truncate mt-1">
                    {item.text.replace(/\n/g, ' ').replace(/\*/g, '')}
                  </p>
                </div>
                {isIncluded && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

