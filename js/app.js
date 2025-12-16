/**
 * CineVault - İnteraktif Medya Kitaplığı
 * Modern JavaScript (ES6+) ile SPA Uygulaması
 * 
 * Özellikler:
 * - Fetch API ile JSON veri çekme
 * - localStorage ile favori yönetimi
 * - SPA mantığı (tek sayfa, dinamik içerik)
 * - Arama ve filtreleme
 * - Responsive grid/list görünümü
 */

// ==================== Constants & Configuration ====================
const CONFIG = {
    dataPath: './data/media.json',
    storageKeys: {
        favorites: 'cinevault_favorites',
        viewMode: 'cinevault_view_mode'
    },
    debounceDelay: 300,
    toastDuration: 3000
};

// ==================== State Management ====================
const state = {
    allMedia: [],
    filteredMedia: [],
    favorites: [],
    currentPage: 'home',
    viewMode: 'grid',
    filters: {
        search: '',
        genre: '',
        year: '',
        type: '',
        sort: 'rating-desc'
    },
    isLoading: true
};

// ==================== DOM Elements ====================
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav__link'),
    navToggle: document.querySelector('.nav__toggle'),
    navMenu: document.querySelector('.nav__menu'),
    favoritesCount: document.querySelector('.favorites-count'),
    
    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    searchClear: document.querySelector('.search-clear'),
    genreFilter: document.getElementById('genreFilter'),
    yearFilter: document.getElementById('yearFilter'),
    typeFilter: document.getElementById('typeFilter'),
    sortFilter: document.getElementById('sortFilter'),
    clearFiltersBtn: document.getElementById('clearFilters'),
    viewBtns: document.querySelectorAll('.view-btn'),
    
    // Results
    resultsCount: document.getElementById('resultsCount'),
    mediaGrid: document.getElementById('mediaGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    browseCatalogBtn: document.getElementById('browseCatalog'),
    
    // Modal
    modal: document.getElementById('detailModal'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalPoster: document.getElementById('modalPoster'),
    modalType: document.getElementById('modalType'),
    modalTitle: document.getElementById('modalTitle'),
    modalOriginalTitle: document.getElementById('modalOriginalTitle'),
    modalRating: document.getElementById('modalRating'),
    modalYear: document.getElementById('modalYear'),
    modalDuration: document.getElementById('modalDuration'),
    modalGenres: document.getElementById('modalGenres'),
    modalPlot: document.getElementById('modalPlot'),
    modalDirector: document.getElementById('modalDirector'),
    modalCast: document.getElementById('modalCast'),
    modalFavoriteBtn: document.getElementById('modalFavoriteBtn'),
    modalClose: document.querySelector('.modal__close'),
    modalOverlay: document.querySelector('.modal__overlay'),
    
    // Toast
    toast: document.getElementById('toast'),
    
    // Hero
    hero: document.querySelector('.hero'),
    filters: document.querySelector('.filters')
};

// ==================== Utility Functions ====================

/**
 * Debounce fonksiyonu - Performans için
 * @param {Function} func - Çalıştırılacak fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {Function}
 */
const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Toast notification göster
 * @param {string} message - Mesaj
 * @param {string} type - 'success' veya 'error'
 */
const showToast = (message, type = 'success') => {
    const { toast } = elements;
    const icon = type === 'success' ? '✓' : '✕';
    
    toast.querySelector('.toast__icon').textContent = icon;
    toast.querySelector('.toast__message').textContent = message;
    toast.className = `toast toast--${type}`;
    toast.hidden = false;
    
    // Trigger reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.hidden = true;
        }, 400);
    }, CONFIG.toastDuration);
};

/**
 * LocalStorage'dan veri oku
 * @param {string} key - Storage key
 * @param {*} defaultValue - Varsayılan değer
 * @returns {*}
 */
const getFromStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('LocalStorage okuma hatası:', error);
        return defaultValue;
    }
};

/**
 * LocalStorage'a veri yaz
 * @param {string} key - Storage key
 * @param {*} value - Değer
 */
const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('LocalStorage yazma hatası:', error);
    }
};

// ==================== Data Fetching ====================

/**
 * JSON dosyasından medya verilerini çek
 * @returns {Promise<Array>}
 */
const fetchMediaData = async () => {
    try {
        console.log('Veri yükleniyor:', CONFIG.dataPath);
        const response = await fetch(CONFIG.dataPath);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Yüklenen medya sayısı:', data.media?.length || 0);
        return data.media || [];
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        showToast('Veriler yüklenirken bir hata oluştu!', 'error');
        // Loading'i gizle hata durumunda da
        elements.loading.hidden = true;
        elements.emptyState.hidden = false;
        return [];
    }
};

// ==================== Filter & Sort Functions ====================

/**
 * Benzersiz türleri çıkar
 * @param {Array} media - Medya listesi
 * @returns {Array}
 */
const extractUniqueGenres = (media) => {
    const genres = new Set();
    media.forEach(item => {
        item.genre.forEach(g => genres.add(g));
    });
    return [...genres].sort();
};

/**
 * Benzersiz yılları çıkar
 * @param {Array} media - Medya listesi
 * @returns {Array}
 */
const extractUniqueYears = (media) => {
    const years = new Set(media.map(item => item.year));
    return [...years].sort((a, b) => b - a);
};

/**
 * Medyaları filtrele
 * @param {Array} media - Medya listesi
 * @param {Object} filters - Filtre kriterleri
 * @returns {Array}
 */
const filterMedia = (media, filters) => {
    return media.filter(item => {
        // Arama filtresi
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesTitle = item.title.toLowerCase().includes(searchTerm);
            const matchesTitleTr = item.titleTr.toLowerCase().includes(searchTerm);
            const matchesDirector = item.director.toLowerCase().includes(searchTerm);
            const matchesCast = item.cast.some(actor => 
                actor.toLowerCase().includes(searchTerm)
            );
            
            if (!matchesTitle && !matchesTitleTr && !matchesDirector && !matchesCast) {
                return false;
            }
        }
        
        // Tür filtresi
        if (filters.genre && !item.genre.includes(filters.genre)) {
            return false;
        }
        
        // Yıl filtresi
        if (filters.year && item.year !== parseInt(filters.year)) {
            return false;
        }
        
        // Tip filtresi
        if (filters.type && item.type !== filters.type) {
            return false;
        }
        
        return true;
    });
};

/**
 * Medyaları sırala
 * @param {Array} media - Medya listesi
 * @param {string} sortBy - Sıralama kriteri
 * @returns {Array}
 */
const sortMedia = (media, sortBy) => {
    const sorted = [...media];
    
    switch (sortBy) {
        case 'rating-desc':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'rating-asc':
            return sorted.sort((a, b) => a.rating - b.rating);
        case 'year-desc':
            return sorted.sort((a, b) => b.year - a.year);
        case 'year-asc':
            return sorted.sort((a, b) => a.year - b.year);
        case 'title-asc':
            return sorted.sort((a, b) => a.titleTr.localeCompare(b.titleTr, 'tr'));
        case 'title-desc':
            return sorted.sort((a, b) => b.titleTr.localeCompare(a.titleTr, 'tr'));
        default:
            return sorted;
    }
};

// ==================== Render Functions ====================

/**
 * Filtre seçeneklerini doldur
 */
const populateFilters = () => {
    const genres = extractUniqueGenres(state.allMedia);
    const years = extractUniqueYears(state.allMedia);
    
    // Tür filtresini doldur
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        elements.genreFilter.appendChild(option);
    });
    
    // Yıl filtresini doldur
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearFilter.appendChild(option);
    });
};

/**
 * Medya kartı oluştur
 * @param {Object} media - Medya objesi
 * @returns {string} - HTML string
 */
const createMediaCard = (media) => {
    const isFavorite = state.favorites.includes(media.id);
    const typeLabels = { film: 'Film', dizi: 'Dizi', kitap: 'Kitap' };
    const typeLabel = typeLabels[media.type] || 'Medya';
    const genresHTML = media.genre.slice(0, 2).map(g => 
        `<span class="media-card__genre">${g}</span>`
    ).join('');
    
    return `
        <article class="media-card" data-id="${media.id}" role="listitem" tabindex="0">
            <div class="media-card__image-container">
                <img 
                    src="${media.poster}" 
                    alt="${media.titleTr} posteri"
                    class="media-card__image"
                    loading="lazy"
                    onerror="this.parentElement.innerHTML='<div class=\\'media-card__image media-card__image--placeholder\\'>🎬</div>'"
                >
                <div class="media-card__overlay">
                    <div class="media-card__quick-actions">
                        <button 
                            class="quick-action-btn quick-action-btn--favorite ${isFavorite ? 'active' : ''}"
                            data-action="favorite"
                            data-id="${media.id}"
                            aria-label="${isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}"
                        >
                            ${isFavorite ? '❤️' : '🤍'}
                        </button>
                        <button 
                            class="quick-action-btn"
                            data-action="detail"
                            data-id="${media.id}"
                            aria-label="Detayları gör"
                        >
                            Detay
                        </button>
                    </div>
                </div>
                <span class="media-card__badge">${typeLabel}</span>
                <span class="media-card__rating">
                    <span class="star-icon">⭐</span>
                    ${media.rating}
                </span>
            </div>
            <div class="media-card__content">
                <h3 class="media-card__title">${media.titleTr}</h3>
                <div class="media-card__meta">
                    <span class="media-card__year">${media.year}</span>
                    <span>•</span>
                    <span>${media.duration}</span>
                </div>
                <div class="media-card__genres">${genresHTML}</div>
            </div>
        </article>
    `;
};

/**
 * Medya gridini render et
 */
const renderMediaGrid = () => {
    const { mediaGrid, loading, emptyState, favoritesEmpty, resultsCount, clearFiltersBtn } = elements;
    
    // Loading durumunu gizle
    loading.hidden = true;
    
    // Hangi veri setini kullanacağımıza karar ver
    let mediaToRender = state.filteredMedia;
    
    // Favoriler sayfasındaysak sadece favorileri göster
    if (state.currentPage === 'favorites') {
        mediaToRender = state.allMedia.filter(item => state.favorites.includes(item.id));
        
        // Favoriler boşsa
        if (mediaToRender.length === 0) {
            mediaGrid.innerHTML = '';
            emptyState.hidden = true;
            favoritesEmpty.hidden = false;
            resultsCount.textContent = '0';
            return;
        }
    }
    
    // Sonuç yoksa empty state göster
    if (mediaToRender.length === 0) {
        mediaGrid.innerHTML = '';
        emptyState.hidden = false;
        favoritesEmpty.hidden = true;
        resultsCount.textContent = '0';
        clearFiltersBtn.hidden = false;
        return;
    }
    
    // Normal render
    emptyState.hidden = true;
    favoritesEmpty.hidden = true;
    resultsCount.textContent = mediaToRender.length;
    
    // Filtre aktif mi kontrol et
    const hasActiveFilters = state.filters.search || state.filters.genre || 
                             state.filters.year || state.filters.type;
    clearFiltersBtn.hidden = !hasActiveFilters;
    
    // Grid HTML oluştur
    mediaGrid.innerHTML = mediaToRender.map(createMediaCard).join('');
    
    // View mode uygula
    mediaGrid.classList.toggle('media-grid--list', state.viewMode === 'list');
};

/**
 * Favori sayısını güncelle
 */
const updateFavoritesCount = () => {
    const { favoritesCount } = elements;
    favoritesCount.textContent = state.favorites.length;
    
    // Animasyon ekle
    favoritesCount.classList.add('bump');
    setTimeout(() => favoritesCount.classList.remove('bump'), 300);
};

// ==================== Modal Functions ====================

/**
 * Modal'ı aç ve medya detaylarını göster
 * @param {number} mediaId - Medya ID
 */
const openModal = (mediaId) => {
    const media = state.allMedia.find(item => item.id === mediaId);
    if (!media) return;
    
    const { 
        modal, modalBackdrop, modalPoster, modalType, modalTitle,
        modalOriginalTitle, modalRating, modalYear, modalDuration,
        modalGenres, modalPlot, modalDirector, modalCast, modalFavoriteBtn
    } = elements;
    
    // Backdrop
    modalBackdrop.style.backgroundImage = `url(${media.backdrop})`;
    
    // Poster
    modalPoster.src = media.poster;
    modalPoster.alt = `${media.titleTr} posteri`;
    
    // Bilgiler
    const typeLabels = { film: 'Film', dizi: 'Dizi', kitap: 'Kitap' };
    modalType.textContent = typeLabels[media.type] || 'Medya';
    modalTitle.textContent = media.titleTr;
    modalOriginalTitle.textContent = media.title;
    modalRating.textContent = media.rating;
    modalYear.textContent = media.year;
    modalDuration.textContent = media.duration;
    
    // Türler
    modalGenres.innerHTML = media.genre.map(g => 
        `<span class="modal__genre">${g}</span>`
    ).join('');
    
    // Özet
    modalPlot.textContent = media.plot;
    
    // Yönetmen / Yazar
    const directorLabel = document.getElementById('modalDirectorLabel');
    const castLabel = document.getElementById('modalCastLabel');
    
    if (media.type === 'kitap') {
        directorLabel.textContent = 'Yazar';
        castLabel.textContent = 'Karakterler';
    } else {
        directorLabel.textContent = 'Yönetmen';
        castLabel.textContent = 'Oyuncular';
    }
    
    modalDirector.textContent = media.director;
    
    // Oyuncular
    modalCast.innerHTML = media.cast.map(actor => 
        `<span class="modal__cast-member">${actor}</span>`
    ).join('');
    
    // Favori durumu
    const isFavorite = state.favorites.includes(mediaId);
    modalFavoriteBtn.setAttribute('aria-pressed', isFavorite);
    modalFavoriteBtn.dataset.id = mediaId;
    modalFavoriteBtn.querySelector('.btn__icon').textContent = isFavorite ? '❤️' : '🤍';
    modalFavoriteBtn.querySelector('.btn__text').textContent = isFavorite ? 'Favorilerde' : 'Favorilere Ekle';
    
    // Modal'ı göster
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    
    // Focus trap için
    modalFavoriteBtn.focus();
};

/**
 * Modal'ı kapat
 */
const closeModal = () => {
    const { modal } = elements;
    modal.hidden = true;
    document.body.style.overflow = '';
};

// ==================== Favorites Functions ====================

/**
 * Favori durumunu toggle et
 * @param {number} mediaId - Medya ID
 */
const toggleFavorite = (mediaId) => {
    const index = state.favorites.indexOf(mediaId);
    const media = state.allMedia.find(item => item.id === mediaId);
    
    if (index === -1) {
        // Favorilere ekle
        state.favorites.push(mediaId);
        showToast(`${media.titleTr} favorilere eklendi! ❤️`, 'success');
    } else {
        // Favorilerden çıkar
        state.favorites.splice(index, 1);
        showToast(`${media.titleTr} favorilerden çıkarıldı`, 'success');
    }
    
    // Storage'a kaydet
    saveToStorage(CONFIG.storageKeys.favorites, state.favorites);
    
    // UI güncelle
    updateFavoritesCount();
    renderMediaGrid();
    
    // Modal açıksa buton güncelle
    const { modal, modalFavoriteBtn } = elements;
    if (!modal.hidden && parseInt(modalFavoriteBtn.dataset.id) === mediaId) {
        const isFavorite = state.favorites.includes(mediaId);
        modalFavoriteBtn.setAttribute('aria-pressed', isFavorite);
        modalFavoriteBtn.querySelector('.btn__icon').textContent = isFavorite ? '❤️' : '🤍';
        modalFavoriteBtn.querySelector('.btn__text').textContent = isFavorite ? 'Favorilerde' : 'Favorilere Ekle';
    }
};

// ==================== Navigation Functions ====================

/**
 * Sayfa değiştir (SPA)
 * @param {string} page - Sayfa adı
 */
const navigateTo = (page) => {
    state.currentPage = page;
    
    // Nav linkleri güncelle
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Sayfa bazlı filtreleme
    switch (page) {
        case 'home':
            state.filters.type = '';
            elements.typeFilter.value = '';
            break;
        case 'movies':
            state.filters.type = 'film';
            elements.typeFilter.value = 'film';
            break;
        case 'series':
            state.filters.type = 'dizi';
            elements.typeFilter.value = 'dizi';
            break;
        case 'books':
            state.filters.type = 'kitap';
            elements.typeFilter.value = 'kitap';
            break;
        case 'favorites':
            // Favoriler için özel durum
            break;
    }
    
    // Hero section gizle/göster
    elements.hero.style.display = page === 'home' ? '' : 'none';
    
    // Filtreleri uygula ve render et
    applyFilters();
    
    // Scroll to top
    window.scrollTo({ top: page === 'home' ? 0 : elements.filters.offsetTop - 80, behavior: 'smooth' });
    
    // Mobile menüyü kapat
    elements.navMenu.classList.remove('open');
    elements.navToggle.setAttribute('aria-expanded', 'false');
};

// ==================== Filter Application ====================

/**
 * Tüm filtreleri uygula
 */
const applyFilters = () => {
    // Favoriler sayfasında değilsek normal filtreleme yap
    if (state.currentPage !== 'favorites') {
        state.filteredMedia = filterMedia(state.allMedia, state.filters);
        state.filteredMedia = sortMedia(state.filteredMedia, state.filters.sort);
    }
    
    renderMediaGrid();
};

// ==================== Event Handlers ====================

/**
 * Arama input handler
 */
const handleSearch = debounce((e) => {
    state.filters.search = e.target.value.trim();
    elements.searchClear.hidden = !state.filters.search;
    
    // Favoriler sayfasından çık eğer arama yapılıyorsa
    if (state.currentPage === 'favorites' && state.filters.search) {
        navigateTo('home');
    }
    
    applyFilters();
    
    // Arama yapıldığında sonuçlara scroll et
    if (state.filters.search) {
        setTimeout(() => {
            elements.filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}, CONFIG.debounceDelay);

/**
 * Filtre değişiklik handler
 */
const handleFilterChange = () => {
    state.filters.genre = elements.genreFilter.value;
    state.filters.year = elements.yearFilter.value;
    state.filters.type = elements.typeFilter.value;
    state.filters.sort = elements.sortFilter.value;
    
    // Tip değişirse nav güncelle
    if (state.filters.type === 'film') {
        state.currentPage = 'movies';
    } else if (state.filters.type === 'dizi') {
        state.currentPage = 'series';
    } else if (state.filters.type === 'kitap') {
        state.currentPage = 'books';
    } else {
        state.currentPage = 'home';
    }
    
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === state.currentPage);
    });
    
    applyFilters();
};

/**
 * Filtreleri temizle
 */
const clearFilters = () => {
    state.filters = {
        search: '',
        genre: '',
        year: '',
        type: '',
        sort: 'rating-desc'
    };
    
    elements.searchInput.value = '';
    elements.genreFilter.value = '';
    elements.yearFilter.value = '';
    elements.typeFilter.value = '';
    elements.sortFilter.value = 'rating-desc';
    elements.searchClear.hidden = true;
    
    navigateTo('home');
};

/**
 * View mode değiştir
 */
const handleViewChange = (e) => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;
    
    state.viewMode = btn.dataset.view;
    
    // Butonları güncelle
    elements.viewBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.view === state.viewMode);
        b.setAttribute('aria-pressed', b.dataset.view === state.viewMode);
    });
    
    // Storage'a kaydet
    saveToStorage(CONFIG.storageKeys.viewMode, state.viewMode);
    
    // Grid'i güncelle
    elements.mediaGrid.classList.toggle('media-grid--list', state.viewMode === 'list');
};

/**
 * Media grid click handler
 */
const handleMediaGridClick = (e) => {
    const card = e.target.closest('.media-card');
    const favoriteBtn = e.target.closest('[data-action="favorite"]');
    const detailBtn = e.target.closest('[data-action="detail"]');
    
    if (favoriteBtn) {
        e.stopPropagation();
        const mediaId = parseInt(favoriteBtn.dataset.id);
        toggleFavorite(mediaId);
        return;
    }
    
    if (detailBtn || card) {
        const mediaId = parseInt((detailBtn || card).dataset.id);
        openModal(mediaId);
    }
};

/**
 * Media card keyboard handler
 */
const handleMediaGridKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.media-card');
        if (card) {
            e.preventDefault();
            const mediaId = parseInt(card.dataset.id);
            openModal(mediaId);
        }
    }
};

// ==================== Event Listeners Setup ====================

const setupEventListeners = () => {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
    
    // Mobile menu toggle
    elements.navToggle.addEventListener('click', () => {
        const isOpen = elements.navMenu.classList.toggle('open');
        elements.navToggle.setAttribute('aria-expanded', isOpen);
    });
    
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    elements.searchClear.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.filters.search = '';
        elements.searchClear.hidden = true;
        applyFilters();
    });
    
    // Filters
    elements.genreFilter.addEventListener('change', handleFilterChange);
    elements.yearFilter.addEventListener('change', handleFilterChange);
    elements.typeFilter.addEventListener('change', handleFilterChange);
    elements.sortFilter.addEventListener('change', handleFilterChange);
    elements.clearFiltersBtn.addEventListener('click', clearFilters);
    
    // View toggle
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Media grid
    elements.mediaGrid.addEventListener('click', handleMediaGridClick);
    elements.mediaGrid.addEventListener('keydown', handleMediaGridKeydown);
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', closeModal);
    elements.modalFavoriteBtn.addEventListener('click', () => {
        const mediaId = parseInt(elements.modalFavoriteBtn.dataset.id);
        toggleFavorite(mediaId);
    });
    
    // Modal keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.modal.hidden) {
            closeModal();
        }
    });
    
    // Browse catalog button (favorites empty state)
    elements.browseCatalogBtn.addEventListener('click', () => {
        navigateTo('home');
    });
    
    // Header scroll behavior
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header--hidden');
        } else {
            header.classList.remove('header--hidden');
        }
        
        lastScrollY = currentScrollY;
    });
};

// ==================== Initialization ====================

/**
 * Uygulamayı başlat
 */
const init = async () => {
    // Storage'dan verileri yükle
    state.favorites = getFromStorage(CONFIG.storageKeys.favorites, []);
    state.viewMode = getFromStorage(CONFIG.storageKeys.viewMode, 'grid');
    
    // View mode butonlarını güncelle
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === state.viewMode);
        btn.setAttribute('aria-pressed', btn.dataset.view === state.viewMode);
    });
    
    // Favori sayısını güncelle
    updateFavoritesCount();
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Verileri çek
    state.allMedia = await fetchMediaData();
    state.filteredMedia = [...state.allMedia];
    state.isLoading = false;
    
    // Filtreleri doldur
    populateFilters();
    
    // İlk sıralama
    state.filteredMedia = sortMedia(state.filteredMedia, state.filters.sort);
    
    // Render
    renderMediaGrid();
    
    console.log('🎬 CineVault başarıyla yüklendi!');
};

// DOM hazır olduğunda başlat
document.addEventListener('DOMContentLoaded', init);

