// Основной JavaScript для документации
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация
    initNavigation();
    initSmoothScrolling();
    initCodeHighlighting();
    initMobileMenu();
    initSearch();
});

// Навигация
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Обработка кликов по навигации
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Если это ссылка на отдельную страницу - не предотвращаем переход
            if (href && !href.startsWith('#')) {
                return; // Позволяем браузеру обработать переход
            }
            
            e.preventDefault();
            
            // Удаляем активный класс со всех ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс к текущей ссылке
            this.classList.add('active');
            
            // Прокручиваем к секции
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
    
    // Отслеживание активной секции при прокрутке
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
        
        // Обновляем активную ссылку
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// Плавная прокрутка
function initSmoothScrolling() {
    // Добавляем плавную прокрутку для всех внутренних ссылок
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

// Подсветка синтаксиса кода
function initCodeHighlighting() {
    // Prism.js уже подключен, просто инициализируем
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
    
    // Добавляем кнопки копирования для блоков кода
    addCopyButtons();
}

// Добавление кнопок копирования
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
        const pre = block.parentElement;
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '📋';
        button.title = 'Копировать код';
        
        // Стили для кнопки
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
        
        // Показываем кнопку при наведении
        pre.style.position = 'relative';
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        // Обработка копирования
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                button.innerHTML = '✅';
                setTimeout(() => {
                    button.innerHTML = '📋';
                }, 2000);
            } catch (err) {
                console.error('Ошибка копирования:', err);
                button.innerHTML = '❌';
                setTimeout(() => {
                    button.innerHTML = '📋';
                }, 2000);
            }
        });
        
        pre.appendChild(button);
    });
}

// Мобильное меню
function initMobileMenu() {
    // Создаем кнопку мобильного меню
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
    
    // Показываем кнопку на мобильных устройствах
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
    
    // Обработка клика по кнопке
    menuButton.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    });
    
    // Закрытие меню при клике вне его
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

// Поиск по документации
function initSearch() {
    // Создаем поле поиска
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск по документации...';
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
    
    // Вставляем поиск в сайдбар
    const sidebarContent = document.querySelector('.sidebar-content');
    sidebarContent.insertBefore(searchContainer, sidebarContent.firstChild);
    
    // Обработка поиска
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
        
        // Подсвечиваем найденные результаты
        if (query) {
            highlightSearchResults(query);
        } else {
            clearHighlights();
        }
    });
    
    // Стили для placeholder
    searchInput.style.setProperty('--placeholder-color', 'rgba(255,255,255,0.6)');
    searchInput.addEventListener('focus', function() {
        this.style.background = 'rgba(255,255,255,0.2)';
    });
    searchInput.addEventListener('blur', function() {
        this.style.background = 'rgba(255,255,255,0.1)';
    });
}

// Подсветка результатов поиска
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

// Очистка подсветки
function clearHighlights() {
    const marks = document.querySelectorAll('mark');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });
}

// Дополнительные утилиты
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Добавляем кнопку "Наверх"
function addScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-to-top';
    button.title = 'Наверх';
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
    
    // Показываем кнопку при прокрутке
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
        } else {
            button.style.opacity = '0';
        }
    });
    
    // Обработка клика
    button.addEventListener('click', scrollToTop);
}

// Инициализируем кнопку "Наверх"
addScrollToTopButton();

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка в документации:', e.error);
});

// Экспорт функций для глобального использования
window.DocsUtils = {
    scrollToTop,
    highlightSearchResults,
    clearHighlights
};
