/**
 * PrimeNexus Media Player Engine with Series Playlist,
 * Live TV Channel Zapper, Exponential Backoff Recovery & HLS.js
 */

const PlayerState = {
  IDLE: 'IDLE',
  RESOLVING: 'RESOLVING',
  BUFFERING: 'BUFFERING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR'
};

class MediaPlayer {
  constructor(videoElement, containerElement) {
    this.video = videoElement;
    this.container = containerElement;
    this.hls = null;
    this.currentSource = null;
    this.currentSeries = null;
    this.currentEpisodeIndex = -1;
    this.state = PlayerState.IDLE;

    // Retry & Recovery State
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryTimeout = null;
    this.controlsTimeout = null;

    // Backup URL Failover
    this.currentBackupIndex = -1; // -1 = primary URL, 0+ = index in backupUrls
    this.currentMediaItem = null; // The full item with backupUrls

    // DOM Elements - Control Bar
    this.playPauseBtn = document.getElementById('btn-play-pause');
    this.playIcon = document.getElementById('icon-play');
    this.pauseIcon = document.getElementById('icon-pause');
    this.btnSkipBack = document.getElementById('btn-skip-back');
    this.btnSkipFwd = document.getElementById('btn-skip-fwd');
    this.btnNextEpisode = document.getElementById('btn-next-episode');
    this.btnZapChannels = document.getElementById('btn-zap-channels');
    
    // Scrubber & Timeline
    this.timeline = document.getElementById('timeline-bar');
    this.timelineProgress = document.getElementById('timeline-progress');
    this.timelineBuffer = document.getElementById('timeline-buffer');
    this.timelineTooltip = document.getElementById('timeline-tooltip');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.durationDisplay = document.getElementById('duration-time');

    // Audio & Volume
    this.volumeSlider = document.getElementById('volume-slider');
    this.btnMute = document.getElementById('btn-mute');
    this.iconVolumeHigh = document.getElementById('icon-vol-high');
    this.iconVolumeMuted = document.getElementById('icon-vol-muted');

    // Settings / Selectors
    this.speedSelect = document.getElementById('speed-select');
    this.qualitySelect = document.getElementById('quality-select');
    this.btnAudioSub = document.getElementById('btn-audio-sub');
    this.audioSubMenu = document.getElementById('audio-sub-menu');
    this.audioTracksList = document.getElementById('audio-tracks-list');
    this.subtitleTracksList = document.getElementById('subtitle-tracks-list');

    // Live TV Drawer
    this.liveChannelsDrawer = document.getElementById('player-live-drawer');
    this.liveChannelsList = document.getElementById('player-live-list');
    this.btnCloseLiveDrawer = document.getElementById('btn-close-live-drawer');

    // Window / Screen Modes
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnPip = document.getElementById('btn-pip');

    // Overlays
    this.loadingSpinner = document.getElementById('player-spinner');
    this.spinnerText = document.getElementById('player-spinner-text');
    this.errorOverlay = document.getElementById('player-error');
    this.errorDesc = document.getElementById('player-error-desc');
    this.liveBadge = document.getElementById('player-live-badge');
    this.overlayTitle = document.getElementById('player-overlay-title');
    this.overlayCategory = document.getElementById('player-overlay-category');
    this.overlaySubtitle = document.getElementById('player-overlay-subtitle');

    this.initEventListeners();
  }

  setState(newState, statusText = '') {
    this.state = newState;
    switch (newState) {
      case PlayerState.RESOLVING:
      case PlayerState.BUFFERING:
        this.showSpinner(true, statusText || getTranslation('loadingStream'));
        this.hideError();
        break;
      case PlayerState.PLAYING:
      case PlayerState.PAUSED:
        this.showSpinner(false);
        this.hideError();
        this.retryCount = 0;
        break;
      case PlayerState.ERROR:
        this.showSpinner(false);
        this.showError(statusText || getTranslation('streamError'));
        break;
      case PlayerState.IDLE:
        this.showSpinner(false);
        this.hideError();
        break;
    }
  }

  initEventListeners() {
    this.video.addEventListener('play', () => {
      this.setState(PlayerState.PLAYING);
      this.updatePlayState(true);
    });

    this.video.addEventListener('pause', () => {
      if (this.state !== PlayerState.ERROR) {
        this.setState(PlayerState.PAUSED);
      }
      this.updatePlayState(false);
    });

    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('progress', () => this.onProgress());
    this.video.addEventListener('waiting', () => {
      if (this.state === PlayerState.PLAYING) {
        this.setState(PlayerState.BUFFERING, getTranslation('loadingStream'));
      }
    });

    this.video.addEventListener('playing', () => {
      this.setState(PlayerState.PLAYING);
    });

    this.video.addEventListener('canplay', () => {
      if (this.state === PlayerState.BUFFERING || this.state === PlayerState.RESOLVING) {
        this.setState(PlayerState.PLAYING);
      }
    });

    this.video.addEventListener('ended', () => {
      // Auto-advance series episode if available
      if (this.currentSeries && this.hasNextEpisode()) {
        this.playNextEpisode();
      }
    });

    this.video.addEventListener('volumechange', () => this.onVolumeChange());
    this.video.addEventListener('error', () => {
      const err = this.video.error;
      this.handlePlaybackFailure(`HTML5 Video Error: ${err ? err.message || err.code : 'Unknown'}`);
    });

    // Play/Pause button
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('dblclick', () => this.toggleFullscreen());

    // Skip 10 seconds
    if (this.btnSkipBack) {
      this.btnSkipBack.addEventListener('click', () => this.skipRelative(-10));
    }
    if (this.btnSkipFwd) {
      this.btnSkipFwd.addEventListener('click', () => this.skipRelative(10));
    }

    // Next episode button
    if (this.btnNextEpisode) {
      this.btnNextEpisode.addEventListener('click', () => this.playNextEpisode());
    }

    // Live TV Drawer toggle
    if (this.btnZapChannels && this.liveChannelsDrawer) {
      this.btnZapChannels.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLiveDrawer();
      });
    }

    if (this.btnCloseLiveDrawer) {
      this.btnCloseLiveDrawer.addEventListener('click', () => {
        if (this.liveChannelsDrawer) this.liveChannelsDrawer.classList.remove('visible');
      });
    }

    // Timeline Scrubbing & Tooltip
    this.initTimelineEvents();

    // Volume & Mute
    this.volumeSlider.addEventListener('input', (e) => {
      this.video.volume = parseFloat(e.target.value);
      this.video.muted = false;
    });
    this.btnMute.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
    });

    // Speed Select
    this.speedSelect.addEventListener('change', (e) => {
      this.video.playbackRate = parseFloat(e.target.value);
    });

    // Quality Select (ABR)
    this.qualitySelect.addEventListener('change', (e) => {
      if (this.hls) {
        this.hls.currentLevel = parseInt(e.target.value, 10);
      }
    });

    // Audio & Subtitles Menu Toggle
    if (this.btnAudioSub && this.audioSubMenu) {
      this.btnAudioSub.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audioSubMenu.classList.toggle('visible');
      });

      document.addEventListener('click', (e) => {
        if (!this.audioSubMenu.contains(e.target) && e.target !== this.btnAudioSub) {
          this.audioSubMenu.classList.remove('visible');
        }
      });
    }

    // Fullscreen & PiP
    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    this.btnPip.addEventListener('click', () => this.togglePiP());

    // Dynamic Controls Visibility on Mouse Move
    this.container.addEventListener('mousemove', () => this.showControlsTemporarily());
    this.container.addEventListener('mouseleave', () => {
      if (!this.video.paused && this.state === PlayerState.PLAYING) {
        this.container.classList.add('controls-hidden');
        if (this.audioSubMenu) this.audioSubMenu.classList.remove('visible');
      }
    });

    // Keyboard Shortcuts
    this.initKeyboardShortcuts();
  }

  initTimelineEvents() {
    let isDragging = false;

    this.timeline.addEventListener('click', (e) => this.seek(e));
    this.timeline.addEventListener('mousedown', () => { isDragging = true; });
    window.addEventListener('mouseup', () => { isDragging = false; });
    
    this.timeline.addEventListener('mousemove', (e) => {
      if (isDragging) this.seek(e);
      this.updateTimelineTooltip(e);
    });

    this.timeline.addEventListener('mouseenter', () => {
      if (!this.currentSource?.isLive && this.timelineTooltip) {
        this.timelineTooltip.style.opacity = '1';
      }
    });

    this.timeline.addEventListener('mouseleave', () => {
      if (this.timelineTooltip) {
        this.timelineTooltip.style.opacity = '0';
      }
    });
  }

  updateTimelineTooltip(e) {
    if (!this.timelineTooltip || this.currentSource?.isLive || !this.video.duration) return;
    const rect = this.timeline.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = pos * this.video.duration;

    this.timelineTooltip.textContent = this.formatTime(targetSeconds);
    this.timelineTooltip.style.left = `${(pos * 100)}%`;
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (this.container.offsetParent === null) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          this.video.muted = !this.video.muted;
          break;
        case 'KeyP':
          e.preventDefault();
          this.togglePiP();
          break;
        case 'KeyJ':
        case 'ArrowLeft':
          e.preventDefault();
          this.skipRelative(-10);
          break;
        case 'KeyL':
        case 'ArrowRight':
          e.preventDefault();
          this.skipRelative(10);
          break;
        case 'KeyN':
          if (this.hasNextEpisode()) {
            e.preventDefault();
            this.playNextEpisode();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.video.volume = Math.min(1, this.video.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.video.volume = Math.max(0, this.video.volume - 0.05);
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          if (this.currentSource?.isLive && window.zapToChannelNumber) {
            e.preventDefault();
            const num = parseInt(e.code.replace('Digit', ''), 10);
            window.zapToChannelNumber(num);
          }
          break;
      }
    });
  }

  skipRelative(seconds) {
    if (this.currentSource?.isLive || !this.video.duration) return;
    this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
    this.showControlsTemporarily();
  }

  // Load a movie or live TV channel
  load(source) {
    this.currentSeries = null;
    this.currentEpisodeIndex = -1;
    this.loadMediaItem(source);
  }

  // Load an episode of a series
  loadEpisode(series, episodeIndex) {
    this.currentSeries = series;
    this.currentEpisodeIndex = episodeIndex;
    const ep = series.episodes[episodeIndex];
    if (!ep) return;

    this.loadMediaItem(ep, series);
  }

  hasNextEpisode() {
    return this.currentSeries && 
           this.currentSeries.episodes && 
           this.currentEpisodeIndex < this.currentSeries.episodes.length - 1;
  }

  playNextEpisode() {
    if (this.hasNextEpisode()) {
      this.loadEpisode(this.currentSeries, this.currentEpisodeIndex + 1);
    }
  }

  loadMediaItem(item, parentSeries = null) {
    this.currentSource = item;
    this.currentMediaItem = item;
    this.currentBackupIndex = -1; // Start with primary URL
    this.clearRetryTimer();
    this.setState(PlayerState.RESOLVING, getTranslation('resolvingStream'));

    // Configure Header Texts
    const lang = currentLang || 'de';
    const title = lang === 'hu' ? (item.title_hu || item.title_de) : (item.title_de || item.title_hu);
    
    if (parentSeries) {
      const seriesTitle = lang === 'hu' ? (parentSeries.title_hu || parentSeries.title_de) : (parentSeries.title_de || parentSeries.title_hu);
      this.overlayTitle.textContent = seriesTitle;
      if (this.overlaySubtitle) {
        this.overlaySubtitle.textContent = title;
        this.overlaySubtitle.style.display = 'block';
      }
      if (this.overlayCategory) {
        this.overlayCategory.textContent = `${getTranslation('typeSeries')} • ${getTranslation('season1')}`;
      }
    } else {
      this.overlayTitle.textContent = title || 'Stream';
      if (this.overlaySubtitle) {
        this.overlaySubtitle.style.display = 'none';
      }
      const typeLabel = item.isLive ? getTranslation('typeLiveTv') : getTranslation('typeMovie');
      const catLabel = getTranslation(`cat_${item.category}`);
      if (this.overlayCategory) {
        this.overlayCategory.textContent = `${typeLabel} • ${catLabel}`;
      }
    }

    // Configure Live vs VOD
    const isLive = item.isLive || item.type === 'livetv';
    if (isLive) {
      this.liveBadge.style.display = 'inline-block';
      this.timeline.style.pointerEvents = 'none';
      this.currentTimeDisplay.textContent = 'LIVE';
      this.durationDisplay.textContent = '';
      this.speedSelect.style.display = 'none';
      if (this.btnSkipBack) this.btnSkipBack.style.display = 'none';
      if (this.btnSkipFwd) this.btnSkipFwd.style.display = 'none';
      if (this.btnZapChannels) this.btnZapChannels.style.display = 'inline-flex';
      if (this.btnNextEpisode) this.btnNextEpisode.style.display = 'none';
    } else {
      this.liveBadge.style.display = 'none';
      this.timeline.style.pointerEvents = 'auto';
      this.speedSelect.style.display = 'inline-block';
      if (this.btnSkipBack) this.btnSkipBack.style.display = 'inline-flex';
      if (this.btnSkipFwd) this.btnSkipFwd.style.display = 'inline-flex';
      if (this.btnZapChannels) this.btnZapChannels.style.display = 'none';
      
      // Next episode button
      if (this.btnNextEpisode) {
        this.btnNextEpisode.style.display = this.hasNextEpisode() ? 'inline-flex' : 'none';
      }
    }

    // Reset Qualities & Menus
    this.qualitySelect.innerHTML = `<option value="-1">${getTranslation('qualityAuto')}</option>`;
    this.qualitySelect.style.display = 'none';
    if (this.audioSubMenu) this.audioSubMenu.classList.remove('visible');
    if (this.liveChannelsDrawer) this.liveChannelsDrawer.classList.remove('visible');

    // Destroy existing HLS session
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const isHls = item.format === 'hls' || item.streamUrl.includes('.m3u8');

    if (isHls && window.Hls && window.Hls.isSupported()) {
      this.initHlsStream(item);
    } else {
      this.initDirectStream(item);
    }
  }

  initHlsStream(source) {
    this.hls = new window.Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      manifestLoadingMaxRetry: 4,
      levelLoadingMaxRetry: 4
    });

    this.hls.loadSource(source.streamUrl);
    this.hls.attachMedia(this.video);

    this.hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
      this.setupQualityLevels(data.levels);
      this.setupAudioAndSubtitleTracks();
      this.video.play().catch(e => console.warn('Autoplay prevented:', e));
    });

    this.hls.on(window.Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      this.setupAudioAndSubtitleTracks();
    });

    this.hls.on(window.Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
      this.setupAudioAndSubtitleTracks();
    });

    this.hls.on(window.Hls.Events.ERROR, (event, data) => {
      console.warn('HLS Event Error:', data);
      if (data.fatal) {
        switch (data.type) {
          case window.Hls.ErrorTypes.NETWORK_ERROR:
            this.handleExponentialRetry('Network error encountered');
            break;
          case window.Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Recovering from fatal media error...');
            this.hls.recoverMediaError();
            break;
          default:
            this.handlePlaybackFailure(`Fatal HLS error: ${data.details}`);
            break;
        }
      }
    });
  }

  initDirectStream(source) {
    this.video.src = source.streamUrl;
    this.video.load();
    this.video.play().catch(e => console.warn('Autoplay prevented:', e));

    if (this.btnAudioSub) {
      this.btnAudioSub.style.display = 'none';
    }
  }

  setupQualityLevels(levels) {
    if (!levels || levels.length <= 1) {
      this.qualitySelect.style.display = 'none';
      return;
    }

    this.qualitySelect.style.display = 'inline-block';
    this.qualitySelect.innerHTML = `<option value="-1">${getTranslation('qualityAuto')}</option>`;
    
    levels.forEach((lvl, idx) => {
      const height = lvl.height || Math.round((lvl.bitrate || 0) / 1000) + 'k';
      const bitrateMbps = lvl.bitrate ? ` (${(lvl.bitrate / 1000000).toFixed(1)} Mbps)` : '';
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${height}p${bitrateMbps}`;
      this.qualitySelect.appendChild(opt);
    });
  }

  setupAudioAndSubtitleTracks() {
    if (!this.hls) return;

    const audioTracks = this.hls.audioTracks || [];
    const subtitleTracks = this.hls.subtitleTracks || [];

    if (audioTracks.length <= 1 && subtitleTracks.length === 0) {
      if (this.btnAudioSub) this.btnAudioSub.style.display = 'none';
      return;
    }

    if (this.btnAudioSub) this.btnAudioSub.style.display = 'inline-flex';

    if (this.audioTracksList) {
      this.audioTracksList.innerHTML = '';
      audioTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `menu-track-item ${this.hls.audioTrack === idx ? 'active' : ''}`;
        item.textContent = track.name || track.lang || `Track ${idx + 1}`;
        item.addEventListener('click', () => {
          this.hls.audioTrack = idx;
          this.setupAudioAndSubtitleTracks();
        });
        this.audioTracksList.appendChild(item);
      });

      const userLang = currentLang || 'de';
      const targetMatch = userLang === 'hu' ? ['hu', 'hun', 'magyar'] : ['de', 'ger', 'deutsch'];
      const preferredIdx = audioTracks.findIndex(t => {
        const text = `${t.lang || ''} ${t.name || ''}`.toLowerCase();
        return targetMatch.some(m => text.includes(m));
      });

      if (preferredIdx !== -1 && this.hls.audioTrack !== preferredIdx) {
        this.hls.audioTrack = preferredIdx;
      }
    }

    if (this.subtitleTracksList) {
      this.subtitleTracksList.innerHTML = '';
      
      const offItem = document.createElement('div');
      offItem.className = `menu-track-item ${this.hls.subtitleTrack === -1 ? 'active' : ''}`;
      offItem.textContent = getTranslation('subtitlesOff');
      offItem.addEventListener('click', () => {
        this.hls.subtitleTrack = -1;
        this.setupAudioAndSubtitleTracks();
      });
      this.subtitleTracksList.appendChild(offItem);

      subtitleTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `menu-track-item ${this.hls.subtitleTrack === idx ? 'active' : ''}`;
        item.textContent = track.name || track.lang || `Subtitle ${idx + 1}`;
        item.addEventListener('click', () => {
          this.hls.subtitleTrack = idx;
          this.setupAudioAndSubtitleTracks();
        });
        this.subtitleTracksList.appendChild(item);
      });
    }
  }

  toggleLiveDrawer() {
    if (!this.liveChannelsDrawer) return;
    this.liveChannelsDrawer.classList.toggle('visible');
    if (this.liveChannelsDrawer.classList.contains('visible') && window.renderPlayerLiveChannels) {
      window.renderPlayerLiveChannels(this.liveChannelsList, (selectedChannel) => {
        this.load(selectedChannel);
        this.liveChannelsDrawer.classList.remove('visible');
      });
    }
  }

  handleExponentialRetry(reason) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delayMs = Math.pow(2, this.retryCount - 1) * 1000;
      console.warn(`${reason}. Retrying (${this.retryCount}/${this.maxRetries}) in ${delayMs}ms...`);
      
      this.setState(PlayerState.BUFFERING, getTranslation('reconnecting', { attempt: this.retryCount }));

      this.retryTimeout = setTimeout(() => {
        if (this.hls) {
          this.hls.startLoad();
        } else if (this.currentSource) {
          this.video.load();
        }
      }, delayMs);
    } else {
      // Try backup URL before final failure
      if (this.tryNextBackupUrl()) return;
      this.handlePlaybackFailure(getTranslation('streamError'));
    }
  }

  handlePlaybackFailure(message) {
    // Try backup URL first
    if (this.tryNextBackupUrl()) return;
    this.setState(PlayerState.ERROR, message);
  }

  /**
   * Failover: Try the next backup stream URL if available.
   * Returns true if a backup was found and loading started.
   */
  tryNextBackupUrl() {
    const item = this.currentMediaItem;
    if (!item || !item.backupUrls || !Array.isArray(item.backupUrls)) return false;

    this.currentBackupIndex++;
    if (this.currentBackupIndex >= item.backupUrls.length) return false;

    const backupUrl = item.backupUrls[this.currentBackupIndex];
    console.log(`Failover: trying backup URL #${this.currentBackupIndex + 1}: ${backupUrl}`);

    this.retryCount = 0;
    this.clearRetryTimer();
    this.setState(PlayerState.BUFFERING, `Backup-Stream #${this.currentBackupIndex + 1} wird geladen...`);

    // Destroy existing HLS session
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Create a temporary source object with the backup URL
    const backupSource = { ...item, streamUrl: backupUrl };
    this.currentSource = backupSource;

    const isHls = backupUrl.includes('.m3u8');
    if (isHls && window.Hls && window.Hls.isSupported()) {
      this.initHlsStream(backupSource);
    } else {
      this.initDirectStream(backupSource);
    }
    return true;
  }

  clearRetryTimer() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.retryCount = 0;
  }

  togglePlay() {
    if (this.video.paused || this.video.ended) {
      this.video.play().catch(e => console.warn('Play error:', e));
    } else {
      this.video.pause();
    }
  }

  updatePlayState(isPlaying) {
    if (isPlaying) {
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'inline-block';
      this.showControlsTemporarily();
    } else {
      this.playIcon.style.display = 'inline-block';
      this.pauseIcon.style.display = 'none';
      this.container.classList.remove('controls-hidden');
    }
  }

  seek(event) {
    if (this.currentSource?.isLive || !this.video.duration) return;
    const rect = this.timeline.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.video.currentTime = pos * this.video.duration;
  }

  onTimeUpdate() {
    if (this.currentSource?.isLive) return;
    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    this.currentTimeDisplay.textContent = this.formatTime(current);
    this.durationDisplay.textContent = this.formatTime(duration);

    if (duration > 0) {
      const percent = (current / duration) * 100;
      this.timelineProgress.style.width = `${percent}%`;
    }
  }

  onProgress() {
    if (this.video.buffered.length > 0 && this.video.duration) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const percent = (bufferedEnd / this.video.duration) * 100;
      this.timelineBuffer.style.width = `${percent}%`;
    }
  }

  onVolumeChange() {
    const vol = this.video.volume;
    const isMuted = this.video.muted || vol === 0;

    this.volumeSlider.value = isMuted ? 0 : vol;
    if (isMuted) {
      this.iconVolumeHigh.style.display = 'none';
      this.iconVolumeMuted.style.display = 'inline-block';
    } else {
      this.iconVolumeHigh.style.display = 'inline-block';
      this.iconVolumeMuted.style.display = 'none';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
    }
  }

  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && !this.video.disablePictureInPicture) {
        await this.video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  }

  showControlsTemporarily() {
    this.container.classList.remove('controls-hidden');
    clearTimeout(this.controlsTimeout);
    if (!this.video.paused) {
      this.controlsTimeout = setTimeout(() => {
        this.container.classList.add('controls-hidden');
        if (this.audioSubMenu) this.audioSubMenu.classList.remove('visible');
        if (this.liveChannelsDrawer) this.liveChannelsDrawer.classList.remove('visible');
      }, 3500);
    }
  }

  showSpinner(show, text = '') {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = show ? 'flex' : 'none';
      if (this.spinnerText && text) {
        this.spinnerText.textContent = text;
      }
    }
  }

  showError(message) {
    if (this.errorOverlay) {
      this.errorOverlay.style.display = 'flex';
      if (this.errorDesc) {
        this.errorDesc.textContent = message;
      }
    }
  }

  hideError() {
    if (this.errorOverlay) {
      this.errorOverlay.style.display = 'none';
    }
  }

  stop() {
    this.clearRetryTimer();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    this.currentSource = null;
    this.currentSeries = null;
    this.currentEpisodeIndex = -1;
    this.setState(PlayerState.IDLE);
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const m = String(mins).padStart(2, '0');
    const s = String(secs).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${m}:${s}`;
    }
    return `${m}:${s}`;
  }
}
