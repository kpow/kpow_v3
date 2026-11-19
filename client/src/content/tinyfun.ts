// Every tinyfun fact the two pages share: what it is, the buttons, the games,
// and how to update it from a phone. The readers are kids and friends who got
// one as a gift, so: few words, no jargon.
//
// Keep it in step with the kFun repo (private, kpow/kfun), the tinyfun app over
// common/: common/engine/Registry.cpp (the game list and each how-to-play
// screen), common/engine/Shell.cpp (quit chord, shake restart, saves),
// common/ui/Launcher.cpp, common/ui/GameOver.cpp, tinyfun/main.cpp (buttons
// held at power-on), tinyfun/OtaMode.cpp (the update mode and its error words)
// and the v2 case's ASSEMBLY.md (switch and charge port).
// Checked against tinyfun-v2 e752af8, Nov 19, 2026.
//
// Rich strings use the inline markup <Rich> renders (components/vizbot/bits.tsx):
// **bold**, `code`, [text](href).

export const BUILDLOG_URL = "/builds/kfun";
/** The static 3D model of the M1 board (client/public/tinyfun-m1/, not a React page). The
 * server serves no directory index, so the link names index.html. */
export const INSIDE_URL = "/tinyfun-m1/index.html";

/** Where kpow.xyz keeps the firmware (server/routes/tinyfun-routes.ts). */
export const FIRMWARE_DIR = "/tinyfun/firmware/";
export const MANIFEST_URL = FIRMWARE_DIR + "manifest.json";

/** The console's own update hotspot and page (tinyfun/OtaMode.cpp). */
export const HOTSPOT = "tinyfun-XXXX";
export const HOTSPOT_IP = "192.168.4.1";

// ------------------------------------------------------------------ photos
// From the build log (client/public/buildlog/kfun/media, synced from kpow-buildlog).

const M = "/buildlog/kfun/media/";

export const PHOTOS = {
  boot: { src: M + "tinyfun-v2-boot.jpg", w: 1280, h: 720, alt: "Three tinyfuns on a cutting mat, each showing the TinyFun title screen" },
  three: { src: M + "tinyfun-v2-three.jpg", w: 1600, h: 1200, alt: "Three tinyfun cases from the front: a screen, three buttons under it and a switch on the right side" },
};

// ------------------------------------------------------------------ start

/** Switch and charge port: the v2 case (ASSEMBLY.md). Nothing in the firmware reads the battery. */
export const START_STEPS: string[] = [
  "Flip the **switch on the right side**.",
  "**TinyFun** pops up. Press any button.",
  "Pick a game and play.",
];

export const CHARGE = "Charge it with a **USB-C** cable in the port at the **bottom**.";

// ------------------------------------------------------------------ buttons

export type Key = "L" | "OK" | "R";

/** One line of the controls: which keys, then what it does. */
export interface Move {
  keys: string;
  does: string;
}

/** The launcher (common/ui/Launcher.cpp). The carousel wraps round. */
export const MENU_MOVES: Move[] = [
  { keys: "L / R", does: "next game" },
  { keys: "OK", does: "play it" },
  { keys: "hold OK", does: "how to play (any button goes back)" },
];

/** Anywhere in a game (common/engine/Shell.cpp, tinyfun/hal/Imu.cpp). */
export const GAME_MOVES: Move[] = [
  { keys: "hold L + R", does: "back to the games. A ring fills in the corner first." },
  { keys: "shake it", does: "start this game over (a hard shake, while you play)" },
  { keys: "game over", does: "OK goes back to the games" },
];

export const GOOD_TO_KNOW: string[] = [
  "Left a game with L + R? Pick it again and it carries on where you were. (SkyGrid always starts fresh.)",
  "Your best score for each game is on its card, and stays when you switch off.",
  "On the games, hold L + R again to see the title screen.",
];

// ------------------------------------------------------------------ games
// In launcher order. Controls and words from each game's how-to-play screen
// (kHelp* in Registry.cpp), shortened. `tint` is the card's colour on the device.

export interface GameCard {
  name: string;
  tint: string;
  moves: Move[];
  how: string;
}

export const GAMES: GameCard[] = [
  {
    name: "Tetris",
    tint: "#00dce6",
    moves: [
      { keys: "L / R", does: "move" },
      { keys: "OK", does: "turn" },
      { keys: "hold OK", does: "drop" },
    ],
    how: "Fill a row to clear it. Four rows at once scores far more.",
  },
  {
    name: "Breakout",
    tint: "#ff9614",
    moves: [
      { keys: "L / R", does: "paddle" },
      { keys: "OK", does: "launch the ball" },
    ],
    how: "Break the whole wall. Higher rows are worth more. You get three balls.",
  },
  {
    name: "Snake",
    tint: "#3cdc46",
    moves: [
      { keys: "L / R", does: "turn" },
      { keys: "OK", does: "pause" },
    ],
    how: "L and R turn the snake left or right from the way it's going, not the screen. Eat to grow. Don't hit a wall or your tail.",
  },
  {
    name: "Invaders",
    tint: "#e63cdc",
    moves: [
      { keys: "L / R", does: "move" },
      { keys: "OK", does: "pause" },
    ],
    how: "Your cannon shoots by itself: just aim. Hide under the bunkers. Don't let them reach the ground.",
  },
  {
    name: "SkyGrid",
    tint: "#00d2ff",
    moves: [
      { keys: "L / R", does: "bank" },
      { keys: "hold OK", does: "boost" },
      { keys: "OK", does: "glide on / off" },
    ],
    how: "Fly the grid and grab the orbs. Each orb buys time, pylons cost time. Boosting scores triple.",
  },
  {
    name: "Backgammon",
    tint: "#46dcff",
    moves: [
      { keys: "L / R", does: "pick a move" },
      { keys: "OK", does: "play it" },
      { keys: "hold OK", does: "undo" },
      { keys: "hold OK + R", does: "double" },
    ],
    how: "You play the computer. First choose how long a match is, and Normal or Hard. Only moves that are allowed come up, so flick through and choose. Bear off all 15 to win.",
  },
];

// ------------------------------------------------------------------ fixes (landing page)

export const FIXES: { q: string; a: string }[] = [
  { q: "The screen stays dark", a: "Charge it for a while. Then switch it on without touching any button." },
  {
    q: "A strange screen came up",
    a: "A button was held while it switched on. Switch it off and on again, hands off the buttons. A screen that says **Update** goes away with **hold L + R**.",
  },
  { q: "Stuck in a game", a: "Hold **L + R** until the ring fills. You're back on the games." },
];

// ------------------------------------------------------------------ update (/tinyfun/update)

/** What /tinyfun/firmware/manifest.json holds (kfun repo, the tinyfun release workflow). */
export interface Manifest {
  version: string;
  notes?: string;
  builds: { s3?: { url: string; size: number; md5: string } };
}

/** The phone steps (tinyfun/OtaMode.cpp). {file} is the .bin's name. */
export const UPDATE_STEPS: string[] = [
  "On your phone, tap **Download**. An iPhone saves it in **Files › Downloads**, Android in **Downloads**.",
  "On tinyfun, press **L** or **R** until you see the **Update** card (a Wi-Fi fan). From Tetris it's one press of **L**. Press **OK**.",
  "tinyfun shows a Wi-Fi name, `tinyfun-` and four letters or numbers, and an **8‑digit password**. Join that Wi-Fi on your phone. If the phone says **no internet**, stay connected.",
  "In your phone's browser, go to `192.168.4.1`.",
  "Tap **Choose File**, pick {file}, then tap **Upload**. A bar fills on the phone and on tinyfun.",
  "tinyfun says **DONE - RESTARTING** and starts up on the new version.",
];

export const UPDATE_AFTER: string[] = [
  "Switch your phone back to your normal Wi-Fi.",
  "Your games, saves and high scores are all kept.",
  "Changed your mind? Hold **L + R** on tinyfun to leave without updating.",
];

export const UPDATE_SAFE: string[] = [
  "The new version goes into a spare space first. If the upload fails or gets cut off, nothing changes: tinyfun keeps the version it had.",
  "Then just try again. The password is new each time, so read it off the screen again.",
];

/** What tinyfun's screen can say instead of the bar (OtaMode.cpp), and what to do. */
export const UPDATE_FIXES: { q: string; a: string }[] = [
  {
    q: "It says NOT A TINYFUN .BIN",
    a: "That's the wrong file. Download it again from this page and pick the file that ends in `.bin`.",
  },
  {
    q: "It says UPLOAD CUT OFF",
    a: "The phone lost tinyfun's Wi-Fi. Keep the phone close, with its screen on, and try again.",
  },
  {
    q: "It says WRITE FAILED or NO ROOM - TRY AGAIN",
    a: "Hold **L + R** to restart tinyfun, open the **Update** card again and start over.",
  },
  {
    q: "The page at 192.168.4.1 won't open",
    a: "Check the phone is still on the `tinyfun-` Wi-Fi. Some phones jump back to home Wi-Fi when there's no internet.",
  },
  {
    q: "Which version do I have?",
    a: "The page at `192.168.4.1` tells you: **This tinyfun runs** and the version.",
  },
];
