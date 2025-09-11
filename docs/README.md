# 📚 Scenarium Documentation

This directory contains complete documentation for the Scenarium project.

## 🚀 Quick Start

### Local Viewing

1. Open the `index.html` file in your browser
2. Or run a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### GitHub Pages

1. Make sure files are in the `docs/` folder in the repository root
2. Enable GitHub Pages in repository settings
3. Select source "Deploy from a branch" and folder "docs"
4. Documentation will be available at: `https://your-username.github.io/scenarium`

## 📁 Documentation Structure

```
docs/
├── index.html          # Main documentation page
├── styles.css          # Documentation styles
├── script.js           # JavaScript for interactivity
├── _config.yml         # GitHub Pages configuration
└── README.md           # This file
```

## 🎨 Features

- **Responsive design** - works on all devices
- **Sidebar navigation** - convenient navigation through sections
- **Search** - quick search through content
- **Syntax highlighting** - beautiful code formatting
- **Code copying** - buttons for copying examples
- **Smooth scrolling** - comfortable navigation
- **Mobile menu** - convenience on mobile devices

## 🔧 Configuration

### Changing Theme

Edit the `styles.css` file:

```css
/* Main colors */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
  --bg-color: #f8f9fa;
}
```

### Adding New Sections

1. Add a section to `index.html`:

```html
<section id="new-section" class="section">
  <h2>New Section</h2>
  <!-- Content -->
</section>
```

2. Add a link to navigation:

```html
<li class="nav-item">
  <a href="#new-section" class="nav-link">New Section</a>
</li>
```

### Search Configuration

Search works automatically on all text elements. To improve results you can:

1. Add `data-search` attributes to elements
2. Configure filtering in `script.js`

## 📝 Updating Documentation

### Adding New Actions

1. Add description to "Actions" section in `index.html`
2. Create an action card with parameters and examples
3. Update navigation if necessary

### Adding New Functions

1. Add description to "Functions" section in `index.html`
2. Create a function card with parameters and examples
3. Update navigation if necessary

## 🚀 Deployment

### GitHub Pages

1. Make sure all files are in the `docs/` folder
2. Commit changes:

```bash
git add docs/
git commit -m "Update documentation"
git push origin main
```

3. GitHub Pages will automatically update the site

### Other Platforms

- **Netlify**: Drag the `docs/` folder to Netlify
- **Vercel**: Connect the repository and specify the `docs/` folder
- **GitHub Pages**: Use Actions for automatic deployment

## 🔍 SEO Optimization

Documentation is optimized for search engines:

- HTML5 semantic markup
- Meta tags for description and keywords
- Structured data
- Fast loading
- Mobile responsiveness

## 📱 Mobile Version

Documentation is fully responsive:

- Sidebar menu collapses on mobile devices
- Mobile menu button appears automatically
- Optimized font sizes and spacing
- Touch navigation

## 🎯 Performance

- Minimal HTTP requests
- Optimized images
- Static resource caching
- Lazy content loading

## 🐛 Troubleshooting

### Navigation Issues

1. Check that all links start with `#`
2. Make sure section IDs match href links
3. Check browser console for JavaScript errors

### Style Issues

1. Make sure `styles.css` file is loading
2. Check for CSS conflicts
3. Clear browser cache

### Search Issues

1. Check that JavaScript is enabled
2. Make sure there are no console errors
3. Check that elements contain text content

## 📞 Support

If you have questions or issues with the documentation:

1. Create an Issue in the repository
2. Describe the problem in detail
3. Attach screenshots if necessary

## 📄 License

Documentation is distributed under the same license as the main project.
