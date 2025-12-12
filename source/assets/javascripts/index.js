import 'bootstrap';

import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';

document.addEventListener('DOMContentLoaded', () => {
	const galleryElements = document.querySelectorAll('.gallery');
	if (!galleryElements.length) return;

	const lightbox = new PhotoSwipeLightbox({
		gallery: '.gallery',
		children: 'a',
		pswpModule: PhotoSwipe,
		showHideAnimationType: 'fade',
		wheelToZoom: true,
		loop: true,
		getCaptionText: (slide) => slide.data.caption || '',
	});

	lightbox.init();
});
