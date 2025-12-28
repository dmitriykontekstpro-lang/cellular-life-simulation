# Changelog

## [1.2.0] - 2025-12-28 - Visual Overhaul

### 🌊 Fractal River System
- **New Algorithm**: Implemented recursive "Brush" painting algorithm.
- **Continuous Flow**: Guaranteed no breaks in the river.
- **Organic Shape**: Thick trunk (8px) branching into thinner streams naturally.

### 🌿 Advanced Plant Life
- **Biomass Tracking**: Stats now show total cell count (Biomass) instead of just plant count.
- **Deep Roots**: Water search radius increased 1x -> 12x. Plants can drink from afar.
- **Durability**: Plants no longer shrink immediately when hungry; they go dormant.
- **Bushy Growth**: New branching logic for more organic, non-linear shapes.

## [1.1.0] - 2025-12-28 - Performance Optimizations

### 🚀 Performance Improvements (10-15x faster)
- **Water system optimization**: Reduced water radius from 20 to 6 cells
- **Algorithm optimization**: Replaced BFS with optimized square radius algorithm
- **Update frequency**: Water now updates every 10 ticks instead of every tick
- **Result**: Eliminated browser freezing, smooth gameplay experience

### 🧪 Testing Tools
- Added `check_code.py` - instant code verification (< 1 second)
- Added `check_performance.py` - performance optimization check
- Added `test_simulation.py` - full automated browser test with Playwright
- Added `QUICK_TEST.md` - quick testing guide

### 📝 Documentation
- Added `COMPLETE.md` - completion summary
- Updated `README.md` - comprehensive guide

## [1.0.0] - 2025-12-28 - Initial Release

### ✨ Features
- **Plant Class**: Full implementation with growth, branching, and lifecycle
- **Water System**: Branching river with water flow
- **Energy System**: Sunlight distribution from top
- **Visual**: Green plants, bright yellow seeds (#ffff00), blue water
- **Settings**: Grid size, plant count, reproduction speed, offspring count, max size
- **Controls**: Start/Pause/Reset, speed control (1x-10x)
- **Camera**: Pan & zoom

### 🌿 Plant Mechanics
- Growth direction: predominantly upward
- Branching: random, max 20 cells per branch
- Minimum distance: 5 cells between plants
- Lifecycle: growth → max size → death → seed generation
- Seeds: bright yellow (#ffff00)

### 💧 Water & Energy
- River: branching pattern from left to right
- Water flow: 6 cell radius from river
- Water does NOT block sunlight (only plants block light)

### 🚀 Deployment
- GitHub repository created
- GitHub Pages enabled
- Live demo available

### 🎨 Design
- Dark theme with neon accents
- Smooth gradients and animations
- Responsive interface
- Modern typography (Inter font)
