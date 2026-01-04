// Unsplash API Configuration
// Sostituisci con il tuo Access Key di Unsplash
const unsplashAccessKey = 'TUO_ACCESS_KEY_QUI';

// Se non hai un Access Key, lascia la stringa vuota e il sito mostrerà immagini di esempio
// const unsplashAccessKey = '';

// Stato dell'applicazione
let currentPage = 1;
let currentQuery = '';
let isLoading = false;
let totalResults = 0;
let currentImageUrl = '';
let currentImageId = '';
let currentPhotographer = '';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const suggestionTags = document.querySelectorAll('.suggestion-tag');
const imagesGrid = document.getElementById('imagesGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const loadMoreButton = document.getElementById('loadMoreButton');
const imageModal = document.getElementById('imageModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const photographerName = document.getElementById('photographerName');
const photographerCredit = document.getElementById('photographerCredit');
const imageDescription = document.getElementById('imageDescription');
const downloadButton = document.getElementById('downloadButton');

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initialized');
    if (unsplashAccessKey && unsplashAccessKey !== 'TUO_ACCESS_KEY_QUI') {
        loadPopularImages();
    } else {
        // Mostra immagini di esempio se non c'è un access key
        showError();
        useSampleImages();
    }
    setupEventListeners();
});

// Configurazione event listeners
function setupEventListeners() {
    // Pulsante di ricerca
    searchButton.addEventListener('click', performSearch);
    
    // Ricerca con tasto Invio
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
    
    // Suggerimenti di ricerca
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const keyword = this.getAttribute('data-keyword');
            searchInput.value = keyword;
            performSearch();
        });
    });
    
    // Carica altre immagini
    loadMoreButton.addEventListener('click', loadMoreImages);
    
    // Chiudi modal
    modalClose.addEventListener('click', closeModal);
    
    // Chiudi modal cliccando fuori
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    // Chiudi modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal.style.display === 'block') {
            closeModal();
        }
    });
    
    // Download immagine
    downloadButton.addEventListener('click', downloadImage);
}

// Esegui ricerca
async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        loadPopularImages();
        return;
    }
    
    currentQuery = query;
    currentPage = 1;
    resultsTitle.textContent = `Results for "${query}"`;
    
    // Reset UI
    imagesGrid.innerHTML = '';
    noResults.style.display = 'none';
    loadMoreButton.style.display = 'none';
    showLoading(true);
    
    try {
        await searchImages(query, currentPage);
    } catch (error) {
        console.error('Search error:', error);
        showError();
    }
}

// Carica immagini popolari
async function loadPopularImages() {
    currentQuery = '';
    currentPage = 1;
    resultsTitle.textContent = 'Popular Horizontal Images';
    
    // Reset UI
    imagesGrid.innerHTML = '';
    noResults.style.display = 'none';
    loadMoreButton.style.display = 'none';
    showLoading(true);
    
    try {
        await fetchPopularImages(currentPage);
    } catch (error) {
        console.error('Error loading popular images:', error);
        showError();
    }
}

// Fetch immagini popolari (usa la ricerca con query "landscape")
async function fetchPopularImages(page = 1) {
    showLoading(true);
    
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?page=${page}&per_page=12&query=landscape&orientation=landscape&client_id=${unsplashAccessKey}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        showLoading(false);
        
        const images = data.results || [];
        
        if (!images || images.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        // Filtra ulteriormente per immagini orizzontali
        const horizontalImages = images.filter(img => {
            if (!img.width || !img.height) return false;
            const ratio = img.width / img.height;
            return ratio >= 1.2; // Assicura che siano orizzontali
        });
        
        if (horizontalImages.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        displayImages(horizontalImages, page > 1);
        totalResults = data.total || 0;
        resultsCount.textContent = horizontalImages.length;
        
        // Mostra pulsante per caricare altre immagini
        if (page * 12 < totalResults) {
            loadMoreButton.style.display = 'inline-flex';
        } else {
            loadMoreButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Fetch error:', error);
        showLoading(false);
        
        // Fallback: usa dati di esempio se l'API fallisce
        useSampleImages();
    }
}

// Cerca immagini
async function searchImages(query, page) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?page=${page}&per_page=12&query=${encodeURIComponent(query)}&orientation=landscape&client_id=${unsplashAccessKey}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        showLoading(false);
        isLoading = false;
        
        const images = data.results || [];
        
        if (images.length === 0) {
            noResults.style.display = 'block';
            loadMoreButton.style.display = 'none';
            return;
        }
        
        // Filtra per immagini orizzontali
        const horizontalImages = images.filter(img => {
            if (!img.width || !img.height) return false;
            const ratio = img.width / img.height;
            return ratio >= 1.2;
        });
        
        if (horizontalImages.length === 0) {
            noResults.style.display = 'block';
            loadMoreButton.style.display = 'none';
            return;
        }
        
        displayImages(horizontalImages, page > 1);
        totalResults = data.total || 0;
        resultsCount.textContent = horizontalImages.length;
        
        // Mostra pulsante per caricare altre immagini
        if (page * 12 < totalResults) {
            loadMoreButton.style.display = 'inline-flex';
        } else {
            loadMoreButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showLoading(false);
        isLoading = false;
        
        // Fallback: usa dati di esempio
        useSampleImages();
    }
}

// Carica altre immagini
async function loadMoreImages() {
    if (isLoading) return;
    
    currentPage++;
    loadMoreButton.disabled = true;
    loadMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        if (currentQuery) {
            await searchImages(currentQuery, currentPage);
        } else {
            await fetchPopularImages(currentPage);
        }
    } catch (error) {
        console.error('Load more error:', error);
    } finally {
        loadMoreButton.disabled = false;
        loadMoreButton.innerHTML = '<i class="fas fa-sync-alt"></i> Load More Horizontal Images';
    }
}

// Mostra immagini nella griglia
function displayImages(images, append = false) {
    if (!append) {
        imagesGrid.innerHTML = '';
    }
    
    images.forEach(image => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        // Usa URL dell'immagine di dimensioni medie
        const imageUrl = image.urls?.regular || image.urls?.small || '';
        const fullImageUrl = image.urls?.full || imageUrl;
        const photographer = image.user?.name || 'Unknown';
        const avatarUrl = image.user?.profile_image?.medium || '';
        const description = image.description || image.alt_description || 'Beautiful horizontal image';
        const imageId = image.id || Date.now();
        const width = image.width || 1200;
        const height = image.height || 800;
        
        imageCard.innerHTML = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${description}" loading="lazy">
            </div>
            <div class="image-info">
                <div class="photographer">
                    <img src="${avatarUrl}" alt="${photographer}" class="photographer-avatar">
                    <span class="photographer-name">${photographer}</span>
                </div>
                <p class="image-description-short">${description}</p>
                <div class="instagram-ready">
                    <i class="fab fa-instagram"></i>
                    <span>Horizontal (${width}×${height})</span>
                </div>
            </div>
        `;
        
        // Aggiungi evento click per aprire il modal
        imageCard.addEventListener('click', () => {
            openImageModal(fullImageUrl, photographer, description, imageId, width, height);
        });
        
        imagesGrid.appendChild(imageCard);
    });
}

// Apri modal immagine
function openImageModal(imageUrl, photographer, description, imageId, width, height) {
    modalImage.src = imageUrl;
    modalImage.alt = description;
    photographerName.textContent = photographer;
    photographerCredit.textContent = photographer;
    imageDescription.textContent = description;
    
    // Salva dati per il download
    currentImageUrl = imageUrl;
    currentImageId = imageId;
    currentPhotographer = photographer;
    
    // Mostra modal
    imageModal.style.display = 'block';
}

// Chiudi modal
function closeModal() {
    imageModal.style.display = 'none';
}

// Download immagine
function downloadImage() {
    if (!currentImageUrl) return;
    
    // Crea elemento temporaneo per il download
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `instagram-horizontal-${currentImageId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Feedback visivo
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = '<i class="fas fa-check"></i> Download Started!';
    downloadButton.style.backgroundColor = '#28a745';
    
    setTimeout(() => {
        downloadButton.innerHTML = originalText;
        downloadButton.style.backgroundColor = '';
    }, 2000);
}

// Mostra/nascondi indicatore di caricamento
function showLoading(show) {
    if (show) {
        loadingIndicator.style.display = 'flex';
        loadMoreButton.style.display = 'none';
        searchButton.disabled = true;
    } else {
        loadingIndicator.style.display = 'none';
        searchButton.disabled = false;
    }
}

// Mostra errore
function showError() {
    showLoading(false);
    noResults.style.display = 'block';
    noResults.innerHTML = `
        <i class="fas fa-exclamation-triangle no-results-icon"></i>
        <h3>Connection Issue or Invalid Access Key</h3>
        <p>Showing sample images. For full functionality, add your Unsplash Access Key in script.js</p>
    `;
    
    // Carica immagini di esempio
    useSampleImages();
}

// Immagini di esempio per fallback
function useSampleImages() {
    const sampleImages = [
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
            },
            user: {
                name: 'Sample Photographer',
                profile_image: { medium: 'https://images.unsplash.com/profile-1506905925346-21bda4d32df4' }
            },
            description: 'Beautiful mountain landscape',
            alt_description: 'Mountain landscape',
            id: 'sample1',
            width: 1350,
            height: 900
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                full: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
            },
            user: {
                name: 'Sample Photographer',
                profile_image: { medium: 'https://images.unsplash.com/profile-1519681393784-d120267933ba' }
            },
            description: 'Sea coast with rocks',
            alt_description: 'Sea coast',
            id: 'sample2',
            width: 1350,
            height: 900
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                full: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
            },
            user: {
                name: 'Sample Photographer',
                profile_image: { medium: 'https://images.unsplash.com/profile-1493246507139-91e8fad9978e' }
            },
            description: 'Italian countryside',
            alt_description: 'Italian landscape',
            id: 'sample3',
            width: 1350,
            height: 900
        }
    ];
    
    displayImages(sampleImages);
    resultsCount.textContent = sampleImages.length;
    loadMoreButton.style.display = 'none';
}

// Imposta valore iniziale della ricerca
searchInput.value = "Italy";
