window.initEventsCarousel = function () {
// Scoped REM
function updateScopedRem() {
    const wrapper = document.querySelector(".eventscarouselwrapper");
    const modal = document.querySelector(".eventsmodalwindowswrapper");
    if (!wrapper) return;
    let rem;
    if (window.innerWidth < 600) {
        rem = 16;
    } else {
        rem = Math.max(window.innerWidth / 1920 * 19.05, 12);
    }
    wrapper.style.fontSize = rem + "px";
    if (modal) modal.style.fontSize = rem + "px";
}

window.addEventListener("DOMContentLoaded", updateScopedRem);
window.addEventListener("resize", updateScopedRem);

// Swiper Init
window.addEventListener("DOMContentLoaded", () => {
    new Swiper('.swiper.swiper-events', {
        loop: false,
        slidesOffsetBefore: 32,
        slidesOffsetAfter: 32,
        slidesPerView: 'auto',
        navigation: {
            nextEl: '.events-button-next',
            prevEl: '.events-button-prev'
        }
    });
});

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

    // Убедимся что модальное окно изначально скрыто
    modal.style.display = 'none';

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
        transition: 'opacity 0.5s ease, pointer-events 0.5s ease',
        pointerEvents: 'auto'
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

    // Обработчик для прямых кликов по слайдам событий
    eventSlides.forEach((slide, idx) => {
        slide.addEventListener('click', e => {
            // Проверяем, был ли клик по eventid-out
            const eventIdOutElement = e.target.closest('[eventid-out], .eventid-out');
            if (eventIdOutElement && !eventIdOutElement.classList.contains('w-dyn-bind-empty')) {
                const eventId = eventIdOutElement.getAttribute('eventid-out') || eventIdOutElement.dataset.eventidOut;
                if (eventId) {
                    // Ищем соответствующую историю с eventid-in
                    const matchIndex = storySlides.findIndex(story => {
                        const inId = story.getAttribute('eventid-in') || story.dataset.eventidIn;
                        return inId === eventId && !story.querySelector('.eventid-in').classList.contains('w-dyn-bind-empty');
                    });
                    if (matchIndex !== -1) {
                        e.preventDefault();
                        e.stopPropagation();
                        openStory(matchIndex);
                        return;
                    }
                }
            }
            // Если не нашли eventid-out или не нашли соответствующий eventid-in, открываем историю по индексу слайда
            openStory(idx);
        });
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
            // Добавляем cursor: pointer для неактивных историй
            s.style.cursor = idx === currentStoryIndex ? '' : 'pointer';
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
            navWrapper.style.pointerEvents = 'none';
            navWrapper.style.opacity = '0';
            isPaused = true;
        }
    }

    function resumeProgress() {
        if (isPaused) {
            const activeProg = paginationWrapper.children[currentInnerIndex]?.querySelector('.progress-bar');
            if (activeProg) {
                activeProg.style.transition = `width ${progressRemaining}ms linear`;
                activeProg.offsetHeight; // Force reflow
                activeProg.style.width = '100%';
            }
            progressStartTime = Date.now();
            autoProgressTimeout = setTimeout(goNext, progressRemaining);
            navWrapper.style.opacity = '1';
            navWrapper.style.pointerEvents = 'auto';
            isPaused = false;
        }
    }

    let startX = 0;
    let isNavigationInteraction = false;

    // Функция для проверки, является ли элемент частью навигации
    function isNavigationElement(element) {
        return element.closest('.inner-prev') ||
            element.closest('.inner-next') ||
            element.closest('.pagination-bullet') ||
            element.closest('.closemodal');
    }

    // Обработчики для navWrapper
    navWrapper.addEventListener('pointerdown', e => {
        if (!isNavigationElement(e.target)) {
            pauseProgress();
        }
        isNavigationInteraction = isNavigationElement(e.target);
    });

    navWrapper.addEventListener('pointerup', e => {
        if (!isNavigationElement(e.target) && !isNavigationInteraction) {
            resumeProgress();
        }
        isNavigationInteraction = false;
    });

    // Обработчики для storiesWrapper
    storiesWrapper.addEventListener('click', e => {
        const clickedSlide = e.target.closest('.swiper-slide.story-slide');
        if (clickedSlide && !clickedSlide.contains(storySlides[currentStoryIndex])) {
            const newIndex = storySlides.indexOf(clickedSlide);
            if (newIndex !== -1) {
                currentStoryIndex = newIndex;
                currentInnerIndex = 0;
                updateSlidesStyle();
                centerStory();
            }
        }
    });

    let isActiveStoryInteraction = false;
    let isPointerDown = false;

    storiesWrapper.addEventListener('pointerdown', e => {
        const activeStory = storySlides[currentStoryIndex];
        const isClickOnActive = activeStory.contains(e.target);

        if (isClickOnActive) {
            isActiveStoryInteraction = true;
            isPointerDown = true;
            startX = e.clientX;
            pauseProgress();
            document.addEventListener('pointermove', handlePointerMove);
        }
    });

    function handlePointerMove(e) {
        if (!isPointerDown) return;
    }

    function handleGlobalPointerUp(e) {
        if (!isPointerDown) return;

        document.removeEventListener('pointermove', handlePointerMove);

        const diff = e.clientX - startX;
        const activeStory = storySlides[currentStoryIndex];

        if (isActiveStoryInteraction) {
            if (Math.abs(diff) > 40) {
                diff < 0 ? goNext() : goPrev();
            } else if (activeStory.contains(e.target)) {
                openActiveLink();
            }
        }

        // ✅ ВСЕГДА возобновляем
        resumeProgress();

        isPointerDown = false;
        isActiveStoryInteraction = false;
    }

    function handlePointerCancel() {
        if (isPointerDown) {
            isPointerDown = false;
            isActiveStoryInteraction = false;
            resumeProgress();
        }
    }

    // Слушаем глобально
    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

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
};

(function disableModularLoadTransitions() {
  const tryPatch = () => {
    // ищем модуль Load
    const app = window.app;
    const load = app?.modules?.Load;

    if (load?.load?.goTo) {
      load.load.goTo = function (...args) {
        console.warn('[BLOCKED] ModularLoad goTo() вызов отменён:', ...args);
        // Альтернатива — обычный переход:
        // window.location.href = args[0];
      };
      console.log('[PATCHED] ModularLoad transitions отключены');
    } else {
      setTimeout(tryPatch, 300);
    }
  };

  tryPatch();
})();

