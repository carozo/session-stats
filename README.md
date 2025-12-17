# WCA Stats

A modern statistics dashboard for speedcubing data. Import your csTimer sessions and visualize your solving performance with beautiful charts and comprehensive analytics.

## Features

### Core Statistics

- **Best Single / Worst Single** — Track your PBs and outliers
- **Mean & Median** — Central tendency measures for your times
- **Ao5, Ao12, Ao100** — Rolling averages with WCA-style trimming

### Progress Analytics

- **Improvement Rate** — Seconds improved per 100 solves
- **Time to Sub-X** — Estimated solves to reach your next goal
- **Time Since PB** — Days and solves since your last personal best
- **Solve Frequency** — Average solves per day and active weeks

### Visualization

- Interactive performance graph with multiple overlays:
  - Solve times with trend line
  - Rolling Ao5, Ao12, Ao100
  - Mean and ±1 standard deviation bands
- Session-based filtering with WCA event icons

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

## Usage

1. Export your data from [csTimer](https://cstimer.net): `Export → Export to file`
2. Drag & drop the JSON file into the app (or click to browse)
3. Select a session to view detailed stats and graphs

## Tech Stack

- React 19
- Recharts
- Vite

## License

MIT
```
