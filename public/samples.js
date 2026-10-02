/**
 * samples.js
 * Pre-built demo transcripts for the three input source types.
 * Loaded before app.js so window.SAMPLES is available on startup.
 */

window.SAMPLES = {

  meeting: `[Meeting Transcript — Q3 Sprint Planning]
Participants: Alice (PM), Bob (Dev Lead), Sarah (Designer), Mike (QA)
Date: Monday April 7 2026

Alice: Alright team, let's finalise the Q3 roadmap. Bob, can you get the backend API for user authentication done by this Friday?

Bob: Yes, I can do that. But I'll need the design specs from Sarah first. Sarah, can you send me the updated Figma files by Wednesday?

Sarah: Sure — I'll get that done by Tuesday EOD so Bob has more breathing room. Also, we still don't have the colour palette approved. Mike, can you chase the brand team on that?

Mike: Will do. I'll ping them today. Also Alice — the QA environment is still broken. We can't test anything until DevOps fixes the staging server. That's blocking us right now.

Alice: That's a critical blocker. Bob, can you raise an urgent ticket with DevOps today? We need staging live by tomorrow.

Bob: On it. Also we need to decide on the payment gateway — we've been going back and forth between Stripe and PayPal.

Alice: Decision made: we go with Stripe. Bob, start the Stripe integration next Monday. Sarah, we'll need checkout flow mockups too — deadline is next Friday.

Mike: I'll write the test cases for the auth flow once Bob sends me the API docs. Bob, can you share those by Thursday EOD?

Bob: Thursday works.

Alice: Great. I'll send a recap email today. Sarah, can you also update the Jira project board?

Sarah: Yes, I'll update Jira by end of today.

Alice: Perfect. One last thing — we need to schedule a stakeholder demo for end of next week. I'll set up the calendar invite.`,

  chat: `[Slack — #product-launch]
April 6 2026

Jordan [10:02]: Hey team, quick sync on the launch checklist. @Emma the landing page copy is still missing the pricing section. Can you get that done by tomorrow?

Emma [10:04]: Yes! On it. Also the hero image is 8 MB — way too large. @Lucas can you optimise it?

Lucas [10:06]: Sure, I'll handle it today. @Jordan heads-up: the CDN config isn't done yet. We need that before launch or the site will be slow.

Jordan [10:08]: CDN is a blocker then. @DevOps can someone pick that up ASAP? We launch Thursday.

DevOps Bot [10:09]: Ticket created — CDN configuration, assigned to Tyler.

Tyler [10:15]: I'll have it done by Wednesday EOD.

Emma [10:17]: Also — we need to finalise the email campaign. Three emails: welcome, feature highlight, and CTA. @Jordan do you want to write those or use the copywriter?

Jordan [10:19]: Let's use the copywriter. @Priya can you brief them today? We need drafts by Wednesday.

Priya [10:21]: Got it, I'll brief them within the hour. Should we do A/B testing on subject lines?

Jordan [10:22]: Yes! Good call — test 2 variants. Priya add that to the brief.

Lucas [10:25]: One more thing — analytics tracking isn't set up. We need Google Analytics AND Mixpanel configured before launch. Who owns this?

Jordan [10:27]: @Emma can you take that? Should be straightforward.

Emma [10:28]: Sure, I'll do both by Wednesday.`,

  doc: `MINUTES OF MEETING — Design Review
Project: Mobile App v2.0
Date: April 5 2026
Attendees: Rachel (Design Lead), Tom (CTO), Nina (iOS Dev), Carlos (Android Dev)

1. NAVIGATION REDESIGN REVIEW
DECISION: Tab-bar navigation approved.
ACTION: Rachel to finalise all 5 tab icons — deadline April 9.

2. ONBOARDING FLOW
Tom raised concerns: the 6-step onboarding is too long.
DECISION: Reduce to 3 steps.
ACTION: Rachel to redesign onboarding flow — deadline April 12.
ACTION: Nina to implement new onboarding on iOS — deadline April 17.
ACTION: Carlos to implement on Android — deadline April 18.

3. DARK MODE SUPPORT
Carlos: 40% of beta users requested dark mode.
DECISION: Prioritise dark mode for v2.0.
ACTION: Rachel to create dark mode design tokens — deadline April 10.
ACTION: Nina and Carlos to implement dark mode — deadline April 21.

4. PERFORMANCE CONCERNS
Tom flagged app launch time at 4.2 seconds; target is under 2 seconds.
RISK: Could delay the May 1 launch if not resolved urgently.
ACTION: Nina to profile and optimise iOS launch time — deadline April 14. HIGH PRIORITY.
ACTION: Carlos to do the same for Android — deadline April 14. HIGH PRIORITY.

5. API DOCUMENTATION
Nina: backend API docs are incomplete — blocking profile screen development.
BLOCKER: Incomplete API docs blocking profile screen.
ACTION: Tom to ensure backend team completes API docs — deadline April 8. URGENT.

6. APP STORE SUBMISSION
ACTION: Nina to prepare iOS App Store assets (screenshots, description) — deadline April 22.
ACTION: Carlos to prepare Google Play listing — deadline April 22.
ACTION: Rachel to export final app icon in all required sizes — deadline April 8.`
};
