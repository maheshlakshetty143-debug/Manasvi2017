import React, { useState } from 'react';
import {
  TreePine,
  Home,
  Mountain,
  Users,
  Compass,
  Sparkles,
  CloudRain,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Trash2,
  TrendingUp,
  Smile,
  Calendar,
  Eye,
  Pencil,
  Check,
  Palmtree,
  Flower2,
  Anchor,
  CircleArrowUp,
  CircleArrowDown,
  Cloud,
  Droplet,
} from 'lucide-react';
import { ToolType, CameraPreset, WorldStats } from './types';

interface ControlDockProps {
  stats: WorldStats;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  cameraPreset: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  onGrow: () => void;
  onTriggerRain: () => void;
  onTimeChange: (time: number) => void;
  onStartTour: () => void;
  isTouring: boolean;
  tourMessage: string;
  onStopTour: () => void;
  onUpdateWorldName: (name: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

type ToolTab = 'nature' | 'structures' | 'terrain' | 'life' | 'manage';

export const ControlDock: React.FC<ControlDockProps> = ({
  stats,
  currentTool,
  onSelectTool,
  cameraPreset,
  onSelectCamera,
  onGrow,
  onTriggerRain,
  onTimeChange,
  onStartTour,
  isTouring,
  tourMessage,
  onStopTour,
  onUpdateWorldName,
  isMuted,
  onToggleMute,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<ToolTab>('nature');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(stats.name);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateWorldName(tempName.trim());
    }
    setIsEditingName(false);
  };

  // Preset time of day buttons
  const isNight = stats.timeOfDay > 0.45 && stats.timeOfDay < 0.92;

  return (
    <>
      {/* Top Header & Miniature World Stats Bar */}
      <header className="fixed top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* World Identity Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-amber-50/90 border border-amber-200/80 shadow-md rounded-2xl px-4 py-2.5 backdrop-blur-none text-stone-800">
          <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shadow-inner">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <form onSubmit={handleNameSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={24}
                    className="text-sm font-semibold bg-white border border-amber-300 rounded px-1.5 py-0.5 text-stone-900 outline-none w-32"
                    autoFocus
                  />
                  <button type="submit" className="p-0.5 text-amber-700 hover:text-amber-900">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <h1 className="text-sm font-bold tracking-tight text-stone-800 flex items-center gap-1.5">
                    {stats.name}
                    <button
                      onClick={() => {
                        setTempName(stats.name);
                        setIsEditingName(true);
                      }}
                      className="text-stone-400 hover:text-stone-600 transition-colors"
                      title="Edit world name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </h1>
                </>
              )}
            </div>
            <p className="text-[11px] font-medium text-stone-500">Pocket World // Terrarium Planet</p>
          </div>
        </div>

        {/* Live Town Vitals Strip */}
        <div className="pointer-events-auto flex items-center gap-4 bg-amber-50/90 border border-amber-200/80 shadow-md rounded-2xl px-4 py-2 text-xs font-medium text-stone-700">
          <div className="flex items-center gap-1.5" title="Villager Population">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Pop:</span>
            <strong className="font-bold text-stone-900">{stats.villagerCount}</strong>
          </div>

          <div className="w-px h-3.5 bg-amber-200" />

          <div className="flex items-center gap-1.5" title="Village Happiness">
            <Smile className="w-3.5 h-3.5 text-emerald-600" />
            <span>Happiness:</span>
            <strong className="font-bold text-stone-900">{stats.happiness}%</strong>
          </div>

          <div className="w-px h-3.5 bg-amber-200" />

          <div className="flex items-center gap-1.5" title="Simulation Day">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Day:</span>
            <strong className="font-bold text-stone-900">{stats.day}</strong>
          </div>

          <div className="w-px h-3.5 bg-amber-200" />

          {/* Sound & Tour Controls */}
          <button
            onClick={onToggleMute}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-amber-100 transition-colors"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-800" />}
          </button>
        </div>
      </header>

      {/* Cinematic Tour Banner when active */}
      {isTouring && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-stone-900/90 text-amber-100 border border-amber-300/40 shadow-xl rounded-full px-5 py-2 flex items-center gap-3 text-xs font-medium animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{tourMessage || 'Guided Terrarium Tour in progress...'}</span>
          <button
            onClick={onStopTour}
            className="ml-2 text-stone-400 hover:text-white underline text-[11px]"
          >
            Interrupt / Exit
          </button>
        </div>
      )}

      {/* Unified Bottom Control Dock (Zero Viewport Occlusion per Three.js directives) */}
      <nav
        aria-label="Terrarium Controls"
        className={`fixed left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-out flex flex-col items-center pointer-events-none ${
          collapsed ? 'bottom-0 translate-y-[calc(100%-28px)]' : 'bottom-4'
        }`}
        style={{ width: 'min(920px, 95vw)' }}
      >
        {/* Collapse / Expand Tab */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="pointer-events-auto bg-amber-100/95 border-t border-x border-amber-300 text-stone-700 hover:text-stone-950 font-semibold text-[11px] px-3.5 py-1 rounded-t-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
              <span>Show Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
              <span>Hide Dock</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div className="pointer-events-auto w-full bg-amber-50/95 border border-amber-200/90 shadow-2xl rounded-2xl p-3 text-stone-800 backdrop-blur-none">
          {/* Top Bar inside dock: Tool Categories + Camera Views + Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-200/60 text-xs">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-amber-100/80 p-0.5 rounded-xl border border-amber-200/60">
              <button
                onClick={() => setActiveTab('nature')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'nature' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Nature
              </button>
              <button
                onClick={() => setActiveTab('structures')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'structures' ? 'bg-white text-rose-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Buildings
              </button>
              <button
                onClick={() => setActiveTab('terrain')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'terrain' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Terrain
              </button>
              <button
                onClick={() => setActiveTab('life')}
                style={{ backgroundColor: '#0b1621' }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all text-white ${
                  activeTab === 'life' ? 'shadow-sm ring-1 ring-amber-300' : 'opacity-90 hover:opacity-100'
                }`}
              >
                Life
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'manage' ? 'bg-white text-purple-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                World & Views
              </button>
            </div>

            {/* Quick Actions (Grow, Rain, Weather Status, Day/Night toggle) */}
            <div className="flex items-center gap-1.5">
              {/* Weather Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold shadow-xs transition-colors ${
                  stats.isRaining
                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                    : isNight
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    : 'bg-amber-100/80 text-amber-900 border-amber-300'
                }`}
                title={stats.isRaining ? 'Current Weather: Rain Shower' : isNight ? 'Current Weather: Clear Night' : 'Current Weather: Sunny'}
              >
                {stats.isRaining ? (
                  <Droplet className="w-3.5 h-3.5 text-sky-600 fill-sky-500" />
                ) : isNight ? (
                  <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="hidden sm:inline text-[11px]">
                  {stats.isRaining ? 'Raining' : isNight ? 'Starry' : 'Sunny'}
                </span>
              </div>

              <button
                onClick={onGrow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold hover:bg-emerald-200 transition-colors"
                title="Advance village development with new homes & trees"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Grow Village</span>
              </button>

              <button
                onClick={onTriggerRain}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  stats.isRaining
                    ? 'bg-sky-200 text-sky-900 border-sky-400'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
                title="Release fine rain shower that darkens ground & advances trees"
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Rain</span>
              </button>

              <button
                onClick={() => onTimeChange(isNight ? 0.25 : 0.72)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-semibold hover:bg-amber-200 transition-colors"
                title={isNight ? 'Switch to Daytime' : 'Switch to Night Mode'}
              >
                {isNight ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{isNight ? 'Day' : 'Night'}</span>
              </button>

              <button
                onClick={onStartTour}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold shadow-sm hover:bg-amber-700 transition-colors"
                title="Watch 25-second cinematic journey"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>25s Tour</span>
              </button>
            </div>
          </div>

          {/* Tab Content: The Tools Palette */}
          <div className="flex items-center justify-between gap-3 min-h-[52px]">
            {/* Tool Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {/* Default Inspect Tool */}
              <button
                onClick={() => onSelectTool('inspect')}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                  currentTool === 'inspect'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                    : 'bg-white/80 text-stone-700 border-amber-200/80 hover:bg-amber-100/60'
                }`}
              >
                <Compass className="w-4 h-4 mb-0.5" />
                <span>Spin/Pan</span>
              </button>

              {/* Tab 1: Nature */}
              {activeTab === 'nature' && (
                <>
                  <button
                    onClick={() => onSelectTool('oak_tree')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'oak_tree'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white/80 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <TreePine className="w-4 h-4 mb-0.5 text-emerald-600" />
                    <span>Oak Tree</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('pine_tree')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'pine_tree'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white/80 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <TreePine className="w-4 h-4 mb-0.5 text-emerald-700" />
                    <span>Pine Tree</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('palm_tree')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'palm_tree'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white/80 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Palmtree className="w-4 h-4 mb-0.5 text-amber-700" />
                    <span>Coastal Palm</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('flower_patch')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'flower_patch'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                        : 'bg-white/80 text-rose-900 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <Flower2 className="w-4 h-4 mb-0.5 text-rose-500" />
                    <span>Wildflowers</span>
                  </button>
                </>
              )}

              {/* Tab 2: Structures */}
              {activeTab === 'structures' && (
                <>
                  <button
                    onClick={() => onSelectTool('cottage')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'cottage'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                        : 'bg-white/80 text-rose-900 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <Home className="w-4 h-4 mb-0.5 text-rose-600" />
                    <span>Pastel Home</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('windmill')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'windmill'
                        ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                        : 'bg-white/80 text-amber-900 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 mb-0.5 text-amber-600" />
                    <span>Windmill</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('lighthouse')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'lighthouse'
                        ? 'bg-red-700 text-white border-red-800 shadow-sm'
                        : 'bg-white/80 text-red-900 border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <Anchor className="w-4 h-4 mb-0.5 text-red-600" />
                    <span>Lighthouse</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('well')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'well'
                        ? 'bg-stone-700 text-white border-stone-800 shadow-sm'
                        : 'bg-white/80 text-stone-900 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-0.5 text-cyan-600" />
                    <span>Stone Well</span>
                  </button>
                </>
              )}

              {/* Tab 3: Terrain */}
              {activeTab === 'terrain' && (
                <>
                  <button
                    onClick={() => onSelectTool('raise_land')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'raise_land'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white/80 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                    title="Click ground to raise hills"
                  >
                    <CircleArrowUp className="w-4 h-4 mb-0.5 text-emerald-600" />
                    <span>Raise Land</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('lower_land')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'lower_land'
                        ? 'bg-cyan-700 text-white border-cyan-800 shadow-sm'
                        : 'bg-white/80 text-cyan-900 border-cyan-200 hover:bg-cyan-50'
                    }`}
                    title="Lower terrain to create lakes & seas"
                  >
                    <CircleArrowDown className="w-4 h-4 mb-0.5 text-cyan-600" />
                    <span>Lower Land</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('mountain')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'mountain'
                        ? 'bg-stone-700 text-white border-stone-800 shadow-sm'
                        : 'bg-white/80 text-stone-900 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Mountain className="w-4 h-4 mb-0.5 text-stone-600" />
                    <span>Mountain</span>
                  </button>
                </>
              )}

              {/* Tab 4: Life */}
              {activeTab === 'life' && (
                <>
                  <button
                    onClick={() => onSelectTool('villager')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'villager'
                        ? 'bg-sky-700 text-white border-sky-800 shadow-sm'
                        : 'bg-white/80 text-sky-900 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-0.5 text-sky-600" />
                    <span>Villager</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('sheep')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'sheep'
                        ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                        : 'bg-white/80 text-amber-900 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <Smile className="w-4 h-4 mb-0.5 text-stone-500" />
                    <span>Sheep</span>
                  </button>

                  <button
                    onClick={() => onSelectTool('cloud')}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                      currentTool === 'cloud'
                        ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                        : 'bg-white/80 text-blue-900 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <Cloud className="w-4 h-4 mb-0.5 text-blue-400" />
                    <span>Cloud</span>
                  </button>
                </>
              )}

              {/* Tab 5: Camera & Time of Day */}
              {activeTab === 'manage' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-100/80 p-0.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] font-bold text-stone-500 px-1.5 flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> Camera:
                    </span>
                    {(['orb', 'surface', 'orbit', 'village'] as CameraPreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => onSelectCamera(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          cameraPreset === preset
                            ? 'bg-amber-700 text-white shadow-sm'
                            : 'text-stone-700 hover:text-stone-900'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Time of Day Slider */}
                  <div className="flex items-center gap-1.5 bg-amber-100/60 px-2 py-1 rounded-xl border border-amber-200/50">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={stats.timeOfDay}
                      onChange={(e) => onTimeChange(parseFloat(e.target.value))}
                      className="w-24 accent-amber-600 cursor-pointer h-1.5"
                      title="Adjust time of day"
                    />
                    <Moon className="w-3.5 h-3.5 text-indigo-700" />
                  </div>
                </div>
              )}

              {/* Remove / Bulldoze Tool */}
              <button
                onClick={() => onSelectTool('remove')}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-[10px] font-semibold border transition-all ${
                  currentTool === 'remove'
                    ? 'bg-red-700 text-white border-red-800 shadow-sm'
                    : 'bg-white/80 text-red-900 border-red-200 hover:bg-red-50'
                }`}
                title="Click any placed tree or structure to remove it"
              >
                <Trash2 className="w-4 h-4 mb-0.5 text-red-500" />
                <span>Remove</span>
              </button>
            </div>

            {/* Instruction Tip */}
            <div className="hidden sm:flex flex-col text-right text-[11px] text-stone-500 pr-1 shrink-0">
              <span className="font-medium text-stone-700">Drag to spin planet</span>
              <span className="text-[10px] text-stone-400">Click ground to place items</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
