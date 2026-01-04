// Unsplash API Configuration
const unsplashAccessKey = '_f2bL-3s-wq6HC7M_0P-9GDggh5aphw9SN1xSgVa3ho';

// Application State
let currentPage = 1;
let currentQuery = '';
let isLoading = false;
let totalResults = 0;
let currentImageUrl = '';
let currentImageId = '';
let currentPhotographer = '';
let currentWidth = 0;
let currentHeight = 0;

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
const imageDimensions = document.getElementById('imageDimensions');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vertical Image Search - Initialized');
    loadPopularImages();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Search button click
    searchButton.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
    
    // Search suggestion tags
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const keyword = this.getAttribute('data-keyword');
            searchInput.value = keyword;
            performSearch();
        });
    });
    
    // Load more images button
    loadMoreButton.addEventListener('click', loadMoreImages);
    
    // Modal close button
    modalClose.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal.style.display === 'block') {
            closeModal();
        }
    });
    
    // Download image button
    downloadButton.addEventListener('click', downloadImage);
}

// Perform search function
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

// Load popular vertical images
async function loadPopularImages() {
    currentQuery = '';
    currentPage = 1;
    resultsTitle.textContent = 'Popular Vertical Images';
    
    // Reset UI
    imagesGrid.innerHTML = '';
    noResults.style.display = 'none';
    loadMoreButton.style.display = 'none';
    showLoading(true);
    
    try {
        await fetchPopularImages();
    } catch (error) {
        console.error('Error loading popular images:', error);
        showError();
    }
}

// Fetch popular vertical images from Unsplash
async function fetchPopularImages() {
    showLoading(true);
    
    try {
        const response = await fetch(
            `https://api.unsplash.com/photos/random?count=12&orientation=portrait&client_id=${unsplashAccessKey}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const images = await response.json();
        showLoading(false);
        
        if (!images || images.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        // Filter for true vertical images (height > width)
        const verticalImages = images.filter(img => {
            if (!img.width || !img.height) return false;
            const ratio = img.height / img.width;
            // Instagram Stories ratio is approximately 9:16 = 1.78
            return ratio >= 1.5; // Allow some flexibility
        });
        
        if (verticalImages.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        displayImages(verticalImages);
        resultsCount.textContent = verticalImages.length;
        
        // Show load more button if we got enough images
        if (verticalImages.length >= 12) {
            loadMoreButton.style.display = 'inline-flex';
        }
        
    } catch (error) {
        console.error('Fetch error:', error);
        showLoading(false);
        useSampleImages(); // Fallback to sample images
    }
}

// Search for vertical images
async function searchImages(query, page) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?page=${page}&per_page=12&query=${encodeURIComponent(query)}&orientation=portrait&client_id=${unsplashAccessKey}`
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
        
        // Filter for true vertical images
        const verticalImages = images.filter(img => {
            if (!img.width || !img.height) return false;
            const ratio = img.height / img.width;
            return ratio >= 1.5;
        });
        
        if (verticalImages.length === 0) {
            noResults.style.display = 'block';
            loadMoreButton.style.display = 'none';
            return;
        }
        
        displayImages(verticalImages, page > 1);
        totalResults = data.total || 0;
        resultsCount.textContent = verticalImages.length;
        
        // Show load more button if there are more results
        if (page * 12 < totalResults) {
            loadMoreButton.style.display = 'inline-flex';
        } else {
            loadMoreButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showLoading(false);
        isLoading = false;
        useSampleImages(); // Fallback to sample images
    }
}

// Load more images for pagination
async function loadMoreImages() {
    if (isLoading) return;
    
    currentPage++;
    loadMoreButton.disabled = true;
    loadMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        if (currentQuery) {
            await searchImages(currentQuery, currentPage);
        } else {
            await fetchPopularImages();
        }
    } catch (error) {
        console.error('Load more error:', error);
        loadMoreButton.disabled = false;
        loadMoreButton.innerHTML = '<i class="fas fa-sync-alt"></i> Load More Vertical Images';
    }
}

// Display images in the grid
function displayImages(images, append = false) {
    if (!append) {
        imagesGrid.innerHTML = '';
    }
    
    images.forEach(image => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        // Use regular size for grid, full size for modal/download
        const imageUrl = image.urls?.regular || image.urls?.small || '';
        const fullImageUrl = image.urls?.full || imageUrl;
        const photographer = image.user?.name || 'Unknown Photographer';
        const avatarUrl = image.user?.profile_image?.medium || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
        const description = image.description || image.alt_description || 'Beautiful vertical image';
        const imageId = image.id || Date.now();
        const width = image.width || 1080;
        const height = image.height || 1920;
        
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
                    <span>Vertical • ${width}×${height}</span>
                </div>
            </div>
        `;
        
        // Add click event to open modal
        imageCard.addEventListener('click', () => {
            openImageModal(fullImageUrl, photographer, description, imageId, width, height);
        });
        
        imagesGrid.appendChild(imageCard);
    });
}

// Open image modal with full details
function openImageModal(imageUrl, photographer, description, imageId, width, height) {
    modalImage.src = imageUrl;
    modalImage.alt = description;
    photographerName.textContent = photographer;
    photographerCredit.textContent = photographer;
    imageDescription.textContent = description;
    imageDimensions.textContent = `${width}×${height}`;
    
    // Store current image data for download
    currentImageUrl = imageUrl;
    currentImageId = imageId;
    currentPhotographer = photographer;
    currentWidth = width;
    currentHeight = height;
    
    // Show modal with animation
    imageModal.style.display = 'block';
}

// Close modal
function closeModal() {
    imageModal.style.display = 'none';
}

// Download image
function downloadImage() {
    if (!currentImageUrl) return;
    
    // Create temporary link for download
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `instagram-vertical-${currentImageId}-${currentWidth}x${currentHeight}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Visual feedback
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = '<i class="fas fa-check"></i> Download Started!';
    downloadButton.style.background = 'linear-gradient(45deg, #20c997, #28a745)';
    
    setTimeout(() => {
        downloadButton.innerHTML = originalText;
        downloadButton.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
    }, 2000);
}

// Show/hide loading indicator
function showLoading(show) {
    if (show) {
        loadingIndicator.style.display = 'flex';
        loadMoreButton.style.display = 'none';
    } else {
        loadingIndicator.style.display = 'none';
    }
}

// Show error state
function showError() {
    showLoading(false);
    noResults.style.display = 'block';
    noResults.innerHTML = `
        <div class="no-results-icon-container">
            <i class="fas fa-wifi-slash"></i>
        </div>
        <h3>Connection Issue</h3>
        <p>Using sample images. Add your Unsplash Access Key for full functionality.</p>
    `;
    
    useSampleImages();
}

// Sample vertical images for fallback
function useSampleImages() {
    const sampleImages = [
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'Jane Smith',
                profile_image: { medium: 'https://images.unsplash.com/profile-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Portrait of a woman looking away',
            alt_description: 'Portrait photography',
            id: 'sample-vertical-1',
            width: 800,
            height: 1200
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'John Doe',
                profile_image: { medium: 'https://images.unsplash.com/profile-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Fashion model in urban environment',
            alt_description: 'Fashion photography',
            id: 'sample-vertical-2',
            width: 800,
            height: 1200
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'Alex Johnson',
                profile_image: { medium: 'https://images.unsplash.com/profile-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Man portrait with natural lighting',
            alt_description: 'Male portrait',
            id: 'sample-vertical-3',
            width: 800,
            height: 1200
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1494790108755-2616b786d4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1494790108755-2616b786d4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'Maria Garcia',
                profile_image: { medium: 'https://images.unsplash.com/profile-1494790108755-2616b786d4d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Smiling woman portrait in studio',
            alt_description: 'Female portrait',
            id: 'sample-vertical-4',
            width: 800,
            height: 1200
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'David Lee',
                profile_image: { medium: 'https://images.unsplash.com/profile-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Model posing with dramatic lighting',
            alt_description: 'Studio photography',
            id: 'sample-vertical-5',
            width: 800,
            height: 1200
        },
        {
            urls: {
                regular: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                full: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            user: {
                name: 'Sophia Williams',
                profile_image: { medium: 'https://images.unsplash.com/profile-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
            },
            description: 'Woman with artistic makeup',
            alt_description: 'Beauty portrait',
            id: 'sample-vertical-6',
            width: 800,
            height: 1200
        }
    ];
    
    displayImages(sampleImages);
    resultsCount.textContent = sampleImages.length;
    loadMoreButton.style.display = 'none';
}

// Set initial search value
searchInput.value = "portrait";
