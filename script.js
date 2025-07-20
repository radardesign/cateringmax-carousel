// Stories Modal System
class StoriesModal {
  constructor() {
    this.modal = document.querySelector('.eventsmodalwindowswrapper');
    this.storiesWrapper = document.querySelector('.storieswrapper');
    this.storiesContainer = document.querySelector('.swiper-wrapper.stories');
    this.pagination = document.querySelector('.pagination');
    this.closeBtn = document.querySelector('.closemodal');
    this.prevBtn = document.querySelector('.inner-prev');
    this.nextBtn = document.querySelector('.inner-next');
    this.navigation = document.querySelector('.eventsmodalnavigation');
    
    this.currentStoryIndex = 0;
    this.currentPhotoIndex = 0;
    this.stories = [];
    this.autoProgressTimer = null;
    this.progressAnimationTimer = null;
    this.isMobile = window.innerWidth <= 479;
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.progressStartTime = 0;
    
    this.init();
  }

  init() {
    this.collectStories();
    this.bindEvents();
    this.setupResponsive();
  }

  collectStories() {
    const storySlides = document.querySelectorAll('.swiper-slide.story-slide');
    this.stories = Array.from(storySlides).map((slide, index) => {
      const eventId = slide.querySelector('.eventid-in')?.textContent?.trim();
      const photos = Array.from(slide.querySelectorAll('.swiper-slide.inner-slide'));
      return {
        element: slide,
        eventId,
        photos,
        index
      };
    });
  }

  bindEvents() {
    // Открытие модального окна
    document.querySelectorAll('.swiper-slide.events').forEach(eventSlide => {
      eventSlide.addEventListener('click', (e) => {
        const eventId = eventSlide.querySelector('.eventid-out')?.textContent?.trim();
        console.log('Clicked event ID:', eventId); // Для отладки
        this.openModal(eventId);
      });
    });

    // Закрытие модального окна
    this.closeBtn?.addEventListener('click', () => this.closeModal());

    // Навигация
    this.prevBtn?.addEventListener('click', () => this.navigatePrev());
    this.nextBtn?.addEventListener('click', () => this.navigateNext());

    // Responsive
    window.addEventListener('resize', () => this.setupResponsive());

    // Swipe для мобильных
    this.setupSwipeGestures();

    // Пауза при удержании
    this.setupPauseGestures();
  }

  setupSwipeGestures() {
    if (!this.isMobile) return;

    let startX = 0;
    let startY = 0;
    let isSwipe = false;

    this.modal.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipe = false;
    });

    this.modal.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;

      const diffX = Math.abs(e.touches[0].clientX - startX);
      const diffY = Math.abs(e.touches[0].clientY - startY);

      if (diffX > diffY && diffX > 50) {
        isSwipe = true;
        e.preventDefault();
      }
    });

    this.modal.addEventListener('touchend', (e) => {
      if (!isSwipe || !startX) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;

      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left - следующая история
          this.navigateToStory(this.currentStoryIndex + 1);
        } else {
          // Swipe right - предыдущая история
          this.navigateToStory(this.currentStoryIndex - 1);
        }
      }

      startX = 0;
      startY = 0;
      isSwipe = false;
    });
  }

  setupPauseGestures() {
    // Для мыши
    this.modal.addEventListener('mousedown', (e) => {
      // Проверяем, что клик не по кнопкам навигации
      if (e.target.closest('.eventsmodalnavigation')) return;
      this.pauseProgress();
    });

    document.addEventListener('mouseup', () => {
      if (this.isPaused) {
        this.resumeProgress();
      }
    });

    // Для тач-устройств
    this.modal.addEventListener('touchstart', (e) => {
      // Проверяем, что тач не по кнопкам навигации
      if (e.target.closest('.eventsmodalnavigation')) return;
      this.pauseProgress();
    });

    document.addEventListener('touchend', () => {
      if (this.isPaused) {
        this.resumeProgress();
      }
    });
  }

  pauseProgress() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    
    // Останавливаем автопрогресс
    this.stopAutoProgress();
    
    // Скрываем навигацию
    if (this.navigation) {
      this.navigation.style.opacity = '0';
      this.navigation.style.transition = 'opacity 300ms ease';
    }
    
    // Останавливаем анимацию progress-bar
    const currentBullet = this.pagination.children[this.currentPhotoIndex];
    if (currentBullet) {
      const progressBar = currentBullet.querySelector('.progress-bar');
      const computedStyle = window.getComputedStyle(progressBar);
      const currentWidth = computedStyle.width;
      progressBar.style.width = currentWidth;
      progressBar.style.transition = 'none';
    }
  }

  resumeProgress() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    
    // Показываем навигацию
    if (this.navigation) {
      this.navigation.style.opacity = '1';
    }
    
    // Вычисляем оставшееся время
    const pauseDuration = Date.now() - this.pauseStartTime;
    const elapsed = Date.now() - this.progressStartTime;
    const remaining = Math.max(0, 5000 - elapsed);
    
    // Возобновляем прогресс
    this.startAutoProgress(remaining);
    
    // Возобновляем анимацию progress-bar
    const currentBullet = this.pagination.children[this.currentPhotoIndex];
    if (currentBullet) {
      const progressBar = currentBullet.querySelector('.progress-bar');
      const remainingSeconds = remaining / 1000;
      progressBar.style.transition = `width ${remainingSeconds}s linear`;
      progressBar.style.width = '100%';
    }
  }

  setupResponsive() {
    this.isMobile = window.innerWidth <= 479;
  }

  openModal(eventId) {
    console.log('Opening modal for event ID:', eventId); // Для отладки
    console.log('Available stories:', this.stories.map(s => s.eventId)); // Для отладки
    
    // Найти соответствующую историю
    const storyIndex = this.stories.findIndex(story => story.eventId === eventId);
    console.log('Found story index:', storyIndex); // Для отладки
    
    if (storyIndex === -1) {
      console.error('Story not found for event ID:', eventId);
      return;
    }

    this.currentStoryIndex = storyIndex;
    this.currentPhotoIndex = 0;

    // Показать модальное окно
    this.modal.style.display = 'flex';
    
    // Настроить истории
    this.setupStories();
    this.updatePagination();
    this.updateNavigation();
    this.startAutoProgress();

    // Добавить анимацию появления
    setTimeout(() => {
      this.modal.style.opacity = '1';
    }, 10);
  }

  closeModal() {
    this.stopAutoProgress();
    this.modal.style.display = 'none';
    this.modal.style.opacity = '0';
    this.isPaused = false;
  }

  setupStories() {
    this.stories.forEach((story, index) => {
      const isActive = index === this.currentStoryIndex;
      const storyElement = story.element;
      
      if (this.isMobile) {
        // На мобильных: активная история на весь экран, остальные скрыты
        if (isActive) {
          storyElement.style.width = '100vw';
          storyElement.style.transform = 'translateX(0)';
          storyElement.style.opacity = '1';
          storyElement.style.zIndex = '10';
        } else {
          storyElement.style.opacity = '0';
          storyElement.style.transform = `translateX(${index < this.currentStoryIndex ? '-100vw' : '100vw'})`;
          storyElement.style.zIndex = '1';
        }
      } else {
        // На десктопе: все истории видны, активная выделена
        storyElement.style.opacity = '1';
        storyElement.style.transform = 'translateX(0)';
        storyElement.style.zIndex = isActive ? '10' : '5';
        
        // Добавляем обработчик клика для неактивных историй
        if (!isActive) {
          storyElement.style.cursor = 'pointer';
          storyElement.onclick = () => this.navigateToStory(index);
        } else {
          storyElement.style.cursor = 'default';
          storyElement.onclick = null;
        }
      }

      // Показать/скрыть overlay для неактивных историй
      const overlay = storyElement.querySelector('.stories-overlay');
      if (overlay) {
        overlay.style.display = isActive ? 'none' : 'block';
      }

      // Настроить фото внутри истории
      this.setupPhotosInStory(story, index === this.currentStoryIndex);
      
      // Анимация
      storyElement.style.transition = 'all 300ms ease';
    });
  }

  navigateToStory(storyIndex) {
    if (storyIndex < 0 || storyIndex >= this.stories.length) return;
    if (storyIndex === this.currentStoryIndex) return;

    this.stopAutoProgress();
    this.currentStoryIndex = storyIndex;
    this.currentPhotoIndex = 0;
    
    this.setupStories();
    this.updatePagination();
    this.updateNavigation();
    this.startAutoProgress();
  }

  setupPhotosInStory(story, isActive) {
    story.photos.forEach((photo, photoIndex) => {
      if (isActive) {
        photo.style.transform = `translateX(${(photoIndex - this.currentPhotoIndex) * 100}%)`;
        photo.style.opacity = photoIndex === this.currentPhotoIndex ? '1' : '0';
      } else {
        photo.style.transform = 'translateX(0)';
        photo.style.opacity = '1';
      }
      photo.style.transition = 'all 300ms ease';
    });
  }

  updatePagination() {
    const currentStory = this.stories[this.currentStoryIndex];
    if (!currentStory) return;

    // Очистить существующие буллеты
    this.pagination.innerHTML = '';

    // Создать буллеты для текущей истории
    currentStory.photos.forEach((photo, index) => {
      const bullet = document.createElement('div');
      bullet.className = 'pagination-bullet';
      bullet.style.cursor = 'pointer';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      bullet.appendChild(progressBar);
      this.pagination.appendChild(bullet);

      // Обработчик клика на буллет
      bullet.addEventListener('click', () => {
        this.stopAutoProgress();
        this.currentPhotoIndex = index;
        this.updateStoryPhoto();
        this.updatePagination();
        this.updateNavigation();
        this.startAutoProgress();
      });
    });

    this.updateProgressBars();
  }

  updateProgressBars() {
    const bullets = this.pagination.querySelectorAll('.pagination-bullet');
    bullets.forEach((bullet, index) => {
      const progressBar = bullet.querySelector('.progress-bar');
      if (index < this.currentPhotoIndex) {
        // Уже просмотренные фото - 100%
        progressBar.style.width = '100%';
        progressBar.style.transition = 'none';
      } else if (index === this.currentPhotoIndex) {
        // Текущее фото - анимация от 0 до 100%
        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 5s linear';
        this.progressStartTime = Date.now();
        setTimeout(() => {
          if (!this.isPaused) {
            progressBar.style.width = '100%';
          }
        }, 10);
      } else {
        // Будущие фото - 0%
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
      }
    });
  }

  updateStoryPhoto() {
    const currentStory = this.stories[this.currentStoryIndex];
    if (!currentStory) return;

    currentStory.photos.forEach((photo, photoIndex) => {
      photo.style.transform = `translateX(${(photoIndex - this.currentPhotoIndex) * 100}%)`;
      photo.style.opacity = photoIndex === this.currentPhotoIndex ? '1' : '0';
    });
  }

  updateNavigation() {
    const currentStory = this.stories[this.currentStoryIndex];
    const isFirstPhoto = this.currentPhotoIndex === 0;
    const isLastPhoto = this.currentPhotoIndex === currentStory.photos.length - 1;
    const isFirstStory = this.currentStoryIndex === 0;
    const isLastStory = this.currentStoryIndex === this.stories.length - 1;

    // Показать/скрыть кнопки
    if (isFirstPhoto && isFirstStory) {
      this.prevBtn.style.opacity = '0';
      this.prevBtn.style.pointerEvents = 'none';
    } else {
      this.prevBtn.style.opacity = '1';
      this.prevBtn.style.pointerEvents = 'auto';
    }

    if (isLastPhoto && isLastStory) {
      this.nextBtn.style.opacity = '0';
      this.nextBtn.style.pointerEvents = 'none';
    } else {
      this.nextBtn.style.opacity = '1';
      this.nextBtn.style.pointerEvents = 'auto';
    }
  }

  navigateNext() {
    this.stopAutoProgress();
    
    const currentStory = this.stories[this.currentStoryIndex];
    const isLastPhoto = this.currentPhotoIndex === currentStory.photos.length - 1;
    
    if (isLastPhoto) {
      // Переход к следующей истории
      if (this.currentStoryIndex < this.stories.length - 1) {
        this.currentStoryIndex++;
        this.currentPhotoIndex = 0;
        this.setupStories();
        this.updatePagination();
      }
    } else {
      // Переход к следующему фото
      this.currentPhotoIndex++;
      this.updateStoryPhoto();
      this.updateProgressBars();
    }
    
    this.updateNavigation();
    this.startAutoProgress();
  }

  navigatePrev() {
    this.stopAutoProgress();
    
    const isFirstPhoto = this.currentPhotoIndex === 0;
    
    if (isFirstPhoto) {
      // Переход к предыдущей истории
      if (this.currentStoryIndex > 0) {
        this.currentStoryIndex--;
        const prevStory = this.stories[this.currentStoryIndex];
        this.currentPhotoIndex = prevStory.photos.length - 1;
        this.setupStories();
        this.updatePagination();
      }
    } else {
      // Переход к предыдущему фото
      this.currentPhotoIndex--;
      this.updateStoryPhoto();
      this.updateProgressBars();
    }
    
    this.updateNavigation();
    this.startAutoProgress();
  }

  startAutoProgress(customDuration = 5000) {
    this.stopAutoProgress();
    
    this.autoProgressTimer = setTimeout(() => {
      if (!this.isPaused) {
        this.navigateNext();
      }
    }, customDuration);
  }

  stopAutoProgress() {
    if (this.autoProgressTimer) {
      clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
  }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Небольшая задержка для корректной инициализации Swiper
  setTimeout(() => {
    window.storiesModal = new StoriesModal();
  }, 100);
});

// Инициализация при изменении размера окна
window.addEventListener('resize', () => {
  if (window.storiesModal) {
    window.storiesModal.setupResponsive();
  }
});