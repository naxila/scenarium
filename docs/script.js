// Main JavaScript for documentation
document.addEventListener('DOMContentLoaded', function() {
    // Initialization
    initNavigation();
    initSmoothScrolling();
    initCodeHighlighting();
    initMobileMenu();
    initSearch();
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // If it's a link to a separate page - don't prevent transition
            if (href && !href.startsWith('#')) {
                return; // Allow browser to handle transition
            }
            
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to current link
            this.classList.add('active');
            
            // Scroll to section
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Track active section on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        // Update active link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// Smooth scrolling
function initSmoothScrolling() {
    // Add smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Code syntax highlighting
function initCodeHighlighting() {
    // Prism.js is already connected, just initialize
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
    
    // Add copy buttons for code blocks
    addCopyButtons();
}

// Adding copy buttons
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
        const pre = block.parentElement;
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '📋';
        button.title = 'Copy code';
        
        // Button styles
        button.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            color: white;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Show button on hover
        pre.style.position = 'relative';
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        // Handle copying
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                button.innerHTML = '✅';
                setTimeout(() => {
                    button.innerHTML = '📋';
                }, 2000);
            } catch (err) {
                console.error('Copy error:', err);
                button.innerHTML = '❌';
                setTimeout(() => {
                    button.innerHTML = '📋';
                }, 2000);
            }
        });
        
        pre.appendChild(button);
    });
}

// Mobile menu
function initMobileMenu() {
    // Create mobile menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '☰';
    menuButton.style.cssText = `
        display: none;
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(menuButton);
    
    // Show button on mobile devices
    function checkMobile() {
        if (window.innerWidth <= 768) {
            menuButton.style.display = 'block';
        } else {
            menuButton.style.display = 'none';
            document.querySelector('.sidebar').classList.remove('open');
        }
    }
    
    window.addEventListener('resize', checkMobile);
    checkMobile();
    
    // Handle button click
    menuButton.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const menuButton = document.querySelector('.mobile-menu-button');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuButton.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// Documentation search
function initSearch() {
    // Create search field
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search documentation...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        width: 100%;
        padding: 0.75rem;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 14px;
    `;
    
    searchContainer.appendChild(searchInput);
    
    // Insert search into sidebar
    const sidebarContent = document.querySelector('.sidebar-content');
    sidebarContent.insertBefore(searchContainer, sidebarContent.firstChild);
    
    // Handle search
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const sections = document.querySelectorAll('.section');
        
        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(query) || query === '') {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
        
        // Highlight search results
        if (query) {
            highlightSearchResults(query);
        } else {
            clearHighlights();
        }
    });
    
    // Styles for placeholder
    searchInput.style.setProperty('--placeholder-color', 'rgba(255,255,255,0.6)');
    searchInput.addEventListener('focus', function() {
        this.style.background = 'rgba(255,255,255,0.2)';
    });
    searchInput.addEventListener('blur', function() {
        this.style.background = 'rgba(255,255,255,0.1)';
    });
}

// Highlight search results
function highlightSearchResults(query) {
    clearHighlights();
    
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.style.display !== 'none') {
            const walker = document.createTreeWalker(
                section,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            textNodes.forEach(textNode => {
                const text = textNode.textContent;
                const regex = new RegExp(`(${query})`, 'gi');
                if (regex.test(text)) {
                    const highlightedText = text.replace(regex, '<mark>$1</mark>');
                    const span = document.createElement('span');
                    span.innerHTML = highlightedText;
                    textNode.parentNode.replaceChild(span, textNode);
                }
            });
        }
    });
}

// Clear highlights
function clearHighlights() {
    const marks = document.querySelectorAll('mark');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });
}

// Additional utilities
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add "To top" button
function addScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-to-top';
    button.title = 'To top';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #667eea;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(button);
    
    // Show button on scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
        } else {
            button.style.opacity = '0';
        }
    });
    
    // Handle click
    button.addEventListener('click', scrollToTop);
}

// Initialize "To top" button
addScrollToTopButton();

// Error handling
window.addEventListener('error', function(e) {
    console.error('Documentation error:', e.error);
});

// Export functions for global use
window.DocsUtils = {
    scrollToTop,
    highlightSearchResults,
    clearHighlights
};
