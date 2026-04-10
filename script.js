// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ============================================
// PROJECT FILTERS
// ============================================
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        projectCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInUp 0.4s ease forwards';
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to elements
document.querySelectorAll('.skill-card, .project-card, .about-content, .about-visual, .contact-form, .contact-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ============================================
// COUNTER ANIMATION
// ============================================
const statNumbers = document.querySelectorAll('.stat-number');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const count = parseInt(target.dataset.count);
            animateCounter(target, count);
            counterObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(num => counterObserver.observe(num));

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 40;
    const duration = 1500;
    const stepTime = duration / 40;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// ============================================
// PROJECT MODAL
// ============================================
const modal = document.getElementById('projectModal');
const modalImg = document.getElementById('modalImg');
const modalTag = document.getElementById('modalTag');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTags = document.getElementById('modalTags');
const modalClose = document.getElementById('modalClose');

projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const info = card.querySelector('.project-info');
        const img = card.querySelector('.project-image img');
        const tag = info.querySelector('.project-tag');
        const title = info.querySelector('h3').textContent;
        const desc = info.querySelector('p').textContent;
        const tags = info.querySelectorAll('.skill-tags li');

        // Set modal image
        if (img && img.style.display !== 'none' && img.naturalWidth > 0) {
            modalImg.src = img.src;
            modalImg.alt = img.alt;
            modalImg.style.display = 'block';
            modalImg.parentElement.style.display = 'flex';
        } else {
            modalImg.style.display = 'none';
            modalImg.parentElement.style.display = 'none';
        }

        // Set tag with correct class
        modalTag.textContent = tag.textContent;
        modalTag.className = 'modal-tag';
        if (tag.classList.contains('tag-vba')) modalTag.classList.add('tag-vba');
        if (tag.classList.contains('tag-ice')) modalTag.classList.add('tag-ice');

        // Set content
        modalTitle.textContent = title;
        modalDesc.textContent = desc;

        // Set tags
        modalTags.innerHTML = '';
        tags.forEach(t => {
            const span = document.createElement('span');
            span.textContent = t.textContent;
            modalTags.appendChild(span);
        });

        // Open modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Close modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ============================================
// SKILL PREVIEW (image flottante au survol)
// ============================================
const skillPreview = document.getElementById('skillPreview');
const skillPreviewImg = document.getElementById('skillPreviewImg');

if (skillPreview) {
    const previewCards = document.querySelectorAll('.skill-card[data-preview]');

    previewCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            skillPreviewImg.src = card.dataset.preview;
            skillPreview.classList.add('active');
        });

        card.addEventListener('mouseleave', () => {
            skillPreview.classList.remove('active');
        });

        card.addEventListener('mousemove', (e) => {
            skillPreview.style.left = (e.clientX + 20) + 'px';
            skillPreview.style.top = (e.clientY - 100) + 'px';
        });
    });
}

// ============================================
// ACCORDION VITRINE
// ============================================
const accordionItems = document.querySelectorAll('.accordion-item');

accordionItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        accordionItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

// ============================================
// CONTACT FORM
// ============================================
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Show success message
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Message envoyé !';
    btn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        contactForm.reset();
    }, 3000);
});

// ============================================
// RATING WIDGET
// ============================================
const RATING_API = 'https://script.google.com/macros/s/AKfycbzmMe6-52tutPDea7KSOmTg7EvkCJcXkEouqy5qP5m4LzoaSbKz2Bf8McFi-45sHf8/exec';

// Load ratings and reviews
function loadRating() {
    fetch(RATING_API, { redirect: 'follow' })
        .then(r => r.text())
        .then(text => {
            var data = JSON.parse(text);
            document.getElementById('ratingAvg').textContent = data.moyenne || '-';
            document.getElementById('ratingCount').textContent = '(' + data.total + ' avis)';
            var navRating = document.getElementById('navRating');
            if (navRating) navRating.textContent = data.moyenne || '-';
            var navStars = document.getElementById('navStars');
            if (navStars && data.moyenne > 0) {
                var filled = Math.round(data.moyenne);
                navStars.innerHTML = '';
                for (var i = 1; i <= 5; i++) {
                    navStars.innerHTML += '<span style="color:' + (i <= filled ? '#f59e0b' : '#4a4a5a') + '">&#9733;</span>';
                }
            }
            if (!hasVoted && data.moyenne > 0) {
                document.querySelectorAll('.star').forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.value) <= Math.round(data.moyenne));
                });
            }
            // Render reviews
            if (data.avis && data.avis.length > 0) {
                var container = document.getElementById('avisItems');
                if (container) {
                    container.innerHTML = '';
                    data.avis.forEach(function(a) {
                        var starsHtml = '';
                        for (var i = 1; i <= 5; i++) {
                            starsHtml += '<span style="color:' + (i <= a.note ? '#f59e0b' : '#4a4a5a') + '">&#9733;</span>';
                        }
                        var html = '<div class="avis-item">' +
                            '<div class="avis-item-header">' +
                            '<span class="avis-item-name">' + (a.nom || 'Anonyme') + '</span>' +
                            '<span class="avis-item-stars">' + starsHtml + '</span>' +
                            '</div>' +
                            '<span class="avis-item-date">' + (a.date || '') + '</span>' +
                            (a.commentaire ? '<p class="avis-item-text">' + a.commentaire + '</p>' : '') +
                            '</div>';
                        container.innerHTML += html;
                    });
                }
            }
        })
        .catch(() => {});
}

// Star interactions
const stars = document.querySelectorAll('.star');
let hasVoted = localStorage.getItem('portfolio_voted');
let selectedNote = 0;
const avisSubmit = document.getElementById('avisSubmit');

if (hasVoted) {
    stars.forEach(s => {
        s.classList.add('voted');
        if (parseInt(s.dataset.value) <= parseInt(hasVoted)) s.classList.add('active');
    });
    var form = document.getElementById('avisForm');
    if (form) form.style.display = 'none';
    var msg = document.getElementById('ratingMessage');
    if (msg) msg.textContent = 'Merci pour votre avis !';
}

stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
        if (hasVoted) return;
        const val = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.value) <= val));
    });

    star.addEventListener('mouseleave', () => {
        if (hasVoted) return;
        stars.forEach(s => s.classList.remove('hover'));
    });

    star.addEventListener('click', () => {
        if (hasVoted) return;
        selectedNote = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= selectedNote));
        if (avisSubmit) avisSubmit.disabled = false;
    });
});

// Submit review
if (avisSubmit) {
    avisSubmit.addEventListener('click', () => {
        if (hasVoted || selectedNote === 0) return;
        var nom = (document.getElementById('avisNom').value || '').trim();
        var commentaire = (document.getElementById('avisCommentaire').value || '').trim();
        var msg = document.getElementById('ratingMessage');

        avisSubmit.disabled = true;
        avisSubmit.textContent = 'Envoi en cours...';

        fetch(RATING_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ note: selectedNote, nom: nom || 'Anonyme', commentaire: commentaire }),
        })
        .then(() => {
            if (msg) msg.textContent = 'Merci pour votre avis !';
            localStorage.setItem('portfolio_voted', selectedNote);
            hasVoted = selectedNote;
            stars.forEach(s => s.classList.add('voted'));
            var form = document.getElementById('avisForm');
            if (form) form.style.display = 'none';
            setTimeout(loadRating, 2000);
        })
        .catch(() => {
            if (msg) msg.textContent = 'Erreur, réessayez plus tard.';
            avisSubmit.disabled = false;
            avisSubmit.textContent = 'Laisser mon avis';
        });
    });
}

loadRating();
setTimeout(loadRating, 3000);

// ============================================
// SMOOTH REVEAL ON LOAD
// ============================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
