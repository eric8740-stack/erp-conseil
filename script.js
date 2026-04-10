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
const RATING_API = 'https://script.google.com/macros/s/AKfycbzpOta4QQ1rhijm5v1zt6hMv5NVhbzM1iLrgZlVK4ay2iMyheYQ0lSNbAbW44OHfU0/exec';

// Load average on page load
function loadRating() {
    fetch(RATING_API, { redirect: 'follow' })
        .then(r => r.text())
        .then(text => {
            var data = JSON.parse(text);
            document.getElementById('ratingAvg').textContent = data.moyenne || '-';
            document.getElementById('ratingCount').textContent = '(' + data.total + ' avis)';
            var navRating = document.getElementById('navRating');
            if (navRating) navRating.textContent = data.moyenne || '-';
        })
        .catch(() => {});
}

// Star interactions
const stars = document.querySelectorAll('.star');
let hasVoted = localStorage.getItem('portfolio_voted');

if (hasVoted) {
    stars.forEach(s => {
        s.classList.add('voted');
        if (parseInt(s.dataset.value) <= parseInt(hasVoted)) s.classList.add('active');
    });
    const msg = document.getElementById('ratingMessage');
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
        const note = parseInt(star.dataset.value);

        stars.forEach(s => {
            s.classList.add('voted');
            s.classList.toggle('active', parseInt(s.dataset.value) <= note);
        });

        const msg = document.getElementById('ratingMessage');
        if (msg) msg.textContent = 'Envoi en cours...';

        fetch(RATING_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ note: note }),
        })
        .then(() => {
            if (msg) msg.textContent = 'Merci pour votre avis !';
            localStorage.setItem('portfolio_voted', note);
            hasVoted = note;
            loadRating();
        })
        .catch(() => {
            if (msg) msg.textContent = 'Erreur, réessayez plus tard.';
        });
    });
});

loadRating();
setTimeout(loadRating, 3000);

// ============================================
// SMOOTH REVEAL ON LOAD
// ============================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
