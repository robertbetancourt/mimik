# MVP Scope

## Goal

Deliver a polished offline local multiplayer charades game ready before July 31.

---

## Platform

- Android
- iOS

---

## Connectivity

- Offline only
- No accounts
- No servers
- No cloud sync

---

## Core Gameplay

- Local multiplayer
- One shared phone
- Tilt controls
- Timed turns
- Configurable rounds
- Continue until manually ended
- Final scoreboard

---

## Categories

Initial MVP:

- Movies
- Music
- Sports
- Animals
- Food
- Countries
- TV Series
- Superheroes
- Video Games
- Modern Celebrities
- Logos

Each category is an independent JSON file.

Each JSON contains:

- id
- title
- description
- illustration
- words[]

Categories may contain different numbers of words.

Words are manually curated.

No difficulty system.

---

## Players

- Custom names
- Local session only
- No persistent profiles

---

## Turn

- Countdown
- Orientation check
- Large centered word
- Tilt Down → Correct
- Tilt Up → Pass
- Haptic feedback
- Timer
- Turn summary

---

## Match End

- Winner
- Final ranking
- Celebration
- Play Again
- Return Home

---

## Mimik

Appears during:

- Countdown
- Turn summary
- Final results
- Empty states

Never speaks.

Communicates only through expressions.

---

## Audio

- Buttons
- Countdown
- Correct
- Pass
- Celebration
- Haptics

---

## Out of Scope

- Online multiplayer
- Accounts
- History
- Statistics
- Achievements
- AI features
- Monetization
- Themes
- Notifications
- Multiple languages