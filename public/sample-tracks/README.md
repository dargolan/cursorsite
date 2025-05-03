# Sample Track Structure

This document explains the file structure for audio tracks in the WaveCave platform.

## File Structure

The platform uses the following file structure for tracks:

```
wave-cave-audio/
└── tracks/
    ├── track-name-1/              # Folder name is kebab-case of track title
    │   ├── main.mp3               # Main track audio
    │   ├── cover.jpg              # Track cover image (required)
    │   └── stems/                 # Optional folder for individual stems
    │       ├── drums.mp3          
    │       ├── bass.mp3
    │       └── guitars.mp3
    └── another-track-name/        # Another track
        ├── main.mp3
        └── cover.jpg
```

## Naming Requirements

For proper functioning of the platform, follow these naming conventions:

1. **Track Folders**: 
   - Use the track title in kebab-case: `rock-intro/` instead of `Rock Intro/`
   - Keep folder names simple and descriptive
   - Example: `electronic-beat`, `ambient-landscape`, `cinematic-opener`

2. **Main Audio File**: 
   - Always name as `main.mp3` (lowercase)
   - Must be MP3 format

3. **Cover Image**: 
   - Always name as `cover.jpg` (lowercase)
   - Must be JPG format
   - Recommended size: 1000x1000 pixels

4. **Stems**: 
   - Place in a subfolder called `stems/`
   - Use descriptive names: `drums.mp3`, `bass.mp3`, `vocals.mp3`, etc.

## Important Notes

- The platform relies on consistent file naming to function properly
- Cover images must be named exactly `cover.jpg` or they won't display
- The main track must be named `main.mp3` to be playable
- Using different file structures or names will cause the files to be inaccessible
- Track metadata (title, BPM, etc.) is stored in the database and linked to these files

## Examples

### Rock Track with Stems
```
tracks/
└── rock-intro/
    ├── main.mp3           # Full mixed track
    ├── cover.jpg          # Cover artwork
    └── stems/
        ├── drums.mp3      # Drum stem
        ├── bass.mp3       # Bass stem
        ├── guitars.mp3    # Guitar stem
        └── vocals.mp3     # Vocal stem
```

### Electronic Track without Stems
```
tracks/
└── electronic-beat/
    ├── main.mp3           # Full track
    └── cover.jpg          # Cover artwork
``` 