// High-Precision 1080x1920 Canvas 2D Glassmorphic & Neumorphic Renderer for GlassLyric Studio
import {
  COUNTRY_FLAGS,
  LYRIC_FONTS,
  SIGNATURE_FONTS,
  NEUMORPHIC_PALETTES,
  hasArabicScript,
} from '../presets/defaultPresets';

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export class GlassLyricRenderer {
  constructor() {
    // Offscreen low-res canvas for fast real-time frosted glass blur
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = 270;
    this.blurCanvas.height = 480;
    this.blurCtx = this.blurCanvas.getContext('2d');

    // Sharp intermediate background canvas (1080x1920)
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = CANVAS_WIDTH;
    this.bgCanvas.height = CANVAS_HEIGHT;
    this.bgCtx = this.bgCanvas.getContext('2d');
  }

  /**
   * Main render entry point called every frame (60fps)
   */
  renderFrame(ctx, state) {
    const {
      config,
      lyrics,
      currentTime,
      duration,
      isPlaying,
      visualizerLevels,
      bgMedia, // { type: 'image'|'video'|'procedural', element, theme }
      avatarImage, // HTMLImageElement or null
      defaultAvatarImage, // HTMLImageElement or null
    } = state;

    this.currentConfig = config;

    ctx.save();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Render background onto bgCanvas + main ctx
    this.renderBackground(this.bgCtx, config, bgMedia, currentTime);
    ctx.drawImage(this.bgCanvas, 0, 0);

    // 2. Render Top-Left Flagpole if behind or part of scene
    if (config.showTopLeftFlag && config.flagCountry !== 'none') {
      if (config.topLeftFlagStyle === 'flagpole') {
        this.drawFlagpoleFlag(ctx, config.flagCountry, currentTime);
      } else {
        this.drawCornerWaveFlagTopLeft(ctx, config.flagCountry, currentTime);
      }
    }

    // 3. Prepare Frosted Glass Blur buffer from current composite background
    this.updateBlurBuffer(ctx, config.glassBlur);

    // 4. Draw Top Navigation Icons (< and ⋮) if enabled (Style 2)
    if (config.showTopNavIcons) {
      this.drawTopNavIcons(ctx, config.headerY);
    }

    // 5. Draw Top Artist Glassmorphic Pill
    if (config.headerStyle !== 'hidden') {
      this.drawHeaderPill(
        ctx,
        config,
        avatarImage || defaultAvatarImage,
        visualizerLevels,
        currentTime
      );
    }

    // 6. Draw Floating Glass Musical Notes (♪ ♫)
    if (config.showFloatingNotes) {
      this.drawFloatingNotes(ctx, config, currentTime);
    }

    // 7. Draw Center Glassmorphic Lyric Card & Active Lyrics
    const activeLyric = this.findActiveLyric(lyrics, currentTime);
    this.drawLyricCard(ctx, config, activeLyric, currentTime);

    // 8. Draw Symmetrical Audio Visualizer (Waveform + Dots)
    this.drawVisualizer(ctx, config, visualizerLevels);

    // 9. Draw Glassmorphic Media Player Controls (Progress Bar + 5 Buttons)
    this.drawPlayerControls(ctx, config, currentTime, duration, isPlaying);

    // 10. Draw Bottom-Right Waving Flag (Style 1)
    if (config.showBottomRightFlag && config.flagCountry !== 'none') {
      this.drawCornerWaveFlagBottomRight(ctx, config.flagCountry, currentTime);
    }

    // 11. Draw Bottom Signatures & Right Overlays (#Hashtag Pill or TikTok Icons)
    this.drawBottomOverlays(ctx, config);

    ctx.restore();
  }

  /**
   * 1. Render Background (Image, Video, or Procedural Dakar Sunset/Night) + Ken Burns + Vignette
   */
  renderBackground(bgCtx, config, bgMedia, currentTime) {
    bgCtx.save();
    bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ken Burns slow zoom & pan
    const zoom = config.kenBurnsEffect ? 1.04 + 0.04 * Math.sin(currentTime * 0.18) : 1.0;
    const panX = config.kenBurnsEffect ? 18 * Math.cos(currentTime * 0.14) : 0;
    const panY = config.kenBurnsEffect ? 14 * Math.sin(currentTime * 0.11) : 0;

    bgCtx.save();
    bgCtx.translate(CANVAS_WIDTH / 2 + panX, CANVAS_HEIGHT / 2 + panY);
    bgCtx.scale(zoom, zoom);
    bgCtx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

    if (
      config.visualTheme !== 'neumorphism' &&
      bgMedia &&
      (bgMedia.type === 'image' || bgMedia.type === 'video') &&
      bgMedia.element &&
      (bgMedia.element.complete || bgMedia.element.readyState >= 2)
    ) {
      const el = bgMedia.element;
      const elW = el.videoWidth || el.naturalWidth || CANVAS_WIDTH;
      const elH = el.videoHeight || el.naturalHeight || CANVAS_HEIGHT;
      const scale = Math.max(CANVAS_WIDTH / elW, CANVAS_HEIGHT / elH);
      const drawW = elW * scale;
      const drawH = elH * scale;
      const dx = (CANVAS_WIDTH - drawW) / 2;
      const dy = (CANVAS_HEIGHT - drawH) / 2;

      if (config.bgBlur > 0) {
        bgCtx.filter = `blur(${config.bgBlur * 2}px)`;
      }
      bgCtx.drawImage(el, dx, dy, drawW, drawH);
      bgCtx.filter = 'none';
    } else if (config.visualTheme === 'neumorphism') {
      // Tactile Soft-UI Neumorphic Background with Subtle Embossed Islamic Geometry & Touba Dome
      this.drawNeumorphicKhassidaBackground(bgCtx, config, bgMedia, currentTime);
    } else {
      // Rich Procedural Sunset / Night Dakar Landscape
      const theme = (bgMedia && bgMedia.theme) || 'dakar-sunset';
      this.drawProceduralLandscape(bgCtx, theme, currentTime);
    }
    bgCtx.restore();

    // Optional Darkening Overlay (skip in Neumorphism to preserve Soft-UI matte surface)
    if (config.visualTheme !== 'neumorphism' && config.bgDarken > 0) {
      bgCtx.fillStyle = `rgba(6, 10, 22, ${config.bgDarken})`;
      bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Cinematic Vignette (Top, Bottom & Corners)
    if (config.visualTheme !== 'neumorphism' && config.bgVignette > 0) {
      const vigGrad = bgCtx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.48,
        CANVAS_WIDTH * 0.25,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.5,
        CANVAS_HEIGHT * 0.72
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(2, 6, 18, ${config.bgVignette})`);
      bgCtx.fillStyle = vigGrad;
      bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Extra bottom gradient so player controls & signature pop clearly
      const botGrad = bgCtx.createLinearGradient(0, CANVAS_HEIGHT * 0.68, 0, CANVAS_HEIGHT);
      botGrad.addColorStop(0, 'rgba(0,0,0,0)');
      botGrad.addColorStop(1, `rgba(3, 7, 18, ${Math.min(0.85, config.bgVignette + 0.25)})`);
      bgCtx.fillStyle = botGrad;
      bgCtx.fillRect(0, CANVAS_HEIGHT * 0.68, CANVAS_WIDTH, CANVAS_HEIGHT * 0.32);
    }

    bgCtx.restore();
  }

  drawProceduralLandscape(ctx, theme, currentTime) {
    // Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (theme === 'ocean-twilight') {
      sky.addColorStop(0, '#07142B');
      sky.addColorStop(0.35, '#163868');
      sky.addColorStop(0.62, '#C86D51');
      sky.addColorStop(0.8, '#1B2A4A');
      sky.addColorStop(1, '#060B16');
    } else if (theme === 'afro-gold') {
      sky.addColorStop(0, '#1B0E07');
      sky.addColorStop(0.4, '#6E3212');
      sky.addColorStop(0.68, '#D97706');
      sky.addColorStop(1, '#0F0703');
    } else {
      // 'dakar-sunset' & 'dakar-golden'
      sky.addColorStop(0, '#172E6E');
      sky.addColorStop(0.28, '#34569B');
      sky.addColorStop(0.5, '#D4835A');
      sky.addColorStop(0.65, '#F59E0B');
      sky.addColorStop(0.82, '#1E293B');
      sky.addColorStop(1, '#090D16');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Golden Sun / Sunset Glow on Right Horizon
    const sunGrad = ctx.createRadialGradient(880, 740, 20, 880, 740, 480);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    sunGrad.addColorStop(0.35, 'rgba(251, 146, 60, 0.45)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 200, CANVAS_WIDTH, 1100);

    // Distant Hill & African Renaissance Monument Silhouette on Right (x: 680..980, y: 420..820)
    ctx.save();
    ctx.fillStyle = '#1E1B24';
    ctx.beginPath();
    ctx.moveTo(480, 880);
    ctx.quadraticCurveTo(690, 720, 830, 560);
    ctx.lineTo(950, 560);
    ctx.quadraticCurveTo(1040, 710, 1080, 880);
    ctx.closePath();
    ctx.fill();

    // Monument Statue Stylized Silhouette
    ctx.fillStyle = '#292224';
    // Pedestal
    ctx.beginPath();
    ctx.moveTo(790, 580);
    ctx.lineTo(960, 580);
    ctx.lineTo(930, 460);
    ctx.lineTo(820, 460);
    ctx.closePath();
    ctx.fill();
    // Male & Female Figures + Raised Arm
    ctx.beginPath();
    ctx.moveTo(830, 470);
    ctx.lineTo(860, 340);
    ctx.lineTo(990, 245); // Raised arm pointing to sky
    ctx.lineTo(996, 255);
    ctx.lineTo(915, 355);
    ctx.lineTo(925, 470);
    ctx.closePath();
    ctx.fill();
    // Second figure
    ctx.beginPath();
    ctx.moveTo(760, 490);
    ctx.lineTo(700, 455);
    ctx.lineTo(785, 385);
    ctx.lineTo(835, 405);
    ctx.lineTo(825, 490);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ocean Bay on Left / Lower Middle
    const seaGrad = ctx.createLinearGradient(0, 1100, 750, 1650);
    seaGrad.addColorStop(0, '#1E3A5F');
    seaGrad.addColorStop(0.5, '#2E4C6D');
    seaGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = seaGrad;
    ctx.beginPath();
    ctx.moveTo(0, 1180);
    ctx.quadraticCurveTo(420, 1210, 620, 1480);
    ctx.lineTo(0, 1750);
    ctx.closePath();
    ctx.fill();

    // Golden Mosque & Palm Skyline at Bottom Right (inspired by Image 2)
    if (theme === 'dakar-golden') {
      const goldGlow = ctx.createRadialGradient(780, 1780, 10, 780, 1780, 420);
      goldGlow.addColorStop(0, 'rgba(250, 204, 21, 0.55)');
      goldGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
      goldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = goldGlow;
      ctx.fillRect(350, 1400, 730, 520);

      // Minaret & Domes silhouette
      ctx.fillStyle = '#090A0F';
      ctx.fillRect(775, 1680, 26, 150);
      ctx.beginPath();
      ctx.moveTo(775, 1680);
      ctx.lineTo(788, 1635);
      ctx.lineTo(801, 1680);
      ctx.fill();
    }
  }

  getNeumorphicPalette(config) {
    const palId = config?.neumorphicPalette || 'touba-emerald';
    return (
      NEUMORPHIC_PALETTES.find((p) => p.id === palId) || NEUMORPHIC_PALETTES[0]
    );
  }

  /**
   * 1B. Tactile Soft-UI Neumorphic Background for Khassida Mode
   */
  drawNeumorphicKhassidaBackground(ctx, config, bgMedia, currentTime) {
    const pal = this.getNeumorphicPalette(config);

    // 1. Matte Soft-UI Surface Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, pal.bgTop);
    bgGrad.addColorStop(0.5, pal.surface);
    bgGrad.addColorStop(1, pal.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // If user explicitly uploaded/chose a photo or video and wants it subtly blended into the Neumorphic surface
    if (
      bgMedia &&
      (bgMedia.type === 'image' || bgMedia.type === 'video') &&
      bgMedia.element &&
      (bgMedia.element.complete || bgMedia.element.readyState >= 2) &&
      bgMedia.id !== 'dakar-sunset-img'
    ) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      const el = bgMedia.element;
      const elW = el.videoWidth || el.naturalWidth || CANVAS_WIDTH;
      const elH = el.videoHeight || el.naturalHeight || CANVAS_HEIGHT;
      const scale = Math.max(CANVAS_WIDTH / elW, CANVAS_HEIGHT / elH);
      const drawW = elW * scale;
      const drawH = elH * scale;
      ctx.drawImage(el, (CANVAS_WIDTH - drawW) / 2, (CANVAS_HEIGHT - drawH) / 2, drawW, drawH);
      ctx.restore();
    }

    // 2. Authentic Islamic & Mouride Decorations (Crescent Moon ☪, Mosque Lanterns Fanous & Mihrab Arch)
    if (config.showIslamicOrnaments !== false) {
      // Sculpted 3D Neumorphic Crescent Moon & Star (☪) in Top-Right Sky
      this.drawEmbossedCrescentAndStar(ctx, 905, 295, 86, pal, currentTime);

      // Gentle Swaying Hanging Mosque Lanterns (Fanous)
      this.drawEmbossedMosqueLantern(ctx, 118, 0, 220, 0.92, pal, currentTime);
      this.drawEmbossedMosqueLantern(ctx, 995, 0, 155, 0.75, pal, currentTime + 1.8);

      // Subtle Embossed Mihrab Mosque Archway Watermark on Lower-Left
      this.drawEmbossedMihrabArch(ctx, 165, 1560, 175, 250, pal);
    }

    // 3. Sculpted Great Mosque of Touba (Lamp Fall Minaret, Grand Domes & Arches) at Bottom Horizon
    this.drawEmbossedToubaMosque(ctx, 790, 1900, pal);
  }

  /**
   * Sculpted 3D Neumorphic Crescent Moon & 5-Point Star (☪)
   */
  drawEmbossedCrescentAndStar(ctx, cx, cy, radius, pal, currentTime = 0) {
    const floatY = Math.sin(currentTime * 1.4) * 6;
    ctx.save();
    ctx.translate(cx, cy + floatY);
    ctx.rotate(-0.25);

    const drawCrescentPath = () => {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0.22 * Math.PI, 1.78 * Math.PI, false);
      ctx.arc(radius * 0.36, -radius * 0.08, radius * 0.78, 1.68 * Math.PI, 0.32 * Math.PI, true);
      ctx.closePath();
    };

    // 1. Top-Left Soft Highlight Shadow
    ctx.save();
    drawCrescentPath();
    ctx.shadowColor = pal.shadowLight;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = -8;
    ctx.shadowOffsetY = -8;
    ctx.fillStyle = pal.surfaceLight || pal.surface;
    ctx.fill();
    ctx.restore();

    // 2. Bottom-Right Soft Ambient Shadow
    ctx.save();
    drawCrescentPath();
    ctx.shadowColor = pal.shadowDark;
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 9;
    ctx.shadowOffsetY = 9;
    ctx.fillStyle = pal.surface;
    ctx.fill();
    ctx.restore();

    // 3. Tactile Surface + Subtle Golden Rim
    const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    grad.addColorStop(0, pal.surfaceLight || pal.surface);
    grad.addColorStop(1, pal.surfaceAlt);
    drawCrescentPath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = pal.ornamentStroke || pal.accentGold;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 4. 5-Point Star nestled inside the Crescent Moon
    ctx.save();
    ctx.shadowColor = pal.shadowDark;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    this.drawFivePointStar(ctx, radius * 0.62, -radius * 0.08, radius * 0.26, pal.accentGold);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Hanging Islamic Mosque Lantern (Fanous) with Chain, Onion Dome & Glowing Lattice
   */
  drawEmbossedMosqueLantern(ctx, x, topY, chainLen, scale, pal, currentTime = 0) {
    const sway = Math.sin(currentTime * 1.6 + x * 0.01) * 0.035;
    ctx.save();
    ctx.translate(x, topY);
    ctx.rotate(sway);

    // Hanging Chain
    ctx.strokeStyle = pal.ornamentStroke || pal.accentGold;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, chainLen);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(0, chainLen);
    ctx.scale(scale, scale);

    // Lantern Body with Soft-UI Shadow
    ctx.save();
    ctx.shadowColor = pal.shadowDark;
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = pal.surfaceLight || pal.surface;
    ctx.strokeStyle = pal.ornamentStroke || pal.accentGold;
    ctx.lineWidth = 2.2;

    // Top Ring & Onion Dome Cap
    ctx.beginPath();
    ctx.arc(0, 6, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-24, 34);
    ctx.quadraticCurveTo(-22, 14, 0, 10);
    ctx.quadraticCurveTo(22, 14, 24, 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hexagonal / Tapered Lantern Body
    ctx.beginPath();
    ctx.moveTo(-28, 34);
    ctx.lineTo(28, 34);
    ctx.lineTo(20, 96);
    ctx.lineTo(-20, 96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Golden Arch Window inside Lantern
    ctx.fillStyle = pal.accentGold;
    ctx.globalAlpha = pal.isLight ? 0.25 : 0.45;
    ctx.beginPath();
    ctx.moveTo(-11, 88);
    ctx.lineTo(-11, 56);
    ctx.quadraticCurveTo(-11, 42, 0, 39);
    ctx.quadraticCurveTo(11, 42, 11, 56);
    ctx.lineTo(11, 88);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Bottom Base & Finial Drop
    ctx.fillStyle = pal.surfaceAlt;
    ctx.beginPath();
    ctx.moveTo(-18, 96);
    ctx.lineTo(18, 96);
    ctx.lineTo(10, 110);
    ctx.lineTo(-10, 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.lineTo(0, 122);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Embossed Mihrab Archway Watermark (Oriental Pointed Dome Arch)
   */
  drawEmbossedMihrabArch(ctx, cx, cy, w, h, pal) {
    const drawArch = () => {
      const left = -w / 2;
      const right = w / 2;
      const top = -h / 2;
      const bot = h / 2;
      ctx.beginPath();
      ctx.moveTo(left, bot);
      ctx.lineTo(left, top + w * 0.55);
      ctx.quadraticCurveTo(left, top + w * 0.12, 0, top);
      ctx.quadraticCurveTo(right, top + w * 0.12, right, top + w * 0.55);
      ctx.lineTo(right, bot);
      ctx.closePath();
    };

    ctx.save();
    ctx.translate(cx, cy);

    // Outer recessed arch
    ctx.save();
    ctx.translate(3, 3);
    ctx.strokeStyle = pal.shadowLight;
    ctx.lineWidth = 3;
    drawArch();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-2, -2);
    ctx.strokeStyle = pal.shadowDark;
    ctx.lineWidth = 3;
    drawArch();
    ctx.stroke();
    ctx.restore();

    // Inner golden filigree arch + hanging lamp silhouette inside Mihrab
    ctx.scale(0.84, 0.86);
    ctx.strokeStyle = pal.ornamentStroke || pal.borderBevel;
    ctx.lineWidth = 2;
    drawArch();
    ctx.stroke();

    // Small Crescent at apex of Mihrab
    this.drawMiniCrescent(ctx, 0, -h * 0.32, 14, pal.accentGold);
    ctx.restore();
  }

  /**
   * Embossed Great Mosque of Touba Silhouette (Lamp Fall Minaret, Central Dome & Flanking Domes)
   */
  drawEmbossedToubaMosque(ctx, cx, baseY, pal) {
    ctx.save();
    ctx.translate(cx, baseY);

    ctx.shadowColor = pal.shadowDark;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = pal.isLight ? pal.surfaceAlt : pal.shadowDark;
    ctx.strokeStyle = pal.ornamentStroke || pal.borderBevel;
    ctx.lineWidth = 2.2;

    // 1. Main Mosque Base & Arched Colonnade
    this.roundRectPath(ctx, -170, -78, 340, 78, 8);
    ctx.fill();
    ctx.stroke();

    // 2. Central Grand Onion/Pointed Dome of Touba
    ctx.beginPath();
    ctx.moveTo(-64, -78);
    ctx.bezierCurveTo(-68, -135, -28, -162, 0, -182);
    ctx.bezierCurveTo(28, -162, 68, -135, 64, -78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Left & Right Flanking Domes
    for (const dx of [-118, 118]) {
      ctx.beginPath();
      ctx.moveTo(dx - 38, -78);
      ctx.bezierCurveTo(dx - 40, -112, dx - 16, -128, dx, -140);
      ctx.bezierCurveTo(dx + 16, -128, dx + 40, -112, dx + 38, -78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Tall Central Lamp Fall Minaret Tower behind/beside main dome
    const minX = 0;
    ctx.fillRect(minX - 18, -285, 36, 120);
    ctx.strokeRect(minX - 18, -285, 36, 120);
    // Minaret Balcony
    ctx.fillRect(minX - 24, -245, 48, 8);
    ctx.strokeRect(minX - 24, -245, 48, 8);
    // Minaret Lantern Top & Spire
    ctx.beginPath();
    ctx.moveTo(minX - 16, -285);
    ctx.lineTo(minX, -330);
    ctx.lineTo(minX + 16, -285);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden Crescent Finial on top of Lamp Fall Minaret
    this.drawMiniCrescent(ctx, minX, -342, 11, pal.accentGold);

    // 5. Flanking Slender Minarets
    for (const mx of [-162, 162]) {
      ctx.fillRect(mx - 10, -210, 20, 132);
      ctx.strokeRect(mx - 10, -210, 20, 132);
      ctx.beginPath();
      ctx.moveTo(mx - 11, -210);
      ctx.lineTo(mx, -242);
      ctx.lineTo(mx + 11, -210);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMiniCrescent(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.2 * Math.PI, 1.8 * Math.PI, false);
    ctx.arc(r * 0.35, -r * 0.08, r * 0.76, 1.7 * Math.PI, 0.3 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Helper to draw an Extruded or Recessed (Inset) Neumorphic Soft-UI Box
   * Uses genuine Soft-UI dual shadows and even-odd inner cutout shadows (no harsh dark wire outlines)
   */
  drawNeumorphicBox(ctx, x, y, w, h, r, config, isInset = false) {
    const pal = this.getNeumorphicPalette(config);
    const relief = config?.neumorphicRelief ?? 1.0;

    ctx.save();

    if (!isInset) {
      // 1A. Top-Left Soft Highlight Shadow (Extruded Light Source)
      ctx.save();
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.shadowColor = pal.shadowLight;
      ctx.shadowBlur = 26 * relief;
      ctx.shadowOffsetX = -12 * relief;
      ctx.shadowOffsetY = -12 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.restore();

      // 1B. Bottom-Right Soft Ambient Shadow
      ctx.save();
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.shadowColor = pal.shadowDark;
      ctx.shadowBlur = 28 * relief;
      ctx.shadowOffsetX = 13 * relief;
      ctx.shadowOffsetY = 13 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.restore();

      // 2. Smooth Matte Convex Soft-UI Surface Fill
      const surfGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      surfGrad.addColorStop(0, pal.surfaceLight || pal.surface);
      surfGrad.addColorStop(0.55, pal.surface);
      surfGrad.addColorStop(1, pal.surfaceAlt);
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.fillStyle = surfGrad;
      ctx.fill();

      // 3. Whisper-thin Specular Edge Highlight (No dark border wire!)
      ctx.strokeStyle = pal.borderBevel;
      ctx.lineWidth = pal.isLight ? 1.8 : 2.0;
      this.roundRectPath(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, Math.max(4, r - 1));
      ctx.stroke();
    } else {
      // Recessed / Carved Inset Neumorphic Well (True Even-Odd Inner Shadow Cutout)
      ctx.save();
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.clip();

      // 1. Concave Well Base Gradient
      const wellGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      wellGrad.addColorStop(0, pal.wellTop || pal.surfaceAlt);
      wellGrad.addColorStop(1, pal.wellBottom || pal.surfaceLight || pal.surface);
      ctx.fillStyle = wellGrad;
      ctx.fillRect(x, y, w, h);

      const buildCutoutPath = () => {
        const pad = 80;
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        // Outer counter-clockwise या clockwise rect
        ctx.rect(x - pad, y - pad, w + pad * 2, h + pad * 2);
        // Inner rounded rect
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
      };

      // 2A. Inner Top-Left Dark Shadow
      ctx.save();
      buildCutoutPath();
      ctx.shadowColor = pal.shadowDark;
      ctx.shadowBlur = 18 * relief;
      ctx.shadowOffsetX = 8 * relief;
      ctx.shadowOffsetY = 8 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill('evenodd');
      ctx.restore();

      // 2B. Inner Bottom-Right Light Highlight Shadow
      ctx.save();
      buildCutoutPath();
      ctx.shadowColor = pal.shadowLight;
      ctx.shadowBlur = 18 * relief;
      ctx.shadowOffsetX = -8 * relief;
      ctx.shadowOffsetY = -8 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill('evenodd');
      ctx.restore();

      ctx.restore();

      // Subtle inner rim highlight
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.strokeStyle = pal.borderBevel;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 2. Fast Pre-Blurred Glass Buffer
   */
  updateBlurBuffer(mainCtx, blurAmount = 22) {
    this.blurCtx.save();
    this.blurCtx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
    const scaledBlur = Math.max(2, Math.round(blurAmount * 0.32));
    this.blurCtx.filter = `blur(${scaledBlur}px) saturate(1.25) brightness(0.92)`;
    this.blurCtx.drawImage(
      mainCtx.canvas,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0,
      0,
      this.blurCanvas.width,
      this.blurCanvas.height
    );
    this.blurCtx.filter = 'none';
    this.blurCtx.restore();
  }

  /**
   * Helper to draw a Frosted Glass Rounded Rectangle with Specular Rim Highlights
   */
  drawFrostedGlassBox(ctx, x, y, w, h, r, options = {}) {
    if (this.currentConfig?.visualTheme === 'neumorphism') {
      this.drawNeumorphicBox(ctx, x, y, w, h, r, this.currentConfig, Boolean(options.isInset));
      return;
    }

    const {
      opacity = 0.25,
      tintColor = '#1E293B',
      rimPrimary = '#7DD3FC',
      rimSecondary = '#FACC15',
      rimIntensity = 0.9,
      shadowBlur = 40,
      shadowOffsetY = 18,
      cornerFlares = true,
    } = options;

    ctx.save();

    // 1. Outer Drop Shadow
    ctx.save();
    this.roundRectPath(ctx, x, y, w, h, r);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.52)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.fill();
    ctx.restore();

    // 2. Clip to Rounded Rect & Draw Blurred Background
    ctx.save();
    this.roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();

    // Draw scaled blurred canvas matching exact screen coordinates
    ctx.drawImage(
      this.blurCanvas,
      0,
      0,
      this.blurCanvas.width,
      this.blurCanvas.height,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    // 3. Glass Tint & Diagonal Frost Gradient
    const tintRgb = this.hexToRgb(tintColor);
    ctx.fillStyle = `rgba(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b}, ${opacity})`;
    ctx.fillRect(x, y, w, h);

    const frostGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
    frostGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.07)');
    frostGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.04)');
    frostGrad.addColorStop(1, 'rgba(255, 255, 255, 0.20)');
    ctx.fillStyle = frostGrad;
    ctx.fillRect(x, y, w, h);

    // Inner bright rim glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 6;
    this.roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(4, r - 2));
    ctx.stroke();

    ctx.restore();

    // 4. Outer Specular Glass Border (Diagonal Gradient with Cyan Top-Left & Gold Bottom-Right)
    const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    borderGrad.addColorStop(0, '#FFFFFF');
    borderGrad.addColorStop(0.12, rimPrimary);
    borderGrad.addColorStop(0.38, 'rgba(255, 255, 255, 0.28)');
    borderGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.25)');
    borderGrad.addColorStop(0.88, rimSecondary);
    borderGrad.addColorStop(1, '#FFFFFF');

    ctx.save();
    this.roundRectPath(ctx, x, y, w, h, r);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();

    // 5. Intense Specular Corner Flares (Matching Image 1 & Image 2 glowing corners!)
    if (cornerFlares && rimIntensity > 0.05) {
      // Top-Left Cyan/White Specular Bloom
      this.drawCornerFlare(
        ctx,
        x + r * 0.9,
        y + 2,
        160,
        rimPrimary,
        rimIntensity
      );
      // Bottom-Left Soft White/Gold Flare
      this.drawCornerFlare(
        ctx,
        x + r * 0.8,
        y + h - 2,
        130,
        rimPrimary,
        rimIntensity * 0.65
      );
      // Bottom-Right Warm Gold/White Specular Bloom
      this.drawCornerFlare(
        ctx,
        x + w - r * 0.85,
        y + h - 2,
        180,
        rimSecondary,
        rimIntensity
      );
      // Top-Right Subtle Rim Flare
      this.drawCornerFlare(
        ctx,
        x + w - r * 0.85,
        y + 2,
        120,
        rimSecondary,
        rimIntensity * 0.55
      );
    }

    ctx.restore();
  }

  drawCornerFlare(ctx, cx, cy, radius, colorHex, intensity) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rgb = this.hexToRgb(colorHex);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * intensity})`);
    grad.addColorStop(0.22, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.65 * intensity})`);
    grad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.18 * intensity})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 3. Waving Country Flags (Top-Left Corner Wave, Flagpole, & Bottom-Right Wave)
   */
  drawCornerWaveFlagTopLeft(ctx, countryId, currentTime) {
    const flag = COUNTRY_FLAGS.find((f) => f.id === countryId);
    if (!flag || !flag.colors.length) return;

    const wave = Math.sin(currentTime * 2.2) * 8;
    ctx.save();

    // Clip to a sweeping corner fabric shape (top-left, exact match to Image 1)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(395 + wave, 0);
    ctx.bezierCurveTo(
      340 + wave,
      90,
      245 - wave,
      140,
      115,
      165 + wave * 0.5
    );
    ctx.quadraticCurveTo(40, 185, 0, 260);
    ctx.closePath();

    ctx.save();
    ctx.clip();

    // Transform slightly for natural diagonal hang
    ctx.translate(-25, -20);
    ctx.rotate(-0.22);

    const fw = 430;
    const fh = 290;
    this.drawFlagPattern(ctx, flag, 0, 0, fw, fh);

    // 3D Silk Fabric Folds (Light & Shadow Stripes)
    const foldGrad = ctx.createLinearGradient(0, 0, fw, fh * 0.5);
    foldGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
    foldGrad.addColorStop(0.18, 'rgba(255,255,255,0.22)');
    foldGrad.addColorStop(0.36, 'rgba(0,0,0,0.28)');
    foldGrad.addColorStop(0.55, 'rgba(255,255,255,0.25)');
    foldGrad.addColorStop(0.78, 'rgba(0,0,0,0.32)');
    foldGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(0, 0, fw, fh);

    ctx.restore();
    ctx.restore();
  }

  drawCornerWaveFlagBottomRight(ctx, countryId, currentTime) {
    const flag = COUNTRY_FLAGS.find((f) => f.id === countryId);
    if (!flag || !flag.colors.length) return;

    const wave = Math.sin(currentTime * 2.0 + 1.2) * 10;
    ctx.save();

    // Sweeping ribbon flag across bottom-right corner (exact match to Image 1)
    ctx.beginPath();
    ctx.moveTo(390, CANVAS_HEIGHT);
    ctx.bezierCurveTo(
      540,
      1775 + wave,
      790,
      1610 - wave,
      CANVAS_WIDTH,
      1665 + wave * 0.5
    );
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();

    // Golden glow along the top edge of the bottom-right flag (as seen in Image 1)
    ctx.save();
    ctx.shadowColor = 'rgba(250, 204, 21, 0.75)';
    ctx.shadowBlur = 28;
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    ctx.clip();

    ctx.translate(450, 1620);
    ctx.rotate(-0.28);
    const fw = 720;
    const fh = 420;
    this.drawFlagPattern(ctx, flag, 0, 0, fw, fh);

    // 3D Silk Fabric Shading
    const foldGrad = ctx.createLinearGradient(0, 0, fw, fh * 0.4);
    foldGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
    foldGrad.addColorStop(0.28, 'rgba(255,255,255,0.22)');
    foldGrad.addColorStop(0.52, 'rgba(0,0,0,0.18)');
    foldGrad.addColorStop(0.75, 'rgba(255,255,255,0.28)');
    foldGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(0, 0, fw, fh);

    ctx.restore();
  }

  drawFlagpoleFlag(ctx, countryId, currentTime) {
    const flag = COUNTRY_FLAGS.find((f) => f.id === countryId);
    if (!flag || !flag.colors.length) return;

    const wave = Math.sin(currentTime * 2.5) * 8;
    ctx.save();

    // Metallic Flagpole on left (Image 2 style)
    const poleX = 30;
    const poleTop = 112;
    const poleBottom = 760;

    const poleGrad = ctx.createLinearGradient(poleX - 6, 0, poleX + 8, 0);
    poleGrad.addColorStop(0, '#475569');
    poleGrad.addColorStop(0.4, '#F8FAFC');
    poleGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = poleGrad;
    ctx.fillRect(poleX - 5, poleTop, 10, poleBottom - poleTop);

    // Finial ball on top of flagpole
    ctx.beginPath();
    ctx.arc(poleX, poleTop, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();

    // Waving Flag Cloth attached to pole
    ctx.beginPath();
    ctx.moveTo(poleX + 5, poleTop + 26);
    ctx.bezierCurveTo(
      170,
      poleTop + 85 + wave,
      295,
      poleTop + 145 - wave,
      430,
      poleTop + 215 + wave
    );
    ctx.lineTo(395, poleTop + 440 + wave);
    ctx.bezierCurveTo(
      270,
      poleTop + 375 - wave,
      155,
      poleTop + 330 + wave,
      poleX + 5,
      poleTop + 340
    );
    ctx.closePath();

    ctx.save();
    ctx.clip();

    ctx.translate(poleX + 5, poleTop + 26);
    ctx.rotate(0.32);
    const fw = 440;
    const fh = 320;
    this.drawFlagPattern(ctx, flag, 0, 0, fw, fh);

    // Silk folds
    const fold = ctx.createLinearGradient(0, 0, fw, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0.22)');
    fold.addColorStop(0.25, 'rgba(255,255,255,0.22)');
    fold.addColorStop(0.5, 'rgba(0,0,0,0.26)');
    fold.addColorStop(0.78, 'rgba(255,255,255,0.2)');
    fold.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, -60, fw, fh + 120);

    ctx.restore();
    ctx.restore();
  }

  drawFlagPattern(ctx, flag, x, y, w, h) {
    const [c1, c2, c3] = flag.colors;
    const stripeW = w / 3;
    ctx.fillStyle = c1;
    ctx.fillRect(x, y, stripeW + 2, h);
    ctx.fillStyle = c2;
    ctx.fillRect(x + stripeW, y, stripeW + 2, h);
    ctx.fillStyle = c3;
    ctx.fillRect(x + stripeW * 2, y, stripeW + 2, h);

    if (flag.starColor) {
      this.drawFivePointStar(ctx, x + w * 0.48, y + h * 0.46, Math.min(w, h) * 0.14, flag.starColor);
    }
  }

  drawFivePointStar(ctx, cx, cy, outerRadius, color) {
    const innerRadius = outerRadius * 0.382;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * 4. Top Navigation Icons (< and ⋮) for Style 2
   */
  drawTopNavIcons(ctx, headerY) {
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;

    // Left Back Chevron '<'
    const navY = headerY + 25;
    ctx.beginPath();
    ctx.moveTo(82, navY - 26);
    ctx.lineTo(54, navY);
    ctx.lineTo(82, navY + 26);
    ctx.stroke();

    // Right Three Vertical Dots '⋮'
    ctx.fillStyle = '#FFFFFF';
    for (const dy of [-20, 0, 20]) {
      ctx.beginPath();
      ctx.arc(1026, navY + dy, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * 5. Top Artist Glassmorphic Pill (Large Style 1 or Compact Style 2)
   */
  drawHeaderPill(ctx, config, avatarImg, visualizerLevels, currentTime) {
    const isNeumorphic = config.visualTheme === 'neumorphism';
    const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;
    const headerTitleColor = isNeumorphic ? pal.textColor : '#FFFFFF';
    const headerSubColor = isNeumorphic ? pal.subTextColor : 'rgba(226, 232, 240, 0.9)';
    const headerAccentColor = isNeumorphic ? pal.accentGold : '#FFFFFF';

    if (config.headerStyle === 'compact') {
      // Style 2: Centered Compact Glass/Neumorphic Pill with Left Rounded-Square Logo & Right Mini Waveform
      const pillW = 576;
      const pillH = 152;
      const pillX = (CANVAS_WIDTH - pillW) / 2 + 20;
      const pillY = config.headerY;
      const pillR = pillH / 2;

      this.drawFrostedGlassBox(ctx, pillX, pillY, pillW, pillH, pillR, {
        opacity: 0.24,
        tintColor: '#1E293B',
        rimPrimary: config.rimLightPrimary,
        rimSecondary: '#93C5FD',
        rimIntensity: 0.85,
        shadowBlur: 28,
        shadowOffsetY: 12,
        cornerFlares: true,
      });

      // Avatar Box on Left (Rounded Square or Circle)
      const avSize = 120;
      const avX = pillX + 18;
      const avY = pillY + (pillH - avSize) / 2;
      const avR = config.avatarShape === 'circle' ? avSize / 2 : 26;
      this.drawAvatarElement(ctx, avX, avY, avSize, avR, config, avatarImg);

      // Artist Name + Verified Badge
      const textX = avX + avSize + 24;
      ctx.save();
      ctx.font = '700 35px "Plus Jakarta Sans", "Amiri", sans-serif';
      ctx.fillStyle = headerTitleColor;
      if (!isNeumorphic) {
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
      }
      ctx.fillText(config.artistName || 'Wally Seck', textX, pillY + 66);

      const nameWidth = ctx.measureText(config.artistName || 'Wally Seck').width;
      if (config.verifiedBadge) {
        this.drawVerifiedBadge(ctx, textX + nameWidth + 24, pillY + 54, 16, config.verifiedColor);
      }

      // Song Title below
      ctx.font = '500 31px "Plus Jakarta Sans", "Amiri", sans-serif';
      ctx.fillStyle = headerSubColor;
      ctx.fillText(config.songTitle || 'Boul Faalé', textX, pillY + 112);
      ctx.restore();

      // Right-side Mini Animated Waveform inside the Pill (exact match to Image 2)
      const waveStartX = pillX + pillW - 148;
      const waveCenterY = pillY + pillH / 2;
      const miniBars = [0.22, 0.55, 0.35, 0.82, 0.45, 0.95, 0.65, 0.78, 0.4, 0.52, 0.25];
      ctx.save();
      ctx.fillStyle = headerAccentColor;
      if (!isNeumorphic) {
        ctx.shadowColor = 'rgba(147, 197, 253, 0.8)';
        ctx.shadowBlur = 8;
      }
      miniBars.forEach((baseH, idx) => {
        const anim = 0.75 + 0.25 * Math.sin(currentTime * 6 + idx * 1.1);
        const bh = Math.max(8, baseH * anim * 76);
        const bx = waveStartX + idx * 10.5;
        this.roundRectPath(ctx, bx, waveCenterY - bh / 2, 4.5, bh, 2.2);
        ctx.fill();
      });
      ctx.restore();
      return;
    }

    // Style 1: Large Top-Left/Center Glass/Neumorphic Pill with Circular Portrait, Genre Subtitle & 3-Dots
    const pillX = isNeumorphic ? (CANVAS_WIDTH - 640) / 2 : 78;
    const pillY = config.headerY;
    const pillW = isNeumorphic ? 640 : 612;
    const pillH = 180;
    const pillR = pillH / 2;

    this.drawFrostedGlassBox(ctx, pillX, pillY, pillW, pillH, pillR, {
      opacity: 0.24,
      tintColor: '#1E293B',
      rimPrimary: config.rimLightPrimary,
      rimSecondary: '#E2E8F0',
      rimIntensity: 0.8,
      shadowBlur: 30,
      shadowOffsetY: 12,
      cornerFlares: true,
    });

    // Circular Avatar on Left
    const avSize = 144;
    const avX = pillX + 18;
    const avY = pillY + (pillH - avSize) / 2;
    const avR = config.avatarShape === 'rounded-square' ? 32 : avSize / 2;
    this.drawAvatarElement(ctx, avX, avY, avSize, avR, config, avatarImg);

    // Artist Name + Verified Badge
    const textX = avX + avSize + 24;
    ctx.save();
    ctx.font = '700 37px "Plus Jakarta Sans", "Amiri", sans-serif';
    ctx.fillStyle = headerTitleColor;
    if (!isNeumorphic) {
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(config.artistName || 'Wally Seck', textX, pillY + 62);

    const nameW = ctx.measureText(config.artistName || 'Wally Seck').width;
    if (config.verifiedBadge) {
      this.drawVerifiedBadge(ctx, textX + nameW + 26, pillY + 50, 16, config.verifiedColor);
    }

    // Song Title
    ctx.font = '400 32px "Plus Jakarta Sans", "Amiri", sans-serif';
    ctx.fillStyle = headerSubColor;
    ctx.fillText(config.songTitle || 'Boul Faalé', textX, pillY + 106);

    // Mini Equalizer Icon + Genre Subtitle ("Musique Sénégalaise 🇸🇳" or "Khassida Mouride • Touba 🕌")
    const eqX = textX;
    const eqY = pillY + 146;
    ctx.fillStyle = headerAccentColor;
    const eqHeights = [12, 21, 15, 23, 13];
    eqHeights.forEach((eh, i) => {
      ctx.fillRect(eqX + i * 5.2, eqY - eh, 3.2, eh);
    });

    ctx.font = '500 24px "Plus Jakarta Sans", "Amiri", sans-serif';
    ctx.fillStyle = headerTitleColor;
    ctx.fillText(config.songSubtitle || 'Musique Sénégalaise 🇸🇳', eqX + 34, eqY - 2);

    // Three Vertical Dots '⋮' on Right inside Pill
    const dotsX = pillX + pillW - 42;
    const dotsCenterY = pillY + pillH / 2 + 4;
    ctx.fillStyle = headerSubColor;
    for (const dy of [-17, 0, 17]) {
      ctx.beginPath();
      ctx.arc(dotsX, dotsCenterY + dy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAvatarElement(ctx, x, y, size, radius, config, avatarImg) {
    ctx.save();
    this.roundRectPath(ctx, x, y, size, size, radius);
    ctx.clip();

    if (config.avatarMode === 'mosque-logo') {
      // Sacred Touba Mosque / Lamp Fall Emblem (adapts to light & dark Neumorphic palettes)
      const isNeumorphic = config.visualTheme === 'neumorphism';
      const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;
      const bg = ctx.createLinearGradient(x, y, x + size, y + size);
      if (pal?.isLight) {
        bg.addColorStop(0, pal.wellTop || pal.surfaceAlt);
        bg.addColorStop(1, pal.surfaceLight || pal.surface);
      } else {
        bg.addColorStop(0, '#092218');
        bg.addColorStop(1, '#133C2B');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, size, size);

      const cx = x + size / 2;
      const baseY = y + size * 0.76;
      const domeGold = pal ? pal.accentGold : '#EAB308';
      ctx.fillStyle = domeGold;
      ctx.strokeStyle = domeGold;
      ctx.lineWidth = 2;

      // Central Lamp Fall Minaret Spire + Crescent
      ctx.fillRect(cx - 6, baseY - 56, 12, 56);
      ctx.beginPath();
      ctx.moveTo(cx - 8, baseY - 56);
      ctx.lineTo(cx, baseY - 74);
      ctx.lineTo(cx + 8, baseY - 56);
      ctx.closePath();
      ctx.fill();
      this.drawMiniCrescent(ctx, cx, baseY - 81, 6, domeGold);

      // Left & Right Mosque Domes
      ctx.beginPath();
      ctx.arc(cx - 23, baseY - 15, 15, Math.PI, 0);
      ctx.lineTo(cx - 8, baseY);
      ctx.lineTo(cx - 38, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx + 23, baseY - 15, 15, Math.PI, 0);
      ctx.lineTo(cx + 38, baseY);
      ctx.lineTo(cx + 8, baseY);
      ctx.closePath();
      ctx.fill();

      // Golden Baseline & TOUBA title
      ctx.fillRect(cx - 42, baseY + 3, 84, 3.5);
      ctx.font = '700 17px "Cinzel", serif';
      ctx.fillStyle = pal?.isLight ? pal.textColor : '#FEF08A';
      ctx.textAlign = 'center';
      ctx.fillText('TOUBA', cx, y + size * 0.91);
    } else if (
      config.avatarMode !== 'crown-logo' &&
      avatarImg &&
      avatarImg.complete &&
      avatarImg.naturalWidth > 0
    ) {
      const iw = avatarImg.naturalWidth;
      const ih = avatarImg.naturalHeight;
      const scale = Math.max(size / iw, size / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(avatarImg, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
    } else {
      // Stylized Dark Luxury Crown Emblem (matches Image 2's Wally Seck Crown Logo!)
      const bg = ctx.createLinearGradient(x, y, x + size, y + size);
      bg.addColorStop(0, '#090D16');
      bg.addColorStop(1, '#1E293B');
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, size, size);

      // Golden Crown
      const cx = x + size / 2;
      const cy = y + size * 0.44;
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + 12);
      ctx.lineTo(cx - 30, cy - 14);
      ctx.lineTo(cx - 13, cy + 2);
      ctx.lineTo(cx, cy - 20);
      ctx.lineTo(cx + 13, cy + 2);
      ctx.lineTo(cx + 30, cy - 14);
      ctx.lineTo(cx + 26, cy + 12);
      ctx.closePath();
      ctx.stroke();

      // Calligraphic Artist Name below Crown
      ctx.font = '22px "Great Vibes", cursive';
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.fillText(config.artistName || 'Wally Seck', cx, y + size * 0.8);
    }
    ctx.restore();

    // Subtle Glass or Golden Rim around Avatar
    ctx.save();
    this.roundRectPath(ctx, x, y, size, size, radius);
    ctx.strokeStyle =
      config.visualTheme === 'neumorphism'
        ? this.getNeumorphicPalette(config).accentGold
        : 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.restore();
  }

  drawVerifiedBadge(ctx, cx, cy, r, color = '#1DA1F2') {
    ctx.save();
    // Scalloped 10-lobe Verified Circle
    ctx.fillStyle = color;
    ctx.beginPath();
    const lobes = 12;
    for (let i = 0; i < lobes * 2; i++) {
      const rad = i % 2 === 0 ? r * 1.08 : r * 0.88;
      const angle = (i * Math.PI) / lobes;
      const px = cx + Math.cos(angle) * rad;
      const py = cy + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Crisp White Checkmark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy + 0.5);
    ctx.lineTo(cx - r * 0.08, cy + r * 0.34);
    ctx.lineTo(cx + r * 0.42, cy - r * 0.28);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 6. Floating Glassmorphic Musical Notes (♪ ♫)
   */
  drawFloatingNotes(ctx, config, currentTime) {
    const notePositions = [
      { x: 970, y: 175, scale: 1.05, type: 'single', phase: 0 },
      { x: 92, y: 455, scale: 0.95, type: 'single', phase: 1.5 },
      { x: 112, y: 1275, scale: 0.92, type: 'double', phase: 3.1 },
      { x: 1005, y: 1235, scale: 0.9, type: 'single', phase: 4.4 },
      { x: 945, y: 515, scale: 0.78, type: 'double', phase: 2.2 },
    ];

    const count = Math.min(notePositions.length, config.notesCount || 4);
    for (let i = 0; i < count; i++) {
      const np = notePositions[i];
      const floatY = np.y + Math.sin(currentTime * 1.8 + np.phase) * 12;
      const floatX = np.x + Math.cos(currentTime * 1.3 + np.phase) * 6;
      this.drawSingleGlassNote(ctx, floatX, floatY, np.scale, np.type, config.notesGlowColor);
    }
  }

  drawSingleGlassNote(ctx, x, y, scale, type, glowColor = '#93C5FD') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(0.14);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;

    const noteGrad = ctx.createLinearGradient(-30, -60, 30, 40);
    noteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
    noteGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.55)');
    noteGrad.addColorStop(1, 'rgba(147, 197, 253, 0.35)');

    ctx.fillStyle = noteGrad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;

    if (type === 'double') {
      // Beamed eighth notes ♫
      // Left head
      ctx.beginPath();
      ctx.ellipse(-22, 26, 16, 12, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right head
      ctx.beginPath();
      ctx.ellipse(22, 18, 16, 12, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Stems & top beam
      ctx.beginPath();
      ctx.moveTo(-9, 22);
      ctx.lineTo(-9, -38);
      ctx.lineTo(35, -48);
      ctx.lineTo(35, 14);
      ctx.lineTo(27, 14);
      ctx.lineTo(27, -34);
      ctx.lineTo(-1, -26);
      ctx.lineTo(-1, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Single eighth note ♪
      ctx.beginPath();
      ctx.ellipse(-10, 28, 18, 13, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stem
      ctx.fillRect(3, -44, 8, 70);
      ctx.strokeRect(3, -44, 8, 70);

      // Flag
      ctx.beginPath();
      ctx.moveTo(11, -44);
      ctx.bezierCurveTo(36, -34, 42, -10, 28, 8);
      ctx.bezierCurveTo(32, -8, 26, -24, 11, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 7. Center Glassmorphic Lyric Card & Multi-Line Brush Lyrics
   */
  findActiveLyric(lyrics, currentTime) {
    if (!lyrics || lyrics.length === 0) {
      return { text: 'Boul Faalé,\n*dafa nekk ci*\nSénégal...', startTime: 0, endTime: 5, progress: 0.5 };
    }
    const sorted = [...lyrics].sort((a, b) => a.startTime - b.startTime);
    // 1. Exact match within [startTime, endTime]
    let item = sorted.find((l) => currentTime >= l.startTime && currentTime <= l.endTime);
    // 2. If in a brief gap between couplets, hold the most recently started couplet
    if (!item) {
      const startedBefore = sorted.filter((l) => l.startTime <= currentTime);
      item = startedBefore.length > 0 ? startedBefore[startedBefore.length - 1] : sorted[0];
    }
    const dur = Math.max(0.1, item.endTime - item.startTime);
    const progress = Math.max(0, Math.min(1, (currentTime - item.startTime) / dur));
    return { ...item, progress };
  }

  drawLyricCard(ctx, config, activeLyric, currentTime) {
    const cardW = config.cardWidth || 910;
    const cardH = config.cardHeight || 565;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const cardY = config.cardY - cardH / 2;
    const cardR = config.cardBorderRadius || 56;

    // 1. Frosted Glass Box with Specular Rim Lights (or Extruded Neumorphic Card in Khassida Mode)
    this.drawFrostedGlassBox(ctx, cardX, cardY, cardW, cardH, cardR, {
      opacity: config.glassOpacity,
      tintColor: config.glassTint,
      rimPrimary: config.rimLightPrimary,
      rimSecondary: config.rimLightSecondary,
      rimIntensity: config.rimLightIntensity,
      shadowBlur: 48,
      shadowOffsetY: 22,
      cornerFlares: true,
    });

    const isNeumorphic = config.visualTheme === 'neumorphism';
    const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;

    // 1B. Neumorphic Carved Inner Well + Islamic Corner Ornaments + Sacred Header Calligraphy (﷽)
    if (isNeumorphic) {
      if (config.neumorphicInsetFrame !== false) {
        const insetPad = 24;
        this.drawNeumorphicBox(
          ctx,
          cardX + insetPad,
          cardY + insetPad,
          cardW - insetPad * 2,
          cardH - insetPad * 2,
          Math.max(20, cardR - 18),
          config,
          true
        );
      }

      if (config.showIslamicOrnaments !== false) {
        this.drawIslamicCardCorners(ctx, cardX, cardY, cardW, cardH, pal.accentGold);
      }

      if (config.khassidaHeaderCalligraphy) {
        ctx.save();
        const headerY = cardY + 66;
        ctx.direction = hasArabicScript(config.khassidaHeaderCalligraphy) ? 'rtl' : 'ltr';
        ctx.font = '700 44px "Amiri", "Scheherazade New", serif';
        ctx.fillStyle = pal.accentGold;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.khassidaHeaderCalligraphy, CANVAS_WIDTH / 2, headerY);

        // Ornamental Side Lines around the Basmala / Calligraphy
        const calW = Math.min(340, ctx.measureText(config.khassidaHeaderCalligraphy).width + 44);
        ctx.strokeStyle = pal.ornamentStroke || pal.borderBevel;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - calW / 2 - 110, headerY);
        ctx.lineTo(CANVAS_WIDTH / 2 - calW / 2, headerY);
        ctx.moveTo(CANVAS_WIDTH / 2 + calW / 2, headerY);
        ctx.lineTo(CANVAS_WIDTH / 2 + calW / 2 + 110, headerY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Optional 3D Glowing Quotation Marks “ on Top-Left Border (Image 2)
    if (config.showQuoteMarks) {
      this.draw3DQuoteMarks(ctx, cardX + 68, cardY - 4, config.rimLightPrimary);
    }

    // 3. Optional Hand-Drawn Yellow Brush Heart ♡ on Top-Right of Card (Image 2)
    if (config.showCardHeart) {
      this.drawBrushHeart(ctx, cardX + cardW - 95, cardY + 68, 44, config.highlightColor);
    }

    // 4. Render Active Lyrics with Auto-Wrap, Auto-Fit, RTL Arabic Shaping & Inline Highlight (*word*)
    const rawText = (activeLyric?.text || '').trim();
    if (!rawText) return;

    const fontObj = LYRIC_FONTS.find((f) => f.id === config.fontFamily) || LYRIC_FONTS[0];
    const baseFontSize = config.fontSize || 98;
    const coupletHasArabic = hasArabicScript(rawText);
    // Give Arabic vocalized lines (Harakat / Tashkeel) generous vertical breathing room
    const lineHeightRatio = coupletHasArabic
      ? Math.max(config.lineHeight || 1.18, 1.34)
      : config.lineHeight || 1.18;

    const cardShowUnderline =
      activeLyric?.showUnderline !== undefined
        ? activeLyric.showUnderline
        : config.showBrushUnderline;

    // Safe inner bounding box of the glass/neumorphic card
    const padX = Math.max(56, (config.cardBorderRadius || 56) * 0.95) + (isNeumorphic ? 18 : 0);
    const hasTopOrnament =
      config.showQuoteMarks ||
      config.showCardHeart ||
      (isNeumorphic && Boolean(config.khassidaHeaderCalligraphy));
    const padTop = hasTopOrnament ? 96 : 52;
    const padBottom = cardShowUnderline ? 92 : 52;
    const maxTextWidth = Math.max(260, cardW - padX * 2);
    const maxTextHeight = Math.max(140, cardH - padTop - padBottom);

    // Tokenize paragraphs into words while preserving *...* highlight state across lines
    const tokenizedParagraphs = this.tokenizeLyricsIntoParagraphs(rawText);

    // For Khassidas / Arabic verses or single-line subtitle cards: keep each line on 1 single line
    // without forced wrapping by scaling the font size to fit the card width.
    const preferSingleLinePerParagraph = Boolean(
      config.singleLinePerCard ||
        config.visualTheme === 'neumorphism' ||
        coupletHasArabic ||
        tokenizedParagraphs.length === 1
    );

    // Auto-fit loop: find the largest fontSize <= baseFontSize where all lines fit width & height
    let effectiveFontSize = baseFontSize;
    const minFontSize = 26;
    let wrappedLines = [];
    let lineHeightPx = effectiveFontSize * lineHeightRatio;

    while (effectiveFontSize >= minFontSize) {
      lineHeightPx = effectiveFontSize * lineHeightRatio;
      const forceSingleLineNow =
        preferSingleLinePerParagraph && effectiveFontSize > minFontSize;

      wrappedLines = this.wrapParagraphsToLines(
        ctx,
        tokenizedParagraphs,
        maxTextWidth,
        fontObj,
        effectiveFontSize,
        forceSingleLineNow
      );

      const totalH = wrappedLines.length * lineHeightPx;
      const widestLine = wrappedLines.reduce((maxW, line) => Math.max(maxW, line.width), 0);

      if (
        (totalH <= maxTextHeight && widestLine <= maxTextWidth + 2) ||
        effectiveFontSize <= minFontSize
      ) {
        break;
      }
      effectiveFontSize -= 2;
    }

    if (wrappedLines.length === 0) return;

    // Apply Karaoke progressive highlighting if active and no explicit *...* markers were used
    const hasExplicitMarkers = rawText.includes('*');
    if (config.lyricAnimation === 'karaoke' && !hasExplicitMarkers) {
      const totalWords = wrappedLines.reduce((sum, l) => sum + l.words.length, 0);
      let wordCounter = 0;
      wrappedLines.forEach((line) => {
        line.words.forEach((wordSegs) => {
          const wordProg = wordCounter / Math.max(1, totalWords);
          const isLit = activeLyric.progress >= wordProg;
          wordSegs.forEach((seg) => {
            seg.highlighted = isLit;
          });
          wordCounter++;
        });
      });
    }

    const totalTextH = wrappedLines.length * lineHeightPx;

    // Entry Animation (pop-fade or slide-up)
    const elapsedInLine = Math.max(0, currentTime - (activeLyric.startTime || 0));
    let animScale = 1;
    let animOffsetY = 0;
    let animAlpha = 1;

    if (config.lyricAnimation === 'pop-fade' && elapsedInLine < 0.28) {
      const p = elapsedInLine / 0.28;
      const ease = 1 - Math.pow(1 - p, 3);
      animScale = 0.92 + 0.08 * ease;
      animAlpha = 0.25 + 0.75 * ease;
    } else if (config.lyricAnimation === 'slide-up' && elapsedInLine < 0.3) {
      const p = elapsedInLine / 0.3;
      const ease = 1 - Math.pow(1 - p, 3);
      animOffsetY = (1 - ease) * 32;
      animAlpha = ease;
    }

    ctx.save();
    // Clip strictly to the inner glass card so text can never overflow the rounded border
    this.roundRectPath(ctx, cardX + 10, cardY + 10, cardW - 20, cardH - 20, Math.max(8, cardR - 8));
    ctx.clip();

    ctx.globalAlpha = animAlpha;
    const verticalCenterOffset = (padTop - padBottom) * 0.35;
    ctx.translate(
      CANVAS_WIDTH / 2,
      cardY + cardH / 2 + verticalCenterOffset + animOffsetY
    );
    ctx.scale(animScale, animScale);
    ctx.textBaseline = 'middle';

    const startY = -totalTextH / 2 + lineHeightPx / 2;

    // Ensure high contrast on light Neumorphic palettes even if config.textColor was previously white
    const baseTextCol =
      isNeumorphic &&
      pal?.isLight &&
      (config.textColor === '#FFFFFF' || config.textColor === '#F8FAFC')
        ? pal.textColor
        : config.textColor;
    const hiTextCol =
      isNeumorphic && pal?.isLight && config.highlightColor === '#FACC15'
        ? pal.accentGold
        : config.highlightColor;

    const drawStyledRun = (text, x, y, color) => {
      // 1. Deep Soft Drop Shadow on Glass or Soft-UI Emboss on Light Neumorphism
      if (config.textShadowIntensity > 0) {
        ctx.save();
        if (isNeumorphic && pal?.isLight) {
          ctx.shadowColor = pal.shadowDark;
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
        } else {
          ctx.shadowColor = `rgba(0, 0, 0, ${0.75 * config.textShadowIntensity})`;
          ctx.shadowBlur = 18;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 8;
        }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();
      }

      // 2. Optional Subtle 3D Bevel / Extrusion
      if (config.textBevelEffect) {
        ctx.fillStyle =
          isNeumorphic && pal?.isLight ? pal.shadowLight : 'rgba(15, 23, 42, 0.45)';
        ctx.fillText(text, x - 2.5, y - 2.5);
      }

      // 3. Main Crisp Glyph Fill
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    wrappedLines.forEach((lineObj, lineIdx) => {
      const ly = startY + lineIdx * lineHeightPx;
      const isRtl = Boolean(lineObj.isRtl);

      ctx.save();
      ctx.font = this.getFontSpecForLine(fontObj, effectiveFontSize, isRtl);
      const spaceWidth = ctx.measureText(' ').width;

      if (isRtl) {
        // RIGHT-TO-LEFT (RTL) ARABIC RENDERING:
        // Group adjacent words that share the same highlight state into contiguous runs
        // so HarfBuzz shapes Arabic words, ligatures (اللَّهِ) and harakat naturally,
        // and place word/run 0 on the FAR RIGHT advancing to the LEFT!
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';

        const runs = this.buildContiguousRuns(ctx, lineObj.words);
        const totalRunsWidth =
          runs.reduce((acc, r) => acc + r.width, 0) +
          Math.max(0, runs.length - 1) * spaceWidth;

        let rightEdgeX = totalRunsWidth / 2;

        runs.forEach((run) => {
          const runCenterX = rightEdgeX - run.width / 2;
          const color = run.highlighted ? hiTextCol : baseTextCol;
          drawStyledRun(run.text, runCenterX, ly, color);
          rightEdgeX -= run.width + spaceWidth;
        });
      } else {
        // LEFT-TO-RIGHT (LTR) LATIN / WOLOF / FRENCH RENDERING:
        ctx.direction = 'ltr';
        ctx.textAlign = 'left';

        let cursorX = -lineObj.width / 2;
        lineObj.words.forEach((wordSegs, wIdx) => {
          wordSegs.forEach((seg) => {
            const color = seg.highlighted ? hiTextCol : baseTextCol;
            drawStyledRun(seg.text, cursorX, ly, color);
            cursorX += seg.width;
          });

          if (wIdx < lineObj.words.length - 1) {
            cursorX += spaceWidth;
          }
        });
      }

      ctx.restore();
    });

    // 5. Hand-Drawn Yellow Brush Underline Stroke beneath the Lyrics
    if (cardShowUnderline) {
      const lastLineW = wrappedLines[wrappedLines.length - 1]?.width || 320;
      const underlineW = Math.max(240, Math.min(maxTextWidth * 0.72, lastLineW * 0.85));
      const underlineY =
        startY + (wrappedLines.length - 0.35) * lineHeightPx + Math.max(12, effectiveFontSize * 0.16);
      this.drawBrushUnderline(
        ctx,
        0,
        underlineY,
        underlineW,
        config.underlineColor || hiTextCol
      );
    }

    ctx.restore();
  }

  /**
   * Returns the CSS font specification for a line, automatically selecting a rich
   * Arabic calligraphy font ("Amiri" / "Scheherazade New" / "Aref Ruqaa" / "Reem Kufi")
   * with a slight optical size boost when the line contains Arabic script.
   */
  getFontSpecForLine(fontObj, fontSize, isRtl = false) {
    if (isRtl) {
      const arabicSize = Math.round(fontSize * 1.06);
      if (fontObj?.isArabicReady) {
        return `normal ${fontObj.weight || '700'} ${arabicSize}px ${fontObj.family}`;
      }
      return `normal 700 ${arabicSize}px "Amiri", "Scheherazade New", serif`;
    }
    return `${fontObj?.style || 'normal'} ${fontObj?.weight || '400'} ${fontSize}px ${fontObj?.family || 'sans-serif'}`;
  }

  /**
   * Groups adjacent words with identical highlight state into contiguous shaped text runs.
   * Essential for Arabic RTL lines so multi-word phrases and ligatures shape seamlessly.
   */
  buildContiguousRuns(ctx, lineWords) {
    const runs = [];
    let currentWords = [];
    let currentHighlight = null;

    const flushRun = () => {
      if (currentWords.length > 0) {
        const text = currentWords.join(' ');
        runs.push({
          text,
          highlighted: Boolean(currentHighlight),
          width: ctx.measureText(text).width,
        });
        currentWords = [];
      }
    };

    for (const wordSegs of lineWords) {
      const wordText = wordSegs.map((s) => s.text).join('');
      const wordHi = wordSegs.some((s) => s.highlighted);
      if (currentHighlight !== null && wordHi !== currentHighlight) {
        flushRun();
      }
      currentHighlight = wordHi;
      currentWords.push(wordText);
    }
    flushRun();

    return runs;
  }

  /**
   * Tokenizes multi-line text into paragraphs of words while preserving `*...*` highlight state
   * even when `*...*` spans across multiple words or lines.
   * For Arabic words, keeps the entire word as a single segment so cursive letter joining is never broken.
   */
  tokenizeLyricsIntoParagraphs(rawText) {
    const rawParagraphs = rawText.split('\n');
    let inHighlight = false;
    const paragraphs = [];

    for (const para of rawParagraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      const words = [];
      let currentWordSegs = [];
      let currentText = '';

      const flushSeg = () => {
        if (currentText.length > 0) {
          currentWordSegs.push({ text: currentText, highlighted: inHighlight });
          currentText = '';
        }
      };

      const flushWord = () => {
        flushSeg();
        if (currentWordSegs.length > 0) {
          const combinedWord = currentWordSegs.map((s) => s.text).join('');
          if (hasArabicScript(combinedWord)) {
            // Never split a single Arabic word into disconnected cursive segments
            const anyHighlighted = currentWordSegs.some((s) => s.highlighted);
            words.push([{ text: combinedWord, highlighted: anyHighlighted }]);
          } else {
            words.push(currentWordSegs);
          }
          currentWordSegs = [];
        }
      };

      for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (ch === '*') {
          flushSeg();
          inHighlight = !inHighlight;
        } else if (/\s/.test(ch)) {
          flushWord();
        } else {
          currentText += ch;
        }
      }
      flushWord();

      if (words.length > 0) {
        paragraphs.push(words);
      }
    }

    return paragraphs;
  }

  /**
   * Wraps tokenized paragraphs into balanced visual lines that fit within `maxWidth`.
   * When `forceSingleLinePerParagraph` is true, keeps each paragraph on a single unbroken line
   * so the caller's auto-fit loop scales the font size instead of forcing a line break.
   */
  wrapParagraphsToLines(
    ctx,
    paragraphs,
    maxWidth,
    fontObj,
    effectiveFontSize,
    forceSingleLinePerParagraph = false
  ) {
    const allLines = [];

    const measureWord = (wordSegs) => {
      let w = 0;
      const measured = wordSegs.map((seg) => {
        const sw = ctx.measureText(seg.text).width;
        w += sw;
        return { ...seg, width: sw };
      });
      return { segs: measured, width: w };
    };

    for (const paraWords of paragraphs) {
      const isRtl = paraWords.some((w) => w.some((s) => hasArabicScript(s.text)));
      ctx.font = this.getFontSpecForLine(fontObj, effectiveFontSize, isRtl);
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      const spaceWidth = ctx.measureText(' ').width;

      // Measure all words in this paragraph, splitting any single Latin word that is wider than maxWidth
      // (Never split an Arabic word character-by-character so cursive joining & harakat stay intact)
      const measuredWords = [];
      for (const rawWordSegs of paraWords) {
        const mw = measureWord(rawWordSegs);
        if (mw.width <= maxWidth || isRtl) {
          measuredWords.push(mw);
        } else {
          // Break an abnormally long unbroken Latin word character by character
          let chunkSegs = [];
          let chunkW = 0;
          for (const seg of rawWordSegs) {
            let subText = '';
            for (const ch of seg.text) {
              const cw = ctx.measureText(ch).width;
              if (chunkW + cw > maxWidth && (chunkSegs.length > 0 || subText.length > 0)) {
                if (subText) {
                  chunkSegs.push({
                    text: subText,
                    highlighted: seg.highlighted,
                    width: ctx.measureText(subText).width,
                  });
                  subText = '';
                }
                measuredWords.push({ segs: chunkSegs, width: chunkW });
                chunkSegs = [];
                chunkW = 0;
              }
              subText += ch;
              chunkW += cw;
            }
            if (subText) {
              chunkSegs.push({
                text: subText,
                highlighted: seg.highlighted,
                width: ctx.measureText(subText).width,
              });
            }
          }
          if (chunkSegs.length > 0) {
            measuredWords.push({ segs: chunkSegs, width: chunkW });
          }
        }
      }

      if (measuredWords.length === 0) continue;

      // Calculate total single-line width of this paragraph
      const totalParaWidth =
        measuredWords.reduce((acc, w) => acc + w.width, 0) +
        Math.max(0, measuredWords.length - 1) * spaceWidth;

      if (totalParaWidth <= maxWidth || forceSingleLinePerParagraph) {
        allLines.push({
          words: measuredWords.map((mw) => mw.segs),
          width: totalParaWidth,
          isRtl,
        });
        continue;
      }

      // Balanced multi-line wrapping so lines have harmonious widths inside the card
      const estimatedLineCount = Math.ceil(totalParaWidth / maxWidth);
      const targetLineWidth = Math.min(
        maxWidth,
        Math.max(maxWidth * 0.62, (totalParaWidth / estimatedLineCount) * 1.12)
      );

      let currentLineWords = [];
      let currentLineWidth = 0;

      for (let i = 0; i < measuredWords.length; i++) {
        const mw = measuredWords[i];
        const nextWidth =
          currentLineWords.length === 0 ? mw.width : currentLineWidth + spaceWidth + mw.width;

        if (currentLineWords.length > 0 && nextWidth > maxWidth) {
          allLines.push({
            words: currentLineWords,
            width: currentLineWidth,
            isRtl,
          });
          currentLineWords = [mw.segs];
          currentLineWidth = mw.width;
        } else if (
          currentLineWords.length > 0 &&
          nextWidth > targetLineWidth &&
          measuredWords.length - i >= 1
        ) {
          allLines.push({
            words: currentLineWords,
            width: currentLineWidth,
            isRtl,
          });
          currentLineWords = [mw.segs];
          currentLineWidth = mw.width;
        } else {
          currentLineWords.push(mw.segs);
          currentLineWidth = nextWidth;
        }
      }

      if (currentLineWords.length > 0) {
        allLines.push({
          words: currentLineWords,
          width: currentLineWidth,
          isRtl,
        });
      }
    }

    ctx.direction = 'ltr';
    return allLines;
  }

  /**
   * Hand-drawn curved dry-brush underline (exact match to Image 1 & Image 2)
   */
  drawBrushUnderline(ctx, centerX, y, width, color = '#FACC15') {
    const leftX = centerX - width * 0.48;
    const rightX = centerX + width * 0.52;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Main curved tapered brushstroke
    ctx.beginPath();
    ctx.moveTo(leftX, y + 26);
    ctx.quadraticCurveTo(centerX + 18, y - 16, rightX, y - 2);
    ctx.quadraticCurveTo(centerX + 14, y - 2, leftX, y + 31);
    ctx.closePath();
    ctx.fill();

    // Secondary dry-brush bristle streak on the right
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(centerX - 30, y + 12);
    ctx.quadraticCurveTo(centerX + 80, y - 2, rightX + 10, y + 4);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 3D Glowing Quotation Marks “ (Image 2 top-left of card)
   */
  draw3DQuoteMarks(ctx, x, y, glowColor = '#7DD3FC') {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;

    for (let i = 0; i < 2; i++) {
      const qx = i * 56;
      const grad = ctx.createLinearGradient(qx, -42, qx + 42, 42);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.82)');
      grad.addColorStop(1, 'rgba(147, 197, 253, 0.55)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(qx + 32, -45);
      ctx.quadraticCurveTo(qx + 4, -22, qx + 2, 12);
      ctx.arc(qx + 20, 18, 18, Math.PI, 0, true);
      ctx.quadraticCurveTo(qx + 38, -2, qx + 22, -6);
      ctx.quadraticCurveTo(qx + 26, -24, qx + 42, -38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Hand-drawn yellow brush Heart ♡ (Image 2 top-right of card)
   */
  drawBrushHeart(ctx, cx, cy, size, color = '#FACC15') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(250, 204, 21, 0.55)';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(0, size * 0.65);
    ctx.bezierCurveTo(-size * 0.9, size * 0.1, -size * 0.85, -size * 0.65, -size * 0.25, -size * 0.55);
    ctx.bezierCurveTo(-size * 0.02, -size * 0.5, 0, -size * 0.2, 0, -size * 0.15);
    ctx.bezierCurveTo(0, -size * 0.25, size * 0.15, -size * 0.75, size * 0.48, -size * 0.62);
    ctx.bezierCurveTo(size * 0.95, -size * 0.42, size * 0.65, size * 0.2, 0, size * 0.65);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Golden Crescent Moons (☪) & Oriental Mihrab Arch Corner Filigree for Khassida card
   */
  drawIslamicCardCorners(ctx, x, y, w, h, goldColor = '#EAB308') {
    const inset = 46;
    const corners = [
      { cx: x + inset, cy: y + inset, sx: 1, sy: 1 },
      { cx: x + w - inset, cy: y + inset, sx: -1, sy: 1 },
      { cx: x + inset, cy: y + h - inset, sx: 1, sy: -1 },
      { cx: x + w - inset, cy: y + h - inset, sx: -1, sy: -1 },
    ];

    ctx.save();
    ctx.strokeStyle = goldColor;
    ctx.fillStyle = goldColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    corners.forEach(({ cx, cy, sx, sy }) => {
      // Delicate Crescent Moon (☪) & Small Star at Corner
      this.drawMiniCrescent(ctx, cx, cy, 11, goldColor);
      this.drawFivePointStar(ctx, cx + sx * 8, cy + sy * 2, 4.2, goldColor);

      // Oriental Arch / Scroll Corner Brackets
      ctx.beginPath();
      ctx.moveTo(cx + sx * 22, cy);
      ctx.quadraticCurveTo(cx + sx * 38, cy - sy * 4, cx + sx * 58, cy);
      ctx.moveTo(cx, cy + sy * 22);
      ctx.quadraticCurveTo(cx - sx * 4, cy + sy * 38, cx, cy + sy * 58);
      ctx.stroke();

      // Tiny decorative pearl dots at bracket tips
      ctx.beginPath();
      ctx.arc(cx + sx * 64, cy, 2.5, 0, Math.PI * 2);
      ctx.arc(cx, cy + sy * 64, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * 8. Symmetrical Audio Visualizer (Pill Bars + Baseline Dots)
   */
  drawVisualizer(ctx, config, levels = []) {
    const centerY = config.visualizerY || 1280;
    const barCount = config.visualizerBars || 39;
    const totalWidth = 650;
    const spacing = totalWidth / barCount;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const maxBarH = 112;
    const isNeumorphic = config.visualTheme === 'neumorphism';
    const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;

    // Optional Recessed Neumorphic Equalizer Well in Khassida Mode
    if (isNeumorphic) {
      const wellW = totalWidth + 88;
      const wellH = 148;
      this.drawNeumorphicBox(
        ctx,
        (CANVAS_WIDTH - wellW) / 2,
        centerY - 94,
        wellW,
        wellH,
        40,
        config,
        true
      );
    }

    ctx.save();
    const vizColor =
      isNeumorphic && pal?.isLight && (!config.visualizerColor || config.visualizerColor === '#FFFFFF')
        ? pal.accentGold
        : config.visualizerColor || (isNeumorphic ? pal.accentGold : '#FFFFFF');
    ctx.fillStyle = vizColor;
    if (!isNeumorphic) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.65)';
      ctx.shadowBlur = 10;
    }

    for (let i = 0; i < barCount; i++) {
      const lv = levels[i] !== undefined ? levels[i] : 0.1;
      const bx = startX + i * spacing;

      // Baseline small dots (characteristic detail in both Reference Image 1 & 2!)
      ctx.beginPath();
      ctx.arc(bx + 2.5, centerY + 26, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Vertical rounded pill bar
      const bh = Math.max(8, lv * maxBarH);
      const by = centerY + 26 - bh;
      const bw = 5.4;
      this.roundRectPath(ctx, bx, by, bw, bh, bw / 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 9. Glassmorphic / Neumorphic Media Player Controls (Progress Bar + Timecodes + 5 Buttons)
   */
  drawPlayerControls(ctx, config, currentTime, duration, isPlaying) {
    const baseY = config.playerY || 1510;
    const barLeft = 92;
    const barRight = CANVAS_WIDTH - 92;
    const barW = barRight - barLeft;
    const barY = baseY - 120;
    const isNeumorphic = config.visualTheme === 'neumorphism';
    const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;

    // Smooth 60fps floating-point progress ratio
    const realDuration = Math.max(1, duration || 30);
    const useDecorativeOffset = config.playerTimeMode === 'decorative';
    const offsetSec = useDecorativeOffset ? config.displayTimeOffset || 0 : 0;
    const displayCurrent = Math.floor(offsetSec + currentTime);
    const displayTotal = useDecorativeOffset
      ? Math.max(displayCurrent + 10, config.displayTotalDuration || 225)
      : Math.floor(realDuration);

    // Smooth floating progress across the track (never jerky!)
    const rawRatio = useDecorativeOffset
      ? (offsetSec + currentTime) / Math.max(1, displayTotal)
      : currentTime / realDuration;
    const progressRatio = Math.max(0.02, Math.min(0.98, rawRatio));
    const thumbX = barLeft + barW * progressRatio;

    ctx.save();

    if (isNeumorphic) {
      // Recessed Neumorphic Groove for Progress Track
      this.drawNeumorphicBox(ctx, barLeft - 4, barY - 9, barW + 8, 18, 9, config, true);

      // Played Golden/Accent Track inside Groove
      this.roundRectPath(ctx, barLeft, barY - 4.5, Math.max(10, thumbX - barLeft), 9, 4.5);
      ctx.fillStyle = pal.accentGold;
      ctx.fill();

      // Tactile Extruded Neumorphic Scrubber Knob
      ctx.save();
      ctx.beginPath();
      ctx.arc(thumbX, barY, 17, 0, Math.PI * 2);
      ctx.shadowColor = pal.shadowDark;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = pal.accentGold;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(thumbX, barY, 6, 0, Math.PI * 2);
      ctx.fillStyle = pal.accentGold;
      ctx.fill();
      ctx.restore();

      // Left & Right Timecodes
      ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = pal.subTextColor;
      ctx.textAlign = 'left';
      ctx.fillText(this.formatTime(displayCurrent), barLeft, barY + 54);
      ctx.textAlign = 'right';
      ctx.fillText(this.formatTime(displayTotal), barRight, barY + 54);
    } else {
      // Unplayed Track
      this.roundRectPath(ctx, barLeft, barY - 3, barW, 6, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();

      // Played Track
      this.roundRectPath(ctx, barLeft, barY - 3.5, Math.max(7, thumbX - barLeft), 7, 3.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Glowing White Scrubber Thumb
      ctx.beginPath();
      ctx.arc(thumbX, barY, 13.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 16;
      ctx.fill();

      // Left & Right Timecodes (00:32 / 03:45 or Real Song Time)
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.font = '500 31px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(this.formatTime(displayCurrent), barLeft, barY + 52);
      ctx.textAlign = 'right';
      ctx.fillText(this.formatTime(displayTotal), barRight, barY + 52);
    }

    // 5 Circular Glassmorphic / Neumorphic Player Buttons
    const btnY = baseY + 38;
    const buttons = [
      { id: 'shuffle', x: 170, r: 53 },
      { id: 'prev', x: 345, r: 57 },
      { id: 'play', x: 540, r: 78, isCenter: true },
      { id: 'next', x: 735, r: 57 },
      { id: 'repeat', x: 910, r: 53 },
    ];

    const iconColor = isNeumorphic ? pal.textColor : '#FFFFFF';
    const centerIconColor = isNeumorphic ? pal.accentGold : '#FFFFFF';

    buttons.forEach((btn) => {
      this.drawCircularGlassButton(ctx, btn.x, btnY, btn.r, btn.isCenter, config);
      this.drawPlayerButtonIcon(
        ctx,
        btn.id,
        btn.x,
        btnY,
        isPlaying,
        btn.isCenter ? centerIconColor : iconColor
      );
    });

    ctx.restore();
  }

  drawCircularGlassButton(ctx, cx, cy, r, isCenter, config) {
    if (config.visualTheme === 'neumorphism') {
      const pal = this.getNeumorphicPalette(config);
      const relief = config.neumorphicRelief ?? 1.0;

      ctx.save();
      // Top-left soft highlight shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.shadowColor = pal.shadowLight;
      ctx.shadowBlur = 22 * relief;
      ctx.shadowOffsetX = -10 * relief;
      ctx.shadowOffsetY = -10 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.restore();

      // Bottom-right dark shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.shadowColor = pal.shadowDark;
      ctx.shadowBlur = 26 * relief;
      ctx.shadowOffsetX = 12 * relief;
      ctx.shadowOffsetY = 12 * relief;
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.restore();

      // Convex Circular Fill
      const surfGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      surfGrad.addColorStop(0, pal.surfaceLight || pal.surface);
      surfGrad.addColorStop(0.55, pal.surface);
      surfGrad.addColorStop(1, pal.surfaceAlt);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = surfGrad;
      ctx.fill();

      // Bevel Ring (Golden accent ring on center button, soft specular edge on side buttons)
      ctx.lineWidth = isCenter ? 2.5 : 1.6;
      ctx.strokeStyle = isCenter ? pal.accentGold : pal.borderBevel;
      ctx.stroke();

      if (isCenter) {
        ctx.beginPath();
        ctx.arc(cx, cy, r - 9, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = pal.ornamentStroke || pal.borderBevel;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    ctx.save();

    // Outer Glow for Center Play/Pause Button (Matches golden/white halo in Images 1 & 2)
    if (isCenter) {
      const glowColor = config.centerButtonGlowColor || '#FACC15';
      const rgb = this.hexToRgb(glowColor);
      const intensity = config.centerButtonGlowIntensity ?? 0.95;

      const halo = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r * 1.48);
      halo.addColorStop(0, `rgba(255, 255, 255, ${0.55 * intensity})`);
      halo.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.55 * intensity})`);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.48, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clip Circle & Draw Blurred Background
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      this.blurCanvas,
      0,
      0,
      this.blurCanvas.width,
      this.blurCanvas.height,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    const glassFill = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    glassFill.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    glassFill.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
    glassFill.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
    ctx.fillStyle = glassFill;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // Specular Circle Rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (isCenter) {
      const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rimGrad.addColorStop(0, '#FFFFFF');
      rimGrad.addColorStop(0.35, config.centerButtonGlowColor || '#FACC15');
      rimGrad.addColorStop(0.7, '#FFFFFF');
      rimGrad.addColorStop(1, config.centerButtonGlowColor || '#FACC15');
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 4.2;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = 2.2;
    }
    ctx.stroke();

    ctx.restore();
  }

  drawPlayerButtonIcon(ctx, id, cx, cy, isPlaying, color = '#FFFFFF') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (id === 'play') {
      // Crisp Pause Bars (||) as shown in both reference images
      const barW = 12;
      const barH = 44;
      const gap = 12;
      this.roundRectPath(ctx, cx - gap - barW, cy - barH / 2, barW, barH, 3);
      ctx.fill();
      this.roundRectPath(ctx, cx + gap, cy - barH / 2, barW, barH, 3);
      ctx.fill();
    } else if (id === 'prev') {
      // Skip Back |<
      ctx.fillRect(cx - 21, cy - 17, 6, 34);
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 18, cy - 18);
      ctx.lineTo(cx + 18, cy + 18);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'next') {
      // Skip Forward >|
      ctx.fillRect(cx + 15, cy - 17, 6, 34);
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy);
      ctx.lineTo(cx - 18, cy - 18);
      ctx.lineTo(cx - 18, cy + 18);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'shuffle') {
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 11);
      ctx.bezierCurveTo(cx - 4, cy - 11, cx + 4, cy + 11, cx + 18, cy + 11);
      ctx.moveTo(cx - 20, cy + 11);
      ctx.bezierCurveTo(cx - 4, cy + 11, cx + 4, cy - 11, cx + 18, cy - 11);
      ctx.stroke();
      // Arrow heads
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy - 17);
      ctx.lineTo(cx + 20, cy - 11);
      ctx.lineTo(cx + 12, cy - 5);
      ctx.moveTo(cx + 12, cy + 5);
      ctx.lineTo(cx + 20, cy + 11);
      ctx.lineTo(cx + 12, cy + 17);
      ctx.stroke();
    } else if (id === 'repeat') {
      ctx.lineWidth = 3.6;
      this.roundRectPath(ctx, cx - 20, cy - 13, 40, 26, 8);
      ctx.stroke();
      // Small arrow heads
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy - 19);
      ctx.lineTo(cx + 11, cy - 13);
      ctx.lineTo(cx + 4, cy - 7);
      ctx.moveTo(cx - 4, cy + 7);
      ctx.lineTo(cx - 11, cy + 13);
      ctx.lineTo(cx - 4, cy + 19);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 10. Bottom Signatures (Left) & Hashtag Pill / TikTok Social Icons (Right)
   */
  drawBottomOverlays(ctx, config) {
    const isNeumorphic = config.visualTheme === 'neumorphism';
    const pal = isNeumorphic ? this.getNeumorphicPalette(config) : null;

    // A. Bottom-Left Calligraphic Signature
    if (config.bottomLeftText) {
      const sigFontObj =
        SIGNATURE_FONTS.find((f) => f.id === config.bottomLeftFont) || SIGNATURE_FONTS[0];
      const sigLines = config.bottomLeftText.split('\n');

      ctx.save();
      ctx.translate(105, 1795);
      ctx.rotate(-0.11);
      ctx.font = `400 78px ${sigFontObj.family}`;
      ctx.fillStyle = isNeumorphic ? pal.textColor : '#FFFFFF';
      if (!isNeumorphic) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 12;
      }

      sigLines.forEach((line, idx) => {
        ctx.fillText(line, idx * 14, idx * 66 - (sigLines.length > 1 ? 45 : 0));
      });

      const lastLineY = (sigLines.length - 1) * 66 - (sigLines.length > 1 ? 45 : 0);

      // Curved Signature Underline
      ctx.strokeStyle = isNeumorphic
        ? pal.accentGold
        : config.bottomLeftShowBrushFlag
        ? '#FACC15'
        : '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(28, lastLineY + 26);
      ctx.quadraticCurveTo(135, lastLineY + 12, 238, lastLineY + 18);
      ctx.stroke();

      // Optional Hand-drawn Heart next to signature (Image 1: "Sénégal ♡")
      if (config.bottomLeftShowHeart) {
        this.drawSmallSignatureHeart(ctx, 272, lastLineY + 8, 24);
      }

      // Optional Painted Brush Flag below signature (Image 2)
      if (config.bottomLeftShowBrushFlag && config.flagCountry !== 'none') {
        const flag = COUNTRY_FLAGS.find((f) => f.id === config.flagCountry) || COUNTRY_FLAGS[0];
        this.drawPaintedBrushFlag(ctx, 180, lastLineY + 34, 128, 56, flag);
      }

      ctx.restore();
    }

    // B. Bottom-Right Overlay: Glass / Neumorphic #Hashtag Pill (Image 1) OR TikTok Social Icons (Image 2)
    if (config.bottomRightMode === 'hashtag-pill' && config.hashtagText) {
      ctx.save();
      ctx.font = '500 26px "Plus Jakarta Sans", "Amiri", sans-serif';
      const textW = ctx.measureText(config.hashtagText).width;
      const pillW = textW + 62;
      const pillH = 74;
      const pillX = CANVAS_WIDTH - pillW - 34;
      const pillY = 1802;

      this.drawFrostedGlassBox(ctx, pillX, pillY, pillW, pillH, pillH / 2, {
        opacity: 0.32,
        tintColor: '#271710',
        rimPrimary: 'rgba(255,255,255,0.45)',
        rimSecondary: '#F59E0B',
        rimIntensity: 0.4,
        shadowBlur: 20,
        shadowOffsetY: 8,
        cornerFlares: false,
      });

      ctx.fillStyle = isNeumorphic ? pal.textColor : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.hashtagText, pillX + pillW / 2, pillY + pillH / 2 + 2);
      ctx.restore();
    } else if (config.bottomRightMode === 'tiktok-icons') {
      this.drawTikTokRightColumn(ctx, config);
    }
  }

  drawSmallSignatureHeart(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.bezierCurveTo(-size, size * 0.2, -size, -size * 0.7, -size * 0.25, -size * 0.55);
    ctx.bezierCurveTo(0, -size * 0.45, 0, -size * 0.15, 0, -size * 0.1);
    ctx.bezierCurveTo(0, -size * 0.2, size * 0.2, -size * 0.75, size * 0.55, -size * 0.55);
    ctx.bezierCurveTo(size * 1.05, -size * 0.25, size * 0.7, size * 0.35, 0, size);
    ctx.stroke();
    ctx.restore();
  }

  drawPaintedBrushFlag(ctx, x, y, w, h, flag) {
    if (!flag || !flag.colors.length) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.05);
    const sw = w / 3;
    flag.colors.forEach((col, i) => {
      ctx.fillStyle = col;
      this.roundRectPath(ctx, i * sw, (i % 2) * 2, sw + 2, h, 6);
      ctx.fill();
    });
    if (flag.starColor) {
      this.drawFivePointStar(ctx, w / 2, h / 2, h * 0.26, flag.starColor);
    }
    ctx.restore();
  }

  drawTikTokRightColumn(ctx, config) {
    const cx = 1012;
    const items = [
      { type: 'heart', label: config.tiktokLikes || '312.6K', y: 1380 },
      { type: 'comment', label: config.tiktokComments || '12.4K', y: 1522 },
      { type: 'bookmark', label: config.tiktokBookmarks || '87.9K', y: 1658 },
      { type: 'share', label: config.tiktokShares || '24.7K', y: 1794 },
    ];

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '600 25px "Plus Jakarta Sans", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;

    items.forEach((item) => {
      const iy = item.y;
      if (item.type === 'heart') {
        ctx.beginPath();
        ctx.moveTo(cx, iy + 22);
        ctx.bezierCurveTo(cx - 38, iy - 2, cx - 36, iy - 34, cx - 14, iy - 34);
        ctx.bezierCurveTo(cx - 4, iy - 34, cx, iy - 24, cx, iy - 20);
        ctx.bezierCurveTo(cx, iy - 24, cx + 4, iy - 34, cx + 14, iy - 34);
        ctx.bezierCurveTo(cx + 36, iy - 34, cx + 38, iy - 2, cx, iy + 22);
        ctx.fill();
      } else if (item.type === 'comment') {
        ctx.beginPath();
        ctx.arc(cx, iy - 8, 28, 0.25 * Math.PI, 1.95 * Math.PI);
        ctx.lineTo(cx + 26, iy + 18);
        ctx.lineTo(cx + 10, iy + 14);
        ctx.closePath();
        ctx.fill();
        // Three dots inside comment bubble
        ctx.save();
        ctx.fillStyle = '#1E293B';
        for (const dx of [-11, 0, 11]) {
          ctx.beginPath();
          ctx.arc(cx + dx, iy - 8, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (item.type === 'bookmark') {
        ctx.beginPath();
        ctx.moveTo(cx - 20, iy - 32);
        ctx.lineTo(cx + 20, iy - 32);
        ctx.lineTo(cx + 20, iy + 20);
        ctx.lineTo(cx, iy + 6);
        ctx.lineTo(cx - 20, iy + 20);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'share') {
        ctx.beginPath();
        ctx.moveTo(cx + 4, iy - 30);
        ctx.lineTo(cx + 30, iy - 8);
        ctx.lineTo(cx + 4, iy + 14);
        ctx.lineTo(cx + 4, iy + 1);
        ctx.quadraticCurveTo(cx - 18, iy + 2, cx - 28, iy + 20);
        ctx.quadraticCurveTo(cx - 22, iy - 14, cx + 4, iy - 16);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillText(item.label, cx, iy + 54);
    });

    ctx.restore();
  }

  /**
   * Utility helpers
   */
  roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 125, g: 211, b: 252 };
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      return {
        r: parseInt(clean.slice(0, 2), 16) || 0,
        g: parseInt(clean.slice(2, 4), 16) || 0,
        b: parseInt(clean.slice(4, 6), 16) || 0,
      };
    }
    return { r: 255, g: 255, b: 255 };
  }
}

