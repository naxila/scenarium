// Smart Documentation System
class SmartDocs {
    constructor() {
        this.currentLanguage = 'en';
        this.currentPage = 'overview';
        this.init();
    }

    init() {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get('lang') || 'en';
        const hash = window.location.hash.substring(1) || 'overview';
        
        this.currentLanguage = lang;
        this.currentPage = hash;
        
        // Load initial content
        this.loadContent(this.currentLanguage, this.currentPage);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.substring(1) || 'overview';
            this.currentPage = hash;
            this.loadContent(this.currentLanguage, this.currentPage);
        });
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update active language button
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`lang-${lang}`).classList.add('active');
        
        // Load content for selected language
        this.loadContent(lang, this.currentPage);
    }

    loadContent(lang, page) {
        const contentPath = `${lang}/${page}.html`;
        
        fetch(contentPath)
            .then(response => response.text())
            .then(html => {
                // Extract main content from the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('.main-content .content');
                
                if (mainContent) {
                    document.getElementById('main-content').innerHTML = mainContent.innerHTML;
                    
                    // Update navigation menu
                    this.updateNavigation(lang);
                    
                    // Update page title
                    const title = doc.querySelector('title');
                    if (title) {
                        document.title = title.textContent;
                    }
                    
                    // Update URL without reload
                    const newUrl = `${window.location.pathname}#${page}`;
                    if (window.location.hash !== `#${page}`) {
                        history.pushState(null, null, newUrl);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading content:', error);
                // Fallback to English if language not found
                if (lang !== 'en') {
                    this.switchLanguage('en');
                }
            });
    }

    updateNavigation(lang) {
        const navMenu = document.getElementById('nav-menu');
        
        const menuItems = {
            en: [
                { href: '#overview', text: '📋 Overview', icon: 'overview' },
                { href: '#installation', text: '📦 Installation', icon: 'installation' },
                { href: '#quick-start', text: '🚀 Quick Start', icon: 'quick-start' },
                { href: '#scenarios', text: '📝 Scenarios', icon: 'scenarios' },
                { href: '#custom-actions', text: '⚡ Custom Actions', icon: 'custom-actions' },
                { href: '#custom-functions', text: '🔧 Custom Functions', icon: 'custom-functions' },
                { href: '#interpolation', text: '🔗 Interpolation', icon: 'interpolation' },
                { href: '#interpolation-system', text: '🎯 Interpolation System', icon: 'interpolation-system' },
                { href: '#examples', text: '💡 Examples', icon: 'examples' },
                { href: '#actions', text: '⚡ Built-in Actions', icon: 'actions', submenu: [
                    { href: '#actions/send-message', text: 'SendMessage' },
                    { href: '#actions/navigate', text: 'Navigate' },
                    { href: '#actions/back', text: 'Back' },
                    { href: '#actions/request-input', text: 'RequestInput' },
                    { href: '#actions/cancel-awaiting-input', text: 'CancelAwaitingInput' },
                    { href: '#actions/update-message', text: 'UpdateMessage' },
                    { href: '#actions/delete-message', text: 'DeleteMessage' },
                    { href: '#actions/store', text: 'Store' },
                    { href: '#actions/request-api', text: 'RequestApi' },
                    { href: '#actions/custom', text: 'CustomAction' }
                ]},
                { href: '#functions', text: '🔧 Built-in Functions', icon: 'functions', submenu: [
                    { href: '#functions/join-to-string', text: 'JoinToString' },
                    { href: '#functions/equals', text: 'Equals' },
                    { href: '#functions/read-storage', text: 'ReadStorage' },
                    { href: '#functions/plus', text: 'Plus' },
                    { href: '#functions/minus', text: 'Minus' },
                    { href: '#functions/multiply', text: 'Multiply' },
                    { href: '#functions/divide', text: 'Divide' },
                    { href: '#functions/mod', text: 'Mod' },
                    { href: '#functions/map', text: 'Map' }
                ]}
            ],
            ru: [
                { href: '#overview', text: '📋 Обзор', icon: 'overview' },
                { href: '#installation', text: '📦 Установка', icon: 'installation' },
                { href: '#quick-start', text: '🚀 Быстрый старт', icon: 'quick-start' },
                { href: '#scenarios', text: '📝 Сценарии', icon: 'scenarios' },
                { href: '#custom-actions', text: '⚡ Кастомные действия', icon: 'custom-actions' },
                { href: '#custom-functions', text: '🔧 Кастомные функции', icon: 'custom-functions' },
                { href: '#interpolation', text: '🔗 Интерполяция', icon: 'interpolation' },
                { href: '#interpolation-system', text: '🎯 Система интерполяции', icon: 'interpolation-system' },
                { href: '#examples', text: '💡 Примеры', icon: 'examples' },
                { href: '#actions', text: '⚡ Встроенные действия', icon: 'actions', submenu: [
                    { href: '#actions/send-message', text: 'SendMessage' },
                    { href: '#actions/navigate', text: 'Navigate' },
                    { href: '#actions/back', text: 'Back' },
                    { href: '#actions/request-input', text: 'RequestInput' },
                    { href: '#actions/cancel-awaiting-input', text: 'CancelAwaitingInput' },
                    { href: '#actions/update-message', text: 'UpdateMessage' },
                    { href: '#actions/delete-message', text: 'DeleteMessage' },
                    { href: '#actions/store', text: 'Store' },
                    { href: '#actions/request-api', text: 'RequestApi' },
                    { href: '#actions/custom', text: 'CustomAction' }
                ]},
                { href: '#functions', text: '🔧 Встроенные функции', icon: 'functions', submenu: [
                    { href: '#functions/join-to-string', text: 'JoinToString' },
                    { href: '#functions/equals', text: 'Equals' },
                    { href: '#functions/read-storage', text: 'ReadStorage' },
                    { href: '#functions/plus', text: 'Plus' },
                    { href: '#functions/minus', text: 'Minus' },
                    { href: '#functions/multiply', text: 'Multiply' },
                    { href: '#functions/divide', text: 'Divide' },
                    { href: '#functions/mod', text: 'Mod' },
                    { href: '#functions/map', text: 'Map' }
                ]}
            ]
        };

        const items = menuItems[lang] || menuItems.en;
        navMenu.innerHTML = '';

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const link = document.createElement('a');
            link.href = item.href;
            link.className = 'nav-link';
            link.textContent = item.text;
            link.onclick = (e) => {
                e.preventDefault();
                const page = item.href.substring(1);
                this.currentPage = page;
                this.loadContent(this.currentLanguage, page);
            };

            li.appendChild(link);

            if (item.submenu) {
                const submenu = document.createElement('ul');
                submenu.className = 'submenu';
                
                item.submenu.forEach(subItem => {
                    const subLi = document.createElement('li');
                    const subLink = document.createElement('a');
                    subLink.href = subItem.href;
                    subLink.className = 'nav-link';
                    subLink.textContent = subItem.text;
                    subLink.onclick = (e) => {
                        e.preventDefault();
                        const page = subItem.href.substring(1);
                        this.currentPage = page;
                        this.loadContent(this.currentLanguage, page);
                    };
                    subLi.appendChild(subLink);
                    submenu.appendChild(subLi);
                });
                
                li.appendChild(submenu);
            }

            navMenu.appendChild(li);
        });
    }
}

// Global functions for backward compatibility
function switchLanguage(lang) {
    if (window.smartDocs) {
        window.smartDocs.switchLanguage(lang);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartDocs = new SmartDocs();
});
