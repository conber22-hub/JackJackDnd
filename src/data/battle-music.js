// Original eight-bar fight scores. Seep sets a delayed pulse a semitone against the lead.
export const FIGHT_LOOPS = [
  {
    "id": "skirmish",
    "title": "Something Keeps Pace",
    "bpm": 86,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "D3/4. F3/8 E3/2 r/4. D3/8 A3/2 Bb3/4. A3/8 F3/2 E3/2 C#3/2 D3/4. A3/8 F3/2 G3/4. r/8 E3/2 F3/4. D3/8 Bb2/2 A2/2 C#3/2",
        "duty": 0.25
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "D2/4 r/8 D2/8 D2/2 D2/4 r/8 D2/8 D2/2 Bb1/4 r/8 Bb1/8 Bb1/2 A1/4 r/8 A1/8 A1/2 D2/4 r/8 D2/8 D2/2 G2/4 r/8 G2/8 G2/2 Bb1/4 r/8 Bb1/8 Bb1/2 A1/4 r/8 A1/8 A1/2"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.095,
        "notes": "X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2 X/8 r/8 x/8 r/8 r/2"
      }
    }
  },
  {
    "id": "clash",
    "title": "Iron at the Lychgate",
    "bpm": 112,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "D4/8 A4/4 G4/8 F4/4 E4/4 F4/4 r/8 C5/8 A4/2 Bb4/8 D5/4 C5/8 A4/4 G4/4 E4/4 G4/8 C#5/8 A4/2 D5/8 A4/4 F4/8 E4/4 D4/4 G4/4 Bb4/8 A4/8 E4/2 F4/8 D4/4 G4/8 E4/4 F4/4 A4/4 G4/8 E4/8 C#4/2",
        "duty": 0.25
      },
      "pulse2": {
        "wave": "square",
        "vol": 0.09,
        "notes": "r/4 F3/4 r/8 F3/8 r/4 r/4 A3/4 r/8 A3/8 r/4 r/4 D4/4 r/8 D4/8 r/4 r/4 C#4/4 r/8 C#4/8 r/4 r/4 F3/4 r/8 F3/8 r/4 r/4 D4/4 r/8 D4/8 r/4 r/4 G3/4 r/8 G3/8 r/4 r/4 E3/4 r/8 E3/8 r/4",
        "duty": 0.125
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "D2/4 r/8 D2/8 D2/2 F2/4 r/8 F2/8 F2/2 Bb1/4 r/8 Bb1/8 Bb1/2 A1/4 r/8 A1/8 A1/2 D2/4 r/8 D2/8 D2/2 G2/4 r/8 G2/8 G2/2 Bb1/4 r/8 Bb1/8 Bb1/2 A1/4 r/8 A1/8 A1/2"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.095,
        "notes": "X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4 X/4 h/8 x/8 r/8 h/8 x/4"
      }
    }
  },
  {
    "id": "peril",
    "title": "The Stair Gives Way",
    "bpm": 137,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "E5/8 G5/4 F#5/8 B4/4 E5/4 F#5/8 A5/4 G5/8 E5/4 D5/4 G5/8 B5/4 A5/8 F#5/4 E5/4 A5/8 C6/4 B5/8 G5/4 F#5/4 B5/8 D6/4 C6/8 G5/4 B5/4 C6/8 A5/4 B5/8 D6/4 C6/4 D6/8 B5/4 A5/8 F#5/4 G5/4 F#5/8 E5/4 B4/8 D#5/4 B4/4",
        "duty": 0.25
      },
      "pulse2": {
        "wave": "square",
        "vol": 0.09,
        "notes": "B3/8 r/8 r/4 B3/4 r/4 C4/8 r/8 r/4 C4/4 r/4 D4/8 r/8 r/4 D4/4 r/4 E4/8 r/8 r/4 E4/4 r/4 F#4/8 r/8 r/4 F#4/4 r/4 G4/8 r/8 r/4 G4/4 r/4 A4/8 r/8 r/4 A4/4 r/4 D#4/8 r/8 r/4 D#4/4 r/4",
        "duty": 0.125
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "E2/4 r/8 E2/8 E2/2 F#2/4 r/8 F#2/8 F#2/2 G2/4 r/8 G2/8 G2/2 A2/4 r/8 A2/8 A2/2 B2/4 r/8 B2/8 B2/2 C3/4 r/8 C3/8 C3/2 D3/4 r/8 D3/8 D3/2 B2/4 r/8 B2/8 B2/2"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.095,
        "notes": "X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8 X/8 h/8 r/8 x/8 h/4 x/8 h/8"
      }
    }
  },
  {
    "id": "lastStand",
    "title": "One Candle Left",
    "bpm": 65,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "A4/2 r/2 r/2. E4/4 F4/2 E4/2 r/2. B3/4 A4/2 C5/2 r/2. G4/4 F4/2 r/2 r/2. G#4/4",
        "duty": 0.25
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "A2/1 r/1 F2/1 E2/1 A2/1 r/1 D2/1 E2/1"
      }
    }
  },
  {
    "id": "court",
    "title": "The Count Takes His Measure",
    "bpm": 94,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "F4/4. Ab4/8 C5/2 Db5/2 C5/2 Bb4/4. G4/8 E4/2 C5/2 G4/2 Ab4/4. F4/8 Eb4/2 Db4/2 F4/2 Bb4/4. G4/8 Db5/2 C5/2 E4/2",
        "duty": 0.5
      },
      "pulse2": {
        "wave": "square",
        "vol": 0.09,
        "notes": "Ab3/1 F3/1 Db3/1 E3/1 C4/1 Ab3/1 Bb3/1 G3/1",
        "duty": 0.5
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "F2/1 Db2/1 Bb1/1 C2/1 F2/1 Db2/1 G2/1 C2/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.095,
        "notes": "X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4 X/4 r/2 h/4"
      }
    }
  },
  {
    "id": "seep",
    "title": "A Second Pulse Beneath",
    "bpm": 91,
    "loop": true,
    "bars": 8,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.17,
        "notes": "C4/4. Db4/8 r/2 Eb4/2 D4/2 Gb4/4. F4/8 Db4/2 r/2 B3/2 C4/4. Eb4/8 Db4/2 G4/2 Gb4/2 F4/4. r/8 Db4/2 D4/2 B3/2",
        "duty": 0.25
      },
      "pulse2": {
        "wave": "square",
        "vol": 0.09,
        "notes": "r/8 Db4/4. r/2 r/8 D4/4. r/2 r/8 F4/4. r/2 r/8 C4/4. r/2 r/8 Db4/4. r/2 r/8 G4/4. r/2 r/8 E4/4. r/2 r/8 C4/4. r/2",
        "duty": 0.125
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.22,
        "notes": "C2/1 Db2/1 F2/1 G1/1 C2/1 Gb2/1 Db2/1 G1/1"
      },
      "noise": {
        "wave": "noise",
        "vol": 0.095,
        "notes": "r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8 r/4 x/16 h/16 r/8 r/4 h/8 r/8"
      }
    }
  }
];

export const STINGS = [
  {
    "id": "won",
    "title": "Room to Breathe",
    "bpm": 76,
    "loop": false,
    "bars": 1,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.15,
        "notes": "F4/8 E4/8 A4/4 F4/4 D4/4",
        "duty": 0.25
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.16,
        "notes": "Bb2/2 D3/2"
      }
    }
  },
  {
    "id": "fell",
    "title": "The Wick Goes Black",
    "bpm": 76,
    "loop": false,
    "bars": 1,
    "beatsPerBar": 4,
    "voices": {
      "pulse1": {
        "wave": "square",
        "vol": 0.15,
        "notes": "A4/4 F4/8 E4/8 D4/4 A3/4",
        "duty": 0.25
      },
      "tri": {
        "wave": "triangle",
        "vol": 0.16,
        "notes": "D3/2 A2/2"
      }
    }
  }
];
