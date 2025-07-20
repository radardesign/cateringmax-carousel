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
    
    this.currentStoryIndex = 0;
    this.currentPhotoIndex = 0;
    this.stories = [];
    this.autoProgressTimer = null;
    this.progressAnimationTimer = null;
    this.isMobile = window.innerWidth <= 479;
    
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
  }

  setupResponsive() {
    this.isMobile = window.innerWidth <= 479;
  }

  openModal(eventId) {
    // Найти соответствующую историю
    const storyIndex = this.stories.findIndex(story => story.eventId === eventId);
    if (storyIndex === -1) return;

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
  }

  setupStories() {
    const containerWidth = this.storiesContainer.offsetWidth;
    const activeStoryWidth = this.isMobile ? window.innerWidth : parseFloat(getComputedStyle(document.documentElement).fontSize) * 26.25;
    const inactiveStoryWidth = this.isMobile ? 0 : activeStoryWidth * (18.75 / 26.25);
    const storyMargin = this.isMobile ? 0 : parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.5;

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
        // На десктопе: центрирование активной истории
        const width = isActive ? activeStoryWidth : inactiveStoryWidth;
        storyElement.style.width = `${width}px`;
        
        // Вычисляем позицию для центрирования активной истории
        const totalWidth = this.stories.length * inactiveStoryWidth + (activeStoryWidth - inactiveStoryWidth) + (this.stories.length - 1) * storyMargin;
        const startX = (containerWidth - totalWidth) / 2;
        
        let translateX = startX;
        for (let i = 0; i < index; i++) {
          translateX += (i === this.currentStoryIndex ? activeStoryWidth : inactiveStoryWidth) + storyMargin;
        }
        
        storyElement.style.transform = `translateX(${translateX}px)`;
        storyElement.style.opacity = '1';
        storyElement.style.zIndex = isActive ? '10' : '1';
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
        setTimeout(() => {
          progressBar.style.width = '100%';
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

  startAutoProgress() {
    this.stopAutoProgress();
    
    this.autoProgressTimer = setTimeout(() => {
      this.navigateNext();
    }, 5000);
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
    new StoriesModal();
  }, 100);
});

// Инициализация при изменении размера окна
window.addEventListener('resize', () => {
  // Пересоздаем экземпляр при изменении ориентации на мобильных
  if (window.storiesModal) {
    window.storiesModal.setupResponsive();
  }
});