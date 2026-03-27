# Feature framework

This document mirrors the **Feature framework** on the Student.Info landing page: each capability includes a short summary, implementation detail, and **contributors** (first names, aligned with [CREDITS.md](./CREDITS.md)).

---

## Legend

- **ID** — Stable identifier used in code/docs.
- **Contributors** — People who owned or co-owned the idea in the project brief (collaboration is explicit where multiple names appear).

---

## Platform, workflow & analytics

| ID | Capability | Summary | Contributors |
| --- | --- | --- | --- |
| `notify` | Auto-notification | When an admin changes status, the backend raises an event and the system sends email or in-app alerts. | Aseel, Nora |
| `track` | Track complaints | Each item has a status field: Pending → Reviewed → Processing → Resolved, surfaced in the UI. | Aseel, Nora |
| `workflow` | System workflow improvement | Rules in the backend (e.g. if priority is High → mark urgent → notify admin immediately). | Aseel |
| `security` | Security control | Each user has a role — admin or student — with controlled access to portals and actions. | Aseel, Nora |
| `heatmap` | Heat map | Complaints store a location; the backend counts per location and the frontend shows density (e.g. red = high volume). | Aseel, Nora |
| `comments-model` | Comments & discussion | Comments table (comment, user, complaint, text, time) enabling discussion on complaints. | Aseel, Nora, Abilio, Zanela |
| `analytics` | Dashboard analytics | Queries such as COUNT by status and category; results feed charts for admins. | Aseel, Nora |

---

## AI, map & student experience

| ID | Capability | Summary | Contributors |
| --- | --- | --- | --- |
| `translator` | AI translator | Students write in their language; recipients see content in theirs (e.g. French in → English out). | Erik |
| `ois` | Front-desk quick window | A compact kiosk or counter tablet so students can submit issues quickly during office hours. | Erik |
| `status-color` | Status color coding | Visual language for processing state — e.g. green solved, yellow in progress. | Erik |
| `rating` | Evaluation & ratings | Five-star service and problem-solving ratings to measure speed and quality. | Erik |
| `ai-map` | AI assistant & campus map | AI for minor problems and wayfinding; interactive campus map with typical zones (classrooms, halls, offices). | Erik |
| `peer-honesty` | Peer help & honesty | Other students can help — with checks so false solutions are discouraged. | Erik |

---

## Engagement, media & gamification

| ID | Capability | Summary | Contributors |
| --- | --- | --- | --- |
| `reply-translate` | Replies & translation under comments | Reply to another student’s comment; optional translation alongside the thread. | Abilio, Nora, Zanela |
| `video-faq` | Video & FAQ surfacing | Pop-out video suggestions for common issues; quick access to frequently asked questions. | Abilio, Nora, Zanela |
| `ai-chat` | AI chat mode | Dedicated mode to chat with AI to work through problems. | Abilio, Nora, Zanela |
| `kudos` | Kudos, tokens & developer support | Page to gift or support developers (Kudos / support tokens, donations) to improve the system. | Abilio, Nora, Zanela |
| `ringtone` | Resolved ringtone | Distinct in-app sound when a problem is marked solved. | Abilio |
| `uni-xp` | UNI XP & activity points | Points for engaging with the app — motivates interaction and quality participation. | Abilio, Zanela |
| `categories-bus` | Categories, appreciation & bus tracker | Categories inside complaints, appreciation boxes, and bus tracker experience. | Nora, Zanela |

---

## Technical leadership

| ID | Capability | Summary | Contributors |
| --- | --- | --- | --- |
| `tech-lead` | Technical leadership | Architecture, backend components, integration patterns, and delivery alignment across features. | Damilola |

---

## Implemented product surface (high level)

The SPA includes, among other routes: **landing** (marketing + framework/credits), **auth** (demo sign-in), **student dashboard**, **thoughts feed** with optional media and lightbox, **submit thought**, **complaint detail**, **leaderboard**, **campus map** / **admin heat map**, **AI assistant** workspace, **notifications**, **developer support** (tokens), and **admin** analytics, complaints queue, users, workflow rules. See the app router and `src/app/pages/` for the authoritative list.
