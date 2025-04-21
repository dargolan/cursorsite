'use client';

import { unifiedAudioManager } from './unified-audio-manager';

/**
 * Keyboard shortcuts for audio control
 * 
 * This module sets up global keyboard shortcuts for controlling audio playback:
 * - Space: Play/pause
 * - Left arrow: Rewind 5 seconds
 * - Right arrow: Forward 5 seconds
 */

class KeyboardShortcuts {
  private static instance: KeyboardShortcuts;
  private initialized = false;
  
  private constructor() {}
  
  public static getInstance(): KeyboardShortcuts {
    if (!KeyboardShortcuts.instance) {
      KeyboardShortcuts.instance = new KeyboardShortcuts();
    }
    return KeyboardShortcuts.instance;
  }
  
  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    
    window.addEventListener('keydown', this.handleKeyDown);
    this.initialized = true;
    
    console.log('Keyboard shortcuts initialized for audio control');
  }
  
  public destroy(): void {
    if (!this.initialized || typeof window === 'undefined') return;
    
    window.removeEventListener('keydown', this.handleKeyDown);
    this.initialized = false;
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Skip if we're in an input field
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
      return;
    }
    
    switch (event.code) {
      case 'Space': // Play/pause
        event.preventDefault();
        unifiedAudioManager.toggle();
        break;
        
      case 'ArrowLeft': // Rewind 5 seconds
        if (unifiedAudioManager.isPlaying()) {
          event.preventDefault();
          const newTime = Math.max(0, unifiedAudioManager.getCurrentTime() - 5);
          unifiedAudioManager.seek(newTime);
        }
        break;
        
      case 'ArrowRight': // Forward 5 seconds
        if (unifiedAudioManager.isPlaying()) {
          event.preventDefault();
          const newTime = Math.min(unifiedAudioManager.getDuration(), unifiedAudioManager.getCurrentTime() + 5);
          unifiedAudioManager.seek(newTime);
        }
        break;
    }
  };
}

export const keyboardShortcuts = KeyboardShortcuts.getInstance(); 