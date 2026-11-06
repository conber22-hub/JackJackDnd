# Prompt for ChatGPT: the people of a place

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/people` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and gives the village's folk these lives.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop for a Curse of Strahd campaign. Its villages have people walking the streets: a smith, a priest, a widow, a drunk, a Vistana trader, a watchman. Today each is a role and a mood. Your module gives **a place's people their lives**:
- names and faces
- a voice to play them with
- what they want, what they fear and what they hide
- who they love, owe, hate or are afraid of in the same village

A DM can then improvise a whole evening from one tap on a stranger.

Write exactly three files and nothing else:

1. `src/engine/people.js`: the generator
2. `src/data/people.js`: names, traits, wants, fears, secrets, voices, relationships (data)
3. `tests/people.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM.
- **Seeded:** a small mulberry32 inside the engine from a `seed` string. No `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:**
  - The engine imports only `../data/people.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Invent everyone. The campaign's places and its famous names (Barovia, Vallaki, Krezk, the Vistani, the Count, Ireena, Ismark, the Abbot, the Burgomaster of Vallaki, Madam Eva) are welcome as people your folk know of, fear or gossip about. Don't write those famous characters themselves, and don't copy any book's text.

## What to write

### `src/data/people.js`

- **Names:**
  - Barovian first names, male, female and neutral: at least 60, with an old-Slavic and Romanian flavour
  - family names: at least 40
  - Vistani names: at least 20, as their own set
  - nicknames: at least 20 ("Old Kasimir", "Two-Coin Vesna")
- **`ROLES`**, matching the app's folk roles (`smith`, `priest`, `innkeeper`, `widow`, `drunk`, `trader`, `watchman`, `farmer`, `child`, `beggar`, `vistana`, `burgomaster's man`, `gravedigger`, `herbwife`, `miller`, and any others you think a Barovian village needs), each with:
  - typical wants and fears
  - what they know (rumour kinds)
  - where they're found
- **`TRAITS`**: at least 40, each a short physical or manner detail ("a burn scar on the back of one hand", "laughs at nothing, then stops").
- **`VOICES`**: at least 25 one-line acting notes for the DM ("speaks to your shoulder, never your face", "every sentence a question").
- **`WANTS`**, **`FEARS`** and **`SECRETS`**: at least 30 each, grim and specific. For example, the secret "buried her husband in the garden, not the churchyard: he did not stay buried".
- **`RELATIONS`**: the kinds, `loves`, `owes`, `hates`, `fears`, `serves`, `hides from`, `is kin to`, `informs on`, each with line templates ("{a} owes {b} three silver and a promise").

### `src/engine/people.js`

Export these:

- **`person({ role, seed, place, gaze = 1 })`** → one person:
  ```js
  {
    id, name, nick, role, age, look:[two traits], voice,
    wants, fears, secret,
    knows:[rumour kinds], mood:'easy'|'wary'|'afraid',
    hook,
  }
  ```
  - `hook` is one line the DM can open with.
  - Their Gaze makes them warier: at a high Gaze, more fears and more secrets about the Count.
- **`village({ seed, place, roles:[…], gaze = 1 })`** → `{ people:[…], ties:[{ a, b, kind, text }], tensions:[…] }`.
  - **Ties:** a web where every person has 1–3 ties, some ties mutual (`loves` both ways, `is kin to`) and some not. At least one secret is known to someone else, who `informs on` or blackmails.
  - **`tensions`:** 2–4 short lines naming a conflict between ties that the party could stumble into ("Vesna owes the miller; the miller informs on Vesna's brother to the watch").
- **`introduce(p, { night = false })`** → a two- or three-sentence read-aloud for the first time the party meets them: their look, what they're doing, their first words in their voice.
- **`askAbout(p, topic, { gaze })`** → what they say about a topic:
  - a place
  - another person (via their ties)
  - the Count
  - the Vistani
  - the dead

  Their answer is coloured by their mood, wants and fears, and **never reveals their own secret** unless `topic` is the secret's subject and their mood is `easy`, and even then only as a slip ("…not that anyone in *my* garden would know").
- **`forPlayers(p, met = [])`** → only what the party could know: name, look and voice, plus `met` facts. Never wants, fears, secrets or ties.

## Tests (`tests/people.test.js`)

- **`person`:**
  - for every role and 20 seeds, it returns complete people with no empty fields
  - names come from the right list (Vistani names for `vistana`)
  - output is deterministic for a seed
- **`village`:**
  - with 12 roles, every person has 1–3 ties
  - at least one `informs on` or blackmail tie points at someone's secret
  - 2–4 tensions, each naming two real people
- **`introduce`** uses the person's name or role and one of their traits.
- **`askAbout`:**
  - never includes the secret text, except the slip case
  - a frightened person says less (shorter answers on average) than an easy one
- **`forPlayers`:** never contains wants, fears, secret or ties.
- **Data sizes** meet the minimums above, with no duplicates within a list.
- **Speed:** a 30-person village in under 50 ms.

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/people`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
