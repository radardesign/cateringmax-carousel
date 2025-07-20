document.addEventListener('DOMContentLoaded', () => {
  const SLIDE_DURATION = 5000;
  const eventSlides = Array.from(document.querySelectorAll('.swiper-slide.events'));
  const modal = document.querySelector('.eventsmodalwindowswrapper');
  const storiesWrapper = modal.querySelector('.storieswrapper .swiper-wrapper.stories');
  const storySlides = Array.from(storiesWrapper.querySelectorAll('.swiper-slide.story-slide'));
  const btnPrev = modal.querySelector('.inner-prev');
  const btnNext = modal.querySelector('.inner-next');
  const paginationWrapper = modal.querySelector('.pagination');
  const btnClose = modal.querySelector('.closemodal');
  const navWrapper = modal.querySelector('.eventsmodalnavigation');

  let currentStoryIndex = 0;
  let currentInnerIndex = 0;
  let autoProgressTimeout;
  let progressStartTime = 0;
  let progressRemaining = SLIDE_DURATION;
  let isPaused = false;


  Object.assign(navWrapper.style, {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'opacity 0.5s ease'
  });

  function resetStyles() {
    clearTimeout(autoProgressTimeout);
    storiesWrapper.style.transition = 'none';
    storiesWrapper.style.transform = 'translateX(0)';
    storySlides.forEach(s => {
      s.style.width = '';
      const inner = s.querySelector('.inner-swiper .swiper-wrapper');
      if (inner) {
        inner.style.transition = 'none';
        inner.style.transform = 'translateX(0)';
      }
    });
  }

  function openStory(idx) {
    currentStoryIndex = idx;
    currentInnerIndex = 0;
    resetStyles();
    modal.style.display = 'flex';
    navWrapper.style.opacity = '1';
    updateSlidesStyle();
    requestAnimationFrame(() => requestAnimationFrame(centerStory));
  }

  eventSlides.forEach((slide, idx) => {
    slide.addEventListener('click', e => {
      let trigger = e.target.closest('[eventid-out], .eventid-out') ||
                    slide.querySelector('[eventid-out], .eventid-out');
      if (trigger) {
        const id = trigger.getAttribute('eventid-out') || trigger.dataset.eventidOut;
        const match = storySlides.findIndex(s =>
          (s.getAttribute('eventid-in') || s.dataset.eventidIn) === id
        );
        if (match !== -1) {
          e.preventDefault();
          e.stopPropagation();
          openStory(match);
          return;
        }
      }
      openStory(idx);
    });
  });

  // Support opening a story when clicking any element associated with
  // `eventid-out`. The click can originate on the element itself,
  // an ancestor, or a container that simply contains such an element.
  document.addEventListener('click', e => {
    let el = e.target instanceof Element ? e.target : e.target.parentElement;

    // Check if the clicked element or its ancestors have the attribute
    let trigger = el && el.closest('[eventid-out], .eventid-out');

    // If not, search inside the clicked element for a descendant with it
    if (!trigger && el) trigger = el.querySelector('[eventid-out], .eventid-out');

    if (!trigger) return;
    const eventId = trigger.getAttribute('eventid-out') || trigger.dataset.eventidOut;

    if (!eventId) return;

    const idx = storySlides.findIndex(s =>
      (s.getAttribute('eventid-in') || s.dataset.eventidIn) === eventId
    );

    if (idx !== -1) {
      e.preventDefault();
      e.stopPropagation();
      openStory(idx);
    }
  });

  function updateSlidesStyle() {
    storySlides.forEach((s, idx) => {
      const overlay = s.querySelector('.stories-overlay');
      if (overlay) {
        Object.assign(overlay.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease',
          display: idx === currentStoryIndex ? 'none' : 'block',
          opacity: idx === currentStoryIndex ? '0' : '1'
        });
      }
      // Сохраняем естественную ширину слайдов для корректного центрирования
      s.style.transition = '';
      s.style.width = '';
    });
  }

  function centerStory() {
    const containerWidth = storiesWrapper.parentElement.clientWidth;
    const active = storySlides[currentStoryIndex];
    const shift = containerWidth / 2 - (active.offsetLeft + active.offsetWidth / 2);

    storiesWrapper.style.transition = 'transform 0.5s ease';
    storiesWrapper.style.transform = `translateX(${shift}px)`;

    updateInnerSlide();
  }

  function updateInnerSlide() {
    clearTimeout(autoProgressTimeout);
    const story = storySlides[currentStoryIndex];
    const innerWrapper = story.querySelector('.inner-swiper .swiper-wrapper');
    const innerSlides = Array.from(innerWrapper.querySelectorAll('.inner-slide'));
    if (currentInnerIndex >= innerSlides.length) currentInnerIndex = 0;

    storySlides.forEach((storySlide, idx) => {
      const wrapper = storySlide.querySelector('.inner-swiper .swiper-wrapper');
      if (wrapper && idx !== currentStoryIndex) {
        wrapper.style.transition = 'none';
        wrapper.style.transform = 'translateX(0)';
      }
    });

    const w = innerSlides[0]?.offsetWidth || 0;
    innerWrapper.style.transition = 'none';
    innerWrapper.style.transform = `translateX(-${currentInnerIndex * w}px)`;
    innerWrapper.offsetHeight;
    innerWrapper.style.transition = 'transform 0.5s ease';

    btnPrev.classList.toggle('swiper-button-disabled', currentStoryIndex === 0 && currentInnerIndex === 0);
    btnNext.classList.toggle('swiper-button-disabled',
      currentStoryIndex === storySlides.length - 1 &&
      currentInnerIndex === innerSlides.length - 1
    );

    paginationWrapper.innerHTML = '';
    innerSlides.forEach((_, i) => {
      const bullet = document.createElement('div');
      bullet.className = 'pagination-bullet';
      bullet.style.borderRadius = '0.25em';
      const prog = document.createElement('div');
      prog.className = 'progress-bar';
      prog.style.borderRadius = '0.25em';
      prog.style.width = i < currentInnerIndex ? '100%' : '0%';
      prog.style.transition = 'none';
      bullet.appendChild(prog);
      bullet.addEventListener('click', () => {
        clearTimeout(autoProgressTimeout);
        currentInnerIndex = i;
        updateInnerSlide();
      });
      paginationWrapper.appendChild(bullet);
    });

    progressRemaining = SLIDE_DURATION;
    progressStartTime = Date.now();
    isPaused = false;

    const activeProg = paginationWrapper.children[currentInnerIndex]?.querySelector('.progress-bar');
    if (activeProg) {
      activeProg.style.transition = 'none';
      activeProg.style.width = '0%';
      activeProg.offsetWidth;
      activeProg.style.transition = `width ${SLIDE_DURATION}ms linear`;
      activeProg.style.width = '100%';
    }

    autoProgressTimeout = setTimeout(goNext, SLIDE_DURATION);
  }

  function pauseProgress() {
    if (!isPaused) {
      clearTimeout(autoProgressTimeout);
      const elapsed = Date.now() - progressStartTime;
      progressRemaining = Math.max(0, SLIDE_DURATION - elapsed);
      const activeProg = paginationWrapper.children[currentInnerIndex]?.querySelector('.progress-bar');
      if (activeProg) {
        activeProg.style.transition = 'none';
        activeProg.style.width = `${(elapsed / SLIDE_DURATION) * 100}%`;
      }
      navWrapper.style.opacity = '0';
      isPaused = true;
    }
  }

  function resumeProgress() {
    if (isPaused) {
      const activeProg = paginationWrapper.children[currentInnerIndex]?.querySelector('.progress-bar');
      if (activeProg) {
        activeProg.style.transition = `width ${progressRemaining}ms linear`;
        activeProg.offsetWidth;
        activeProg.style.width = '100%';
      }
      progressStartTime = Date.now();
      autoProgressTimeout = setTimeout(goNext, progressRemaining);
      navWrapper.style.opacity = '1';
      isPaused = false;
    }
  }

  let startX = 0;
  storiesWrapper.addEventListener('pointerdown', e => {
    if (!storySlides[currentStoryIndex].contains(e.target)) return;
    startX = e.clientX;
    pauseProgress();
  });
  storiesWrapper.addEventListener('pointerup', e => {
    if (!storySlides[currentStoryIndex].contains(e.target)) {
      resumeProgress();
      return;
    }
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 40) {
      diff < 0 ? goNext() : goPrev();
    } else {
      openActiveLink();
    }
    resumeProgress();
  });
  storiesWrapper.addEventListener('pointercancel', resumeProgress);

  function openActiveLink() {
    const slide = storySlides[currentStoryIndex];
    const url = slide.dataset.url || slide.querySelector('a')?.href;
    if (url) window.location.href = url;
  }

  function goNext() {
    const innerCount = storySlides[currentStoryIndex].querySelectorAll('.inner-slide').length;
    if (currentInnerIndex < innerCount - 1) {
      currentInnerIndex++;
      updateInnerSlide();
    } else if (currentStoryIndex < storySlides.length - 1) {
      currentStoryIndex++;
      currentInnerIndex = 0;
      navWrapper.style.opacity = '0';
      updateSlidesStyle();
      requestAnimationFrame(() => {
        centerStory();
        navWrapper.style.opacity = '1';
      });
    }
  }
  function goPrev() {
    if (currentInnerIndex > 0) {
      currentInnerIndex--;
      updateInnerSlide();
    } else if (currentStoryIndex > 0) {
      currentStoryIndex--;
      const prevCount = storySlides[currentStoryIndex].querySelectorAll('.inner-slide').length;
      currentInnerIndex = prevCount - 1;
      navWrapper.style.opacity = '0';
      updateSlidesStyle();
      requestAnimationFrame(() => {
        centerStory();
        navWrapper.style.opacity = '1';
      });
    }
  }

  btnNext.addEventListener('click', () => {
    clearTimeout(autoProgressTimeout);
    goNext();
  });

  btnPrev.addEventListener('click', () => {
    clearTimeout(autoProgressTimeout);
    goPrev();
  });

  btnClose.addEventListener('click', () => {
    clearTimeout(autoProgressTimeout);
    modal.style.display = 'none';
  });
});