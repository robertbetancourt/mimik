# DATA_STRUCTURE

## Principles

- Local data only
- JSON driven
- Human readable
- Easy to extend
- No database required

---

# Category

Fields

- id
- title
- description
- illustration
- words

Notes

- Each category is an independent JSON file.
- Categories can contain different numbers of words.
- Words are manually curated.

---

# Word

Fields

- id
- value

Rules

- Unique inside its category.
- Single answer only.
- No duplicates.
- Family friendly.

---

# Player

Fields

- id
- name
- score

Rules

- Created at the beginning of every match.
- Exists only during the current session.

---

# Match

Fields

- category
- players
- roundDuration
- totalRounds
- currentRound
- infiniteMode
- status

Status

- setup
- countdown
- playing
- turnResults
- finalResults
- finished

---

# Turn

Fields

- playerId
- correctWords
- passedWords
- score
- duration

Rules

- One turn per player per round.
- Ends automatically when time reaches zero.

---

# Final Results

Fields

- winner
- ranking
- totalRounds
- players

---

# Assets

Illustrations

/assets/images/

Categories

/assets/images/categories/

Mimik

/assets/images/mimik/

Icons

/assets/images/ui/

Sounds

/assets/audio/

Fonts

/assets/fonts/

---

# Future

Reserved for future versions

- Statistics
- Achievements
- Online profiles
- Cloud sync
- Multiplayer