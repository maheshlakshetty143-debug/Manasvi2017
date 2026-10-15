export interface WorldStats {
  name: string;
  day: number;
  timeOfDay: number; // 0..1 (0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight)
  population: number;
  happiness: number; // 0..100
  villagerCount: number;
  sheepCount: number;
  treeCount: number;
  homeCount: number;
  isRaining: boolean;
  rainTimeRemaining: number;
}

export type ToolType =
  | 'inspect'
  | 'oak_tree'
  | 'pine_tree'
  | 'palm_tree'
  | 'cottage'
  | 'windmill'
  | 'lighthouse'
  | 'well'
  | 'mountain'
  | 'flower_patch'
  | 'cloud'
  | 'villager'
  | 'sheep'
  | 'raise_land'
  | 'lower_land'
  | 'remove';

export type CameraPreset = 'orb' | 'surface' | 'orbit' | 'village';

export interface PlacedItem {
  id: string;
  type: ToolType;
  position: [number, number, number]; // on sphere
  normal: [number, number, number];
  rotationY: number;
  scale: number;
  createdAt: number;
  colorVariant?: string;
  houseColor?: string;
}

export interface VillagerActor {
  id: string;
  name: string;
  color: string;
  hatColor: string;
  targetPos: [number, number, number];
  currentPos: [number, number, number];
  normal: [number, number, number];
  phase: number;
  speed: number;
  homeId?: string;
  state: 'walking' | 'visiting_well' | 'chatting' | 'resting';
  actionTimer: number;
}

export interface SheepActor {
  id: string;
  currentPos: [number, number, number];
  targetPos: [number, number, number];
  normal: [number, number, number];
  grazeTime: number;
  walkSpeed: number;
  animPhase: number;
}
