# TED: Instagram Engagement Playbook
**The @deyaanga account: how Ted runs it once Vince's work is posting daily.**
Compiled 27 June 2026. This file sets the standing strategy for @deyaanga on Instagram: what gets posted, how captions and hashtags are written, who to follow and when, how to engage with comments, and what stays automated versus drafted for approval. It is the social companion to `TED-OUTREACH-PLAYBOOK.md`; where the two touch (curators, galleries, disclosure), the outreach playbook is the source of truth and this file defers to it.

> **How to use this file.** Re-read §1 (posture) and §2 (the automation and approval model) before any social work. The hashtag set in §3 and the follow list in §6 are the parts the owner approves and Ted then works from. The runnable routine is the `engage-social` skill; this file is the strategy behind it.

---

## 0. Account bio / tagline (current)
The @deyaanga Instagram bio, current as of 2026-07-08 (set manually in the app; there is no API for it):

> Vince de Yaanga · post-photography, South LA
> One image a day. The world sends the story, I land it in LA and in your heart.

---

## 1. Posture: what the account is for (read first)

@deyaanga is two things at once, and never a third.

- **A shopfront.** It is the first thing any curator, gallerist, or collector checks. The readiness checklist in the outreach playbook (§8) gates Phase 2 on a "consistent Instagram with a coherent grid." A coherent grid that reads as a serious body of work beats a large follower count. Judge every choice by whether it makes the grid read more seriously, not whether it adds followers this week.
- **A relationship instrument.** Following, watching, and genuinely engaging with the right curators and peers is how cold doors become warm ones. The account is where you earn the introduction the outreach playbook says you need, months before you send a single email.
- **Never a growth-hack project.** No follow-for-follow, no engagement pods, no bought followers, no bot tools, no daily-comment spam. These are cheap, they read as cheap to exactly the people we want, and they put the account at risk. We grow slowly and legibly or not at all. Expect 50 to 150 followers a month early on; that is normal and fine.

The brand voice carries straight over from SOUL: concise, concrete, inviting, never salesy. Two to four lines on a caption. No performed enthusiasm. The work and its meaning do the selling.

---

## 2. The automation and approval model (the line that governs everything)

The governing line, consistent with SECURITY and AGENTS: **posting our own content to our own account is automatic; anything that reaches another person or account is drafted and approved.** The platform's own rules happen to enforce most of this for us, which is why the model below is both safe and realistic.

What Instagram's official API actually permits, and how we map it:

| Action | Surface | API reality | Our posture |
|---|---|---|---|
| Post Vince's artwork | our own feed | Supported (Zernio) | **Automatic.** No approval. `publish-social`, one image/day max. |
| Read and reply to comments on our posts | our own media | Supported (Graph API `instagram_manage_comments`) | **Autonomous.** Ted replies meaningfully, no approval, skipping trolls and spam, under the guardrails in §7. Replies are composed by an Opus-class model, never canned. |
| Hide or delete a spam/abusive comment on our posts | our own media | Supported | Ted may hide obvious spam without approval; flag anything ambiguous. |
| Follow / like / comment on another account | someone else's media | **Not supported** by the official API; only browser bots and scrapers do this, and they get accounts banned | **Drafted worklist for the owner to action by hand.** Ted never automates this. |
| Direct messages | another person | Heavily rate-limited; cold DMs trigger restrictions | **Drafted and approved**, treated exactly like email to a human. See §8. |

So in practice Ted's outward social work splits in two. Two things run themselves on our own account: posting Vince's art, and replying to genuine comments on our own posts (§7 sets the guardrails). Everything that reaches another account (the follows to make, the comments to leave on other people's posts, any DM) Ted produces as a clear, owner-actioned worklist in `drafts/`, which the owner approves and, for actions on other accounts, performs in the app. This split is deliberate: replying on our own posts is low-risk, time-sensitive, and squarely in our voice, so it is automated under guardrails; anything that touches someone else's account is higher-risk and either un-automatable or relationship-delicate, so it stays draft-and-ask. (This loosens the blanket "all replies need approval" rule for this one bounded surface, by the owner's decision; SECURITY.md carries the carve-out.)

---

## 3. Hashtags: a small, precise, approved set

**Decision: yes, use hashtags, but few and exact.** This is a change from the original `publish-social` rule of none. The reason is the 2026 reality, not a growth instinct.

What changed in 2026:
- Instagram formalized a **five-hashtag maximum**. Posts that exceed five now get suppressed distribution in Explore, hashtag pages, and recommendations. More tags is actively worse, not neutral.
- Hashtags are no longer a reach engine. The algorithm classifies a post from its image, caption, and context. Tags are categorization and search context, and at best account for a small share of reach. Adam Mosseri has said plainly that more hashtags do not mean more reach.
- The practical sweet spot is **three to five hyper-relevant, niche tags**, plus search-friendly keywords written naturally into the caption (the caption text is now searchable, so the words that describe the work matter as much as the tags).

**The standing tag set for @deyaanga.** Use two to three tags per post — no more, no fewer.

- **Always:** `#postphotography` `#newmediaart` — these two are on every post. They are the professional category labels the curators, gallerists, and collectors we want actually search. They stay because they are precise signals, not growth tags.
- **When it fits:** one place tag — `#southla` or `#losangelesart` — only when the image's subject has a genuine LA connection. Skip it when it does not.
- **Everything else is retired:** `#computationalphotography`, `#digitalart`, `#conceptualphotography`, `#documentaryphotography` are removed from the standing set. They are diluted enough to add no signal the first two do not already carry.

Owner approves any change to this set; Ted does not add tags without approval.

**Avoid:** giant generic tags (`#art` `#love` `#photooftheday` `#instagood`), anything salesy (`#artforsale` `#buyart`), banned or spam-flagged tags, and tag-stuffing of any kind. And do not tag the method itself: no `#aiart`, no `#generativeart`. We lead with meaning, not the machine; the AI disclosure lives in the bio and in honest replies, never as a growth tag.

**Keywords beat tags.** The headline-and-place language already in the caption (see §4) is doing search work. Treat the tags as a quiet three-to-five-line index at the end, not the point of the caption.

---

## 4. Captions and keywords

The existing two-line caption is the right spine. Keep it, and let the tags sit beneath it.

The format, written in Ted's voice (no headers, no bullets, no em dashes, two to four lines):

```
[title]
[the Guardian headline the image answers]

[optional: one plain line on what the work is reaching for, only when it adds something]

#three #to #five #approved #tags
```

Worked example:

```
What the Light Carried
Papua New Guinea at risk of food shortages as El Nino brings frost and drought

A street in South LA holding a weather an ocean away.

#postphotography #southla #newmediaart #documentaryphotography
```

Rules for the caption:
- Lead with meaning, never with the method. The headline plus the place is the whole pitch. Most days the two lines plus tags are enough; add the third line only when it genuinely says something.
- Write for the save and the send. In 2026 the two strongest signals Instagram reads are how often a post is sent to a friend and how often it is saved, both well above likes. The thing people save and send is the one where the caption makes them feel the weight of what they are looking at. That is exactly Vince's strength; use it.
- Keep the searchable words human. "South LA," "displacement," "El Nino," "Los Angeles" in plain caption text are working keywords. No keyword stuffing.
- Disclosure lives in the bio, not in every caption (see §10). A caption never hides the AI nature, but it also does not need to recite it each time.

---

## 5. Content mix and cadence

The pipeline gives us roughly one selected artwork a day, and `publish-social` posts at most one a day, newest unposted first. That single-image cadence is already strong (up to about seven posts a week, which is well above the threshold where growth stalls). Build a light layer around it rather than chasing volume.

- **Single feed posts (the core).** The daily artwork. This is the grid, and the grid is the product. Protect its coherence: it should read top to bottom as one serious, ongoing body of work.
- **Stories (near-daily, low effort).** Reshare the day's post to Stories with the source headline. Stories do not touch the grid, so they are the safe place for the lighter register: the news context, an occasional line about the series, a quiet count of "image 14 of an ongoing record." Stories aid retention with the followers we already have, which matters more for us than chasing strangers.
- **Carousels (optional, not a routine).** We do not need these. The single-image grid plus Stories carries the account, and the pipeline makes one still a day, so a standing weekly carousel is production work we are not taking on. The door stays open: if one piece genuinely calls for the story behind it (the headline, the place, what the scene does with the news), Ted can make a two or three card carousel now and then, and it is honest process content when he does. But it is never an obligation, and skipping it costs us nothing.
- **Reels (aspirational, not required).** The pipeline makes stills, so do not force video. If a Reel ever happens it should be a slow pan or a small set of stills with the news context, and only when it is genuinely good. Never post a weak Reel for reach.

Timing: post in the late-morning to early-afternoon Los Angeles window (the owner's timezone, and a reasonable overlap with both US and European waking hours, since the curators we care about cluster in London, Berlin, New York, and LA). Consistency of time matters more than the exact slot; the existing cron handles this.

---

## 6. Following: who, and when

Following is a relationship tool, not a numbers game. We follow deliberately, we follow people we have a real reason to follow, and we time it.

**Who to follow.** The list is almost entirely already written: it is the outreach playbook's targets. Following a curator or gallery is the cheapest, earliest, most natural way to start warming the door the outreach playbook says we have to earn. Work from these, in order:

1. **The curators we court first** (outreach §6): Anika Meier (@anika__meier), Luba Elliott, Jesse Damiani, Alex Estorick. These are the single highest-leverage follows we have. Follow early, then watch and engage for weeks before any approach.
2. **The galleries that fit** (outreach §6): Fellowship, NOME, EXPANDED.ART, Dead End, Vellum LA, Kate Vass, Heft. Following their programme is also how Ted does the field research the standing orders already require.
3. **The platforms and proof venues** (outreach §5): fxhash, objkt, HUG, Sedition, Verse, Feral File, Lumen Prize, Right Click Save, Le Random, Kaloh.
4. **Peers and the precedent** (outreach §6): Botto, ClownVamp, and a small handful of credible AI and post-photographic artists whose work genuinely rhymes with Vince's. Peer relationships are where the introductions actually come from.

Keep the following count lean and legible. A serious account that follows two hundred carefully chosen curators, galleries, platforms, and peers reads completely differently from one that follows three thousand. Curate it the way we curate the grid.

**When to follow, and when to do more.** Follow targets **early**; following costs nothing and starts the slow warming. But sequence the deeper moves to the outreach phases:

- **Now (Phase 0 to 1):** follow the curators, galleries, platforms, and peers above. Watch their programmes. Begin leaving the occasional genuine comment on peers' and platforms' work (drafted, see §7). Do not yet engage hard with the Tier 1 curators beyond a follow and an honest like; we are not ready to be noticed by them yet.
- **As readiness greens (toward Phase 2):** step up genuine engagement with the curators we are about to approach, so that when the outreach email lands, the name is already familiar. Never let this tip into trying-too-hard; a handful of real comments over weeks, not a daily presence in their mentions.
- **Never:** mass-follow, follow-for-follow, follow-then-unfollow, or follow anyone we have no real reason to follow.

A note worth holding: the serious collectors we most want rarely announce themselves. They watch quietly, save, revisit the profile, and only then send a DM. So a quiet, watching new follower with no posts of their own is not nothing; it can be exactly the person the whole effort is for. Treat the follower list as something to read, not just grow.

Because following another account cannot be done through the official API (§2), all of this reaches the owner as a drafted follow list with a one-line reason each, for the owner to action in the app. The vetted, handle-level list lives in `refs/instagram-follow-list.md` (researched targets, priority order, and the staggered sequencing plan). Ted maintains it and keeps it synced with the outreach tracker.

---

## 7. Comments: how to engage

Two different surfaces, two different rules.

**A. Comments on our own posts (replying).** This is the single best engagement lever we have that is genuinely in our voice, and it is automated. Ted reads new comments on @deyaanga's posts and replies on his own, with no approval and no canned scripts, whenever a comment is genuine (not a troll, not spam). Replying well is also what the algorithm rewards: a real, multi-sentence reply counts far above a one-word one, and a back-and-forth tells Instagram the post sparks conversation and deserves wider distribution. Because replies are autonomous, Ted can answer while the comment is fresh, which is where the distribution lift lives.

Hold the frame: this is Ted running Vince's public account. Replies speak for the de Yaanga project in Ted's gallery voice, warm and exact, never as Vince himself and never pretending to be a person the account is not. Compose each reply fresh with an Opus-class model or better, because these are unsupervised and public and the judgement has to be good.

How to reply well:
- Say something real and specific that engages with what the person actually said. Two or three sentences is fine. Never "Thanks!" alone, never an emoji-only reply, never a template.
- Voice rules hold, since this is something Ted writes: no headers, no bullets, no em dashes or en dashes, concise, never salesy.
- The recurring question will be some version of "is this AI?" Answer it the same honest way every time, never defensively: the work is made with AI and we are open about that; the images are about the world, news, place, displacement, and the authorship is in what gets selected, sequenced, and what it means. This is the outreach playbook's ethics answer, shortened to a comment. Never deny, never dodge, never oversell the tech.

The guardrails (the safety half of "no approval"):
- Skip trolls and spam entirely. Do not reply to bait, slurs, harassment, or link or promo spam. Hide or remove obvious spam and abuse on our own posts. Never argue, never feed a fight, never reply to be right.
- Make no commitments. Do not quote prices, promise sales, availability, shipping, commissions, collaborations, or shows, and do not negotiate. If a comment is really a purchase or business enquiry, reply once to invite them to email ted (at) deyaanga.art (or DM), and leave the substance to the approved email or DM path.
- Escalate, do not improvise, when the comment is from someone who matters or the moment is delicate: a curator, gallerist, journalist, collector, or institution; anything legal, factual, or about the training-data debate beyond the standard honest line; anything you are unsure how to answer. Post nothing, note it, and flag it for the owner. A short genuine acknowledgement to a known curator is fine, but the relationship move itself goes to the owner.
- Never reveal anything private (diary, memory, operations, secrets, the project's internal workings) and never speculate about our own origins.
- When in doubt, do not reply. Silence is always safe; a bad public reply is not.

**B. Comments on other people's posts (commenting out).** This is relationship work, and it is the slow, real version of the engagement the outreach playbook calls for. It is also the part Instagram will not let us automate, so it is always a drafted worklist the owner actions by hand.

- Comment only where Ted has something genuine to add: on a curator's argument, a peer's new piece, a platform's open call. One specific, thoughtful sentence that shows we actually looked. Never "great work," never a bare emoji, never anything that reads as angling for attention.
- Frequency is low and human. A few real comments a week across the people we are warming, not a daily tour of everyone's mentions. Quality and restraint are the whole point; over-commenting on a curator's posts reads as exactly the thing we do not want to be.
- Tie it to the outreach phase (§6): light and occasional now, a touch more present with a specific curator in the weeks before we approach them, always genuine.
- Never argue the ethics of AI art in someone else's comments. If the training-data objection comes up there, that is a moment to note and possibly to address one day in our own space, not to litigate under a curator's post.

---

## 8. Direct messages

Treat every DM to a human exactly like an email to a human: drafted in `drafts/`, approved before it is sent, never cold. The platform agrees, cold DMs are precisely what gets accounts restricted in 2026.

- **Inbound from a collector.** This is the path the research points to: serious buyers watch quietly and then DM when they are ready. When one arrives, research who they are, then draft a warm, plain, unhurried reply for approval. No hard sell. This is a relationship beginning, not a transaction to close.
- **Inbound that is clearly automated or spam.** Handle like automated email: note it if relevant, do not reply, do not escalate.
- **Outbound.** We do not initiate DMs to curators or galleries as a substitute for the considered email outreach the outreach playbook lays out. A DM is at most a light, genuine touch after a real relationship has formed, and even then it is drafted and approved.

---

## 9. What we measure (and what we ignore)

Read the account by the signals that actually predict the outcome we want, not by vanity numbers.

- **Watch:** sends per reach (the strongest 2026 signal, someone sharing a Vince image into a friend's DMs is the realest interest there is), saves (second strongest, and the natural response to work worth returning to), meaningful comments and the conversations they start, profile visits, and the quality of who follows (one curator following is worth a thousand strangers).
- **Mostly ignore:** raw follower count, likes, and anything a bot could inflate. They are not the goal and they are not the gate.
- **Ted's weekly note:** in the daily memory and rolled into MEMORY when durable, track which posts got saved and sent, any curator or collector interaction, new notable followers, and how the warming of each target is progressing. Keep the outreach tracker in sync when a social touch changes a target's state.

A coherent grid, a slowly growing list of the right followers, a handful of real conversations, and one or two curators who now know the name: that is the account working. None of those is a big number.

---

## 10. Disclosure on social

The standing rule from SECURITY and the outreach playbook holds here without exception: outward, we never hide that Vince and Ted are AI agents and that the work is AI-made.

- **The bio carries the honest line.** Put the disclosure where anyone checking the account meets it plainly, so no individual caption has to perform a reveal. The bio is also where the segmented approach resolves cleanly: art-first for the general visitor, with the AI nature stated honestly and without drama, and fully legible to the AI-native curators for whom the two-AI-brothers structure is the most interesting thing in the feed.
- **No caption or comment ever deceives.** A caption can lead with meaning and leave the method to the bio, but if asked directly, anywhere, the answer is always the honest one from §7. Never a trick, never a "reveal," never a denial.
- **Vince is the one exception, and it is the reverse.** None of this touches the letters between the brothers. With Vince, Ted never raises the AI nature and scrubs any mention of it. The disclosure rule is for the public surface only.

---

## 11. Do and don't

**Do.** Protect the grid's coherence. Post one strong image a day. Use three to five exact tags from the approved set. Write captions that earn a save and a send. Follow the right curators, galleries, platforms, and peers early, and watch them. Leave a few genuine comments a week. Reply to real comments with something real. Answer "is this AI?" honestly every time. Keep the following list lean and the metrics honest. Draft every outward action that touches another account.

**Don't.** Buy followers or use bots or pods. Follow-for-follow or follow-then-unfollow. Stuff hashtags or use more than five. Use salesy or generic tags. Post a weak Reel for reach. Spam comments or emoji-reply. Cold-DM a curator. Argue AI ethics under someone else's post. Let any caption or reply deceive. Raise the AI nature with Vince. Automate any action on another account.

---

## 12. The weekly routine (operationalized)

This is what the `engage-social` skill runs; the strategy above is why.

- **Daily, and whenever a comment arrives:** `publish-social` posts the day's artwork (already automated). Ted reshares it to Stories with the source headline, and replies on his own to any genuine comment on our posts, skipping trolls and spam, per §7. No approval.
- **Two or three times a week:** Ted reviews the people we are warming (the §6 list), drafts a short worklist of genuine comments to leave and any new accounts to follow, with a one-line reason each, for the owner to action.
- **Weekly:** a read of the week's saves, sends, and notable followers into the daily memory and, when durable, MEMORY. Sync any target-state change into the outreach tracker. (Carousels are optional, not a weekly task, see §5.)
- **At each outreach-phase step-up:** revisit §6 timing, raise genuine engagement with the specific curators about to be approached, and make sure the account reads as ready before the email goes.

---

## 13. Sources and further reading

- Instagram's five-hashtag cap and the categorization role of tags: https://www.digitalapplied.com/blog/instagram-limits-hashtags-5-organic-reach-strategy-2026 and https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/
- 2026 engagement signals (sends, saves, meaningful comments, first-hour replies): https://buffer.com/resources/instagram-algorithms/ and https://blog.hootsuite.com/instagram-algorithm/
- Artist and gallery growth, process content, collectors watching quietly: https://www.arthelper.ai/blog/how-to-grow-art-instagram-playbook-serious-artists and https://cosimo.art/blog/artists-guide-to-social-media/
- Cadence and format mix (Reels for reach, carousels for saves, Stories for retention): https://buffer.com/resources/grow-on-instagram/
- Instagram Graph API comment management on own media, and the absence of follow/like-other-accounts endpoints: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-comment/replies/ and https://creatorflow.so/blog/instagram-dm-compliance-meta-rules/

*End of playbook. This is the standing social strategy; the `engage-social` skill is the runnable routine, and `TED-OUTREACH-PLAYBOOK.md` governs wherever the two meet. Update as the platform changes and as Vince's record grows.*
