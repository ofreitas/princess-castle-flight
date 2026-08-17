# Princess Castle Flight — Design Direction

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Storybook Sunbeam | A hand-painted, storybook sky journey with warm paper texture and theatrical castle silhouettes. It should feel like opening a treasured fairy-tale picture book. | 0.07 |
| Crown & Cloud Carnival | A lively pastel fairground in the clouds with bright iconography and bouncy toy-like movement. It foregrounds playful competition and immediate touch controls. | 0.04 |
| Moonlit Royal Relay | A nocturnal, jewel-toned flight through moonlit towers and stained-glass color. It gives the game a more magical, mysterious arcade character. | 0.09 |

## Chosen approach: Storybook Sunbeam

### Design Movement

**Storybook illustration meets paper-cut theatre.** The experience will evoke layered watercolor scenery and cut-paper stage sets rather than a generic mobile-game dashboard. Princesses appear in soft illustrated portraits before entering a lively side-scrolling world.

### Core Principles

1. **A journey, not a menu:** screens read like pages in an unfolding fairytale, with the castle always acting as a visual north star.
2. **Tactile layers:** cloud banks, distant hills, foreground vines, and obstacle towers create depth through parallax and staged overlap.
3. **Playful clarity:** the score, pause action, selection state, and touch input remain large, immediate, and high contrast on small screens.
4. **Character-forward play:** each princess gets a distinct palette, silhouette, and personality while keeping gameplay balanced and easy to understand.

### Color Philosophy

The shared world uses a **sunlit parchment sky**—creamy ivory, honey gold, faded cornflower, and sage—so the scene feels warm rather than candy-saturated. Character colors provide the energy: Helena in rose-coral, Eliza in twilight teal, and Aurora in amethyst. The ownable bright accent is **Sunbeam Gold (#F7B84B)**, used for scores, sparks, crowns, and the primary play call-to-action.

### Layout Paradigm

The game uses a **theatre-stage composition** rather than centered card stacks. The main menu has a drifting castle scene at the upper right, an arched title on the left, and princess portraits arranged along a lower “story shelf.” During play, the score floats at the top like a page-marker while the castle remains in the distant flight path.

### Signature Elements

1. **Scalloped parchment panels** for menus and score labels, edged with thin hand-inked lines.
2. **Crown-star particles** that trail jumps and punctuate score increases.
3. **Layered watercolor cloud ribbons** moving at different speeds behind the course.

### Interaction Philosophy

Every interaction should read as a small piece of storybook magic. Character cards tilt and rise when selected; the play button depresses like a wax seal; a tap or spacebar gives the princess a crisp upward “flutter” with a crown-spark burst. Input stays intentionally simple: tap/click/space to rise, with a clear restart route after each run.

### Animation

Use lightweight, physical motion. Selection cards lift by 4–8px over 180ms and settle with a brisk custom ease. Clouds and background layers drift slowly on the canvas. A princess uses a repeating bob/wing-like cape flutter while waiting and rotates subtly upward or downward in response to velocity. Scoring triggers an 800ms gold number pop and a brief particle burst. Nonessential motion must obey `prefers-reduced-motion`.

### Typography System

Use **Fraunces** as the expressive storybook display face for the game title and princess names, paired with **Nunito Sans** for all functional UI. Headings are semi-bold with a gentle negative tracking; score labels and buttons use Nunito Sans Black in upper case at high legibility. Avoid generic sans-only treatments.

### Brand Essence

**Princess Castle Flight is a one-touch fairytale arcade run for players who want quick, cheerful skill challenges with a storybook heart.**

Personality: **spirited, sunlit, whimsical**.

### Brand Voice

Headlines are adventurous and tactile; CTAs are direct, encouraging, and playful. Microcopy should speak like a narrator cheering the player forward, never like a generic system message.

> “Choose your royal flyer.”

> “The castle is calling—keep soaring.”

### Wordmark & Logo

The wordmark is an arched, hand-lettered “Princess Castle Flight,” with a three-pointed **crown taking flight as a small comet** above the first word. The logo mark alone is a bold gold crown-comet silhouette with three trailing spark stars, set on a transparent PNG background.

### Signature Brand Color

**Sunbeam Gold — #F7B84B.**

## Style Decisions

Every playable state preserves the castle as a visible north star and combines at least two depth layers—cloud ribbons, rolling sage hills, parchment panels, foreground vines, or paper-cut towers. The pale sky remains a supporting base rather than the finished visual field. The menu wordmark combines an arched Fraunces-led title with the Sunbeam Gold crown-comet mark, while functional controls retain high-clarity Nunito Sans typography.
