/***********************
 * CONFIGURATION
 ***********************/

// password (SHA-256 hash)
const PASSWORD_HASH =
  "5e830826bec068f0da87ebf40099d59b62969c9e796de3ea7f65b3b756e6e316";


// section boundaries
const EARLY_END = 7;
const DATES_END = 19;

// durations (seconds)
const IMAGE_DURATION = 4;
const TEXT_DURATION = 3.5;

// music (optional)
const MUSIC_FILE = "assets/music/bg.mp3";
const ENABLE_MUSIC = false;

// text placeholders
const TEXTS = {
  BEFORE_CHILDHOOD: "<TEXT_BEFORE_CHILDHOOD>",
  TRANSITION_US: "<TEXT_TRANSITION_INTO_US>",
  BEFORE_EARLY: "<TEXT_BEFORE_EARLY_PICS>",
  BEFORE_DATES: "<TEXT_BEFORE_DATES>",
  BEFORE_CRAZY: "<TEXT_BEFORE_CRAZY_US>",
  ENDING: "<TEXT_ENDING>",
};

/***********************
 * PASSWORD GATE
 ***********************/

let tapCount = 0;
let tapTimer = null;

const tapZone = document.getElementById("tap-zone");
const passwordBox = document.getElementById("password-container");
const passwordInput = document.getElementById("password-input");

tapZone.addEventListener("click", () => {
  tapCount++;
  if (tapCount === 5) {
    passwordBox.classList.add("visible");
    passwordInput.focus();
  }
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => (tapCount = 0), 1000);
});

passwordInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const entered = passwordInput.value;
    const hash = await sha256(entered);
    if (hash === PASSWORD_HASH) {
      startSlideshow();
    }
  }
});

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/***********************
 * SLIDESHOW ENGINE
 ***********************/

const slideshow = document.getElementById("slideshow");
let slides = [];
let currentIndex = 0;

function startSlideshow() {
  document.getElementById("lock-screen").classList.add("hidden");
  slideshow.classList.remove("hidden");

  if (ENABLE_MUSIC) {
    const audio = document.getElementById("bg-music");
    audio.src = MUSIC_FILE;
    audio.volume = 0;
    audio.play();
    fadeInAudio(audio);
  }

  buildSlides().then(() => showNext());
}

async function buildSlides() {
  slides = [];

  slides.push(textSlide(TEXTS.BEFORE_CHILDHOOD));
  slides.push(...CHILDHOOD_MEDIA.map(mediaSlide));

  slides.push(textSlide(TEXTS.TRANSITION_US));
  slides.push(textSlide(TEXTS.BEFORE_EARLY));

  slides.push(...US_MEDIA.slice(0, EARLY_END).map(mediaSlide));

  slides.push(textSlide(TEXTS.BEFORE_DATES));
  slides.push(...US_MEDIA.slice(EARLY_END, DATES_END).map(mediaSlide));

  slides.push(textSlide(TEXTS.BEFORE_CRAZY));
  slides.push(...US_MEDIA.slice(DATES_END).map(mediaSlide));

  slides.push(textSlide(TEXTS.ENDING));
  slides.push(finalButtonSlide());
}


function showNext() {
  if (currentIndex >= slides.length) return;

  const slide = slides[currentIndex];
  slideshow.innerHTML = "";
  slideshow.appendChild(slide.el);

  requestAnimationFrame(() => slide.el.classList.add("visible"));

  if (slide.type === "video") {
    slide.el.querySelector("video").onended = () => {
      currentIndex++;
      showNext();
    };
  } else {
    setTimeout(() => {
      currentIndex++;
      showNext();
    }, slide.duration * 1000);
  }
}

/***********************
 * SLIDE FACTORIES
 ***********************/

function textSlide(text) {
  const el = document.createElement("div");
  el.className = "slide text-slide";
  el.textContent = text;
  return { type: "text", el, duration: TEXT_DURATION };
}

function mediaSlide(src) {
  const ext = src.split(".").pop().toLowerCase();
  const el = document.createElement("div");
  el.className = "slide";

  if (ext === "mp4") {
    const v = document.createElement("video");
    v.src = src;
    v.autoplay = true;
    v.muted = true;
    v.playsInline = true;
    el.appendChild(v);
    return { type: "video", el };
  } else {
    const img = document.createElement("img");
    img.src = src;
    el.appendChild(img);
    return { type: "image", el, duration: IMAGE_DURATION };
  }
}

function finalButtonSlide() {
  const el = document.createElement("div");
  el.className = "slide";
  const btn = document.createElement("button");
  btn.id = "final-button";
  btn.textContent = "One more thing";
  btn.onclick = playHiddenVideo;
  el.appendChild(btn);
  return { type: "text", el, duration: 9999 };
}

/***********************
 * HIDDEN VIDEO
 ***********************/

function playHiddenVideo() {
  slideshow.innerHTML = "";
  const v = document.createElement("video");
  v.src = "assets/hidden/01.mp4";
  v.autoplay = true;
  v.controls = false;
  v.playsInline = true;
  v.style.width = "100%";
  v.style.height = "100%";
  slideshow.appendChild(v);
}

/***********************
 * HELPERS
 ***********************/

// async function listMedia(path) {
//   // GitHub Pages compatible directory listing
//   const res = await fetch(path);
//   const text = await res.text();
//   const matches = [...text.matchAll(/href="([^"]+)"/g)]
//     .map(m => m[1])
//     .filter(f => /\.(jpg|jpeg|png|mp4)$/i.test(f))
//     .sort();
//   return matches.map(f => `${path}/${f}`);
// }

function fadeInAudio(audio) {
  let vol = 0;
  const interval = setInterval(() => {
    vol += 0.05;
    audio.volume = Math.min(vol, 1);
    if (vol >= 1) clearInterval(interval);
  }, 200);
}
