/***********************
 * CONFIGURATION
 ***********************/

// password (SHA-256 hash)
const PASSWORD_HASH =
  "5e830826bec068f0da87ebf40099d59b62969c9e796de3ea7f65b3b756e6e316";


// section boundaries
const Jan8 = 2;
const EARLY_END = 10;
const DATES_END = 23;

// durations (seconds)
const IMAGE_DURATION = 4;
const TEXT_DURATION = 3.5;

// music (optional)
const MUSIC_FILE = "assets/music/bg.mp3";
const ENABLE_MUSIC = true;

// text placeholders
const TEXTS = {
  BEFORE_CHILDHOOD: "Once upon a time... We were two kutti kids, making our way towards each other with every step.",
  TRANSITION_US: "Then, one fine day, we met - one of the most special days for both of us.",
  BEFORE_EARLY: "We took time, but then, once we started, we just fell in love with each other every single day.",
  BEFORE_DATES: "Soon came the phase of endless outings, adventures and fun that brought us even closer.",
  BEFORE_CRAZY: "Once we started understanding each other, nothing else mattered... just the two of us soo deeply and crazily in love.",
  ENDING:
  "These are some of the most beautiful memories we created together over the decade.\n" +
  "Really can’t wait to make many more.\n\n" +
  "I really love you always, Archi ma!!"

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
    unlock();
  }
});


document.getElementById("unlock-btn").addEventListener("click", unlock);

async function unlock() {
  const entered = passwordInput.value;
  const hash = await sha256(entered);

  if (hash !== PASSWORD_HASH) return;

  if (ENABLE_MUSIC) {
    const audio = document.getElementById("bg-music");
    audio.src = MUSIC_FILE;
    audio.volume = 0;
    audio.play().then(() => {
      fadeInAudio(audio);
    }).catch(() => {
      // mobile may still delay slightly, but this is the best possible trigger
    });
  }

  startSlideshow();
}



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

let isManualMode = false;

const slideshow = document.getElementById("slideshow");
let slides = [];
let currentIndex = 0;
let slideTimer = null;
let slideStartTime = null;
let remainingTime = null;
let isPaused = false;

let secretTapCount = 0;
let secretTimer = null;

// document.getElementById("hidden-fab").classList.add("hidden");


// slideshow.addEventListener("click", (e) => {
//   if (!hasSeenHiddenVideo) return;

//   if (e.clientX < window.innerWidth / 2) {
//     secretTapCount++;

//     clearTimeout(secretTimer);
//     secretTimer = setTimeout(() => (secretTapCount = 0), 1000);

//     if (secretTapCount === 5) {
//       secretTapCount = 0;
//       startManualMode(false);
//     }
//   }
// });

slideshow.addEventListener("click", (e) => {
  // Secret gesture is ALWAYS enabled
  if (e.clientX < window.innerWidth / 2) {
    secretTapCount++;

    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => (secretTapCount = 0), 1000);

    if (secretTapCount === 5) {
      secretTapCount = 0;
      startManualMode(false);
    }
  }
});


function startSlideshow() {
  isManualMode = false;

  document.getElementById("lock-screen").classList.add("hidden");
  slideshow.classList.remove("hidden");

  // if (ENABLE_MUSIC) {
  //   const audio = document.getElementById("bg-music");
  //   audio.src = MUSIC_FILE;
  //   audio.volume = 0;
  //   audio.play();
  //   fadeInAudio(audio);
  // }

  buildSlides().then(() => showNext());
}

async function buildSlides() {
  slides = [];

  // 1. Before childhood
  slides.push(textSlide(TEXTS.BEFORE_CHILDHOOD));

  // 2. Childhood images
  slides.push(...CHILDHOOD_MEDIA.map(mediaSlide));

  // 3. Transition into "us"
  slides.push(textSlide(TEXTS.TRANSITION_US));

  // 4. Jan 8 special images (US_MEDIA[0] and US_MEDIA[1])
  slides.push(...US_MEDIA.slice(0, Jan8).map(mediaSlide));

  // 5. Before early phase
  slides.push(textSlide(TEXTS.BEFORE_EARLY));

  // 6. Early "us" phase (after Jan 8)
  slides.push(
    ...US_MEDIA.slice(Jan8, EARLY_END).map(mediaSlide)
  );

  // 7. Before dates phase
  slides.push(textSlide(TEXTS.BEFORE_DATES));

  // 8. Dates / outings phase
  slides.push(
    ...US_MEDIA.slice(EARLY_END, DATES_END).map(mediaSlide)
  );

  // 9. Before crazy-us
  slides.push(textSlide(TEXTS.BEFORE_CRAZY));

  // 10. Crazy-us
  slides.push(
    ...US_MEDIA.slice(DATES_END).map(mediaSlide)
  );

  // 11. Ending
  slides.push(textSlide(TEXTS.ENDING));

  // Choice screen
  slides.push(choiceSlide());
}

function choiceSlide() {
  const el = document.createElement("div");
  el.className = "slide text-slide";

  const box = document.createElement("div");
  box.style.display = "flex";
  box.style.flexDirection = "column";
  box.style.gap = "20px";
  box.style.alignItems = "center";

  const title = document.createElement("div");
  title.textContent = "What would you like to do?";
  title.style.fontSize = "22px";

  const revisit = document.createElement("button");
  revisit.textContent = "Revisit our memories";
  revisit.onclick = () => startManualMode(true);

  box.appendChild(title);
  box.appendChild(revisit);
  el.appendChild(box);

  return { type: "choice", el, duration: 9999 };
}




function showNext() {
  // if (currentIndex >= slides.length) {
  //   enableManualNavigation();
  //   return;
  // }
  if (!slides[currentIndex]) return;

  const slide = slides[currentIndex];
  slideshow.innerHTML = "";
  slideshow.appendChild(slide.el);

  requestAnimationFrame(() => slide.el.classList.add("visible"));

  if (slide.type === "video") {
    const video = slide.el.querySelector("video");
    video.play();

    video.onended = () => {
      currentIndex++;
      showNext();
    };

    slide.el.onpointerdown = () => {
      if (!isPaused) {
        video.pause();
        pauseMusic();
        isPaused = true;
      }
    };


    slide.el.onpointerup = slide.el.onpointerleave = () => {
      if (isPaused) {
        video.play();
        resumeMusic();
        isPaused = false;
      }
    };
  } else {
    remainingTime = slide.duration * 1000;
    slideStartTime = Date.now();

    slideTimer = setTimeout(nextSlide, remainingTime);

    slide.el.onpointerdown = () => {
      pauseTimer();
      pauseMusic();
    };

  slide.el.onpointerup = slide.el.onpointerleave = () => {
      resumeTimer();
      resumeMusic();
    };
  }
}

function nextSlide() {
  currentIndex++;
  showNext();
}

function startManualMode(showHint) {
  clearTimeout(slideTimer);
  isPaused = false;

  isManualMode = true;
  stopMusic();

  currentIndex = 0;
  slideshow.onclick = null;

  if (showHint) {
    showManualHint();
  } else {
    enableManualNavigation();
  }
}



function enableManualNavigation() {
  slideshow.innerHTML = "";
  currentIndex = 0;
  showManualSlide();

  slideshow.onclick = (e) => {
    const mid = window.innerWidth / 2;
    if (e.clientX > mid) {
      currentIndex = Math.min(currentIndex + 1, slides.length - 1);
    } else {
      currentIndex = Math.max(currentIndex - 1, 0);
    }
    showManualSlide();
  };
}

function showManualHint() {
  slideshow.innerHTML = "";

  const el = document.createElement("div");
  el.className = "slide text-slide";
  el.textContent =
    "Take your time.\nTap right to go forward.\nTap left to go back.";

  slideshow.appendChild(el);
  requestAnimationFrame(() => el.classList.add("visible"));

  setTimeout(() => {
    enableManualNavigation();
  }, 3000);
}


function showManualSlide() {
  const slide = slides[currentIndex];
  slideshow.innerHTML = "";
  slideshow.appendChild(slide.el);
  requestAnimationFrame(() => slide.el.classList.add("visible"));

  // Pause video by default in manual mode
  if (slide.type === "video") {
    const v = slide.el.querySelector("video");
    v.pause();
    v.controls = true;
  }
}


function pauseTimer() {
  if (isPaused) return;
  isPaused = true;
  clearTimeout(slideTimer);
  remainingTime -= Date.now() - slideStartTime;
}

function resumeTimer() {
  if (!isPaused) return;
  isPaused = false;
  slideStartTime = Date.now();
  slideTimer = setTimeout(nextSlide, remainingTime);
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

  const bg = document.createElement(ext === "mp4" ? "video" : "img");
  bg.src = src;
  bg.className = "bg-media";
  bg.muted = true;
  bg.autoplay = ext === "mp4";
  bg.playsInline = true;

  const fg = document.createElement(ext === "mp4" ? "video" : "img");
  fg.src = src;
  fg.className = "fg-media";
  fg.autoplay = ext === "mp4";
  fg.muted = ext === "mp4";
  fg.playsInline = true;

  el.appendChild(bg);
  el.appendChild(fg);

  return ext === "mp4"
    ? { type: "video", el }
    : { type: "image", el, duration: IMAGE_DURATION };
}


// function finalButtonSlide() {
//   const el = document.createElement("div");
//   el.className = "slide";
//   const btn = document.createElement("button");
//   btn.id = "final-button";
//   btn.textContent = "One more thing";
//   btn.onclick = playHiddenVideo;
//   el.appendChild(btn);
//   return { type: "text", el, duration: 9999 };
// }

// /***********************
//  * HIDDEN VIDEO
//  ***********************/
// let hasSeenHiddenVideo = false;

// function playHiddenVideo() {
//   stopMusic();
//   slideshow.innerHTML = "";

//   const v = document.createElement("video");
//   v.src = "assets/hidden/01.mp4";
//   v.autoplay = true;
//   v.controls = false;
//   v.playsInline = true;
//   v.style.width = "100%";
//   v.style.height = "100%";

//   slideshow.appendChild(v);

//   v.onended = () => {
//   hasSeenHiddenVideo = true;
//   showPostHiddenOptions();
//   };
// }

// function showPostHiddenOptions() {
//   slideshow.innerHTML = "";

//   const el = document.createElement("div");
//   el.className = "slide text-slide";

//   const btn = document.createElement("button");
//   btn.textContent = "Revisit our memories";
//   btn.onclick = () => startManualMode(true);

//   el.appendChild(btn);
//   slideshow.appendChild(el);

//   requestAnimationFrame(() => el.classList.add("visible"));
// }


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

function stopMusic() {
  const audio = document.getElementById("bg-music");
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
}

function pauseMusic() {
  const audio = document.getElementById("bg-music");
  if (audio && !audio.paused) audio.pause();
}

function resumeMusic() {
  if (isManualMode) return; // 🚫 never resume in manual mode
  const audio = document.getElementById("bg-music");
  if (audio && ENABLE_MUSIC) audio.play();
}



function fadeInAudio(audio) {
  let vol = 0;
  const interval = setInterval(() => {
    vol += 0.05;
    audio.volume = Math.min(vol, 1);
    if (vol >= 1) clearInterval(interval);
  }, 200);
}
