# Viral App Thinking — Five Hard Questions Before You Build

*Working notes from October 2026 hackathon planning session.*
*Uses examples from the Chronicle / Playmate / Decode / Orbit / Confession / Proof idea set.*

---

## Question 1 — Most agentic AI apps today are productivity tools, not for the general public. True?

**Verdict: Totally right.**

### What the data shows

Every major AI marketplace launched in 2026 tells the same story:

| Platform | What's actually in the marketplace |
|---|---|
| OpenAI ChatGPT plugins (1.2B weekly users) | Notion, Slack, Gmail, Asana, Canva, Snowflake, Figma, Tableau |
| xAI Grok marketplace | MongoDB, Vercel, Sentry, Chrome DevTools, Cloudflare |
| Meta Muse platform | CRM connectors, seller tools, enterprise integrations |

These are tools for knowledge workers. The closest thing to a "consumer" app in OpenAI's marketplace is Spotify (plays music) and a meme generator. That's it.

### Why this happened

The developers who build on top of AI platforms are, overwhelmingly, software engineers and product teams. They build what they personally need. They understand B2B procurement cycles. Enterprise contracts are larger and more predictable than consumer downloads.

The result: a massive structural gap. 1.2 billion people open ChatGPT every week. Almost none of them find anything that speaks to their actual daily life — their family, their relationships, their memories, their money, their fears.

### What the general public actually responds to

For comparison, look at what went viral with the general public in the AI wave:

- **Lensa AI** — turned your photos into fantasy portraits. Hit 4M downloads in 5 days. General public.
- **FaceApp** — aged your face. Completely non-technical audience. Went viral because your grandmother could do it.
- **Character.ai** — talk to fictional personas. 200M users, mostly teenagers.
- **Spotify Wrapped** — your year in music. Zero AI in the original version, but the format is what AI output should aspire to: a beautiful, personal, shareable card.
- **ChatGPT itself** — the "I asked AI to write my resignation letter" moment. Not a productivity tool. A personal liberation moment.

None of these are in an enterprise marketplace. All of them were built for a person, not a company.

### The opportunity

The consumer category on every AI platform is essentially empty. Chronicle, Playmate, and Decode (described below) would be among the first genuine consumer apps on any of these platforms. First-mover advantage in a distribution network with over a billion users.

---

## Question 2 — Most agentic apps live inside always-on systems or their own sites/apps. True?

**Verdict: Partially right. Three buckets exist, and the emerging third one is the most important.**

### The three buckets

**Bucket 1: Enterprise embedded (always-on, invisible)**

These agents run inside existing enterprise software. The user never thinks of them as "apps" — they just work.

Examples:
- Salesforce Einstein agents — auto-drafts follow-ups, classifies leads, updates CRM records. Always running. The salesperson doesn't open a separate app.
- ServiceNow agentic workflows — auto-routes IT tickets, resolves known issues without human touch.
- Intercom Fin — answers customer support tickets autonomously. Lives inside Intercom's existing product.

Characteristics: high revenue per customer, low consumer visibility, not viral in any meaningful sense. Companies pay $50K–$500K/year. Nobody tweets about them.

**Bucket 2: Standalone sites and apps (own distribution, zero starting users)**

This is most of the AI startup wave. You go to them. They have their own URL, their own app download, their own user acquisition problem.

Examples:
- Perplexity (perplexity.ai) — built search from scratch.
- Cursor — built a whole code editor.
- character.ai — built a social platform.
- Midjourney — lived in Discord, which is a clever distribution hack.

From our idea set:
- Chronicle as a standalone app would fit here. Beautiful website, you download the iOS app, you share links. Zero users on day one. You must acquire every user yourself.

Characteristics: you own everything — product, data, relationship — but you also own the entire cold-start problem. Most standalone AI consumer apps fail not because the product is bad but because they run out of money before they find distribution.

**Bucket 3: Platform plugins (newest, fastest-growing, largely empty for consumers)**

Apps that live inside an existing platform and borrow its users, trust, and billing infrastructure.

Examples:
- Canva plugin inside ChatGPT — 200M Canva users + 1.2B ChatGPT users, now connected.
- Runway plugin — video generation inside ChatGPT conversation.
- ElevenLabs plugin — voice output from any ChatGPT conversation.

From our idea set:
- Chronicle as a ChatGPT plugin: user types "help me record a story from my grandmother." ChatGPT surfaces Chronicle. No download, no account, no trust barrier. The grandmother's grandchild is already in ChatGPT.
- Playmate as a plugin: parent is already using ChatGPT for something. Chronicle-style plugin surfaces in conversation. One click.
- Decode as a plugin: user uploads a video of their dog. Decode plugin activates. Result shared immediately.

The critical insight: **Bucket 3 solves the cold-start problem.** Distribution is already there. Trust is already established. Billing infrastructure is already there (OpenAI handles payment). The developer just needs to build the experience.

### Where the market is going

The trend is clearly toward Bucket 3. OpenAI explicitly stated at DevDay 2026 that their goal is to become "the App Store for AI." That means Bucket 3 grows as fast as ChatGPT grows. Bucket 1 stays enterprise. Bucket 2 faces increasing pressure because why build your own acquisition funnel when a platform with 1.2B users wants to host you.

---

## Question 3 — Community will adopt any app, or only specific types?

**Verdict: Totally right that it's specific types. Not any app. Very specific types.**

### What community adoption actually requires

Useful is not enough. There are thousands of useful apps that nobody talks about. Community forms around something else entirely.

The five traits that create community adoption:

---

**Trait 1: Low floor — zero friction to try**

If someone has to create an account, verify their email, download an app, grant permissions, and then figure out how to use it — most people leave before they experience the product at all.

The apps that build community have a floor so low that trying them is effortless.

- FaceApp: open, take photo, see result. Done. Viral before you closed it.
- Spotify Wrapped: log in with your existing Spotify account, it's already made. No setup.
- ChatGPT: type one sentence. Get something remarkable. Nothing to configure.

From our ideas:
- Chronicle needs low floor. "Record your grandmother's story" must be immediate — open app, press record, done. No profile setup, no onboarding flow, no permission request screens before the first moment of magic.
- Decode needs low floor even more. Upload a 10-second video of your dog. Get the result. That's it. If there's a signup wall before the first result, it dies.
- Confession has naturally low floor — connect your bank once via Plaid, and the first reveal comes to you. No weekly input required.

---

**Trait 2: Identity signal — using it says something about who you are**

The most viral apps function as identity badges. Using them publicly signals membership in a tribe.

- Early Notion users: "I'm the kind of person who thinks in systems."
- Early iPhone users: "I'm ahead of the curve."
- Spotify Wrapped sharers: "I'm the kind of person who listens to obscure music / has eclectic taste / is a devoted fan."
- Character.ai users: "I'm someone who explores ideas in unconventional ways."

From our ideas:
- Chronicle has identity signal: "I'm the kind of grandchild who cares enough to capture this before it's gone." Sharing a Chronicle story says something admirable about the person sharing it.
- Orbit has identity signal: "I'm honest and self-aware enough to look at my real friendships, not just my perceived ones." But this one is more complicated — the uncomfortable truth might suppress sharing if the result is unflattering.
- Proof has strong identity signal for workers who feel undervalued: "I'm someone who knows my actual worth and I'm not going to pretend otherwise."

---

**Trait 3: Social proof loop — the more people use it, the more others see it**

The best community apps have a built-in mechanism where every use creates visibility for potential new users.

- Spotify Wrapped: sharing your result is the product. The card is designed to be screenshot.
- Lensa: profile pictures changed. Everyone saw the change. Everyone asked "what is that?"
- BeReal: the notification sound became a cultural signal. Everyone knew what it meant.

From our ideas:
- Playmate is strong here. The illustrated storybook is beautiful, designed to be shared in family WhatsApp groups and Instagram. Every share is an ad.
- Decode is very strong. Pet content is the internet's native language. A video of your dog's "inner monologue" narrated by AI is exactly the kind of content people repost without being asked.
- Orbit is weak here. The result of "your real social network" is often something you'd rather not share publicly if it's uncomfortable.

---

**Trait 4: Contribution ceiling — there's something the community can add**

The apps that build lasting communities — not just viral moments — have a ceiling that the community can push toward. Something unfinished they can contribute to.

This is the intentional gap you identified (Question 4 goes deeper on this). The key point here: the ceiling must be visible and reachable. If it's too vague ("contribute to the project!") nobody knows where to start. If it's too specific and already done, there's no reason to contribute.

- Wikipedia: any article can be improved. The gap is always visible. The contribution is clear.
- Figma community templates: designers share their templates. The contribution is a natural byproduct of their own work.
- Open-source repos: the issue tracker shows exactly what's missing. Contribution path is explicit.

From our ideas:
- Chronicle's contribution ceiling: a library of story prompts that work for different cultures, different family structures, different relationships. Anyone can add a prompt. The community knows what "a good prompt" looks like because they've experienced the product.
- Decode's contribution ceiling: a library of behavioral interpretations for specific breeds. A Golden Retriever community can contribute what "spinning before feeding" means in their dogs. Very specific, very reachable.
- Playmate's contribution ceiling: illustrated storybook styles and templates. Artists can contribute illustration packs.

---

**Trait 5: Shared belief or shared enemy**

The most powerful community apps are organized around a belief that unites the community against something.

- Arc Browser: "tabs are broken and everyone pretends they're fine." Arc users feel like they discovered the truth.
- Obsidian: "your notes belong to you, not to a company." The community believes in local-first data ownership.
- Signal: "your conversations are private and that matters." The community shares a belief about surveillance.

From our ideas:
- Chronicle's shared belief: "these stories are disappearing and nobody is doing enough about it." The community unites around the urgency of preservation.
- Proof's shared belief: "workers are systematically invisible in their organizations and that's unjust." Very strong tribal energy, especially in the post-layoff era.
- Confession's shared belief: "your spending is the most honest version of you, more honest than anything you'd say out loud." A community can form around the discomfort of that truth.

---

## Question 4 — For community to adopt, must it feel like something was forgotten, and the community can add it? What creates community buzz?

**Verdict: Partially right. The insight is real. The intentional gap is one mechanism, not the only one.**

### The intentional gap — what you described

You're identifying a specific pattern in open-source and community-built products: the creator ships something that is demonstrably excellent but visibly incomplete. The incompleteness is not an accident. It is a designed invitation.

The gap communicates:
1. This thing is worth adding to.
2. We (the creators) trust you (the community) to fill it.
3. Your contribution will matter — it won't be swallowed by something already finished.

Classic examples:
- **Linux kernel**: Torvalds shipped a functional OS kernel with clear gaps. Every contributor could see where they were needed. The "forgotten thing" was device drivers, filesystem support, architecture ports.
- **WordPress**: Shipped as a blog engine. Plugin system designed from day one as an explicit gap. The "forgotten thing" was every vertical use case — e-commerce, events, portfolios. Community filled them. 60,000 plugins.
- **Stable Diffusion**: Released as a base model. The "forgotten thing" was fine-tuned models for specific aesthetics, characters, styles. Community trained thousands of LoRAs and custom models.

From our ideas:
- **Chronicle** with intentional gap: ships with 50 story prompts for a generic English-speaking family. The gap: prompts for Indian families, Nigerian families, Japanese families, working-class families, estranged families. The community fills cultural gaps that the original team couldn't.
- **Decode** with intentional gap: ships with behavioral interpretations for Labrador Retrievers (the most common dog). The gap: every other breed. Breed communities are extremely tight-knit and motivated. French Bulldog community will rush to contribute French Bulldog behavioral patterns.
- **Playmate** with intentional gap: ships with one illustration style (watercolor storybook). The gap: digital art, Japanese anime style, graphic novel, LEGO style. Artists contribute styles. Parents choose styles. Artists get attribution.

### What else creates community buzz — the four other mechanisms

**1. Shared discovery moment**

Everyone in the community finds out something at the same time. The simultaneous experience creates bonding.

- Wordle: everyone gets the same word every day. Sharing your result is sharing the same experience.
- Spotify Wrapped drops on the same day for everyone. The whole internet processes it together.
- Eclipse apps: millions of people pointed cameras at the sky simultaneously. Not an intentional gap — a shared moment.

For our ideas: Confession has this potential if it sends its "uncomfortable truth" reveal on the same day every week to all users simultaneously. If everyone gets their Monday morning confession card at 9am, the experience of dreading and opening it becomes communal.

**2. Remix culture**

The community takes the base and makes it their own version. The original is a starting point, not the destination.

- TikTok sounds and trends: one person makes a video format. Millions recreate it in their own version.
- Midjourney prompts: the community shares prompt formulas. Everyone remixes each other's prompts.
- Notion templates: one person builds a system. Others fork it, adapt it, reshare it.

For our ideas: Playmate's illustrated storybooks are inherently remixable. "Here is the story I made with my 4-year-old about the planet called Borbor" creates a format others immediately want to try. "My kid's planet is called Florbus and here is the book." The remix is the spread.

**3. Earned status within the community**

Early adopters, top contributors, and prolific creators get status signals that the community recognizes.

- GitHub stars: contributors get star counts. Stars are social currency.
- Reddit karma: early high-quality posts surface more. Karma is a reputation system.
- Duolingo streaks: the streak is a status signal within the Duolingo community.

For our ideas: Chronicle's "archivist level" — users who have captured more than 10 family stories get a badge visible on their shared stories. Grandchildren compete gently to capture more of the family's history. Status is earned through contribution to the family, not through in-app purchases.

**4. Fear of missing out on the window**

Some community buzz comes not from contribution or identity but from urgency — if you don't join now, you miss something that won't come back.

- Product Hunt launches: the launch day creates a spike. Being there on launch day matters.
- Discord community drops: limited seats. If you miss the window, you're out.
- Pokémon GO regional events: specific creatures only available in specific places and times.

For our ideas: Chronicle's core emotional mechanic is exactly this. The buzz is: "your grandmother is alive right now. The window is open. It will close. I recorded mine — have you recorded yours?" That urgency is shareable and it compounds. Every person who shares their Chronicle story creates FOMO in every person whose grandparent is still alive and unrecorded.

---

## Question 5 — What questions to ask before choosing which app to build?

These questions emerged from everything analyzed across all five questions above, plus new filters that surfaced during the actual process of evaluating ideas. They work as a selection filter — if an idea fails too many of them, it should be dropped or redesigned, not pushed forward.

Use them in order. The early questions are hard eliminating questions. The later ones are design questions.

---

### Group 0 — Before you evaluate a single idea

**Q0. Are you building for the general public or for developers/operators?**

This is the question to ask before anything else — before you evaluate virality, before you check for competitors, before you assess the build. An app that goes viral among developers does not go viral with the general public. They are different populations with different sharing habits, different emotional triggers, and different trust thresholds.

The general public is: your grandmother, a parent at school pickup, a teenager, a factory worker, a retiree. They share things via WhatsApp, Instagram, Facebook, TikTok. They do not share things via GitHub, Hacker News, or a dev newsletter.

Test: would you describe this app to your grandmother and have her immediately understand why it matters to her? If the first thing you say involves the words "AI," "model," "workflow," "agents," or "pipeline" — you are building for developers.

From our history: the entire first round of ideas was rejected on this question alone. Every idea — an AI code review tool, an agent testing harness, a prompt management system — was technically interesting and genuinely useful, but only to developers. None of it would ever reach a general public audience. The round was discarded before any individual idea was evaluated further.

---

### Group 1 — Elimination traps (structural problems that kill ideas before they start)

These are four patterns that kill hackathon apps specifically. An idea that falls into any one of these traps cannot be rescued by better execution — the trap is in the concept itself.

**Trap 1: The Static Chatbox Trap**

The app is a text input box that sends a prompt to a model and displays the result. That's it. The "product" is just a system prompt with a nice interface around it.

Signs: the entire experience is question → answer. There are no persistent outputs. Nothing is created that didn't exist in the conversation. There is no state that accumulates over time.

Why it fails virally: there is nothing to share. A conversation transcript is not a shareable artifact. ChatGPT already does this for free. You are competing with the platform your app lives on.

From our ideas: "AI therapist," "AI life coach," "AI financial advisor" — all of these, unless specifically redesigned, fall into this trap. The output is advice text. Advice text does not spread.

**Trap 2: The 2019 Gimmick Trap**

The app uses AI to do something that was technically impressive in 2019 but that every major platform can now do for free in a single prompt.

Signs: "AI-generated images," "AI-written text," "AI that summarizes documents," "AI that translates language," "AI that writes emails."

Why it fails virally: the behavior is not novel. Users have already done this in ChatGPT, in Google, in their phone keyboard. There is no discovery moment. There is no "I have never seen this before."

From our ideas: any app whose core mechanic is "upload a photo and AI describes it" or "paste text and AI rewrites it" falls here. The mechanic must be novel at the experience level, not just at the technology level.

**Trap 3: The Manual-Trigger Trap**

The app only does something when the user explicitly remembers to open it and ask it to do something. It has no autonomous loop. Nothing happens without direct human initiation each time.

Signs: the app has no notifications, no background processing, no accumulation of anything over time. Every session starts from zero. The user must remember to come back.

Why it fails virally: apps that require constant deliberate effort from the user lose the competition with inertia. The user forgets. Life happens. The app goes unused. There is no moment of surprise — the kind that makes people share. You can only be surprised by something you didn't initiate.

From our ideas: a recipe suggestion app where you have to manually enter what's in your fridge every time falls here. Chronicle avoids this trap because the output is so valuable that the user comes back deliberately — but the best version of Chronicle has ambient recording that runs without the user thinking about it.

**Trap 4: The Complex Infrastructure Trap**

The app requires infrastructure that a solo developer cannot realistically build and deploy in 2–3 days. It depends on integrations that require business agreements, regulatory approval, or significant backend architecture before the first user can try it.

Signs: "it connects to your bank account," "it integrates with your EHR," "it requires a Bluetooth device," "it needs access to your employer's HR system."

Why it fails for a hackathon: you spend 90% of your time on plumbing and never reach the moment of magic. The demo is always "and here's what it would do if the integration worked."

From our ideas: HealthGuard (medical records integration) and Proof (workplace email/calendar metadata) both hit this trap in their original form. The fix is to redesign around a discrete, self-contained input — something the user can hand you in one step without requiring an integration agreement.

---

### Group A — Eliminating questions (fail one = reconsider entirely)

**Q1. Does a real person feel this in their actual daily life — without being prompted to?**

Not "would a person appreciate this if they tried it." Does a real human, unprompted, have the feeling that creates the need for this app?

- Chronicle: a grandchild thinks "I should really record grandma's stories" without being told. The feeling is real and unprompted. ✓
- Playmate: a parent thinks "my kid said the funniest thing and I didn't record it, and I'll forget." Unprompted. ✓
- Orbit: does a person spontaneously wonder "who actually shows up for me?" Sometimes. But it requires more introspection than most people initiate spontaneously. Weaker. ~
- Proof: does a worker spontaneously feel "I've done more than anyone knows and it's disappearing." Yes — especially in review season, after a layoff announcement, after being passed over. But it's seasonal, not constant. ~

**Q2. Does a dominant player already own this exact space?**

Not "is there anything in this area" but "does a specific product own the specific emotional job this app does?"

- Chronicle: StoryWorth exists, but requires the elder to write. Shutterfly makes photo books. Neither captures voice + extracts narrative from a third-party conversation. The exact job is unclaimed. ✓
- Playmate: Shutterfly, Chatbooks — photo books. Nobody turns a child's imagination into an illustrated narrative storybook. Gap confirmed. ✓
- Orbit: LinkedIn owns professional networks. Snapchat owns engagement streaks. Nobody owns emotional support network mapping. Gap exists. ✓
- Decode: Petcube is a security camera. Nobody owns pet behavioral narrative. Gap confirmed. ✓
- Confession: Copilot, Monarch, YNAB own budgeting. Nobody owns "uncomfortable truth reveal from spending." Gap exists. ✓
- Proof: LinkedIn owns curated career narrative. Nobody owns passive documentation of actual workplace impact. Gap exists. ✓

**Q3. What specific emotion does it trigger — and is that emotion strong enough to make someone share it without being asked?**

Mapping emotion to sharing behavior:

| Emotion | Sharing behavior | Example |
|---|---|---|
| Pride | Immediate broadcast | "My grandmother's story is now preserved forever" |
| Urgency/guilt | Peer pressure share | "I recorded mine — have you recorded yours?" |
| Laughter | Reflex repost | Dog's inner monologue is funny |
| Uncomfortable truth | "Tag yourself" share | "My Confession card said this and it's painfully accurate" |
| Vindication | "Here's my proof" share | "The app confirmed I've been undervalued" |
| Wonder | "You have to try this" share | "My 4-year-old's storybook made me cry" |

If the app's emotion is "I found this useful" — it doesn't share. Utility does not spread. Emotion spreads.

**Q4. Does the app require passive background surveillance of private data?**

This is a trust barrier that kills adoption before virality is possible.

- Requires ongoing access to messages (Orbit): the majority of people will not grant this. Fatal for consumer viral.
- Requires permanent bank connection (Confession via Plaid): significant barrier. Maybe 30–40% of potential users will stop here.
- Requires always-on camera (Decode via pet cam): medium barrier. Pet owners are more accepting of cameras in their homes than data on their phones.
- Requires one-time active recording (Chronicle, Playmate): no background access. User controls exactly when it runs. Zero trust problem.

**Reframe**: apps that work from a single deliberate act ("I pressed record") bypass the surveillance problem entirely. Apps that require ongoing passive access must either earn deep trust before asking, or redesign around discrete inputs.

**Q5. Is the app extractive — does it work around the user rather than requiring them to do the work?**

This is a different question from the surveillance question. Surveillance is about trust. Extraction is about effort and where the labor falls.

An extractive app delivers value to person A by using the natural behavior of person B. Neither person has to do anything unusual. The magic is captured from life as it's already being lived.

A non-extractive app requires the target user to do deliberate work — to fill in forms, to write essays, to remember to log things, to make time for it.

The difference in practice:

- **StoryWorth** — sends the elderly person a weekly email asking them to write a story from their life. Requires the elder to write. Many elders find this difficult, embarrassing, or simply do not do it. 60–70% churn before a complete book is produced.
- **Chronicle** — the grandchild has a conversation with the grandmother. The grandmother just talks, as she always talks. The grandchild asks questions. Chronicle records, transcribes, and turns the conversation into a story. The grandmother did nothing unusual. The grandchild did the work. The grandmother gets the output.

The extractive design solves a problem that non-extractive design cannot: it works on people who would never use the app themselves.

More examples:
- **Playmate** is extractive toward the child. The child just plays and talks, as children always do. The parent does the recording. The child doesn't need to know the app exists.
- **Decode** is extractive toward the dog. The dog behaves as dogs always behave. The owner does the recording.
- **Orbit** in its original form is NOT extractive — it requires the user to grant access to their private messages. The user must do active work and accept risk. This is a key reason it scores lower.

Test: does the person who receives the most value from this app need to install it, sign up for it, or remember to use it? If yes — non-extractive. If no — extractive. Extractive wins in consumer markets because it bypasses the friction of persuading the beneficiary.

---

### Group B — Design questions (these shape how you build it)

**Q5. Is the output something people physically want to possess and share?**

Outputs that spread:
- A beautiful card (Spotify Wrapped format)
- A story with a title (Chronicle)
- An illustrated book (Playmate)
- A video with narration (Decode)
- A single stark data card (Confession)

Outputs that don't spread:
- A dashboard
- A report
- A score
- A list of recommendations

The test: would someone screenshot this and send it to a family member with no explanation needed? If the output needs explaining, it won't spread.

**Q6. Can this be built by one person in 2–3 days?**

Forces radical simplification. The features that get cut are almost always the right ones to cut. The core emotional moment must work without those features.

What Chronicle needs in a hackathon build:
- Voice recording interface (one button)
- Transcription (Whisper API)
- Story generation from transcript (Claude or GPT-4o)
- PDF / shareable link output

What Chronicle does NOT need for the hackathon:
- User accounts
- Cloud storage
- Family collaboration features
- Multilingual support
- Mobile app

The hackathon version tests the core mechanic. Does the output make someone cry? If yes, build the rest later.

**Q7a. Where does the app LIVE — and which surface best matches your target audience?**

This question is not just "standalone vs. plugin." There is a full landscape of surfaces, each with a different existing user base, a different trust level, a different build cost, and a different relationship to always-on behavior. Choosing the wrong surface means building for an audience that isn't there.

The full surface landscape for consumer apps:

| Surface | Existing users | Always-on? | Trust level | Build complexity | Best fit for |
|---|---|---|---|---|---|
| Standalone web app | Zero on day one | No — user must visit | Must earn from scratch | Medium — need hosting, auth | Ideas with strong direct acquisition story |
| Mobile app (iOS/Android) | Zero on day one | Yes — push notifications | Must earn from scratch | High — App Store approval, native build | Ideas needing camera, mic, or OS-level access |
| ChatGPT plugin | 1.2B weekly users | Surfaces in conversation | Inherits OpenAI trust | Low — API-focused | Ideas where user is already in ChatGPT |
| WhatsApp bot | 2B+ users, dominant in family groups, global | Yes — messages arrive in existing chat | High — WhatsApp is trusted as a family tool | Low — Twilio or WhatsApp Business API | Ideas designed for family group sharing or intimate 1:1 |
| Telegram bot | 900M users, strong in tech/creator communities | Yes — lives in existing chat | Medium-high | Very low — Telegram bot API is simple | Ideas targeting creator or developer-adjacent audiences |
| Instagram / TikTok effect or filter | Platform-native reach | Yes — surfaces when user opens camera | High — embedded in platform they already use | Medium — Meta Spark or TikTok Effect House | Ideas where the output IS the content, e.g. pet narration, face transformation |
| iMessage extension | iPhone users only | Yes — surfaces in Messages | High — Apple ecosystem trust | Medium — Xcode required | Ideas meant for private 1:1 or small group sharing |
| Browser extension | Moderate — requires installation | Yes — runs on every page | Medium — users are cautious about extensions | Low-medium | Ideas that activate on existing web content |
| Email-based (no app at all) | Zero — but zero friction to try | Yes — lands in inbox | High — email is trusted and familiar | Very low — just sending email | Ideas where the cadence is weekly and the output is a card or letter |
| Voice assistant (Siri, Alexa, Google) | Large but declining engagement | Yes — always listening | Medium — depends on device trust | Medium — requires skill/action build | Ideas triggered by voice command in natural context |

**Why the surface choice changes the product:**

**Chronicle** — the natural surface is NOT a standalone app and NOT ChatGPT. It is a **WhatsApp bot**. Here is why: family conversations already happen in WhatsApp. The grandmother is already in the family WhatsApp group. The grandchild doesn't need to download anything new. The bot joins the group and when the grandchild says "tell me about when you were young, grandma," the bot records, transcribes, and produces the story inside the same conversation. The sharing moment is already in the right place. No one leaves WhatsApp to use Chronicle. Chronicle lives where the family already is.

**Decode** — the natural surface is a **TikTok effect or Instagram filter**, not a standalone app. The pet owner opens TikTok's camera, points it at their dog, and the Decode effect is live: AI reads the dog's body language in real time and narrates the inner monologue as an audio overlay. The user records their TikTok video with the effect already applied. The output is the video. It is already on TikTok. No export, no share button, no second step.

**Playmate** — works well as a **mobile app** (needs camera + microphone + illustration generation, benefits from push notification: "your book is ready") but could also work as a **WhatsApp bot** for parents who already share child photos in family groups.

**Confession** — works best as a **weekly email** with no app at all. User signs up once, connects Plaid once, receives a card every Monday morning. The card is designed to be forwarded. The surface is the inbox. There is no app to forget to open.

**The design principle:** the surface choice should feel inevitable for the target audience — as if the app could not have lived anywhere else. If you have to persuade your user to go to a new place to use the product, you are fighting friction that the right surface choice would have eliminated entirely.

**Q7b. Where does the OUTPUT get shared — and is the output format native to that platform?**

This is a completely different question from Q7a. Where the app lives and where the output spreads are often different places entirely. The app runs somewhere. The viral moment happens somewhere else.

The output format must be native to the platform where the target audience shares things. A beautiful PDF does not go viral on TikTok. A vertical video does not spread well in a WhatsApp family group. A text post does not work on Instagram.

Map each app to its natural sharing platform:

| App | Target audience | Where they share | Native format needed |
|---|---|---|---|
| Chronicle | Grandchildren of elderly | WhatsApp family groups, Facebook | Link preview + shareable PDF or image card |
| Playmate | Parents of children 3–7 | Instagram, WhatsApp, Facebook parenting groups | Beautiful image of a book page, short video of child's voice |
| Decode | Pet owners | TikTok, Instagram Reels, Reddit breed subreddits | Short vertical video with narration audio |
| Orbit | Adults examining friendships | Private — DM, or Twitter/Reddit if brave | Single stark image card, designed for screenshot |
| Confession | Adults examining spending | Twitter/X, Reddit (r/personalfinance), TikTok | Single card, designed to be screenshot and captioned |
| Proof | Employed workers | LinkedIn, Twitter/X, Reddit (r/antiwork) | Professional-tone image card, "here's what the data said" format |

**Why this matters in practice:**

Decode is strongest on TikTok. Pet video content with an AI voiceover narrating what the dog is thinking is exactly the format that dominates that platform. If Decode outputs a PDF or a dashboard — it dies. If it outputs a 30-second vertical video with the dog's "inner monologue" spoken aloud over footage — it has a structural advantage on the highest-reach consumer platform in the world.

Chronicle is strongest on WhatsApp and Facebook. The output — a story document with the elder's photo, their name, and the title of the story — is designed to be forwarded in a family group chat. The sharing moment is: "I recorded grandma's story. Here it is." That format travels via link or as a saved PDF. It does not need to be a video. It does not need to be on TikTok.

Playmate works across platforms because the output is an illustrated book page — static image for Instagram, short video for TikTok (flip through the pages), link for WhatsApp. The visual format translates across surfaces.

**The design test:** before you finalize the output format, ask: "will someone be able to share this in under 10 seconds on the specific platform where this audience lives?" If it takes more than 10 seconds to extract something shareable, the output format needs to be redesigned.

**Platform-output mismatch kills virality even when everything else is right.** An app that makes people feel something but produces output in the wrong format for their platform will be used once and never shared. The emotion is real. The spread never happens.

**Q8. Is there an intentional gap — something the community can fill?**

Name the gap specifically before you start building. Vague gaps ("the community can improve it") don't motivate contribution. Specific gaps do.

- Chronicle's specific gap: story prompt library by culture and family type
- Decode's specific gap: behavioral interpretation library by dog breed
- Playmate's specific gap: illustration style library contributed by artists
- Confession's specific gap: interpretation copy ("your spending means X") by cultural context

The gap must be:
1. Visible — community can see exactly what's missing
2. Reachable — a single person can contribute a meaningful piece
3. Valued — contributions get visible credit and community recognition

**Q9. Does the shared belief behind this app unite a community that already exists?**

You are not creating community from nothing. You are finding a community that already holds a belief and giving them a tool that embodies that belief.

- Chronicle speaks to a community that already believes: "family stories are disappearing and we're not doing enough." This community exists. It gathers on genealogy forums, in Facebook groups for grandchildren of immigrants, in subreddits about preserving family history.
- Proof speaks to a community that already believes: "workers are systematically invisible and undervalued." This community exists loudly on LinkedIn, on r/antiwork, on career coaching communities.
- Playmate speaks to a community that already believes: "childhood is over too fast and we're not capturing the right things." This community exists in parenting subreddits, in Montessori parent groups, in "slow parenting" communities.

If the community that holds your app's belief does not yet exist, you are building both the product and the culture simultaneously. That is much harder. Start with a community that already believes.

---

### Group C — Portfolio questions (asked across the full set of ideas, not per idea)

These questions only make sense when you are evaluating multiple ideas at once — choosing which to build from a shortlist, or deciding which to submit to a hackathon.

**QC1. Are any of these ideas the same mechanic with different skin?**

This is the hardest question to answer honestly, because ideas that are superficially different in domain often share the exact same underlying mechanic. When that happens, only one of them should be built. Submitting two ideas with the same mechanic to a hackathon — or building two such apps in the same portfolio — is building the same product twice.

How to identify same-mechanic ideas: strip away the domain (family, finance, career, pets) and describe only what the app does structurally.

The "personal data reveal" mechanic:
> *The app collects data about you or your life, processes it, and reveals an insight about you that you didn't know or wouldn't say out loud. The reveal is designed to be shareable.*

Three ideas that all use this mechanic:
- **Wrapped for Your Life** — collects your year of activity, reveals your year as a visual story
- **Relationship Film** — collects your messages and call history, reveals your relationship as a film
- **The Real You** — collects your behavioral data, reveals your real personality vs. your perceived one

These look different. They're in different domains. They have different output formats. But they are structurally identical. The user correctly identified this problem: "Wrapped for your life, relationship, and the real you are in the same area?"

If you build all three, you have not built three products. You have built one product three times.

**The test:** describe each idea as a single sentence using this template:
> *"The app collects [INPUT], processes it, and produces [OUTPUT] that makes the user feel [EMOTION]."*

If two ideas produce the same sentence with only the domain swapped — they are the same mechanic.

- Chronicle: "The app records a family conversation, processes it into a narrative, and produces a story that makes the user feel they preserved something precious."
- Playmate: "The app records a child playing, processes it into an illustrated book, and produces a storybook that makes the user feel they captured childhood before it disappears."

These have structural similarities (record → process → preserve artifact) but they differ in the emotion (preservation of elder knowledge vs. preservation of childhood imagination), in who does the work (grandchild vs. parent), and in the output format (written story vs. illustrated book). Different enough to both exist.

- Wrapped / Relationship Film / Real You: same structure, same emotion (self-discovery reveal), same output format (shareable card/video). Not different enough. Pick one.

**QC2. Does each idea occupy a genuinely different domain — or are multiple ideas competing for the same audience?**

Even if the mechanics are different, two ideas that target the same person at the same emotional moment are competing for the same adoption slot. A person will use one, not both.

From our set:
- Chronicle targets: grandchildren of elderly family members
- Playmate targets: parents of young children (ages 3–7)
- Decode targets: pet owners
- Orbit targets: adults questioning their real friendships
- Confession targets: adults unsatisfied with their spending habits
- Proof targets: employed workers who feel undervalued

These are genuinely different audiences. A grandmother's grandchild and a dog owner are not the same person choosing between two options. Good portfolio — six different doors.

If two ideas targeted "parents of young children" — that would be a portfolio problem regardless of how different the mechanics seemed.

---

## Summary matrix — the six ideas against all questions

| | Chronicle | Playmate | Decode | Orbit | Confession | Proof |
|---|---|---|---|---|---|---|
| **For general public (not devs)** | ✓ | ✓ | ✓ | ✓ | ✓ | ~ Working adults |
| **Avoids all 4 traps** | ✓ | ✓ | ✓ | ~ Chatbox risk | ✓ | ~ Infrastructure |
| Felt daily unprompted | ✓ | ✓ | ✓ | ~ | ~ | ~ Seasonal |
| No dominant competitor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Strong shareable emotion | ✓ Gift + urgency | ✓ Wonder + gift | ✓ Humor + love | ~ Discomfort | ~ Recognition | ~ Vindication |
| No surveillance problem | ✓ | ✓ | ~ Pet cam | ✗ Messages | ~ Plaid | ~ Work data |
| **Extractive design** | ✓ Works around elder | ✓ Works around child | ✓ Works around dog | ✗ User labor | ✗ User labor | ✗ User labor |
| Beautiful shareable output | ✓ Story | ✓ Book | ✓ Video | ~ Map | ✓ Card | ~ Report |
| **Output format native to sharing platform** | ✓ WhatsApp/Facebook → PDF+image | ✓ Instagram/WhatsApp → book image | ✓ TikTok/Reels → vertical video | ~ Screenshot card | ✓ Screenshot card | ~ LinkedIn card |
| Solo 2–3 day build | ✓ | ✓ | ✓ | ~ | ✓ | ~ |
| **Best surface fit** | ✓ WhatsApp bot | ✓ Mobile app + WhatsApp | ✓ TikTok/Instagram effect | ~ Standalone or DM | ✓ Email (no app) | ~ Standalone |
| Has intentional gap | ✓ Prompts | ✓ Art styles | ✓ Breed library | ~ | ~ Category copy | ~ |
| Existing belief community | ✓ Strong | ✓ Strong | ✓ Strong | ~ Medium | ~ Medium | ✓ Strong |
| **Unique mechanic in portfolio** | ✓ | ✓ Different emotion | ✓ Different audience | ✓ | ✓ | ✓ |
| **Total strong** | **14/14** | **12/14** | **11/14** | **5/14** | **7/14** | **5/14** |

---

*Chronicle, Playmate, and Decode are the three strongest — they pass every structural filter including the general public test, the extraction test, and the four traps.*

*Orbit, Confession, and Proof each share the same fatal weakness: they are not extractive. They require the user to do significant work or grant significant access. They would need to be redesigned around a discrete single input — rather than ongoing passive access — before building.*

*The portfolio of all six covers genuinely different audiences and domains. No two ideas share the same mechanic or compete for the same person.*

---

*Last updated: October 2026*
