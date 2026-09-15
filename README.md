# UJ Campus Notices — Graded Lab (DSW02B1)

A single-screen React Native (Expo) app that:
1. Loads "notices" from `https://jsonplaceholder.typicode.com/posts` (Question 1)
2. Caches them with AsyncStorage so they survive being offline (Question 2)

Everything lives in **two files**, on purpose, so it's easy to open and explain:
- `App.js` — all the logic (state, fetch, AsyncStorage, rendering)
- `components/NoticeCard.js` — the one reusable UI piece

---

## 1. How to set it up

You need Node.js and the Expo CLI. Then, from a terminal:

```bash
npx create-expo-app uj-campus-notices
cd uj-campus-notices
npm install @react-native-async-storage/async-storage
```

Now **replace** the generated `App.js` with the `App.js` from this project, and
**create** a `components` folder containing `NoticeCard.js` from this project.

Your final folder should look like:

```
uj-campus-notices/
├── App.js
├── components/
│   └── NoticeCard.js
└── package.json
```

## 2. How to run it

```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone, or press `a` / `i`
in the terminal to open an Android/iOS simulator.

---

## 3. How the data flows (say this out loud in your demo)

**Question 1 — live data:**
```
Screen opens → useEffect() → fetch(API_URL) → response.json()
            → setNotices() → FlatList → NoticeCard (×10)
```

**Question 2 — offline-first:**
```
App opens → read AsyncStorage cache first (so screen isn't blank)
         → then try the live API
API succeeds → show fresh notices → overwrite the cache + save timestamp
API fails + cache exists → keep showing cached notices + "Saved copy • Last updated …"
API fails + no cache → show the friendly error message
```

This two-step start-up (cache first, then live) is what makes it "offline-first":
the user always sees *something* immediately, and it only gets replaced if the
live request actually succeeds.

---

## 4. Mapping the code to the rubric (use this to explain to your marker)

### Question 1 — Live API screen

| Requirement | Where it is in `App.js` |
|---|---|
| Screen titled "UJ Campus Notices" | `<Text style={styles.headerTitle}>` in the header |
| `useState` for notices/loading/error | Top of the component, three `useState` calls |
| `useEffect` calls an async function on open | `useEffect(() => { const startUp = async () => {...} }, [])` |
| `fetch` + `response.ok` + `response.json()` | Inside `fetchNotices()` |
| Only first 10 records | `data.slice(0, 10)` |
| `FlatList` with `String(item.id)` key | `keyExtractor={(item) => String(item.id)}` |
| Reusable `NoticeCard` via props | `components/NoticeCard.js`, receives `notice` prop |
| Visible loading state | `ActivityIndicator` shown while `loading` is true |
| Friendly error message, no raw error shown | `setError('Unable to load notices...')` — the real error only goes to `console.log` |
| Retry action | "Retry" button calls `fetchNotices()` again |

**Why `fetch` instead of Axios:** no extra library is needed, it's built into
React Native, and `response.ok` gives an explicit, easy-to-explain check before
trusting the response body — good for a viva question like "why did you choose
this approach?"

### Question 2 — Offline-first storage

| Requirement | Where it is in `App.js` |
|---|---|
| Install & import AsyncStorage | Top of file: `import AsyncStorage from '@react-native-async-storage/async-storage'` |
| Namespaced keys | `CACHE_KEY` and `LAST_UPDATED_KEY` constants |
| Save only on success, using `JSON.stringify` | Inside the `try` block of `fetchNotices()`, after a successful response |
| Save the refresh timestamp | `AsyncStorage.setItem(LAST_UPDATED_KEY, now)` |
| Handle `getItem()` returning `null` on first launch | `if (cachedJson !== null)` check in `loadCachedNotices()` |
| Convert back with `JSON.parse` | Same function |
| Fresh data replaces cache on success | `setNotices(firstTen)` + re-saving the cache every successful fetch |
| Keep showing cache + status text when API fails | `catch` block: if a cached copy exists, `setIsShowingCache(true)` and the banner renders "Saved copy • Last updated …" |
| Friendly empty/error state with no cache | `setError(...)` only fires when there's no cache to fall back on |
| "Clear Saved Notices" removes only the two keys | `clearSavedNotices()` uses `removeItem()` twice — never `AsyncStorage.clear()` |

---

## 5. How to demonstrate the offline behaviour (for your evidence/recording)

1. Run the app with Wi-Fi/data on. Confirm the notices list loads normally.
2. Close the app fully, then reopen it — confirm it still works (this proves
   the state isn't just sitting in memory).
3. Turn on **Airplane Mode** (or disable Wi-Fi) on your phone.
4. Restart the app. You should immediately see the previously saved notices,
   plus the orange **"Saved copy • Last updated HH:MM"** banner at the top.
5. Tap **Refresh** — since there's no connection, it will fail and quietly
   keep showing the same cached notices with the same banner.
6. Tap **Clear Saved Notices** — you'll get a confirmation alert. Restart the
   app again while still offline: this time you'll see the friendly error
   message instead of old data, proving the cache was actually removed.
7. Turn Wi-Fi/data back on and refresh — the banner disappears because you're
   looking at live data again.

Record steps 3–6 as one continuous screen recording — that's your strongest
single piece of evidence for Question 2.

---

## 6. Security note (already followed in the code)

No API keys, passwords or secrets appear anywhere in this project —
JSONPlaceholder is a public, keyless test API, and AsyncStorage is only ever
used to store the public notice list and a timestamp, exactly as the brief
requires.


