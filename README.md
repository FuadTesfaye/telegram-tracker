# 🏆 Telegram League — Track. Compete. Get Roasted.

> **Telegram League** is a gamified Telegram analytics, self-tracking, and competitive weekly tournament platform. It turns observable Telegram presence and chat footprints into rich statistics, ridiculous titles, head-to-head rivalry showdowns, and deterministic multi-level roasts.

🌐 **Live Web & Mini App:** [https://telegram-tracker-alpha.vercel.app/](https://telegram-tracker-alpha.vercel.app/)  
🤖 **Telegram Bot:** [@lurkening_bot](https://t.me/lurkening_bot)  
📂 **GitHub Repository:** [https://github.com/FuadTesfaye/telegram-tracker](https://github.com/FuadTesfaye/telegram-tracker)

---

## 🎮 Two Primary Modes

### 👤 Mode A: My Telegram (Self-Analytics & Footprint)
Connect your personal Telegram account via secure, encrypted MTProto authorization (`GramJS`) to unlock:
- **Presence Metrics**: Total observed active time, sessions count, longest continuous session, average session length.
- **Message Frequencies**: Total messages sent across observed chats and reply density.
- **Community Breakdown**: Percentage distribution across **Group Chats**, **Private Direct Chats**, and **Broadcast Channels**.
- **Chat Footprint**: Observed presence and message counts in legitimate communities.
- **Private Custom Labels**: Assign user-defined labels (e.g. `[Work]`, `[Favorite Human]`, `[Study Group]`) for personalized private context.
- **Activity Replay**: Hourly timeline displaying peak hours and activity intensity.

---

### 🏆 Mode B: Telegram League (3-Slot Weekly Tournament)
Track up to 3 competitors (e.g. `@fuadtesfaye`, `@alice`, `@bob`) in an automated weekly tournament:
- **Weekly Leaderboard**: Ranked by total verified presence hours with distance-to-crown metrics (*"Only 3h 15m away from stealing the crown 👀"*).
- **⚔️ The Rival**: Real-time head-to-head tracker comparing your observed activity against your chosen nemesis.
- **🎖 Weekly Mini-Awards (Superlatives)**:
  - 🏆 **Weekly Champion**: Most total observed presence
  - ⏱ **Session King**: Longest continuous session
  - 🔁 **Serial Checker**: Most sessions recorded
  - 🌙 **Night Owl**: Most activity past 22:00
  - ☀️ **Early Bird**: Most activity before 08:00
  - 🫥 **Ghost Award**: Lowest activity (*Touched Real Grass*)
- **🔮 Midweek Predictions**: Run-rate extrapolation forecasting the Sunday winner.
- **📢 Automated Telegram Broadcast**: Sunday winner announcement delivered directly to your Telegram chat.

---

## 👑 Ridiculous Dynamic Title Generator

Titles are calculated deterministically from actual verified presence metrics:

| Title | Requirement | Description |
| :--- | :--- | :--- |
| **🛰️ Telegram Infrastructure** | `45h+` | Basically part of Telegram's backend server architecture |
| **👑 Telegram Emperor** | `40h - 45h` | Absolute ruler of screen time |
| **🧠 Supreme Online Commander**| `35h - 40h` | Directing digital traffic day and night |
| **📱 Full-Time Telegram Employee**| `30h - 35h` | Full-time job hours without the salary |
| **🫡 Minister of Being Online** | `25h - 30h` | High-ranking government official of the blue app |
| **📡 24/7 Signal Tower** | `20h - 25h` | Constant beacon of connectivity |
| **🔌 Human Push Notification** | `15h - 20h` | More reliable than APNs |
| **🏃 Professional Scroller** | `10h - 15h` | High-mileage thumb endurance |
| **🪑 The Chair Resident** | Single session `> 4h` | The couch has permanently molded to your posture |
| **🚪 Door → Telegram → Door** | `80+` sessions | Checking Telegram like checking an empty fridge |
| **🌙 Lord of the Night Shift** | `8h+` past 22:00 | Active at 3:45 AM arguing about nothing |
| **☀️ The 5AM Telegram Prophet** | `5h+` before 08:00 | Deploying memes before the birds wake up |
| **📈 The Comeback Addict** | `+50%` weekly increase | Massive sudden surge in observed presence |
| **🧘 Enlightened One** | `-40%` weekly decrease | Discovered the physical universe |
| **😐 Aggressively Normal** | Moderate usage | Suspiciously healthy amount of screen time |
| **🫥 The Ghost Lurker** | `< 2h` usage | Confirmed living outside |

---

## 🔥 Deterministic Multi-Level Roast Engine

The roast engine operates across **4 selectable intensity levels**, computing funny, factually grounded roasts without making psychological hallucinations:

1. 🙂 **Friendly**: Soft, positive, encouraging community humor.
2. 🔥 **Normal**: Sharp, witty, observation-backed comedy.
3. 💀 **Brutal**: Direct, unhinged usage reality checks.
4. ☠️ **Nuclear**: Maximum comedic damage based strictly on verified numbers.

### Behavioral Archetypes:
- **`THE_OBSERVER`**: `>2h` in a chat with `<10` messages sent (*"Bro is not participating. Bro is conducting field research 🧪"*).
- **`SPEED_TYPER`**: `>80` messages in `<30` minutes (*"Entered the chat, deployed 80 messages, and vanished ⚡"*).
- **`MESSAGE_MACHINE`**: High-frequency message bursts.
- **`SERIAL_CHECKER`**: Frequent short visits (*"Checking Telegram like the fridge hoping new food appeared 🔄"*).
- **`CHAIR_RESIDENT`**: Marathon single continuous sessions.
- **`NIGHT_SHIFT`**: Active past midnight (*"Sleep schedule: Error 500 🌙"*).

---

## 🏛 System Architecture

```
                       TELEGRAM
                          │
             ┌────────────┴─────────────┐
             │                          │
       Bot API (@lurkening_bot)     User Session
             │                        (GramJS)
             ▼                          │
       Bot Interface                    ▼
      (Grammy Webhook)          Observed Footprint
             │                    & Presence
             └─────────────┬────────────┘
                           ▼
                      Event Pipeline
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
             Presence    Messages    Chats
                │          │          │
                └──────────┼──────────┘
                           ▼
                 Supabase PostgreSQL
                  (Drizzle Schema)
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
          Analytics     League      Roast Engine
              │            │             │
              └────────────┼─────────────┘
                           ▼
                    Next.js Mini App
              (Tailwind CSS & Lucide Icons)
```

---

## 🤖 Telegram Bot Commands

| Command | Action |
| :--- | :--- |
| `/start` | Open Telegram League main interactive dashboard |
| `/my` | View personal stats, message totals & observed chat footprint |
| `/league` | View Weekly Championship Leaderboard (🥇 🥈 🥉) |
| `/roast` | Generate a deterministic roast for the current leader |
| `/rival` | Real-time Head-to-Head rivalry comparison |
| `/footprint` | Observed community & chat activity breakdown |
| `/awards` | View weekly mini-awards (Session King, Night Owl, Ghost) |
| `/track` | Enroll a competitor into your 3-slot league |
| `/help` | Game rules, privacy policy & guidelines |

---

## 🛡️ Privacy Guarantee & Data Ethics

1. **Observable Signals Only**: Ranks and analytics are computed strictly from public Telegram presence timestamps and authorized chat events.
2. **No Message Content Storage**: Only message metadata (message counts, timestamps, chat types) is retained.
3. **No Unwarranted Inferences**: The roast engine describes observable actions rather than making unfounded assumptions about relationships or intentions.
4. **Encrypted Sessions**: User-authorized MTProto sessions are encrypted at rest with `AES-256-GCM`.

---

## 🛠️ Local Development & Testing

```bash
# 1. Clone repository
git clone https://github.com/FuadTesfaye/telegram-tracker.git
cd telegram-tracker

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local

# 4. Run database migrations
pnpm db:migrate

# 5. Run test suite
pnpm test

# 6. Start development server
pnpm dev
```
