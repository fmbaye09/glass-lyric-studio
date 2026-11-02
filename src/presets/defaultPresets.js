// Presets, Fonts, Flags, and Lyric Parsing Utilities for GlassLyric Studio

export const LYRIC_FONTS = [
  { id: 'Caveat Brush', name: 'Caveat Brush (Pinceau Original)', family: '"Caveat Brush", cursive', weight: '400', style: 'normal' },
  { id: 'Kaushan Script', name: 'Kaushan Script (Calligraphie Pinceau)', family: '"Kaushan Script", cursive', weight: '400', style: 'normal' },
  { id: 'Amiri', name: 'Amiri (Khassida / Calligraphie & Serif)', family: '"Amiri", serif', weight: '700', style: 'normal' },
  { id: 'Playfair Display', name: 'Playfair Display (Prestige & Khassida)', family: '"Playfair Display", serif', weight: '700', style: 'italic' },
  { id: 'Cinzel', name: 'Cinzel (Gravure Royale Or)', family: '"Cinzel", serif', weight: '700', style: 'normal' },
  { id: 'Permanent Marker', name: 'Permanent Marker (Feutre Épais)', family: '"Permanent Marker", cursive', weight: '400', style: 'normal' },
  { id: 'Satisfy', name: 'Satisfy (Cursive Douce)', family: '"Satisfy", cursive', weight: '400', style: 'normal' },
  { id: 'Courgette', name: 'Courgette (Brush Arrondi)', family: '"Courgette", cursive', weight: '400', style: 'normal' },
  { id: 'Pacifico', name: 'Pacifico (Rétro Brush)', family: '"Pacifico", cursive', weight: '400', style: 'normal' },
  { id: 'Dancing Script', name: 'Dancing Script (Élégant)', family: '"Dancing Script", cursive', weight: '700', style: 'normal' },
  { id: 'Montserrat Italic', name: 'Montserrat Black Italic (Moderne)', family: '"Montserrat", sans-serif', weight: '900', style: 'italic' },
  { id: 'Poppins Bold', name: 'Poppins ExtraBold (Clean Pop)', family: '"Poppins", sans-serif', weight: '800', style: 'normal' },
];

export const NEUMORPHIC_PALETTES = [
  {
    id: 'white-neumorphic',
    name: '🤍 Blanc Pur Neumorphism (Porcelaine & Or)',
    isLight: true,
    bgTop: '#F4F7FB',
    bgBottom: '#E9EEF5',
    surface: '#F0F4F9',
    surfaceLight: '#FAFCFF',
    surfaceAlt: '#E8EEF5',
    wellTop: '#E2E8F1',
    wellBottom: '#F5F8FC',
    shadowLight: 'rgba(255, 255, 255, 1.0)',
    shadowDark: 'rgba(163, 177, 198, 0.62)',
    borderBevel: 'rgba(255, 255, 255, 0.9)',
    ornamentStroke: 'rgba(197, 155, 39, 0.38)',
    textColor: '#1E293B',
    subTextColor: '#64748B',
    accentGold: '#C59B27',
    accentColor: '#C59B27',
  },
  {
    id: 'beige-neumorphic',
    name: '🏜️ Beige Sable & Or Doux (Crème & Ambre)',
    isLight: true,
    bgTop: '#F6F0E6',
    bgBottom: '#EAE0D0',
    surface: '#F1E9DC',
    surfaceLight: '#FBF7F0',
    surfaceAlt: '#E8DEC9',
    wellTop: '#E1D5C0',
    wellBottom: '#F6F0E5',
    shadowLight: 'rgba(255, 253, 248, 0.98)',
    shadowDark: 'rgba(176, 156, 128, 0.62)',
    borderBevel: 'rgba(255, 251, 242, 0.88)',
    ornamentStroke: 'rgba(180, 123, 24, 0.38)',
    textColor: '#2C1E14',
    subTextColor: '#78614A',
    accentGold: '#B87D14',
    accentColor: '#B87D14',
  },
  {
    id: 'touba-emerald',
    name: '🕌 Émeraude de Touba & Or (Sombre)',
    isLight: false,
    bgTop: '#0B1F19',
    bgBottom: '#06120E',
    surface: '#112E25',
    surfaceLight: '#16382E',
    surfaceAlt: '#0D241D',
    wellTop: '#081813',
    wellBottom: '#123027',
    shadowLight: 'rgba(42, 110, 88, 0.55)',
    shadowDark: 'rgba(2, 8, 6, 0.88)',
    borderBevel: 'rgba(250, 204, 21, 0.26)',
    ornamentStroke: 'rgba(250, 204, 21, 0.32)',
    textColor: '#F8FAFC',
    subTextColor: '#A7F3D0',
    accentGold: '#FACC15',
    accentColor: '#FACC15',
  },
  {
    id: 'sacred-ivory',
    name: '📜 Ivoire Parchemin & Émeraude (Clair)',
    isLight: true,
    bgTop: '#F3EFE2',
    bgBottom: '#E5DEC9',
    surface: '#EDE7D7',
    surfaceLight: '#F8F5EC',
    surfaceAlt: '#E3DCC8',
    wellTop: '#DDD4BE',
    wellBottom: '#F2EDE0',
    shadowLight: 'rgba(255, 255, 255, 0.95)',
    shadowDark: 'rgba(166, 152, 122, 0.62)',
    borderBevel: 'rgba(255, 255, 255, 0.85)',
    ornamentStroke: 'rgba(4, 120, 87, 0.32)',
    textColor: '#0A251E',
    subTextColor: '#334155',
    accentGold: '#047857',
    accentColor: '#047857',
  },
  {
    id: 'obsidian-gold',
    name: '🌙 Obsidienne Nuit & Or Soufi (Sombre)',
    isLight: false,
    bgTop: '#141923',
    bgBottom: '#0C0F17',
    surface: '#181E2C',
    surfaceLight: '#1E2638',
    surfaceAlt: '#131824',
    wellTop: '#0E121B',
    wellBottom: '#1A2130',
    shadowLight: 'rgba(48, 60, 88, 0.55)',
    shadowDark: 'rgba(4, 6, 10, 0.9)',
    borderBevel: 'rgba(250, 204, 21, 0.25)',
    ornamentStroke: 'rgba(250, 204, 21, 0.3)',
    textColor: '#F8FAFC',
    subTextColor: '#94A3B8',
    accentGold: '#FACC15',
    accentColor: '#FACC15',
  },
];

export const KHASSIDA_SAMPLE_LYRICS = [
  {
    id: 'khassida-1',
    startTime: 0.0,
    endTime: 5.0,
    text: 'بِسْمِ اللَّهِ *الرَّحْمَٰنِ* الرَّحِيمِ\nBismillāhi *r-Raḥmāni* r-Raḥīm',
  },
  {
    id: 'khassida-2',
    startTime: 5.0,
    endTime: 10.0,
    text: '*Matlaboul Fawzeyni*\nJërëjëfë *Borom Touba*',
  },
  {
    id: 'khassida-3',
    startTime: 10.0,
    endTime: 15.0,
    text: 'Wa kāna *ḥaqqan* ʿalaynā\n*naṣru* l-muʾminīna',
  },
  {
    id: 'khassida-4',
    startTime: 15.0,
    endTime: 20.0,
    text: 'Yaa *Cheikh Ahmadou Bamba*\nKhadimou *Rassoul* 🕌',
  },
  {
    id: 'khassida-5',
    startTime: 20.0,
    endTime: 25.0,
    text: 'Alḥamdulillāhi *Rabbi* l-ʿālamīn\n*Touba* Darou Salam ✨',
  },
  {
    id: 'khassida-6',
    startTime: 25.0,
    endTime: 30.0,
    text: 'Ṣallā l-Lāhu ʿalā *Muḥammadin*\nWa ʿalā *ālihi* wa ṣaḥbihi',
  },
];

export const SIGNATURE_FONTS = [
  { id: 'Great Vibes', name: 'Great Vibes (Signature Royale)', family: '"Great Vibes", cursive' },
  { id: 'Sacramento', name: 'Sacramento (Manuscrit Fin)', family: '"Sacramento", cursive' },
  { id: 'Allura', name: 'Allura (Calligraphie Fluide)', family: '"Allura", cursive' },
  { id: 'Dancing Script', name: 'Dancing Script (Vif)', family: '"Dancing Script", cursive' },
  { id: 'Kaushan Script', name: 'Kaushan Script (Pinceau)', family: '"Kaushan Script", cursive' },
];

export const COUNTRY_FLAGS = [
  { id: 'sn', name: 'Sénégal 🇸🇳', emoji: '🇸🇳', colors: ['#00853F', '#FDEF42', '#E31B23'], starColor: '#00853F', type: 'vertical-star' },
  { id: 'ml', name: 'Mali 🇲🇱', emoji: '🇲🇱', colors: ['#14B53A', '#FCD116', '#CE1126'], starColor: null, type: 'vertical' },
  { id: 'gn', name: 'Guinée 🇬🇳', emoji: '🇬🇳', colors: ['#CE1126', '#FCD116', '#009460'], starColor: null, type: 'vertical' },
  { id: 'ci', name: 'Côte d’Ivoire 🇨🇮', emoji: '🇨🇮', colors: ['#F77F00', '#FFFFFF', '#009E60'], starColor: null, type: 'vertical' },
  { id: 'cm', name: 'Cameroun 🇨🇲', emoji: '🇨🇲', colors: ['#007A5E', '#CE1126', '#FCD116'], starColor: '#FCD116', type: 'vertical-star' },
  { id: 'cd', name: 'RD Congo 🇨🇩', emoji: '🇨🇩', colors: ['#007FFF', '#F7D618', '#CE1021'], starColor: '#F7D618', type: 'diagonal-star' },
  { id: 'ma', name: 'Maroc 🇲🇦', emoji: '🇲🇦', colors: ['#C1272D', '#C1272D', '#C1272D'], starColor: '#006233', type: 'solid-star' },
  { id: 'fr', name: 'France 🇫🇷', emoji: '🇫🇷', colors: ['#002395', '#FFFFFF', '#ED2939'], starColor: null, type: 'vertical' },
  { id: 'ng', name: 'Nigéria 🇳🇬', emoji: '🇳🇬', colors: ['#008751', '#FFFFFF', '#008751'], starColor: null, type: 'vertical' },
  { id: 'none', name: 'Aucun drapeau', emoji: '🚫', colors: [], starColor: null, type: 'none' },
];

export const BUILTIN_BACKGROUNDS = [
  {
    id: 'dakar-sunset-ai',
    name: 'Monument de la Renaissance (Coucher de Soleil)',
    type: 'image-or-procedural',
    url: '/backgrounds/dakar_sunset.png',
    fallbackTheme: 'dakar-sunset',
  },
  {
    id: 'touba-neumorphic-bg',
    name: '🕌 Touba Émeraude & Arabesques (Spécial Khassida)',
    type: 'procedural',
    fallbackTheme: 'touba-neumorphic',
  },
  {
    id: 'dakar-golden-night',
    name: 'Dakar Crépuscule Doré & Mosquée',
    type: 'procedural',
    fallbackTheme: 'dakar-golden',
  },
  {
    id: 'ocean-twilight',
    name: 'Océan Atlantique & Palmiers (Bleu Nuit)',
    type: 'procedural',
    fallbackTheme: 'ocean-twilight',
  },
  {
    id: 'warm-afro-gold',
    name: 'Ambre Royal & Lumières Boisées',
    type: 'procedural',
    fallbackTheme: 'afro-gold',
  },
  {
    id: 'ref-image-1',
    name: 'Image de Référence 1 (Aperçu Original)',
    type: 'image',
    url: '/references/style1_ref.jpg',
  },
  {
    id: 'ref-image-2',
    name: 'Image de Référence 2 (Aperçu Original)',
    type: 'image',
    url: '/references/style2_ref.jpg',
  },
];

export const DEFAULT_LYRICS = [
  {
    id: 'line-1',
    startTime: 0.0,
    endTime: 4.5,
    text: 'Boul Faalé,\n*dafa nekk ci*\nSénégal...',
  },
  {
    id: 'line-2',
    startTime: 4.5,
    endTime: 9.0,
    text: '*Dafa* nekk ci\nSénégal...',
  },
  {
    id: 'line-3',
    startTime: 9.0,
    endTime: 13.5,
    text: 'Ku muñul *doole*,\nbul xool ci ginnaaw...',
  },
  {
    id: 'line-4',
    startTime: 13.5,
    endTime: 18.0,
    text: 'Aduna *dafa gudd*,\nyoon wi dafa sori...',
  },
  {
    id: 'line-5',
    startTime: 18.0,
    endTime: 23.0,
    text: 'Waaye *yaakaar*\nduañ ko bàyyi mukk !',
  },
  {
    id: 'line-6',
    startTime: 23.0,
    endTime: 30.0,
    text: 'Sunu *gal* mooy\nsunu xol bi ✨',
  },
];

export const STYLE_PRESETS = {
  style1: {
    id: 'style1',
    name: 'Style 1 : Classique Drapeaux & Pilule Large (Image 1)',
    description: 'Pilule artiste large avec photo ronde, drapeaux flottants aux coins, notes 3D en verre, signature calligraphique et badge #Hashtag.',
    config: {
      // Header Pill
      headerStyle: 'large', // 'large' (Image 1) | 'compact' (Image 2) | 'hidden'
      artistName: 'Wally Seck',
      verifiedBadge: true,
      verifiedColor: '#1DA1F2',
      songTitle: 'Boul Faalé',
      songSubtitle: 'Musique Sénégalaise 🇸🇳',
      avatarMode: 'portrait', // 'portrait' | 'crown-logo' | 'custom'
      avatarShape: 'circle', // 'circle' | 'rounded-square'
      showTopNavIcons: false,
      headerY: 165,

      // Background & Flags
      bgBlur: 0,
      bgDarken: 0.12,
      bgVignette: 0.35,
      kenBurnsEffect: true,
      flagCountry: 'sn',
      showTopLeftFlag: true,
      topLeftFlagStyle: 'corner-wave', // 'corner-wave' (Image 1) | 'flagpole' (Image 2)
      showBottomRightFlag: true,

      // Floating Musical Notes
      showFloatingNotes: true,
      notesCount: 4,
      notesGlowColor: '#93C5FD',

      // Main Glass Lyric Card
      cardY: 855,
      cardWidth: 910,
      cardHeight: 575,
      cardBorderRadius: 56,
      glassBlur: 22,
      glassOpacity: 0.24,
      glassTint: '#1E293B',
      rimLightPrimary: '#7DD3FC', // Cyan-white top-left specular glow
      rimLightSecondary: '#FDE047', // Warm gold-white bottom-right specular glow
      rimLightIntensity: 0.95,
      showQuoteMarks: false,
      showCardHeart: false,
      showBrushUnderline: true,
      underlineColor: '#FACC15',

      // Lyrics Typography
      fontFamily: 'Caveat Brush',
      fontSize: 98,
      lineHeight: 1.18,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      textShadowIntensity: 0.85,
      textBevelEffect: true,
      lyricAnimation: 'pop-fade', // 'pop-fade' | 'slide-up' | 'karaoke' | 'none'

      // Audio Visualizer & Player Controls
      visualizerY: 1275,
      visualizerBars: 39,
      visualizerStyle: 'symmetrical-dots',
      visualizerColor: '#FFFFFF',
      playerY: 1510,
      displayTimeOffset: 32, // Starts display at 00:32 like Image 1
      displayTotalDuration: 225, // 03:45 like Image 1
      centerButtonGlowColor: '#FDE68A',
      centerButtonGlowIntensity: 0.9,

      // Bottom Signatures & Overlays
      bottomLeftText: 'Sénégal',
      bottomLeftFont: 'Great Vibes',
      bottomLeftShowHeart: true,
      bottomLeftShowBrushFlag: false,
      bottomRightMode: 'hashtag-pill', // 'hashtag-pill' (Image 1) | 'tiktok-icons' (Image 2) | 'none'
      hashtagText: '#MusiqueSénégalaise 🔥',
      tiktokLikes: '312.6K',
      tiktokComments: '12.4K',
      tiktokBookmarks: '87.9K',
      tiktokShares: '24.7K',
      visualTheme: 'glassmorphism',
      showIslamicOrnaments: false,
    },
  },

  style2: {
    id: 'style2',
    name: 'Style 2 : Citation Lumineuse, Cœur & TikTok (Image 2)',
    description: 'Pilule compacte centrée avec logo couronne & mini-onde, guillemets 3D lumineux, cœur dessiné au pinceau, lueur dorée intense et icônes TikTok.',
    config: {
      // Header Pill
      headerStyle: 'compact',
      artistName: 'Wally Seck',
      verifiedBadge: true,
      verifiedColor: '#1DA1F2',
      songTitle: 'Boul Faalé',
      songSubtitle: 'Musique Sénégalaise 🇸🇳',
      avatarMode: 'crown-logo',
      avatarShape: 'rounded-square',
      showTopNavIcons: true,
      headerY: 105,

      // Background & Flags
      bgBlur: 0,
      bgDarken: 0.15,
      bgVignette: 0.4,
      kenBurnsEffect: true,
      flagCountry: 'sn',
      showTopLeftFlag: true,
      topLeftFlagStyle: 'flagpole',
      showBottomRightFlag: false,

      // Floating Musical Notes
      showFloatingNotes: false,
      notesCount: 3,
      notesGlowColor: '#93C5FD',

      // Main Glass Lyric Card
      cardY: 960,
      cardWidth: 915,
      cardHeight: 490,
      cardBorderRadius: 54,
      glassBlur: 24,
      glassOpacity: 0.26,
      glassTint: '#1E293B',
      rimLightPrimary: '#7DD3FC',
      rimLightSecondary: '#FACC15',
      rimLightIntensity: 1.0,
      showQuoteMarks: true,
      showCardHeart: true,
      showBrushUnderline: true,
      underlineColor: '#FACC15',

      // Lyrics Typography
      fontFamily: 'Kaushan Script',
      fontSize: 112,
      lineHeight: 1.16,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      textShadowIntensity: 0.9,
      textBevelEffect: true,
      lyricAnimation: 'pop-fade',

      // Audio Visualizer & Player Controls
      visualizerY: 1320,
      visualizerBars: 41,
      visualizerStyle: 'symmetrical-dots',
      visualizerColor: '#FFFFFF',
      playerY: 1525,
      displayTimeOffset: 48, // 00:48 like Image 2
      displayTotalDuration: 232, // 03:52 like Image 2
      centerButtonGlowColor: '#FACC15',
      centerButtonGlowIntensity: 1.0,

      // Bottom Signatures & Overlays
      bottomLeftText: 'Musique\nSénégalaise',
      bottomLeftFont: 'Dancing Script',
      bottomLeftShowHeart: false,
      bottomLeftShowBrushFlag: true,
      bottomRightMode: 'tiktok-icons',
      hashtagText: '#MusiqueSénégalaise 🔥',
      tiktokLikes: '312.6K',
      tiktokComments: '12.4K',
      tiktokBookmarks: '87.9K',
      tiktokShares: '24.7K',
      visualTheme: 'glassmorphism',
      showIslamicOrnaments: false,
    },
  },

  style3: {
    id: 'style3',
    name: 'Style 3 : Cristal Néon & Nuit Urbaine',
    description: 'Verre ultra-flouté à reflets cyan et magenta, typographie moderne italique et égaliseur lumineux.',
    config: {
      headerStyle: 'large',
      artistName: 'Wally Seck',
      verifiedBadge: true,
      verifiedColor: '#38BDF8',
      songTitle: 'Boul Faalé (Remix)',
      songSubtitle: 'Afro Vibes ✨',
      avatarMode: 'crown-logo',
      avatarShape: 'circle',
      showTopNavIcons: false,
      headerY: 165,
      bgBlur: 2,
      bgDarken: 0.28,
      bgVignette: 0.5,
      kenBurnsEffect: true,
      flagCountry: 'none',
      showTopLeftFlag: false,
      topLeftFlagStyle: 'corner-wave',
      showBottomRightFlag: false,
      showFloatingNotes: true,
      notesCount: 5,
      notesGlowColor: '#38BDF8',
      cardY: 870,
      cardWidth: 910,
      cardHeight: 550,
      cardBorderRadius: 60,
      glassBlur: 30,
      glassOpacity: 0.3,
      glassTint: '#0F172A',
      rimLightPrimary: '#38BDF8',
      rimLightSecondary: '#F472B6',
      rimLightIntensity: 1.0,
      showQuoteMarks: true,
      showCardHeart: false,
      showBrushUnderline: true,
      underlineColor: '#38BDF8',
      fontFamily: 'Montserrat Italic',
      fontSize: 82,
      lineHeight: 1.25,
      textColor: '#FFFFFF',
      highlightColor: '#38BDF8',
      textShadowIntensity: 0.9,
      textBevelEffect: true,
      lyricAnimation: 'pop-fade',
      visualizerY: 1280,
      visualizerBars: 41,
      visualizerStyle: 'symmetrical-dots',
      visualizerColor: '#E0F2FE',
      playerY: 1510,
      displayTimeOffset: 15,
      displayTotalDuration: 210,
      centerButtonGlowColor: '#38BDF8',
      centerButtonGlowIntensity: 0.95,
      bottomLeftText: 'Afro Vibes',
      bottomLeftFont: 'Great Vibes',
      bottomLeftShowHeart: true,
      bottomLeftShowBrushFlag: false,
      bottomRightMode: 'hashtag-pill',
      hashtagText: '#TikTokMusic 🔥',
      tiktokLikes: '312.6K',
      tiktokComments: '12.4K',
      tiktokBookmarks: '87.9K',
      tiktokShares: '24.7K',
      visualTheme: 'glassmorphism',
      showIslamicOrnaments: false,
    },
  },

  khassida: {
    id: 'khassida',
    name: '🕌 Mode Khassida : Thème Neumorphism (Touba & Or)',
    description: 'Design Soft-UI en relief (Neumorphism) mat et ciselé, arabesques & étoile islamique ۞, calligraphie Basmala, dôme de Touba et typographie sacrée.',
    config: {
      // Visual Engine Theme
      visualTheme: 'neumorphism', // 'glassmorphism' | 'neumorphism'
      neumorphicPalette: 'touba-emerald', // 'touba-emerald' | 'sacred-ivory' | 'obsidian-gold' | 'pearl-emerald'
      neumorphicRelief: 1.0,
      neumorphicInsetFrame: true,
      showIslamicOrnaments: true,
      khassidaHeaderCalligraphy: '﷽',

      // Header Pill
      headerStyle: 'large',
      artistName: 'Kourel Khassida Touba',
      verifiedBadge: true,
      verifiedColor: '#10B981',
      songTitle: 'Matlaboul Fawzeyni',
      songSubtitle: 'Khassida Cheikh Ahmadou Bamba 🕌',
      avatarMode: 'mosque-logo', // 'mosque-logo' | 'portrait' | 'crown-logo' | 'custom'
      avatarShape: 'circle',
      showTopNavIcons: false,
      headerY: 165,

      // Background & Flags
      bgBlur: 0,
      bgDarken: 0.05,
      bgVignette: 0.25,
      kenBurnsEffect: false,
      flagCountry: 'sn',
      showTopLeftFlag: false,
      topLeftFlagStyle: 'corner-wave',
      showBottomRightFlag: false,

      // Floating Notes Off for Sacred Sobriety
      showFloatingNotes: false,
      notesCount: 3,
      notesGlowColor: '#FACC15',

      // Main Neumorphic Card
      cardY: 865,
      cardWidth: 910,
      cardHeight: 590,
      cardBorderRadius: 56,
      glassBlur: 22,
      glassOpacity: 0.25,
      glassTint: '#112E25',
      rimLightPrimary: '#34D399',
      rimLightSecondary: '#FACC15',
      rimLightIntensity: 0.85,
      showQuoteMarks: false,
      showCardHeart: false,
      showBrushUnderline: true,
      underlineColor: '#FACC15',

      // Lyrics Typography
      fontFamily: 'Amiri',
      fontSize: 88,
      lineHeight: 1.24,
      textColor: '#F8FAFC',
      highlightColor: '#FACC15',
      textShadowIntensity: 0.45,
      textBevelEffect: false,
      lyricAnimation: 'pop-fade',

      // Audio Visualizer & Player Controls
      visualizerY: 1285,
      visualizerBars: 39,
      visualizerStyle: 'symmetrical-dots',
      visualizerColor: '#FACC15',
      playerY: 1515,
      displayTimeOffset: 0,
      displayTotalDuration: 225,
      centerButtonGlowColor: '#FACC15',
      centerButtonGlowIntensity: 0.85,

      // Bottom Signatures & Overlays
      bottomLeftText: 'Touba Darou Salam',
      bottomLeftFont: 'Great Vibes',
      bottomLeftShowHeart: false,
      bottomLeftShowBrushFlag: false,
      bottomRightMode: 'hashtag-pill',
      hashtagText: '#Khassida #Touba 🕌',
      tiktokLikes: '312.6K',
      tiktokComments: '12.4K',
      tiktokBookmarks: '87.9K',
      tiktokShares: '24.7K',
    },
  },
};

/**
 * Parse LRC or SRT file content into our lyrics array format
 */
export function parseLyricsFile(content, filename = '') {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const parsed = [];

  if (filename.toLowerCase().endsWith('.srt') || content.includes('-->')) {
    // Parse SRT format
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map((s) => s.trim());
        const startTime = parseSrtTime(startStr);
        const endTime = parseSrtTime(endStr);
        i++;
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim());
          i++;
        }
        if (textLines.length > 0) {
          parsed.push({
            id: `lyric-${Date.now()}-${parsed.length}`,
            startTime,
            endTime: endTime > startTime ? endTime : startTime + 4,
            text: textLines.join('\n'),
          });
        }
      } else {
        i++;
      }
    }
    return parsed;
  }

  // Parse LRC format: [mm:ss.xx] Lyric text
  const lrcRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/;
  const rawEntries = [];
  for (const line of lines) {
    const match = line.match(lrcRegex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim().replace(/\s*\|\s*/g, '\n');
      if (text) {
        rawEntries.push({ startTime: time, text });
      }
    }
  }

  for (let i = 0; i < rawEntries.length; i++) {
    const current = rawEntries[i];
    const next = rawEntries[i + 1];
    parsed.push({
      id: `lyric-${Date.now()}-${i}`,
      startTime: Number(current.startTime.toFixed(2)),
      endTime: next ? Number(next.startTime.toFixed(2)) : Number((current.startTime + 4.5).toFixed(2)),
      text: current.text,
    });
  }

  return parsed;
}

function parseSrtTime(str) {
  const clean = str.replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

/**
 * Export our lyrics array to standard .LRC string
 */
export function exportToLRC(lyrics, meta = {}) {
  const header = [
    `[ar:${meta.artistName || 'Artiste'}]`,
    `[ti:${meta.songTitle || 'Titre'}]`,
    `[by:GlassLyric Studio]`,
    '',
  ];
  const body = lyrics.map((item) => {
    const mins = Math.floor(item.startTime / 60);
    const secs = (item.startTime % 60).toFixed(2).padStart(5, '0');
    const singleLine = item.text.replace(/\n/g, ' | ');
    return `[${String(mins).padStart(2, '0')}:${secs}]${singleLine}`;
  });
  return [...header, ...body].join('\n');
}

