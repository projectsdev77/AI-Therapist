# Ambient sound files

The app ships with generated placeholder sounds, so this folder can stay empty.
To use your own recordings:

1. Put the files here, for example:
   - `public/audio/ambient-rain.ogg`
   - `public/audio/ambient-room.ogg`
   - `public/audio/ambient-hum.ogg`
2. Point to them in `src/lib/ambient/sources.ts`:

   ```ts
   export const AMBIENT_FILES = {
     rain: "/audio/ambient-rain.ogg",
     room: "/audio/ambient-room.ogg",
     hum: "/audio/ambient-hum.ogg",
   };
   ```

   Leave any entry `null` to keep its generated sound. If a file fails to load, the
   generated sound is used instead.

## What makes a good file

- **Length:** 30 seconds to 2 minutes. It loops forever; longer loops repeat less noticeably.
- **Format:** OGG/Opus or M4A (AAC) at 96–128 kbps keeps files small. WAV works too but is large.
  MP3 is fine: silence at the ends is trimmed automatically.
- **Seams:** you don't need a perfect loop. The last 1.5 seconds are crossfaded into the start.
- **Level:** normalize to around −3 dB peak. The app sets the actual (quiet) volume.
- **Content:** steady and even. No voices, birds, thunder claps, or anything that sounds
  like speech or a sudden event: it should never pull attention from the conversation.
- **Mono or stereo** both work.

## How it stays out of the conversation

- It drops by 18 dB the moment either you or the companion speaks, and comes back slowly.
- While the microphone is on, it plays at half volume, and the voice detector learns the
  steady background level, so the ambient sound (or a fan, or rain outside) is never
  mistaken for speech. The browser's echo cancellation usually removes it from the mic signal as well.
- It goes silent during Breathe, when the help panel is open, when the tab is hidden, and
  when the conversation ends. It runs on its own audio context, separate from the mic and
  the companion's voice.
