import 'bootstrap';

import PhotoSwipeLightbox from 'photoswipe/lightbox';

document.addEventListener('DOMContentLoaded', () => {
	const galleryElements = document.querySelectorAll('.gallery');
	if (!galleryElements.length) return;

	const lightbox = new PhotoSwipeLightbox({
		gallery: '.gallery',
		children: 'a',
		pswpModule: () => import('photoswipe'),
		showHideAnimationType: 'fade',
		wheelToZoom: true,
		loop: true,
		getCaptionText: (slide) => slide.data.caption || '',
	});

	lightbox.init();
});
