// Password generation & strength estimation.

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123485679",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/",
};

export function generatePassword(length = 20, options = {}) {
  const { lower = true, upper = true, digits = true, symbols = true, noAmbiguous = false } = options;
  let pool = "";
  if (lower) pool += SETS.lower;
  if (upper) pool += SETS.upper;
  if (digits) pool += SETS.digits;
  if (symbols) pool += SETS.symbols;
  if (noAmbiguous) pool = pool.replace(/[O0Il1|]/g, "");
  if (!pool) return "";
  const random = crypto.getRandomValues(new Uint32Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += pool[random[i] % pool.length];
  return out;
}

export function generatePassphrase(words = 6) {
  const list = [
    "apple", "river", "mountain", "cipher", "galaxy", "phoenix", "shadow", "crystal",
    "thunder", "forest", "ocean", "violet", "silver", "golden", "marble", "ember",
    "falcon", "harbor", "jungle", "lantern", "meadow", "nectar", "orbit", "prism",
    "quartz", "raven", "summit", "tundra", "umbra", "velvet", "willow", "zenith",
  "anchor", "breeze", "candle", "dawn", "echo", "frost", "glen", "haven",
  "ivory", "jasper", "kite", "lunar", "moss", "nimbus", "opal", "petal",
  "quill", "ridge", "spark", "tide", "umber", "vortex", "wave", "yarrow",
    "azure", "bloom", "cliff", "drift", "flint", "gale", "haze", "iris",
  "jade", "kelp", "lotus", "magma", "noble", "onyx", "pine", "quay",
  "revel", "sage", "talon", "vast", "wisp", "yew", "ash", "birch",
  "cedar", "dune", "fern", "glade", "hollow", "ice", "jet", "knoll",
  "loch", "mist", "nook", "oasis", "peak", "quagmire", "roost", "sway",
  "tarn", "vale", "wharf", "yonder", "zephyr", "amber", "basalt", "cove",
  ];
  const random = crypto.getRandomValues(new Uint32Array(words));
  const chosen = Array.from(random, (r) => list[r % list.length]);
  const num = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
  return chosen.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") + "-" + num;
}

// Simple strength estimator: entropy-based with bonuses/penalties.
export function estimateStrength(password) {
  if (!password) return { score: 0, label: "Empty", entropy: 0 };
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  const entropy = password.length * Math.log2(pool || 1);
  let score = 0;
  if (entropy >= 100) score = 4;
  else if (entropy >= 70) score = 3;
  else if (entropy >= 45) score = 2;
  else if (entropy >= 25) score = 1;
  else score = 0;
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  return { score, label: labels[score], entropy: Math.round(entropy) };
}