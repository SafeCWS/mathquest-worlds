export type InteractionType =
  | 'tap'          // Standard multiple choice (uses gameModule.gameType)
  | 'choice'       // Alternative name for standard choice-based games
  | 'drag-target'  // CodeSpark: Drag number to gap
  | 'sequence'     // CodeSpark: Order commands (1, 2, 3)
  | 'trace'        // Writing numbers
  | 'physics-feed'; // Feed the avatar (counting)

export type GameDifficulty = 'beginner' | 'intermediate' | 'advanced';

// The "Atom" of content - agnostic to how it's displayed
export interface GameAsset {
  id: string;
  type: 'sprite' | 'audio' | 'text';
  content: string; // URL or literal text
  value?: number;  // Semantic math value (e.g., "3 apples" -> 3)
  tags?: string[]; // ['fruit', 'red'] for filtering
}

// A single "Level" or "Question"
export interface GameProblem {
  id: string;
  type: InteractionType;
  prompt: string;
  assets: GameAsset[];
  correctSequence?: string[]; // For sequence mode: ['id_1', 'id_2']
  correctValue?: number;      // For math calculation
  tolerance?: number;         // For drag precision (in pixels)
  difficultyWeight: number;   // 0.1 to 1.0 (Duolingo adaptation metric)
}

// Telemetry for the "Teacher Algorithm"
export interface AttemptMetric {
  problemId: string;
  timeTakenMs: number;
  attemptsCount: number;
  didGiveUp: boolean;
  interactionPattern: 'direct' | 'hesitant' | 'random_spam';
  timestamp: number;
}

export interface GameModeProps {
  problem: GameProblem;
  onCorrect: (timestamp: number) => void;
  onWrong: (timestamp: number) => void;
}
