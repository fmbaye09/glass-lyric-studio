import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Plus,
  Repeat,
  Sparkles,
  Scissors,
  Maximize2,
} from 'lucide-react';

export default function StudioTimeline({
  lyrics,
  selectedLyricId,
  onSelectLyric,
  onUpdateLyric,
  onAddLyricAtTime,
  onDeleteLyric,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  isMuted,
  onToggleMute,
  playbackRate,
  onChangePlaybackRate,
  loopPlayback,
  onToggleLoop,
  isTapSyncActive,
  tapSyncIndex,
  onStartTapSync,
  onTriggerTapSync,
  exportStartSec = 0,
  exportEndSec = 15,
  onChangeExportStart,
  onChangeExportEnd,
}) {
  const scrollContainerRef = useRef(null);
  const trackAreaRef = useRef(null);

  // Pixels per second for timeline zoom (default: fit ~30s comfortably, adjustable 20..220 px/s)
  const [pxPerSec, setPxPerSec] = useState(42);
  const [autoFollowPlayhead, setAutoFollowPlayhead] = useState(true);

  // Dragging state: { type: 'scrub' | 'move' | 'resize-left' | 'resize-right', lyricId, startX, origStart, origEnd }
  const [dragState, setDragState] = useState(null);

  const effectiveDuration = Math.max(10, duration || 30);
  const timelineWidth = Math.max(800, effectiveDuration * pxPerSec + 120);

  // Auto-scroll timeline to keep playhead in view during playback
  useEffect(() => {
    if (!isPlaying || !autoFollowPlayhead || dragState) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const playheadX = currentTime * pxPerSec;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;

    if (playheadX > viewRight - 80 || playheadX < viewLeft) {
      container.scrollLeft = Math.max(0, playheadX - container.clientWidth * 0.25);
    }
  }, [currentTime, isPlaying, autoFollowPlayhead, pxPerSec, dragState]);

  // Convert clientX mouse coordinate to timeline seconds
  const clientXToSeconds = useCallback(
    (clientX) => {
      const trackEl = trackAreaRef.current;
      if (!trackEl) return 0;
      const rect = trackEl.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const sec = offsetX / pxPerSec;
      return Math.max(0, Math.min(effectiveDuration, Number(sec.toFixed(2))));
    },
    [pxPerSec, effectiveDuration]
  );

  // Global mouse move / up listeners when dragging playhead or lyric blocks
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      if (dragState.type === 'scrub') {
        const newTime = clientXToSeconds(e.clientX);
        onSeek(newTime);
        return;
      }

      if (dragState.type === 'export-in') {
        const t = clientXToSeconds(e.clientX);
        if (onChangeExportStart) {
          onChangeExportStart(Math.max(0, Math.min(exportEndSec - 1, Number(t.toFixed(1)))));
        }
        return;
      }

      if (dragState.type === 'export-out') {
        const t = clientXToSeconds(e.clientX);
        if (onChangeExportEnd) {
          onChangeExportEnd(
            Math.max(exportStartSec + 1, Math.min(effectiveDuration, Number(t.toFixed(1))))
          );
        }
        return;
      }

      const deltaPx = e.clientX - dragState.startX;
      const deltaSec = deltaPx / pxPerSec;

      if (dragState.type === 'move') {
        const blockDur = dragState.origEnd - dragState.origStart;
        const newStart = Math.max(
          0,
          Math.min(effectiveDuration - blockDur, Number((dragState.origStart + deltaSec).toFixed(2)))
        );
        const newEnd = Number((newStart + blockDur).toFixed(2));
        onUpdateLyric(dragState.lyricId, { startTime: newStart, endTime: newEnd });
      } else if (dragState.type === 'resize-left') {
        const maxStart = dragState.origEnd - 0.4;
        const newStart = Math.max(
          0,
          Math.min(maxStart, Number((dragState.origStart + deltaSec).toFixed(2)))
        );
        onUpdateLyric(dragState.lyricId, { startTime: newStart });
      } else if (dragState.type === 'resize-right') {
        const minEnd = dragState.origStart + 0.4;
        const newEnd = Math.max(
          minEnd,
          Math.min(effectiveDuration, Number((dragState.origEnd + deltaSec).toFixed(2)))
        );
        onUpdateLyric(dragState.lyricId, { endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, clientXToSeconds, pxPerSec, effectiveDuration, onSeek, onUpdateLyric]);

  // Fit entire song duration into visible timeline width
  const handleFitToWindow = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const idealPx = Math.max(12, Math.min(150, (container.clientWidth - 60) / effectiveDuration));
    setPxPerSec(Math.round(idealPx));
    container.scrollLeft = 0;
  };

  // Jump to previous or next lyric card
  const handlePrevLyric = () => {
    if (!lyrics.length) return;
    const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    const prev = [...sorted].reverse().find((l) => l.startTime < currentTime - 0.3);
    const target = prev || sorted[0];
    onSelectLyric(target.id);
    onSeek(target.startTime + 0.02);
  };

  const handleNextLyric = () => {
    if (!lyrics.length) return;
    const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    const next = sorted.find((l) => l.startTime > currentTime + 0.15);
    const target = next || sorted[sorted.length - 1];
    onSelectLyric(target.id);
    onSeek(target.startTime + 0.02);
  };

  // Split currently active lyric card at playhead position
  const handleSplitAtPlayhead = () => {
    const active = lyrics.find(
      (l) => currentTime > l.startTime + 0.5 && currentTime < l.endTime - 0.5
    );
    if (!active) return;
    const splitTime = Number(currentTime.toFixed(2));
    const origEnd = active.endTime;
    const lines = active.text.split('\n');
    const half = Math.ceil(lines.length / 2);
    const firstText = lines.slice(0, half).join('\n') || active.text;
    const secondText = lines.slice(half).join('\n') || active.text;

    onUpdateLyric(active.id, { endTime: splitTime, text: firstText });
    onAddLyricAtTime(splitTime, origEnd, secondText);
  };

  const formatTimecode = (sec) => {
    const s = Math.max(0, sec || 0);
    const mins = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    const tenths = Math.floor((s % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}.${tenths}`;
  };

  // Generate ruler ticks based on zoom level
  const tickStep = pxPerSec >= 70 ? 1 : pxPerSec >= 30 ? 2 : pxPerSec >= 15 ? 5 : 10;
  const ticks = [];
  for (let t = 0; t <= effectiveDuration; t += tickStep) {
    ticks.push(t);
  }

  return (
    <div className="h-52 border-t border-slate-800/90 bg-[#080C18] flex flex-col shrink-0 select-none z-20">
      {/* ==================== TOP TRANSPORT & TIMELINE TOOLBAR ==================== */}
      <div className="h-11 px-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Playback Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
            title="Retour au début (00:00)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePrevLyric}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
            title="Couplet précédent"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition"
            title="Lecture / Pause"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lecture</span>
              </>
            )}
          </button>

          <button
            onClick={handleNextLyric}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
            title="Couplet suivant"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded-lg border cursor-pointer transition ${
              loopPlayback
                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                : 'bg-slate-800 border-transparent text-slate-400 hover:text-white'
            }`}
            title="Lecture en boucle"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
            title="Couper / Activer le son"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>

          {/* Speed selector */}
          <select
            value={playbackRate}
            onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
            className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-200 border border-slate-700 outline-none cursor-pointer"
            title="Vitesse de lecture (pratique pour synchroniser)"
          >
            <option value={0.5}>0.5x (Lent)</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x (Normal)</option>
            <option value={1.25}>1.25x</option>
          </select>

          {/* Digital Timecode Display */}
          <div className="ml-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">{formatTimecode(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatTimecode(effectiveDuration)}</span>
          </div>
        </div>

        {/* Center: Quick Timeline Editing Actions (Add card, Split at playhead, Tap-Sync) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onAddLyricAtTime(Number(currentTime.toFixed(2)))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition"
            title="Ajouter une carte de paroles à la position du curseur"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Carte ici</span>
          </button>

          <button
            onClick={handleSplitAtPlayhead}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition"
            title="Couper la carte actuelle en deux au niveau du curseur"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span>Scinder</span>
          </button>

          {/* Quick Mark Export In / Out at current playhead */}
          <div className="flex items-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-0.5 gap-1">
            <button
              onClick={() => {
                if (onChangeExportStart) {
                  const t = Number(currentTime.toFixed(1));
                  onChangeExportStart(t);
                  if (exportEndSec <= t + 1 && onChangeExportEnd) {
                    onChangeExportEnd(Math.min(effectiveDuration, Number((t + 15).toFixed(1))));
                  }
                }
              }}
              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[11px] font-bold cursor-pointer transition"
              title="Définir le début de l'export à la position actuelle du curseur"
            >
              [ Début Export ici
            </button>
            <span className="text-[10px] font-mono text-emerald-200 px-1">
              {formatTimecode(exportStartSec).slice(0, 5)} → {formatTimecode(exportEndSec).slice(0, 5)}
            </span>
            <button
              onClick={() => {
                if (onChangeExportEnd) {
                  const t = Math.max(exportStartSec + 1, Number(currentTime.toFixed(1)));
                  onChangeExportEnd(t);
                }
              }}
              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[11px] font-bold cursor-pointer transition"
              title="Définir la fin de l'export à la position actuelle du curseur"
            >
              Fin Export ici ]
            </button>
          </div>

          {!isTapSyncActive ? (
            <button
              onClick={onStartTapSync}
              className="px-3 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tap-Sync en direct</span>
            </button>
          ) : (
            <button
              onClick={onTriggerTapSync}
              className="px-3.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              ⚡ TAPER [Espace] (#{tapSyncIndex + 1}/{lyrics.length})
            </button>
          )}
        </div>

        {/* Right: Timeline Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Zoom Timeline :</span>
          <button
            onClick={() => setPxPerSec((z) => Math.max(12, Math.round(z * 0.75)))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Dézoomer la timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="12"
            max="160"
            value={pxPerSec}
            onChange={(e) => setPxPerSec(parseInt(e.target.value, 10))}
            className="w-20 h-1 hidden sm:block"
          />
          <button
            onClick={() => setPxPerSec((z) => Math.min(160, Math.round(z * 1.3)))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Zoomer la timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitToWindow}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Ajuster toute la musique à la largeur"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================== SCROLLABLE MULTI-TRACK TIMELINE AREA ==================== */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#060913]"
      >
        <div
          ref={trackAreaRef}
          style={{ width: `${timelineWidth}px` }}
          className="h-full relative flex flex-col"
        >
          {/* 1. TIME RULER (Click or drag anywhere on ruler to scrub playhead) */}
          <div
            onMouseDown={(e) => {
              const t = clientXToSeconds(e.clientX);
              onSeek(t);
              setDragState({ type: 'scrub' });
            }}
            className="h-7 bg-slate-900/90 border-b border-slate-800 relative cursor-ew-resize shrink-0"
            title="Cliquer ou glisser pour déplacer la tête de lecture"
          >
            {ticks.map((t) => {
              const leftPx = t * pxPerSec;
              const mins = Math.floor(t / 60);
              const secs = Math.floor(t % 60);
              const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              return (
                <div
                  key={t}
                  style={{ left: `${leftPx}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                >
                  <div className="h-2.5 border-l border-slate-600 pl-1.5 text-[10px] font-mono text-slate-400 leading-none">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. LYRICS BLOCKS TRACK (Draggable & Resizable Blocks) */}
          <div
            onDoubleClick={(e) => {
              const t = clientXToSeconds(e.clientX);
              onAddLyricAtTime(t);
            }}
            className="flex-1 relative bg-slate-950/60 border-b border-slate-800/70 py-2"
            title="Double-cliquez dans un espace vide pour créer une carte de paroles"
          >
            {/* Subtle vertical grid lines */}
            {ticks.map((t) => (
              <div
                key={`grid-${t}`}
                style={{ left: `${t * pxPerSec}px` }}
                className="absolute top-0 bottom-0 border-l border-slate-800/35 pointer-events-none"
              />
            ))}

            {/* Track watermark label */}
            <div className="sticky left-3 top-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 pointer-events-none z-0">
              Piste Paroles (Glisser pour déplacer • Tirer les bords ⟷ pour ajuster la durée)
            </div>

            {/* Lyric Clips */}
            {lyrics.map((item, idx) => {
              const leftPx = item.startTime * pxPerSec;
              const widthPx = Math.max(24, (item.endTime - item.startTime) * pxPerSec);
              const isSelected = selectedLyricId === item.id;
              const isCurrent =
                currentTime >= item.startTime && currentTime <= item.endTime;

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectLyric(item.id);
                    setDragState({
                      type: 'move',
                      lyricId: item.id,
                      startX: e.clientX,
                      origStart: item.startTime,
                      origEnd: item.endTime,
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLyric(item.id);
                  }}
                  className={`absolute top-5 bottom-2 rounded-xl border transition-shadow cursor-grab active:cursor-grabbing flex flex-col justify-between px-2.5 py-1.5 overflow-hidden group ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-500/35 via-amber-400/25 to-yellow-500/30 border-amber-400 shadow-lg shadow-amber-500/15 z-10'
                      : isSelected
                      ? 'bg-sky-500/25 border-sky-400 shadow-md z-10'
                      : 'bg-slate-800/85 hover:bg-slate-800 border-slate-600/80'
                  }`}
                >
                  {/* Left Resize Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectLyric(item.id);
                      setDragState({
                        type: 'resize-left',
                        lyricId: item.id,
                        startX: e.clientX,
                        origStart: item.startTime,
                        origEnd: item.endTime,
                      });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/0 hover:bg-amber-400/80 cursor-ew-resize flex items-center justify-center z-20 transition"
                    title="Glisser pour ajuster le début"
                  >
                    <div className="w-0.5 h-5 bg-white/50 rounded-full" />
                  </div>

                  {/* Clip Header & Text Preview */}
                  <div className="flex items-center justify-between gap-1 pointer-events-none">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-950/70 text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {item.startTime.toFixed(1)}s - {item.endTime.toFixed(1)}s
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white truncate pointer-events-none">
                    {item.text.replace(/\n/g, ' · ').replace(/\*/g, '')}
                  </div>

                  {/* Right Resize Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectLyric(item.id);
                      setDragState({
                        type: 'resize-right',
                        lyricId: item.id,
                        startX: e.clientX,
                        origStart: item.startTime,
                        origEnd: item.endTime,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/0 hover:bg-amber-400/80 cursor-ew-resize flex items-center justify-center z-20 transition"
                    title="Glisser pour ajuster la fin"
                  >
                    <div className="w-0.5 h-5 bg-white/50 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. DECORATIVE AUDIO WAVEFORM TRACK (Click anywhere to seek) */}
          <div
            onMouseDown={(e) => {
              const t = clientXToSeconds(e.clientX);
              onSeek(t);
              setDragState({ type: 'scrub' });
            }}
            className="h-9 bg-slate-950 flex items-center px-1 relative cursor-pointer shrink-0 overflow-hidden"
            title="Piste Audio — Cliquer pour se déplacer dans la chanson"
          >
            <div className="sticky left-3 text-[10px] font-bold uppercase tracking-wider text-sky-400/70 pointer-events-none z-10">
              🎵 Piste Audio
            </div>
            <div className="absolute inset-0 flex items-center gap-[3px] opacity-40 pointer-events-none">
              {Array.from({ length: Math.min(600, Math.floor(timelineWidth / 6)) }).map(
                (_, i) => {
                  const h =
                    25 +
                    35 * Math.abs(Math.sin(i * 0.43)) +
                    25 * Math.abs(Math.cos(i * 0.19));
                  const barSec = (i * 6) / pxPerSec;
                  const isPlayed = barSec <= currentTime;
                  return (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`w-[3px] rounded-full shrink-0 ${
                        isPlayed ? 'bg-amber-400' : 'bg-sky-500/60'
                      }`}
                    />
                  );
                }
              )}
            </div>
          </div>

          {/* 4. VISUAL EXPORT ZONE OVERLAY & DRAGGABLE [ IN / OUT ] HANDLES */}
          {/* Top Export Range Highlight Ribbon */}
          <div
            style={{
              left: `${exportStartSec * pxPerSec}px`,
              width: `${Math.max(8, (exportEndSec - exportStartSec) * pxPerSec)}px`,
            }}
            className="absolute top-0 h-7 bg-emerald-500/20 border-t-2 border-emerald-400 pointer-events-none z-20 flex items-center justify-center"
          >
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 bg-slate-950/80 px-1.5 rounded">
              Zone Export ({Math.max(1, Math.round(exportEndSec - exportStartSec))}s)
            </span>
          </div>

          {/* Left Export Handle [ IN */}
          <div
            style={{ left: `${exportStartSec * pxPerSec}px` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({ type: 'export-in' });
            }}
            className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-25 cursor-ew-resize group"
            title="Glisser pour choisir le début de l'export"
          >
            <div className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[9px] font-extrabold rounded-r-md shadow-md whitespace-nowrap w-max">
              [ DÉBUT
            </div>
          </div>

          {/* Right Export Handle OUT ] */}
          <div
            style={{ left: `${exportEndSec * pxPerSec}px` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({ type: 'export-out' });
            }}
            className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-25 cursor-ew-resize group"
            title="Glisser pour choisir la fin de l'export"
          >
            <div className="px-1.5 py-0.5 -translate-x-full bg-emerald-400 text-slate-950 text-[9px] font-extrabold rounded-l-md shadow-md whitespace-nowrap w-max">
              FIN ]
            </div>
          </div>

          {/* 5. PLAYHEAD NEEDLE (Tête de lecture verticale haute précision) */}
          <div
            style={{ left: `${currentTime * pxPerSec}px` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({ type: 'scrub' });
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 cursor-ew-resize pointer-events-auto shadow-[0_0_10px_rgba(244,63,94,0.9)]"
          >
            {/* Playhead Top Diamond / Cap */}
            <div className="w-4 h-4 -ml-[7px] bg-rose-500 rounded-b-md flex items-center justify-center shadow-md">
              <div className="w-1 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

