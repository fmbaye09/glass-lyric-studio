import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Music,
  Image as ImageIcon,
  Type,
  Sparkles,
  Sliders,
  Film,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Eye,
  Wand2,
  FileText,
  Camera,
  Volume2,
  VolumeX,
  Flag,
  Heart,
  Quote,
  Save,
  FolderOpen,
  Layers,
  Clock,
} from 'lucide-react';

import {
  STYLE_PRESETS,
  LYRIC_FONTS,
  SIGNATURE_FONTS,
  COUNTRY_FLAGS,
  BUILTIN_BACKGROUNDS,
  NEUMORPHIC_PALETTES,
  DEFAULT_LYRICS,
  KHASSIDA_SAMPLE_LYRICS,
  parseLyricsFile,
  exportToLRC,
} from './presets/defaultPresets';
import { createDemoAudioBlob, StudioAudioController } from './utils/audioEngine';
import {
  GlassLyricRenderer,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './renderer/canvasRenderer';
import StudioTimeline from './components/StudioTimeline';
import ExportRangeSelector from './components/ExportRangeSelector';

export default function App() {
  // Active Preset & Full Configuration
  const [activePresetId, setActivePresetId] = useState('style1');
  const [config, setConfig] = useState(() => ({
    ...STYLE_PRESETS.style1.config,
  }));

  // Lyrics State
  const [lyrics, setLyrics] = useState(() => DEFAULT_LYRICS);
  const [selectedLyricId, setSelectedLyricId] = useState(DEFAULT_LYRICS[0].id);
  const [bulkLyricsText, setBulkLyricsText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Studio Navigation Tabs
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'lyrics' | 'glass' | 'fonts' | 'export'
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  // Audio & Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [audioFileName, setAudioFileName] = useState('Rythme Démo Mbalax (Intégré)');
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loopPlayback, setLoopPlayback] = useState(true);
  const [uploadedBgVideoUrl, setUploadedBgVideoUrl] = useState(null);
  const [isCanvasScrubbing, setIsCanvasScrubbing] = useState(false);

  // Tap-to-Sync Mode
  const [isTapSyncActive, setIsTapSyncActive] = useState(false);
  const [tapSyncIndex, setTapSyncIndex] = useState(0);

  // Background & Avatar Media Elements
  const [selectedBgId, setSelectedBgId] = useState('dakar-sunset-ai');
  const [bgMediaState, setBgMediaState] = useState({
    type: 'procedural',
    element: null,
    theme: 'dakar-sunset',
  });
  const [customAvatarImg, setCustomAvatarImg] = useState(null);
  const [defaultAvatarImg, setDefaultAvatarImg] = useState(null);

  // Video Export State
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStartSec, setExportStartSec] = useState(0);
  const [exportEndSec, setExportEndSec] = useState(15);
  const [exportFps, setExportFps] = useState(60);
  const [lastExportUrl, setLastExportUrl] = useState(null);
  const [lastExportExt, setLastExportExt] = useState('webm');

  // Refs for Canvas, Renderer, Audio Controller & Animation Loop
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const audioCtrlRef = useRef(null);
  const stateRef = useRef({});
  const mediaRecorderRef = useRef(null);

  // Update helper for config properties
  const updateConfig = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Apply one of the complete visual presets (Style 1, Style 2, Style 3, or Khassida Neumorphism)
  const applyPreset = (presetKey) => {
    const preset = STYLE_PRESETS[presetKey];
    if (!preset) return;
    setActivePresetId(presetKey);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
    }));

    // Automatically switch sample lyrics & background when toggling Khassida Mode
    if (presetKey === 'khassida') {
      setSelectedBgId('touba-neumorphic-bg');
      setBgMediaState({
        type: 'procedural',
        element: null,
        theme: 'touba-neumorphic',
      });
      if (lyrics[0]?.id === 'lyric-1') {
        setLyrics(KHASSIDA_SAMPLE_LYRICS);
        setSelectedLyricId(KHASSIDA_SAMPLE_LYRICS[0].id);
      }
    } else if (lyrics[0]?.id === 'khassida-1') {
      setLyrics(DEFAULT_LYRICS);
      setSelectedLyricId(DEFAULT_LYRICS[0].id);
    }
  };

  // Apply a Neumorphic color palette & sync text/highlight/visualizer colors
  const handleSelectNeumorphicPalette = (pal) => {
    setConfig((prev) => ({
      ...prev,
      visualTheme: 'neumorphism',
      neumorphicPalette: pal.id,
      textColor: pal.textColor,
      highlightColor: pal.accentGold,
      underlineColor: pal.accentGold,
      visualizerColor: pal.accentGold,
    }));
  };

  // Initialize Renderer, Demo Audio, Default Background & Default Avatar on Mount
  useEffect(() => {
    rendererRef.current = new GlassLyricRenderer();
    const audioCtrl = new StudioAudioController();
    audioCtrlRef.current = audioCtrl;
    audioCtrl.audio.loop = true;

    // Generate & Load built-in 30s Afro-Mbalax Demo WAV Track
    const demoBlob = createDemoAudioBlob(30);
    const demoUrl = URL.createObjectURL(demoBlob);
    audioCtrl.loadUrl(demoUrl);

    const onTimeUpdate = () => {
      setCurrentTime(audioCtrl.audio.currentTime);
    };
    const onLoadedMetadata = () => {
      const d = audioCtrl.audio.duration || 30;
      setDuration(d);
      setExportEndSec(Math.min(18, Math.floor(d)));
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setIsTapSyncActive(false);
    };

    audioCtrl.audio.addEventListener('timeupdate', onTimeUpdate);
    audioCtrl.audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audioCtrl.audio.addEventListener('play', onPlay);
    audioCtrl.audio.addEventListener('pause', onPause);
    audioCtrl.audio.addEventListener('ended', onEnded);

    // Load default generated artist avatar
    const defAv = new Image();
    defAv.crossOrigin = 'anonymous';
    defAv.onload = () => setDefaultAvatarImg(defAv);
    defAv.src = '/backgrounds/artist_avatar.jpg';

    // Load default generated Dakar Sunset background
    const defBg = new Image();
    defBg.crossOrigin = 'anonymous';
    defBg.onload = () => {
      setBgMediaState({
        type: 'image',
        element: defBg,
        theme: 'dakar-sunset',
      });
    };
    defBg.src = '/backgrounds/dakar_sunset.png';

    return () => {
      audioCtrl.pause();
      audioCtrl.audio.removeEventListener('timeupdate', onTimeUpdate);
      audioCtrl.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioCtrl.audio.removeEventListener('play', onPlay);
      audioCtrl.audio.removeEventListener('pause', onPause);
      audioCtrl.audio.removeEventListener('ended', onEnded);
      URL.revokeObjectURL(demoUrl);
    };
  }, []);

  // Keep latest state in a ref for the 60fps requestAnimationFrame loop
  useEffect(() => {
    stateRef.current = {
      config,
      lyrics,
      currentTime,
      duration,
      isPlaying,
      bgMedia: bgMediaState,
      avatarImage: customAvatarImg,
      defaultAvatarImage: defaultAvatarImg,
    };
  }, [config, lyrics, currentTime, duration, isPlaying, bgMediaState, customAvatarImg, defaultAvatarImg]);

  // 60FPS Render Loop on Canvas + Smooth 30fps UI Playhead Sync
  useEffect(() => {
    let rafId;
    let lastUiSyncMs = 0;

    const renderLoop = (nowMs) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const audioCtrl = audioCtrlRef.current;

      if (canvas && renderer) {
        const ctx = canvas.getContext('2d');
        const st = stateRef.current;
        const playingNow = Boolean(audioCtrl && !audioCtrl.audio.paused);
        const liveTime = playingNow ? audioCtrl.audio.currentTime : st.currentTime || 0;

        // Smoothly update React timeline playhead state ~30 times/sec while playing
        if (playingNow && nowMs - lastUiSyncMs > 32) {
          lastUiSyncMs = nowMs;
          setCurrentTime(liveTime);
        }

        // Ensure background video plays smoothly without constant seeking stutter
        if (st.bgMedia?.type === 'video' && st.bgMedia.element) {
          const vid = st.bgMedia.element;
          if (playingNow && vid.paused) {
            vid.play().catch(() => {});
          } else if (!playingNow && !vid.paused) {
            vid.pause();
          }
          const vidDur = vid.duration || 10;
          const targetVidTime = liveTime % vidDur;
          if (!vid.seeking && Math.abs(vid.currentTime - targetVidTime) > 1.2) {
            vid.currentTime = targetVidTime;
          }
        }

        const visualizerLevels = audioCtrl
          ? audioCtrl.getVisualizerLevels(
              st.config?.visualizerBars || 39,
              liveTime,
              playingNow
            )
          : [];

        renderer.renderFrame(ctx, {
          ...st,
          currentTime: liveTime,
          isPlaying: playingNow,
          visualizerLevels,
        });
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Play / Pause Toggle
  const togglePlay = useCallback(async () => {
    const audioCtrl = audioCtrlRef.current;
    if (!audioCtrl) return;
    if (audioCtrl.audio.paused) {
      if (audioCtrl.audio.ended || audioCtrl.audio.currentTime >= (duration || 30) - 0.1) {
        audioCtrl.seek(0);
      }
      await audioCtrl.play();
      if (bgMediaState.type === 'video' && bgMediaState.element) {
        bgMediaState.element.play().catch(() => {});
      }
    } else {
      audioCtrl.pause();
      if (bgMediaState.type === 'video' && bgMediaState.element) {
        bgMediaState.element.pause();
      }
    }
  }, [duration, bgMediaState]);

  // Seek Audio & Background Video
  const handleSeek = useCallback(
    (newTime) => {
      const t = Math.max(0, Math.min(duration || 300, Number(newTime) || 0));
      setCurrentTime(t);
      if (audioCtrlRef.current) {
        audioCtrlRef.current.seek(t);
      }
      if (bgMediaState.type === 'video' && bgMediaState.element) {
        const vid = bgMediaState.element;
        const vidDur = vid.duration || 10;
        vid.currentTime = t % vidDur;
      }
    },
    [duration, bgMediaState]
  );

  // Mute / Unmute
  const toggleMute = () => {
    if (!audioCtrlRef.current) return;
    audioCtrlRef.current.audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Playback Rate (0.5x .. 1.25x)
  const handleChangePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (audioCtrlRef.current) {
      audioCtrlRef.current.audio.playbackRate = rate;
    }
    if (bgMediaState.type === 'video' && bgMediaState.element) {
      bgMediaState.element.playbackRate = rate;
    }
  };

  // Loop Toggle
  const handleToggleLoop = () => {
    const next = !loopPlayback;
    setLoopPlayback(next);
    if (audioCtrlRef.current) {
      audioCtrlRef.current.audio.loop = next;
    }
  };

  // Interactive Canvas Click & Scrubbing (Progress Bar & Player Buttons inside 9:16 Preview)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return { x, y };
  };

  const handleCanvasPointerDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    const baseY = config.playerY || 1510;
    const barY = baseY - 120;
    const btnY = baseY + 38;
    const barLeft = 92;
    const barRight = CANVAS_WIDTH - 92;

    // 1. Check if clicking/dragging on the in-video Progress Bar
    if (y >= barY - 45 && y <= barY + 45 && x >= barLeft - 25 && x <= barRight + 25) {
      const ratio = Math.max(0, Math.min(1, (x - barLeft) / (barRight - barLeft)));
      handleSeek(ratio * (duration || 30));
      setIsCanvasScrubbing(true);
      return;
    }

    // 2. Check if clicking Previous Track button (x: 345, y: btnY, r: 65)
    if (Math.hypot(x - 345, y - btnY) <= 68) {
      const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
      const prev = [...sorted].reverse().find((l) => l.startTime < currentTime - 0.3) || sorted[0];
      if (prev) {
        setSelectedLyricId(prev.id);
        handleSeek(prev.startTime + 0.02);
      }
      return;
    }

    // 3. Check if clicking Next Track button (x: 735, y: btnY, r: 65)
    if (Math.hypot(x - 735, y - btnY) <= 68) {
      const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
      const next =
        sorted.find((l) => l.startTime > currentTime + 0.15) || sorted[sorted.length - 1];
      if (next) {
        setSelectedLyricId(next.id);
        handleSeek(next.startTime + 0.02);
      }
      return;
    }

    // 4. Otherwise toggle Play / Pause
    togglePlay();
  };

  useEffect(() => {
    if (!isCanvasScrubbing) return;
    const onMove = (e) => {
      const { x } = getCanvasCoords(e);
      const barLeft = 92;
      const barRight = CANVAS_WIDTH - 92;
      const ratio = Math.max(0, Math.min(1, (x - barLeft) / (barRight - barLeft)));
      handleSeek(ratio * (duration || 30));
    };
    const onUp = () => setIsCanvasScrubbing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isCanvasScrubbing, duration, handleSeek]);

  // Built-in Background Selector
  const handleSelectBuiltinBg = (bgItem) => {
    setSelectedBgId(bgItem.id);
    if (bgItem.type === 'procedural') {
      setBgMediaState({
        type: 'procedural',
        element: null,
        theme: bgItem.fallbackTheme,
      });
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBgMediaState({
          type: 'image',
          element: img,
          theme: bgItem.fallbackTheme || 'dakar-sunset',
        });
      };
      img.onerror = () => {
        setBgMediaState({
          type: 'procedural',
          element: null,
          theme: bgItem.fallbackTheme || 'dakar-sunset',
        });
      };
      img.src = bgItem.url;
    }
  };

  // Custom Background Upload (Image or Video)
  const handleUploadBgFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedBgId('custom');

    if (file.type.startsWith('video/')) {
      setUploadedBgVideoUrl({ url, name: file.name });
      const vid = document.createElement('video');
      vid.src = url;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.crossOrigin = 'anonymous';
      vid.onloadeddata = () => {
        if (audioCtrlRef.current && !audioCtrlRef.current.audio.paused) {
          vid.play().catch(() => {});
        }
        setBgMediaState({ type: 'video', element: vid, theme: 'custom' });
      };
      vid.load();
    } else {
      setUploadedBgVideoUrl(null);
      const img = new Image();
      img.onload = () => {
        setBgMediaState({ type: 'image', element: img, theme: 'custom' });
      };
      img.src = url;
    }
  };

  // Use audio from the uploaded background video
  const handleUseBgVideoAudio = () => {
    if (!uploadedBgVideoUrl || !audioCtrlRef.current) return;
    setAudioFileName(`Audio de : ${uploadedBgVideoUrl.name}`);
    audioCtrlRef.current.loadUrl(uploadedBgVideoUrl.url);
    handleSeek(0);
  };

  // Custom Audio Upload (.mp3, .wav, .m4a, .ogg)
  const handleUploadAudio = (e) => {
    const file = e.target.files?.[0];
    if (!file || !audioCtrlRef.current) return;
    const url = URL.createObjectURL(file);
    setAudioFileName(file.name);
    audioCtrlRef.current.loadUrl(url);
    setCurrentTime(0);
  };

  // Custom Artist Avatar Upload
  const handleUploadAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCustomAvatarImg(img);
      updateConfig('avatarMode', 'custom');
    };
    img.src = url;
  };

  // Lyrics Management Functions
  const updateLyricItem = (id, field, value) => {
    setLyrics((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleUpdateLyricPatch = useCallback((id, patch) => {
    setLyrics((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const addLyricCard = () => {
    const last = lyrics[lyrics.length - 1];
    const start = last ? Number(last.endTime.toFixed(2)) : 0;
    const end = Number((start + 4.5).toFixed(2));
    const newCard = {
      id: `lyric-${Date.now()}`,
      startTime: start,
      endTime: end,
      text: 'Nouvelle phrase,\n*mot en or*\nici...',
    };
    setLyrics((prev) => [...prev, newCard]);
    setSelectedLyricId(newCard.id);
    handleSeek(start + 0.02);
  };

  const handleAddLyricAtTime = useCallback(
    (startSec, customEndSec = null, customText = null) => {
      const start = Math.max(0, Number(startSec.toFixed(2)));
      const end = customEndSec
        ? Number(customEndSec.toFixed(2))
        : Number(Math.min(duration || 30, start + 4.0).toFixed(2));
      const newCard = {
        id: `lyric-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        startTime: start,
        endTime: Math.max(start + 0.8, end),
        text: customText || 'Nouveau couplet,\n*dafa nekk ci*\nSénégal...',
      };
      setLyrics((prev) =>
        [...prev, newCard].sort((a, b) => a.startTime - b.startTime)
      );
      setSelectedLyricId(newCard.id);
    },
    [duration]
  );

  const duplicateLyricCard = (item) => {
    const dur = Math.max(1, item.endTime - item.startTime);
    const newCard = {
      id: `lyric-${Date.now()}`,
      startTime: item.endTime,
      endTime: Number((item.endTime + dur).toFixed(2)),
      text: item.text,
    };
    const idx = lyrics.findIndex((l) => l.id === item.id);
    const copy = [...lyrics];
    copy.splice(idx + 1, 0, newCard);
    setLyrics(copy);
    setSelectedLyricId(newCard.id);
  };

  const deleteLyricCard = (id) => {
    if (lyrics.length <= 1) return;
    setLyrics((prev) => prev.filter((item) => item.id !== id));
  };

  // Extract words and their highlight state (*...*) from a lyric card's text
  const extractWordsWithHighlight = (text = '') => {
    const rawLines = text.split('\n');
    let inHighlight = false;
    let globalIndex = 0;
    const linesOfWords = [];
    const flatWords = [];

    for (const line of rawLines) {
      const lineWords = [];
      let curWord = '';
      let wordHasHighlight = false;

      const flushWord = () => {
        if (curWord.length > 0) {
          const obj = {
            word: curWord,
            highlighted: wordHasHighlight,
            globalIndex: globalIndex++,
          };
          lineWords.push(obj);
          flatWords.push(obj);
          curWord = '';
          wordHasHighlight = false;
        }
      };

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '*') {
          inHighlight = !inHighlight;
        } else if (/\s/.test(ch)) {
          flushWord();
        } else {
          curWord += ch;
          if (inHighlight) wordHasHighlight = true;
        }
      }
      flushWord();
      linesOfWords.push(lineWords);
    }

    return { linesOfWords, flatWords };
  };

  // Toggle a single word's *...* highlight when user clicks its word chip
  const toggleWordHighlightInCard = (item, targetGlobalIdx) => {
    const { linesOfWords } = extractWordsWithHighlight(item.text || '');

    const rebuiltLines = linesOfWords.map((lineWords) => {
      if (lineWords.length === 0) return '';
      const updatedWords = lineWords.map((w) =>
        w.globalIndex === targetGlobalIdx ? { ...w, highlighted: !w.highlighted } : w
      );

      // Group adjacent highlighted words on the same line into a single *...* span
      const chunks = [];
      let i = 0;
      while (i < updatedWords.length) {
        const isHi = updatedWords[i].highlighted;
        const group = [];
        while (i < updatedWords.length && updatedWords[i].highlighted === isHi) {
          group.push(updatedWords[i].word);
          i++;
        }
        chunks.push(isHi ? `*${group.join(' ')}*` : group.join(' '));
      }
      return chunks.join(' ');
    });

    updateLyricItem(item.id, 'text', rebuiltLines.join('\n'));
  };

  // Format seconds as MM:SS for the "Caler Temps (00:48)" button
  const formatTimeMMSS = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  // "Caler Temps" button: stamps current time onto the selected lyric card & advances to next
  const handleCalerTemps = () => {
    const now = Number(currentTime.toFixed(1));
    const idx = lyrics.findIndex((l) => l.id === selectedLyricId);
    const targetIdx = idx !== -1 ? idx : 0;

    setLyrics((prev) => {
      const copy = [...prev];
      if (copy[targetIdx]) {
        copy[targetIdx] = {
          ...copy[targetIdx],
          startTime: now,
          endTime: Math.max(now + 4, copy[targetIdx].endTime),
        };
        if (targetIdx > 0) {
          copy[targetIdx - 1] = {
            ...copy[targetIdx - 1],
            endTime: now,
          };
        }
      }
      return copy;
    });

    if (targetIdx + 1 < lyrics.length) {
      setSelectedLyricId(lyrics[targetIdx + 1].id);
    }
  };

  // Tap-to-Sync Engine (Click or Spacebar to stamp timestamps live!)
  const startTapSyncMode = async () => {
    if (!audioCtrlRef.current) return;
    setTapSyncIndex(0);
    setIsTapSyncActive(true);
    audioCtrlRef.current.seek(0);
    await audioCtrlRef.current.play();
  };

  const triggerTapSyncStep = useCallback(() => {
    if (!isTapSyncActive || !audioCtrlRef.current) return;
    const now = Number(audioCtrlRef.current.audio.currentTime.toFixed(2));

    setLyrics((prev) => {
      const updated = [...prev];
      if (tapSyncIndex < updated.length) {
        updated[tapSyncIndex] = {
          ...updated[tapSyncIndex],
          startTime: tapSyncIndex === 0 ? 0 : now,
          endTime: Math.max(now + 4, updated[tapSyncIndex].endTime),
        };
        if (tapSyncIndex > 0) {
          updated[tapSyncIndex - 1] = {
            ...updated[tapSyncIndex - 1],
            endTime: now,
          };
        }
      }
      return updated;
    });

    if (tapSyncIndex + 1 < lyrics.length) {
      setSelectedLyricId(lyrics[tapSyncIndex + 1].id);
      setTapSyncIndex((i) => i + 1);
    } else {
      setIsTapSyncActive(false);
    }
  }, [isTapSyncActive, tapSyncIndex, lyrics]);

  // Spacebar listener for Tap-to-Sync
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        isTapSyncActive &&
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        triggerTapSyncStep();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTapSyncActive, triggerTapSyncStep]);

  // Import .LRC / .SRT File
  const handleImportLyricsFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      const parsed = parseLyricsFile(content, file.name);
      if (parsed.length > 0) {
        setLyrics(parsed);
        setSelectedLyricId(parsed[0].id);
      }
    };
    reader.readAsText(file);
  };

  // Export .LRC File
  const handleDownloadLRC = () => {
    const lrcContent = exportToLRC(lyrics, {
      artistName: config.artistName,
      songTitle: config.songTitle,
    });
    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(config.songTitle || 'lyrics').replace(/\s+/g, '_')}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper: Format a long single-line or multi-line string into balanced lines (~22-28 chars per line)
  const autoWrapTextString = (str, maxCharsPerLine = 24) => {
    const paragraphs = str
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const resultLines = [];

    for (const para of paragraphs) {
      const cleanLen = para.replace(/\*/g, '').length;
      if (cleanLen <= maxCharsPerLine) {
        resultLines.push(para);
        continue;
      }
      const words = para.split(/\s+/);
      let currentLine = [];
      let currentLen = 0;

      for (const word of words) {
        const wLen = word.replace(/\*/g, '').length;
        if (currentLine.length > 0 && currentLen + 1 + wLen > maxCharsPerLine) {
          resultLines.push(currentLine.join(' '));
          currentLine = [word];
          currentLen = wLen;
        } else {
          currentLine.push(word);
          currentLen += (currentLine.length > 1 ? 1 : 0) + wLen;
        }
      }
      if (currentLine.length > 0) {
        resultLines.push(currentLine.join(' '));
      }
    }
    return resultLines.join('\n');
  };

  // Auto-format all lyric cards to have clean multi-line breaks
  const handleAutoFormatAllCards = () => {
    setLyrics((prev) =>
      prev.map((item) => ({
        ...item,
        text: autoWrapTextString(item.text, 24),
      }))
    );
  };

  // Bulk Paste Text -> Split into Lyric Cards automatically & format lines to fit card
  const handleApplyBulkLyrics = () => {
    if (!bulkLyricsText.trim()) {
      setShowBulkModal(false);
      return;
    }
    let blocks = bulkLyricsText
      .trim()
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    // If user pasted many lines without blank lines between couplets, group every 2-3 lines into a card
    if (blocks.length === 1) {
      const allLines = blocks[0]
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (allLines.length > 3) {
        blocks = [];
        for (let i = 0; i < allLines.length; i += 2) {
          blocks.push(allLines.slice(i, i + 2).join('\n'));
        }
      }
    }

    const totalDur = Math.max(15, duration || 30);
    const step = Number((totalDur / Math.max(1, blocks.length)).toFixed(2));

    const generated = blocks.map((blockText, i) => ({
      id: `lyric-${Date.now()}-${i}`,
      startTime: Number((i * step).toFixed(2)),
      endTime: Number(((i + 1) * step).toFixed(2)),
      text: autoWrapTextString(blockText, 24),
    }));

    setLyrics(generated);
    setSelectedLyricId(generated[0].id);
    setShowBulkModal(false);
  };

  // Instant 1080x1920 PNG Snapshot Download
  const handleDownloadPngSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `GlassLyric_${(config.songTitle || 'TikTok').replace(/\s+/g, '_')}_1080x1920.png`;
    a.click();
  };

  // Save / Load Project JSON
  const handleSaveProjectJson = () => {
    const payload = JSON.stringify({ config, lyrics, activePresetId }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Projet_GlassLyric_${(config.songTitle || 'TikTok').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProjectJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result || '{}'));
        if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
        if (Array.isArray(data.lyrics) && data.lyrics.length > 0) setLyrics(data.lyrics);
        if (data.activePresetId) setActivePresetId(data.activePresetId);
      } catch (err) {
        console.error('Invalid project file:', err);
      }
    };
    reader.readAsText(file);
  };

  // Full HD Video Export (Canvas Stream + Web Audio Track -> MP4 / WebM)
  const handleStartVideoExport = async () => {
    const canvas = canvasRef.current;
    const audioCtrl = audioCtrlRef.current;
    if (!canvas || !audioCtrl || isExportingVideo) return;

    const startSec = Math.max(0, Number(exportStartSec) || 0);
    const endSec = Math.max(startSec + 1, Number(exportEndSec) || 15);
    const totalExportDur = endSec - startSec;

    setIsExportingVideo(true);
    setExportProgress(0);
    setLastExportUrl(null);

    // Seek audio to startSec & start playing so audio + visualizer + lyrics record in real time
    audioCtrl.seek(startSec);
    await audioCtrl.play();

    const canvasStream = canvas.captureStream(exportFps);
    const audioTrack = audioCtrl.getAudioStreamTrack();
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    // Prefer native MP4 (H.264 + AAC) if supported by browser, otherwise high-bitrate WebM
    const mimeCandidates = [
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' },
    ];
    const chosen =
      mimeCandidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) ||
      mimeCandidates[mimeCandidates.length - 1];

    const chunks = [];
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: chosen.mime,
      videoBitsPerSecond: 12_000_000, // 12 Mbps Crisp 1080p quality
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    recorder.onstop = () => {
      audioCtrl.pause();
      const blob = new Blob(chunks, { type: chosen.mime });
      const url = URL.createObjectURL(blob);
      setLastExportUrl(url);
      setLastExportExt(chosen.ext);
      setIsExportingVideo(false);
      setExportProgress(100);

      // Trigger automatic download
      const a = document.createElement('a');
      a.href = url;
      a.download = `GlassLyric_${(config.songTitle || 'TikTok').replace(/\s+/g, '_')}.${chosen.ext}`;
      a.click();
    };

    recorder.start(100);

    // Track progress until endSec
    const checkInterval = setInterval(() => {
      const cur = audioCtrl.audio.currentTime;
      const elapsed = Math.max(0, cur - startSec);
      const pct = Math.min(99, Math.round((elapsed / totalExportDur) * 100));
      setExportProgress(pct);

      if (cur >= endSec || audioCtrl.audio.ended || recorder.state !== 'recording') {
        clearInterval(checkInterval);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    }, 100);
  };

  const handleStopVideoExportEarly = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const activeLyricObj =
    lyrics.find((l) => currentTime >= l.startTime && currentTime <= l.endTime) || lyrics[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060913] text-slate-100 overflow-hidden select-none">
      {/* ==================== TOP STUDIO HEADER BAR ==================== */}
      <header className="h-16 px-5 border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-sky-400 p-[2px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-amber-200 to-sky-300 bg-clip-text text-transparent">
                GLASS LYRIC STUDIO
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                TikTok 9:16 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Générateur automatisé de décors Glassmorphic, Paroles & Styles
            </p>
          </div>
        </div>

        {/* Instant Visual Presets Switcher (Image 1, Image 2, Style 3, Mode Khassida) */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 px-2.5 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Modèles :
          </span>
          {Object.values(STYLE_PRESETS).map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activePresetId === preset.id
                  ? preset.id === 'khassida'
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {preset.id === 'style1'
                ? '🇸🇳 Style 1 (Drapeaux & Pilule)'
                : preset.id === 'style2'
                ? '💛 Style 2 (Guillemets & TikTok)'
                : preset.id === 'khassida'
                ? '🕌 Mode Khassida (Neumorphism)'
                : '✨ Style 3 (Cristal Néon)'}
            </button>
          ))}
        </div>

        {/* Right Actions: Reference Viewer, Save/Load, PNG Snapshot, Video Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReferenceModal(true)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 flex items-center gap-1.5 cursor-pointer transition"
            title="Comparer avec vos 2 images modèles"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Images Modèles</span>
          </button>

          <button
            onClick={handleSaveProjectJson}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 cursor-pointer transition"
            title="Sauvegarder le projet (.json)"
          >
            <Save className="w-4 h-4 text-slate-300" />
          </button>

          <label
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 cursor-pointer transition"
            title="Charger un projet (.json)"
          >
            <FolderOpen className="w-4 h-4 text-slate-300" />
            <input
              type="file"
              accept=".json"
              onChange={handleLoadProjectJson}
              className="hidden"
            />
          </label>

          <button
            onClick={handleDownloadPngSnapshot}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
            title="Capturer l'image actuelle en 1080x1920 PNG"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Capture PNG</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer transition"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Exporter Vidéo</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: STUDIO CONTROLS (TABS + SETTINGS) */}
        <div className="w-full lg:w-[58%] xl:w-[60%] flex flex-col border-r border-slate-800/80 bg-slate-900/40">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/60 px-4 pt-2 gap-1 shrink-0 overflow-x-auto">
            {[
              { id: 'media', label: '1. Média & Artiste', icon: Music },
              { id: 'lyrics', label: '2. Paroles & Sync', icon: FileText },
              { id: 'glass', label: '3. Décor Glass / Neumorphic', icon: Layers },
              { id: 'fonts', label: '4. Polices & Styles', icon: Type },
              { id: 'export', label: '5. Export Vidéo HD', icon: Film },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900/90 text-amber-400 border-amber-400 shadow-inner'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ==================== TAB 1: MEDIA & ARTISTE ==================== */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Quick Preset Cards */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    Choisir le Style Visuel de Base (Glassmorphism ou Mode Khassida Neumorphism)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {Object.values(STYLE_PRESETS).map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          activePresetId === preset.id
                            ? preset.id === 'khassida'
                              ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                              : 'bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">
                              {preset.name}
                            </span>
                            {activePresetId === preset.id && (
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick 1-Click Neumorphic Color Chips (Blanc, Beige, Émeraude, Ivoire...) */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 mr-1">
                      🎨 Thèmes Neumorphism (Mode Khassida) :
                    </span>
                    {NEUMORPHIC_PALETTES.map((pal) => {
                      const isActivePal =
                        config.visualTheme === 'neumorphism' &&
                        config.neumorphicPalette === pal.id;
                      return (
                        <button
                          key={pal.id}
                          onClick={() => {
                            if (config.visualTheme !== 'neumorphism') {
                              applyPreset('khassida');
                            }
                            handleSelectNeumorphicPalette(pal);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition cursor-pointer ${
                            isActivePal
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border shrink-0"
                            style={{
                              backgroundColor: pal.surface,
                              borderColor: pal.accentGold,
                            }}
                          />
                          <span>{pal.name.split('(')[0].trim()}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Audio Track Upload */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-sky-400" />
                      Piste Musicale (Audio MP3 / WAV / M4A)
                    </h2>
                    <span className="text-xs text-amber-300 font-medium bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                      Actif : {audioFileName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-sky-500/20">
                      <Upload className="w-4 h-4" />
                      Importer votre Musique (MP3 / WAV)
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleUploadAudio}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-400">
                      L'égaliseur sonore et le lecteur réagissent automatiquement aux fréquences de votre chanson.
                    </p>
                  </div>
                </section>

                {/* Background Image / Video Section */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Image ou Vidéo de Fond (9:16)
                    </h2>
                    <div className="flex items-center gap-2">
                      {uploadedBgVideoUrl && (
                        <button
                          onClick={handleUseBgVideoAudio}
                          className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Music className="w-3.5 h-3.5" />
                          Utiliser le son de la vidéo
                        </button>
                      )}
                      <label className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        Importer Photo / Vidéo de Fond
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleUploadBgFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Built-in Backgrounds Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {BUILTIN_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => handleSelectBuiltinBg(bg)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          selectedBgId === bg.id
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{bg.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {bg.id.startsWith('ref-') ? 'Image modèle originale' : 'Fond HD sans texte'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Background Adjustments */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Assombrir le fond</span>
                        <span className="text-amber-400 font-semibold">
                          {Math.round(config.bgDarken * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.75"
                        step="0.02"
                        value={config.bgDarken}
                        onChange={(e) => updateConfig('bgDarken', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Vignette Cinéma</span>
                        <span className="text-amber-400 font-semibold">
                          {Math.round(config.bgVignette * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.85"
                        step="0.05"
                        value={config.bgVignette}
                        onChange={(e) => updateConfig('bgVignette', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-200 font-medium">
                        Zoom lent (Ken Burns)
                      </span>
                      <input
                        type="checkbox"
                        checked={config.kenBurnsEffect}
                        onChange={(e) => updateConfig('kenBurnsEffect', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </div>
                  </div>
                </section>

                {/* Artist Header Pill Info */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Pilule Artiste en Haut (Header Glassmorphic)
                    </h2>
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {[
                        { id: 'large', label: 'Large (Image 1)' },
                        { id: 'compact', label: 'Compact + Onde (Image 2)' },
                        { id: 'hidden', label: 'Masqué' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => updateConfig('headerStyle', st.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                            config.headerStyle === st.id
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Nom de l'Artiste
                      </label>
                      <input
                        type="text"
                        value={config.artistName}
                        onChange={(e) => updateConfig('artistName', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-400 outline-none"
                        placeholder="Ex: Wally Seck"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Titre de la Chanson
                      </label>
                      <input
                        type="text"
                        value={config.songTitle}
                        onChange={(e) => updateConfig('songTitle', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-400 outline-none"
                        placeholder="Ex: Boul Faalé"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Sous-titre / Genre (Style 1)
                      </label>
                      <input
                        type="text"
                        value={config.songSubtitle}
                        onChange={(e) => updateConfig('songSubtitle', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-400 outline-none"
                        placeholder="Ex: Musique Sénégalaise 🇸🇳"
                      />
                    </div>

                    <div className="flex flex-col justify-end gap-2">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          Photo Artiste
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadAvatar}
                            className="hidden"
                          />
                        </label>

                        <button
                          onClick={() => {
                            const nextMode =
                              config.avatarMode === 'portrait'
                                ? 'crown-logo'
                                : config.avatarMode === 'crown-logo'
                                ? 'mosque-logo'
                                : 'portrait';
                            updateConfig('avatarMode', nextMode);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 cursor-pointer"
                        >
                          {config.avatarMode === 'crown-logo'
                            ? '👑 Logo Couronne'
                            : config.avatarMode === 'mosque-logo'
                            ? '🕌 Logo Mosquée Touba'
                            : '🧑 Photo Portrait'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ==================== TAB 2: PAROLES & SYNCHRONISATION ==================== */}
            {activeTab === 'lyrics' && (
              <div className="space-y-4">
                {/* Top Header Bar Matching Screenshot: "Astuce : Cliquez sur un mot..." + "Caler Temps (00:48)" */}
                <div className="bg-[#0b1020] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-300 font-medium">
                      Astuce : Cliquez sur un mot pour le surligner en{' '}
                      <span className="text-[#FACC15] font-extrabold">Jaune Or</span>
                    </p>

                    <button
                      onClick={handleCalerTemps}
                      className="px-4 py-2 rounded-xl bg-[#2a2412] hover:bg-[#383016] text-[#FACC15] border border-[#FACC15]/40 font-extrabold text-xs flex items-center gap-2 cursor-pointer transition shadow-md"
                      title="Caler le début de la carte sélectionnée sur le temps actuel de la chanson"
                    >
                      <Clock className="w-4 h-4 text-[#FACC15]" />
                      <span>Caler Temps ({formatTimeMMSS(currentTime)})</span>
                    </button>
                  </div>

                  {/* Secondary Tools Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/70">
                    {!isTapSyncActive ? (
                      <button
                        onClick={startTapSyncMode}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Tap-Sync en direct
                      </button>
                    ) : (
                      <button
                        onClick={triggerTapSyncStep}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer"
                      >
                        ⚡ TAPER [Espace] (#{tapSyncIndex + 1}/{lyrics.length})
                      </button>
                    )}

                    <button
                      onClick={handleAutoFormatAllCards}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-xs font-semibold text-sky-300 border border-sky-500/30 cursor-pointer flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Auto-Lignes
                    </button>

                    <button
                      onClick={() => {
                        setBulkLyricsText(lyrics.map((l) => l.text).join('\n\n'));
                        setShowBulkModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Coller Texte
                    </button>

                    <label className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      .LRC / .SRT
                      <input
                        type="file"
                        accept=".lrc,.srt,.txt"
                        onChange={handleImportLyricsFile}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={() => {
                        setLyrics(KHASSIDA_SAMPLE_LYRICS);
                        setSelectedLyricId(KHASSIDA_SAMPLE_LYRICS[0].id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-300 border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                      title="Charger un exemple de couplets Khassida (Arabe + Transcription)"
                    >
                      🕌 Exemple Khassida
                    </button>

                    <button
                      onClick={handleDownloadLRC}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      Exporter .LRC
                    </button>
                  </div>
                </div>

                {/* Lyric Cards List (Exact Screenshot Layout) */}
                <div className="space-y-4">
                  {lyrics.map((item, idx) => {
                    const isCurrent =
                      activeLyricObj?.id === item.id || selectedLyricId === item.id;
                    const { flatWords } = extractWordsWithHighlight(item.text || '');
                    const cardUnderlineEnabled =
                      item.showUnderline !== undefined
                        ? item.showUnderline
                        : config.showBrushUnderline;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLyricId(item.id);
                          if (!isPlaying) {
                            handleSeek(item.startTime + 0.02);
                          }
                        }}
                        className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                          isCurrent
                            ? 'bg-[#0e1526] border-[#FACC15]/70 shadow-lg shadow-amber-500/5'
                            : 'bg-[#0b101e] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {/* TOP ROW: #01 · Début [ 0 ] -> Fin [ 4,5 ]   [Trait Pinceau] [Trash] */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`font-extrabold text-sm font-mono ${
                                isCurrent ? 'text-[#FACC15]' : 'text-slate-400'
                              }`}
                            >
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 font-medium">Début</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.startTime}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                updateLyricItem(
                                  item.id,
                                  'startTime',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2.5 py-1 rounded-lg bg-[#050811] border border-slate-800 text-white font-mono text-xs font-bold focus:border-[#FACC15] outline-none"
                            />
                            <span className="text-slate-500">→</span>
                            <span className="text-slate-400 font-medium">Fin</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.endTime}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                updateLyricItem(
                                  item.id,
                                  'endTime',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2.5 py-1 rounded-lg bg-[#050811] border border-slate-800 text-white font-mono text-xs font-bold focus:border-[#FACC15] outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLyricItem(
                                  item.id,
                                  'showUnderline',
                                  !cardUnderlineEnabled
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer leading-tight text-center ${
                                cardUnderlineEnabled
                                  ? 'bg-[#3b3216] hover:bg-[#4d411b] text-[#FACC15] border border-[#FACC15]/30'
                                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 border border-slate-700/60'
                              }`}
                              title="Activer / Désactiver le trait de pinceau jaune sous ce couplet"
                            >
                              Trait
                              <br />
                              Pinceau
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateLyricCard(item);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 cursor-pointer transition"
                              title="Dupliquer ce couplet"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLyricCard(item.id);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition"
                              title="Supprimer ce couplet"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* MIDDLE TEXTAREA BOX */}
                        <textarea
                          rows={2}
                          value={item.text}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateLyricItem(item.id, 'text', e.target.value)
                          }
                          className="w-full p-3.5 rounded-xl bg-[#040711] border border-slate-800/90 focus:border-[#FACC15]/70 text-base text-white font-semibold outline-none resize-y leading-snug"
                          placeholder="Saisissez les paroles du couplet..."
                        />

                        {/* BOTTOM INTERACTIVE WORD CHIPS BAR */}
                        <div className="pt-1 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                            <span>Cliquez sur les mots à colorer en jaune pinceau :</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {flatWords.length > 0 ? (
                              flatWords.map((wObj) => (
                                <button
                                  key={wObj.globalIndex}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWordHighlightInCard(item, wObj.globalIndex);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    wObj.highlighted
                                      ? 'bg-[#FACC15] hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20'
                                      : 'bg-[#121a2d] hover:bg-[#1a2540] text-slate-200 border border-slate-700/80'
                                  }`}
                                >
                                  {wObj.word}
                                </button>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Aucun mot saisi...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={addLyricCard}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#FACC15] text-slate-300 hover:text-[#FACC15] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une Nouvelle Carte de Paroles
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: DECOR GLASSMORPHIC / NEUMORPHIC ==================== */}
            {activeTab === 'glass' && (
              <div className="space-y-6">
                {/* Visual Theme Switcher: Glassmorphism vs Neumorphism (Khassida) */}
                <section className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Moteur de Thème : Glassmorphism vs Neumorphism (Mode Khassida 🕌)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Basculez entre le verre translucide et le relief tactile Soft-UI (Neumorphism) conçu pour les Khassidas.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => updateConfig('visualTheme', 'glassmorphism')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                          config.visualTheme !== 'neumorphism'
                            ? 'bg-sky-400 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        💎 Verre Glassmorphic
                      </button>
                      <button
                        onClick={() => applyPreset('khassida')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                          config.visualTheme === 'neumorphism'
                            ? 'bg-gradient-to-r from-emerald-400 to-amber-400 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🕌 Mode Khassida (Neumorphism)
                      </button>
                    </div>
                  </div>

                  {/* Neumorphic Palettes & Khassida Ornaments Controls */}
                  {config.visualTheme === 'neumorphism' && (
                    <div className="space-y-4 pt-3 border-t border-slate-800/80">
                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-2">
                          Palette Neumorphic Soft-UI (Blanc, Beige, Émeraude, Ivoire, Obsidienne) :
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {NEUMORPHIC_PALETTES.map((pal) => {
                            const isSelected = config.neumorphicPalette === pal.id;
                            return (
                              <button
                                key={pal.id}
                                onClick={() => handleSelectNeumorphicPalette(pal)}
                                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                                  isSelected
                                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div
                                  className="w-9 h-9 rounded-xl shrink-0 border flex items-center justify-center font-bold text-sm"
                                  style={{
                                    backgroundColor: pal.surface,
                                    borderColor: pal.accentGold,
                                    color: pal.accentGold,
                                    boxShadow: `3px 3px 6px ${pal.shadowDark}`,
                                  }}
                                >
                                  ☪
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{pal.name}</div>
                                  <div
                                    className="text-[10px] truncate font-medium"
                                    style={{ color: pal.accentGold }}
                                  >
                                    Relief Soft-UI
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Profondeur du Relief 3D</span>
                            <span className="text-emerald-400 font-semibold">
                              {Math.round((config.neumorphicRelief ?? 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.4"
                            max="1.6"
                            step="0.05"
                            value={config.neumorphicRelief ?? 1.0}
                            onChange={(e) =>
                              updateConfig('neumorphicRelief', parseFloat(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-slate-300 mb-1">
                            Calligraphie Sacrée en Haut de la Carte (Ex: ﷽ ou ۞ خَصِيدَة ۞)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={config.khassidaHeaderCalligraphy ?? '﷽'}
                              onChange={(e) =>
                                updateConfig('khassidaHeaderCalligraphy', e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-amber-300 font-bold outline-none"
                              placeholder="﷽"
                            />
                            {['﷽', '۞ خَصِيدَة ۞', 'يَا رَسُولَ اللَّهِ', ''].map((presetCal, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  updateConfig('khassidaHeaderCalligraphy', presetCal)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 cursor-pointer"
                              >
                                {presetCal || 'Aucun'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                          <span className="text-xs font-semibold text-slate-200">
                            Cadre Intérieur Creusé (Neumorphic Inset Well)
                          </span>
                          <input
                            type="checkbox"
                            checked={config.neumorphicInsetFrame !== false}
                            onChange={(e) =>
                              updateConfig('neumorphicInsetFrame', e.target.checked)
                            }
                            className="w-4 h-4 accent-emerald-400"
                          />
                        </label>

                        <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                          <span className="text-xs font-semibold text-slate-200">
                            Décorations Islamiques (Croissant de Lune ☪, Lanternes & Mosquée)
                          </span>
                          <input
                            type="checkbox"
                            checked={config.showIslamicOrnaments !== false}
                            onChange={(e) =>
                              updateConfig('showIslamicOrnaments', e.target.checked)
                            }
                            className="w-4 h-4 accent-emerald-400"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </section>

                {/* Main Glass Card Customization */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    Carte Centrale Glassmorphic (Verre Dépoli & Reflets Lumineux)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Flou du Verre (Blur)</span>
                        <span className="text-amber-400 font-semibold">{config.glassBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="40"
                        step="1"
                        value={config.glassBlur}
                        onChange={(e) => updateConfig('glassBlur', parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Opacité du Verre</span>
                        <span className="text-amber-400 font-semibold">
                          {Math.round(config.glassOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.7"
                        step="0.02"
                        value={config.glassOpacity}
                        onChange={(e) =>
                          updateConfig('glassOpacity', parseFloat(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Arrondi des Coins</span>
                        <span className="text-amber-400 font-semibold">
                          {config.cardBorderRadius}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="110"
                        step="2"
                        value={config.cardBorderRadius}
                        onChange={(e) =>
                          updateConfig('cardBorderRadius', parseInt(e.target.value, 10))
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Intensité Lueur des Coins</span>
                        <span className="text-amber-400 font-semibold">
                          {Math.round(config.rimLightIntensity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.2"
                        step="0.05"
                        value={config.rimLightIntensity}
                        onChange={(e) =>
                          updateConfig('rimLightIntensity', parseFloat(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300">Reflet Coin Haut-Gauche</span>
                      <input
                        type="color"
                        value={config.rimLightPrimary}
                        onChange={(e) => updateConfig('rimLightPrimary', e.target.value)}
                        className="w-8 h-7 rounded cursor-pointer bg-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300">Reflet Coin Bas-Droite</span>
                      <input
                        type="color"
                        value={config.rimLightSecondary}
                        onChange={(e) => updateConfig('rimLightSecondary', e.target.value)}
                        className="w-8 h-7 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Decorative Card Elements (Quote marks, Heart, Underline) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
                    <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <Quote className="w-4 h-4 text-sky-400" />
                        Guillemets 3D “ (Style 2)
                      </span>
                      <input
                        type="checkbox"
                        checked={config.showQuoteMarks}
                        onChange={(e) => updateConfig('showQuoteMarks', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-amber-400" />
                        Cœur Pinceau ♡ (Style 2)
                      </span>
                      <input
                        type="checkbox"
                        checked={config.showCardHeart}
                        onChange={(e) => updateConfig('showCardHeart', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Soulignement Pinceau Or
                      </span>
                      <input
                        type="checkbox"
                        checked={config.showBrushUnderline}
                        onChange={(e) => updateConfig('showBrushUnderline', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>
                  </div>
                </section>

                {/* Country Flags & Floating Notes */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-emerald-400" />
                    Drapeaux Nationaux & Notes de Musique Flottantes (♪ ♫)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Pays du Drapeau
                      </label>
                      <select
                        value={config.flagCountry}
                        onChange={(e) => updateConfig('flagCountry', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold outline-none"
                      >
                        {COUNTRY_FLAGS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Style du Drapeau Haut-Gauche
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            updateConfig('showTopLeftFlag', true);
                            updateConfig('topLeftFlagStyle', 'corner-wave');
                          }}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                            config.showTopLeftFlag && config.topLeftFlagStyle === 'corner-wave'
                              ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Drapé en Coin (Image 1)
                        </button>
                        <button
                          onClick={() => {
                            updateConfig('showTopLeftFlag', true);
                            updateConfig('topLeftFlagStyle', 'flagpole');
                          }}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                            config.showTopLeftFlag && config.topLeftFlagStyle === 'flagpole'
                              ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Sur Mât (Image 2)
                        </button>
                        <button
                          onClick={() => updateConfig('showTopLeftFlag', false)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                            !config.showTopLeftFlag
                              ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Off
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-200">
                        Drapeau Ruban en Bas à Droite (Image 1)
                      </span>
                      <input
                        type="checkbox"
                        checked={config.showBottomRightFlag}
                        onChange={(e) => updateConfig('showBottomRightFlag', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-200">
                        Notes de Musique en Verre 3D (♪ ♫)
                      </span>
                      <input
                        type="checkbox"
                        checked={config.showFloatingNotes}
                        onChange={(e) => updateConfig('showFloatingNotes', e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>
                  </div>
                </section>

                {/* Bottom Signature & Right Overlay (#Hashtag vs TikTok Icons) */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white">
                    Signature Bas-Gauche & Overlay Bas-Droite (#Hashtag ou TikTok)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Signature Calligraphique (Bas-Gauche)
                      </label>
                      <textarea
                        rows={2}
                        value={config.bottomLeftText}
                        onChange={(e) => updateConfig('bottomLeftText', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                        placeholder="Ex: Sénégal ou Musique Sénégalaise"
                      />
                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.bottomLeftShowHeart}
                            onChange={(e) =>
                              updateConfig('bottomLeftShowHeart', e.target.checked)
                            }
                            className="accent-amber-400"
                          />
                          Petit Cœur ♡ (Style 1)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.bottomLeftShowBrushFlag}
                            onChange={(e) =>
                              updateConfig('bottomLeftShowBrushFlag', e.target.checked)
                            }
                            className="accent-amber-400"
                          />
                          Drapeau Peint (Style 2)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Élément en Bas à Droite
                        </label>
                        <div className="flex gap-1.5">
                          {[
                            { id: 'hashtag-pill', label: 'Pilule #Hashtag (Image 1)' },
                            { id: 'tiktok-icons', label: 'Icônes TikTok (Image 2)' },
                            { id: 'none', label: 'Aucun' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => updateConfig('bottomRightMode', m.id)}
                              className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                                config.bottomRightMode === m.id
                                  ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {config.bottomRightMode === 'hashtag-pill' && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Texte du Badge Hashtag
                          </label>
                          <input
                            type="text"
                            value={config.hashtagText}
                            onChange={(e) => updateConfig('hashtagText', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ==================== TAB 4: POLICES & STYLES ==================== */}
            {activeTab === 'fonts' && (
              <div className="space-y-6">
                {/* Font Family Selector Grid */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4 text-amber-400" />
                    Police des Paroles (Brush, Calligraphie & Moderne)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {LYRIC_FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => updateConfig('fontFamily', f.id)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                          config.fontFamily === f.id
                            ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="text-xl truncate mb-1 text-white"
                          style={{
                            fontFamily: f.family,
                            fontWeight: f.weight,
                            fontStyle: f.style,
                          }}
                        >
                          Boul Faalé Sénégal
                        </div>
                        <div className="text-[11px] text-slate-400">{f.name}</div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Size, Colors & Animation */}
                <section className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white">
                    Taille, Couleurs Or/Blanc & Animation des Paroles
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Taille de la Police</span>
                        <span className="text-amber-400 font-semibold">{config.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="54"
                        max="140"
                        step="2"
                        value={config.fontSize}
                        onChange={(e) => updateConfig('fontSize', parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Interligne (Espacement)</span>
                        <span className="text-amber-400 font-semibold">{config.lineHeight}</span>
                      </div>
                      <input
                        type="range"
                        min="0.95"
                        max="1.6"
                        step="0.02"
                        value={config.lineHeight}
                        onChange={(e) => updateConfig('lineHeight', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-slate-200">
                        Couleur du Texte Principal
                      </span>
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => updateConfig('textColor', e.target.value)}
                        className="w-9 h-7 rounded cursor-pointer bg-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-amber-300">
                        Couleur des Mots Surlignés (*mot*)
                      </span>
                      <input
                        type="color"
                        value={config.highlightColor}
                        onChange={(e) => {
                          updateConfig('highlightColor', e.target.value);
                          updateConfig('underlineColor', e.target.value);
                        }}
                        className="w-9 h-7 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Lyric Transition Style */}
                  <div className="pt-2">
                    <label className="block text-xs text-slate-400 mb-2">
                      Animation d'Apparition des Paroles
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'pop-fade', label: '✨ Pop & Fondu Doux' },
                        { id: 'slide-up', label: '⬆️ Glissement Haut' },
                        { id: 'karaoke', label: '🎤 Karaoké Progressif' },
                        { id: 'none', label: '⚡ Instantané' },
                      ].map((anim) => (
                        <button
                          key={anim.id}
                          onClick={() => updateConfig('lyricAnimation', anim.id)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                            config.lyricAnimation === anim.id
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {anim.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Signature Font Selector */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <label className="block text-xs text-slate-400 mb-2">
                      Police de la Signature en Bas à Gauche
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {SIGNATURE_FONTS.map((sf) => (
                        <button
                          key={sf.id}
                          onClick={() => updateConfig('bottomLeftFont', sf.id)}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer ${
                            config.bottomLeftFont === sf.id
                              ? 'bg-sky-500/15 border-sky-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="text-lg text-white" style={{ fontFamily: sf.family }}>
                            Sénégal
                          </div>
                          <div className="text-[10px] truncate">{sf.id}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ==================== TAB 5: EXPORT VIDEO HD ==================== */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-amber-400" />
                        Exporter la Vidéo Complète TikTok (1080 × 1920 Full HD)
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Enregistre la vidéo en pleine résolution 9:16 avec le décor Glassmorphic, les paroles synchronisées, l'égaliseur animé et la musique intégrée.
                      </p>
                    </div>
                  </div>

                  <ExportRangeSelector
                    duration={duration}
                    lyrics={lyrics}
                    exportStartSec={exportStartSec}
                    exportEndSec={exportEndSec}
                    onChangeStart={setExportStartSec}
                    onChangeEnd={setExportEndSec}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onSeek={handleSeek}
                    onTogglePlay={togglePlay}
                  />

                  <div className="flex items-center justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="block text-xs font-bold text-slate-200">
                        Qualité & Fluidité Vidéo (FPS)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Résolution native TikTok 1080 × 1920 Full HD (12 Mbps)
                      </span>
                    </div>
                    <select
                      value={exportFps}
                      onChange={(e) => setExportFps(parseInt(e.target.value, 10))}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold cursor-pointer"
                    >
                      <option value={60}>60 FPS (Ultra Fluide TikTok)</option>
                      <option value={30}>30 FPS (Standard Rapide)</option>
                    </select>
                  </div>

                  {/* Export Action Buttons & Progress */}
                  {!isExportingVideo ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleStartVideoExport}
                        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/20 cursor-pointer transition"
                      >
                        <Download className="w-4 h-4" />
                        Lancer l'Enregistrement Vidéo ({Math.max(1, exportEndSec - exportStartSec)}s)
                      </button>

                      <button
                        onClick={handleDownloadPngSnapshot}
                        className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer transition"
                      >
                        <Camera className="w-4 h-4 text-sky-400" />
                        Télécharger Image PNG 1080×1920
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-amber-400/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          Enregistrement HD en cours... ({exportProgress}%)
                        </span>
                        <button
                          onClick={handleStopVideoExportEarly}
                          className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 cursor-pointer"
                        >
                          Arrêter et Sauvegarder maintenant
                        </button>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-sky-400 transition-all duration-150"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {lastExportUrl && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="text-xs text-emerald-200 font-medium">
                        ✅ Votre vidéo TikTok a été générée avec succès !
                      </div>
                      <a
                        href={lastExportUrl}
                        download={`GlassLyric_${(config.songTitle || 'TikTok').replace(/\s+/g, '_')}.${lastExportExt}`}
                        className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Re-télécharger (.{lastExportExt})
                      </a>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: LIVE 9:16 TIKTOK CANVAS PREVIEW ==================== */}
        <div className="w-full lg:w-[42%] xl:w-[40%] bg-[#04070F] flex flex-col items-center justify-between p-3 relative overflow-hidden">
          {/* Ambient Glow behind Phone */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-amber-500/10 blur-[110px]" />
            <div className="w-72 h-72 rounded-full bg-sky-500/10 blur-[100px] -translate-y-20" />
          </div>

          {/* Top Preview Status Pill */}
          <div className="w-full flex items-center justify-between px-2 z-10 shrink-0">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              Aperçu Interactif 1080 × 1920 (9:16)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  updateConfig(
                    'playerTimeMode',
                    config.playerTimeMode === 'decorative' ? 'real' : 'decorative'
                  )
                }
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition"
                title="Basculer entre le temps réel de la chanson et le compteur décoratif (00:32 / 03:45)"
              >
                {config.playerTimeMode === 'decorative'
                  ? '⏱️ Compteur Décoratif (00:32)'
                  : '⏱️ Temps Réel Chanson'}
              </button>
            </div>
          </div>

          {/* 9:16 Phone Frame Container */}
          <div className="flex-1 min-h-0 flex items-center justify-center py-1.5 z-10 w-full">
            <div className="relative h-full aspect-[9/16] max-h-full rounded-[28px] p-1.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-black/90 border border-slate-700/80 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseDown={handleCanvasPointerDown}
                className="w-full h-full rounded-[22px] cursor-pointer object-contain bg-slate-950"
                title="Cliquer pour Lecture/Pause • Glisser la barre blanche ou cliquer |< et >| directement sur l'écran !"
              />
            </div>
          </div>

          {/* Helper Caption under Phone */}
          <div className="text-[11px] text-slate-400 text-center z-10 shrink-0">
            💡 <span className="text-slate-300">Écran interactif :</span> cliquez sur{' '}
            <strong className="text-amber-300">Play/Pause</strong>,{' '}
            <strong className="text-amber-300">|&lt; / &gt;|</strong> ou glissez la{' '}
            <strong className="text-white">barre de progression</strong> directement sur le téléphone !
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM MULTI-TRACK INTERACTIVE STUDIO TIMELINE ==================== */}
      <StudioTimeline
        lyrics={lyrics}
        selectedLyricId={selectedLyricId}
        onSelectLyric={(id) => {
          setSelectedLyricId(id);
          const found = lyrics.find((l) => l.id === id);
          if (found && !isPlaying) {
            handleSeek(found.startTime + 0.02);
          }
        }}
        onUpdateLyric={handleUpdateLyricPatch}
        onAddLyricAtTime={handleAddLyricAtTime}
        onDeleteLyric={deleteLyricCard}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        playbackRate={playbackRate}
        onChangePlaybackRate={handleChangePlaybackRate}
        loopPlayback={loopPlayback}
        onToggleLoop={handleToggleLoop}
        isTapSyncActive={isTapSyncActive}
        tapSyncIndex={tapSyncIndex}
        onStartTapSync={startTapSyncMode}
        onTriggerTapSync={triggerTapSyncStep}
        exportStartSec={exportStartSec}
        exportEndSec={exportEndSec}
        onChangeExportStart={setExportStartSec}
        onChangeExportEnd={setExportEndSec}
      />

      {/* ==================== MODAL: BULK PASTE LYRICS ==================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Coller toutes vos paroles d'un coup
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Fermer ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Séparez chaque carte par une <strong>ligne vide</strong>. Utilisez <code className="text-amber-300">*mot*</code> pour mettre des mots en Jaune Or.
            </p>
            <textarea
              rows={10}
              value={bulkLyricsText}
              onChange={(e) => setBulkLyricsText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-amber-400"
              placeholder={'Boul Faalé,\n*dafa nekk ci*\nSénégal...\n\n*Dafa* nekk ci\nSénégal...'}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyBulkLyrics}
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Découper en Cartes Automatiquement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: REFERENCE IMAGES VIEWER ==================== */}
      {showReferenceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Vos 2 Images Modèles de Référence
              </h3>
              <button
                onClick={() => setShowReferenceModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
              >
                Fermer ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <img
                  src="/references/style1_ref.jpg"
                  alt="Référence Style 1"
                  className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-800 mx-auto"
                />
                <button
                  onClick={() => {
                    applyPreset('style1');
                    setShowReferenceModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Appliquer ce Style 1 Maintenant
                </button>
              </div>
              <div className="space-y-2 text-center">
                <img
                  src="/references/style2_ref.jpg"
                  alt="Référence Style 2"
                  className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-800 mx-auto"
                />
                <button
                  onClick={() => {
                    applyPreset('style2');
                    setShowReferenceModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Appliquer ce Style 2 Maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

