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

  const targetEm = 18.75;
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const targetPx = targetEm * rootFontSize;

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
    updateSlidesStyle();
    requestAnimationFrame(() => requestAnimationFrame(centerStory));
  }

  eventSlides.forEach((slide, idx) => {
    slide.addEventListener('click', () => openStory(idx));
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
      s.style.transition = 'width 0.5s ease';
      s.style.width = idx === currentStoryIndex ? '' : `${targetPx}px`;
    });
  }

  function centerStory() {
    // Сброс трансформа для точных вычислений
    storiesWrapper.style.transition = 'none';
    storiesWrapper.style.transform = 'translateX(0)';
    storySlides.forEach(s => {
      const inner = s.querySelector('.inner-swiper .swiper-wrapper');
      if (inner) {
        inner.style.transition = 'none';
        inner.style.transform = 'translateX(0)';
      }
    });
    storiesWrapper.offsetHeight; // reflow

    // Границы контейнера и активного слайда
    const container = storiesWrapper.parentElement;
    const cRect = container.getBoundingClientRect();
    const active = storySlides[currentStoryIndex];
    const aRect = active.getBoundingClientRect();

    // Центры
    const containerCenter = cRect.left + cRect.width / 2;
    const activeCenter = aRect.left + aRect.width / 2;
    const shift = containerCenter - activeCenter;

    storiesWrapper.style.transition = 'transform 0.5s ease';
    storiesWrapper.style.transform = `translateX(${shift}px)`;

    updateInnerSlide();
    // navWrapper.style.opacity = '1'; // теперь показываем после окончания transform
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
      isPaused = false;
    }
  }

  storiesWrapper.addEventListener('pointerdown', e => {
    if (storySlides[currentStoryIndex].contains(e.target)) pauseProgress();
  });
  document.addEventListener('pointerup', resumeProgress);

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
      const active = storySlides[currentStoryIndex];
      active.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'width') {
          active.removeEventListener('transitionend', handler);
          centerStory();
          navWrapper.style.opacity = '1';
        }
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
      const active = storySlides[currentStoryIndex];
      active.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'width') {
          active.removeEventListener('transitionend', handler);
          centerStory();
          navWrapper.style.opacity = '1';
        }
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