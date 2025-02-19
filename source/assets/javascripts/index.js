import 'bootstrap';

// Include Lightbox 
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/photoswipe.css';

// Initialize PhotoSwipe Lightbox
const lightbox = new PhotoSwipeLightbox({
	gallery: '.gallery', // Target the gallery div
	children: 'a',       // Select all <a> elements inside the gallery
	pswpModule: () => import('photoswipe'), // Dynamically load PhotoSwipe
	showHideAnimationType: 'fade', // Animations: 'zoom', 'fade', 'none'
	wheelToZoom: true,  // Enable zooming with the scroll wheel
	loop: true,         // Enable infinite looping

	getCaptionText: (slide) => slide.data.caption || '', // Fetch captions from `data-caption`
});

// Start the lightbox
lightbox.init();

// Handle keyboard navigation
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape') {
		// Close modals, dropdowns, etc.
	}
});

// Manage focus for modals
function openModal(modalId) {
	const modal = document.getElementById(modalId);
	const focusableElements = modal.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);
	// ... focus management code
}
