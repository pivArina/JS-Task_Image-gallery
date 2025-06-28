document.addEventListener('DOMContentLoaded', () => {
  if (!window.UNSPLASH_CONFIG?.ACCESS_KEY) {
    showFatalError('API key not configured');
    return;
  }

  const AppConfig = {
    DEFAULT_PHOTO_COUNT: 12,
    THEMES: ['light', 'dark', 'color']
  };

  const DOM = {
    gallery: document.getElementById("gallery"),
    modal: document.getElementById("modal"),
    modalImg: document.getElementById("modal-img"),
    closeBtn: document.querySelector(".close"),
    searchInput: document.querySelector(".content__input"),
    searchForm: document.querySelector(".search-form"),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('.theme-icon')
  };

  const AppState = {
    allPhotos: [],
    filteredPhotos: [],
    currentIndex: 0,
    currentTheme: localStorage.getItem('theme') || 'light',
    scrollPosition: 0
  };

  function initTheme() {
    document.documentElement.setAttribute('data-theme', AppState.currentTheme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const icons = {
      'light': '🌙',
      'dark': '☀️',
      'color': '🌈'
    };
    DOM.themeIcon.textContent = icons[AppState.currentTheme] || '🌙';
  }

  function toggleTheme() {
    const currentIndex = AppConfig.THEMES.indexOf(AppState.currentTheme);
    const nextIndex = (currentIndex + 1) % AppConfig.THEMES.length;
    AppState.currentTheme = AppConfig.THEMES[nextIndex];

    document.documentElement.setAttribute('data-theme', AppState.currentTheme);
    localStorage.setItem('theme', AppState.currentTheme);
    updateThemeIcon();
  }

  async function fetchPhotos() {
    try {
      const url = `${window.UNSPLASH_CONFIG.API_URL}/photos/random?count=${AppConfig.DEFAULT_PHOTO_COUNT}&client_id=${window.UNSPLASH_CONFIG.ACCESS_KEY}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      AppState.allPhotos = await response.json();
      AppState.filteredPhotos = [...AppState.allPhotos];
      displayPhotos();
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
      showErrorMessage();
    }
  }

  function showErrorMessage() {
    DOM.gallery.innerHTML = `
      <div class="error-message">
        <p>Не удалось загрузить фотографии.</p>
        <button class="retry-btn">Попробовать снова</button>
      </div>
    `;
    document.querySelector('.retry-btn').addEventListener('click', fetchPhotos);
  }

  function showFatalError(message) {
    document.body.innerHTML = `
      <div style="color: red; padding: 20px; font-family: Arial;">
        <h2>Critical Error</h2>
        <p>${message}</p>
      </div>
    `;
    throw new Error(message);
  }

  function displayPhotos() {
    DOM.gallery.innerHTML = AppState.filteredPhotos
      .map((photo, index) => `
        <div class="photo-card">
          <img 
            src="${photo.urls.regular}" 
            alt="Фото ${index + 1}" 
            data-index="${index}"
            loading="lazy"
          >
        </div>
      `)
      .join("");

    document.querySelectorAll('.photo-card img').forEach(img => {
      img.addEventListener('click', () => openModal(parseInt(img.dataset.index)));
    });
  }

  function searchPhotos(e) {
    e.preventDefault();
    const searchTerm = DOM.searchInput.value.trim().toLowerCase();

    if (!searchTerm) {
      AppState.filteredPhotos = [...AppState.allPhotos];
      displayPhotos();
      return;
    }

    AppState.filteredPhotos = AppState.allPhotos.filter(photo => {
      const description = photo.alt_description?.toLowerCase() || '';
      const tags = photo.tags?.map(tag => tag.title.toLowerCase()) || [];
      return description.includes(searchTerm) || tags.some(tag => tag.includes(searchTerm));
    });

    displayPhotos();
  }

  let isModalOpen = false;
  let scrollPosition = 0;

  function openModal(index) {
    if (isModalOpen) return;

    isModalOpen = true;
    AppState.currentIndex = index;

    DOM.modalImg.src = AppState.filteredPhotos[index].urls.full;
    DOM.modalImg.alt = AppState.filteredPhotos[index].alt_description || "Фото";

    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.cssText = `
    overflow: hidden;
    position: fixed;
    top: -${scrollPosition}px;
    width: 100%;
  `;

    DOM.modal.style.display = "flex";
  }

  function closeModal() {
    if (!isModalOpen) return;

    isModalOpen = false;
    DOM.modal.style.display = "none";

    document.body.style.cssText = '';
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
  }

  function updateModalImage() {
    DOM.modalImg.src = AppState.filteredPhotos[AppState.currentIndex].urls.full;
    DOM.modalImg.alt = AppState.filteredPhotos[AppState.currentIndex].alt_description || "Фото";
  }

  function navigateImage(direction) {
    const step = direction === 'next' ? 1 : -1;
    AppState.currentIndex = (AppState.currentIndex + step + AppState.filteredPhotos.length) % AppState.filteredPhotos.length;
    updateModalImage();
  }

  function createNavigationButtons() {
    const prevBtn = document.createElement("button");
    const nextBtn = document.createElement("button");

    prevBtn.innerHTML = "&larr;";
    prevBtn.className = "nav-btn prev-btn";
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateImage('prev');
    });

    nextBtn.innerHTML = "&rarr;";
    nextBtn.className = "nav-btn next-btn";
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateImage('next');
    });

    DOM.modal.append(prevBtn, nextBtn);
  }

  function init() {
    createNavigationButtons();
    initTheme();

    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.closeBtn.addEventListener('click', closeModal);

    DOM.searchForm.addEventListener('submit', searchPhotos);

    DOM.modal.addEventListener('click', (e) => {
      if (e.target === DOM.modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (DOM.modal.style.display === "flex") {
        switch (e.key) {
          case "ArrowLeft": navigateImage('prev'); break;
          case "ArrowRight": navigateImage('next'); break;
          case "Escape": closeModal(); break;
        }
      }
    });

    fetchPhotos();
  }

  init();
});