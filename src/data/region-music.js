/* Original eight-bar scores in 4/4. Final dominant bars lead to the opening tonic.
   Road/night share a motif; the other regions have their own phrases. Rests make
   room for play. Mists has no percussion or repeated pulse; its bar grid is only
   a scheduling boundary. Every score has a sounding voice at the final boundary. */
export const LOOPS = [
  {
    "id": "village",
    "title": "Bread behind shutters",
    "bpm": 64,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E4/2 G4/4 F#4/4 B3/4 E4/4 D4/2 C4/2 E4/2 F#4/4 D4/4 B3/2 E4/4 G4/4 B4/2 A4/2 G4/4 E4/4 F#4/2 D4/4 C4/4 B3/2 F#4/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 B2/1 C3/1 B2/1 E2/1 A2/1 D3/1 B2/1"
      }
    }
  },
  {
    "id": "villageNight",
    "title": "A window still lit",
    "bpm": 58,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E4/4 r/2 B3/4 r/2 G4/4 r/4 F#4/2 r/2 r/4 D4/4 B3/2 E4/4 r/4 G4/4 r/4 r/2 E4/2 D4/4 r/2 C4/4 B3/2 r/4 D#4/4"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/8 r/8 E2/8 r/8 E2/2 E2/8 r/8 E2/8 r/8 E2/2 C3/8 r/8 C3/8 r/8 C3/2 B2/8 r/8 B2/8 r/8 B2/2 E2/8 r/8 E2/8 r/8 E2/2 A2/8 r/8 A2/8 r/8 A2/2 C3/8 r/8 C3/8 r/8 C3/2 B2/8 r/8 B2/8 r/8 B2/2"
      }
    }
  },
  {
    "id": "vallaki",
    "title": "Smile for the procession",
    "bpm": 88,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "G4/8 B4/8 A4/4 F#4/4 G4/4 E4/4 B4/8 A4/8 G4/2 A4/4 C5/4 B4/8 G4/8 E4/4 F#4/2 D#4/4 B3/4 G4/4 B4/4 C5/8 B4/8 A4/4 E4/8 F#4/8 G4/4 B4/2 A4/4 F#4/4 E4/4 C4/4 D#4/2 B3/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E3/1 C3/1 A2/1 B2/1 E3/1 C3/1 F#2/1 B2/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.15,
        "notes": "h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2"
      }
    }
  },
  {
    "id": "krezk",
    "title": "Stone remembers winter",
    "bpm": 60,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.18,
        "notes": "D4/2 A3/2 F4/2 E4/4 D4/4 Bb3/1 A3/2 C#4/2 D4/2 F4/2 E4/4 D4/4 C4/2 Bb3/2 G3/2 A3/1"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "D2/1 D3/1 Bb2/1 A2/1 D2/1 C3/1 G2/1 A2/1"
      },
      "pulse2": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.15,
        "notes": "A3/1 F3/1 D3/1 E3/1 A3/1 G3/1 D3/1 E3/1"
      }
    }
  },
  {
    "id": "road",
    "title": "The next mile",
    "bpm": 84,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E4/4 B3/8 D4/8 G4/4 E4/4 F#4/4 A4/4 G4/2 E4/8 G4/8 A4/4 B4/4 G4/4 F#4/2 B3/2 G4/4 E4/4 D4/4 B3/4 C4/4 E4/4 A4/2 G4/4 F#4/4 D4/4 C4/4 B3/4 D#4/4 F#4/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E3/1 D3/1 C3/1 B2/1 E3/1 A2/1 D3/1 B2/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.15,
        "notes": "x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8. x/16 r/8. r/2 h/16 r/8."
      }
    }
  },
  {
    "id": "roadNight",
    "title": "The mile behind you",
    "bpm": 66,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E4/2 B3/4 D4/4 G4/4 r/4 F#4/2 E4/2 r/4 G4/4 F#4/2 B3/2 G4/2 E4/4 D4/4 C4/4 r/4 E4/2 D4/2 C4/2 B3/2 D#4/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 D3/1 C3/1 B2/1 E2/1 A2/1 D3/1 B2/1"
      }
    }
  },
  {
    "id": "woods",
    "title": "Footsteps in the needles",
    "bpm": 72,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "B3/8 r/8 F#4/4 r/2 E4/4 D4/8 r/8 B3/2 C4/2 r/4 G4/4 F#4/4 r/2 B3/4 E4/8 r/8 G4/4 r/2 A4/4 F#4/4 E4/2 D4/4 r/4 C4/2 B3/2 r/4 F#4/4"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 B2/1 C3/1 B2/1 E2/1 A2/1 C3/1 B2/1"
      }
    }
  },
  {
    "id": "church",
    "title": "The unlit aisle",
    "bpm": 56,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.18,
        "notes": "E4/1 B3/1 G4/1 F#4/1 E4/1 C4/1 D4/1 B3/1"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 E2/1 C3/1 B2/1 A2/1 C3/1 D3/1 B2/1"
      },
      "pulse2": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.15,
        "notes": "B3/1 F#3/1 G3/1 F#3/1 C4/1 E3/1 A3/1 F#3/1"
      }
    }
  },
  {
    "id": "tavern",
    "title": "Rosin and cold supper",
    "bpm": 92,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "A4/8 C5/8 B4/4 E4/4 A4/4 G4/4 E4/8 F4/8 G4/2 F4/8 A4/8 C5/4 B4/4 A4/4 G#4/2 E4/2 A4/4 E4/4 C5/4 B4/4 G4/8 A4/8 G4/4 E4/2 F4/4 D4/4 B3/4 F4/4 E4/2 G#4/2"
      },
      "pulse2": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.15,
        "notes": "A3/2 r/4 A3/4 G3/2 r/4 G3/4 F3/2 r/4 F3/4 E3/2 r/4 E3/4 A3/2 r/4 A3/4 C4/2 r/4 C4/4 D4/2 r/4 D4/4 E3/2 r/4 E3/4"
      }
    }
  },
  {
    "id": "house",
    "title": "A clock in the next room",
    "bpm": 76,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E4/4 r/4 B3/4 r/4 G4/2 E4/4 r/4 C4/4 r/4 E4/4 r/4 D#4/2 B3/2 E4/4 r/4 G4/4 r/4 A4/2 E4/2 D4/4 r/4 C4/4 r/4 B3/2 F#4/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E3/1 E3/1 C3/1 B2/1 E3/1 A2/1 D3/1 B2/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.15,
        "notes": "h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2 h/32 r/16. r/4 h/32 r/16. r/2"
      }
    }
  },
  {
    "id": "crypt",
    "title": "Water under the stone",
    "bpm": 60,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E3/2 r/2 r/4 B3/4 r/2 F3/2 r/2 D#3/4 r/4 B2/2 E3/4 r/2 G3/4 r/2 C4/2 F3/4 r/4 E3/2 B2/2 r/4 D#3/4"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 B1/1 F2/1 B1/1 E2/1 C2/1 F2/1 B1/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.15,
        "notes": "r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4. r/2 h/32 r/16. r/4."
      }
    }
  },
  {
    "id": "vistani",
    "title": "Embers kept for strangers",
    "bpm": 94,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "D4/8 F4/8 A4/4 G4/8 F4/8 E4/4 F4/4 D4/8 E4/8 A4/2 Bb4/8 A4/8 G4/4 F4/4 D4/4 E4/4 C#4/4 A3/2 D4/4 A4/8 G4/8 F4/4 A4/4 C5/4 A4/4 G4/8 F4/8 E4/4 F4/4 G4/4 E4/4 D4/4 C#4/2 A3/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "D3/1 D3/1 G2/1 A2/1 D3/1 F3/1 G2/1 A2/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.15,
        "notes": "x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4 x/8 r/8 h/8 r/8 x/8 r/8 r/4"
      }
    }
  },
  {
    "id": "mists",
    "title": "Where the road forgets",
    "bpm": 54,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.18,
        "notes": "E4/1 r/2 F4/2 B3/1 r/4 C4/2. G4/1 r/2 F#4/2 F4/1 B3/1"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 F2/1 B1/1 C2/1 E2/1 D2/1 F2/1 B1/1"
      }
    }
  },
  {
    "id": "castle",
    "title": "The windows above the valley",
    "bpm": 58,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "duty": 0.25,
        "vol": 0.18,
        "notes": "E3/2 B3/2 G3/2 F#3/2 C4/2 G3/4 E3/4 D#3/1 E3/2 G3/2 A3/2 C4/2 F#3/2 F3/2 B2/2 D#3/2"
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.2,
        "notes": "E2/1 B1/1 C2/1 B1/1 E2/1 A1/1 F2/1 B1/1"
      },
      "pulse2": {
        "wave": "square",
        "duty": 0.5,
        "vol": 0.15,
        "notes": "B3/1 F#3/1 G3/1 F#3/1 C4/1 E3/1 A3/1 F#3/1"
      }
    }
  }
];
