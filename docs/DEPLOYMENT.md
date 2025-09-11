# 🚀 Развертывание документации

Этот файл содержит инструкции по развертыванию документации Telegram Bot Constructor на различных платформах.

## 📋 Предварительные требования

- Git репозиторий с документацией в папке `docs/`
- Доступ к настройкам репозитория
- Базовые знания работы с Git

## 🌐 GitHub Pages

### Автоматическое развертывание

1. **Включите GitHub Pages в настройках репозитория:**
   - Перейдите в Settings → Pages
   - Выберите Source: "Deploy from a branch"
   - Выберите Branch: "main" или "master"
   - Выберите Folder: "/docs"
   - Нажмите Save

2. **Документация будет доступна по адресу:**
   ```
   https://your-username.github.io/telegram-bot-constructor
   ```

3. **Обновление происходит автоматически** при каждом push в основную ветку

### Ручное развертывание

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/telegram-bot-constructor.git
cd telegram-bot-constructor

# Переключитесь на ветку gh-pages
git checkout -b gh-pages

# Скопируйте содержимое папки docs в корень
cp -r docs/* .

# Зафиксируйте изменения
git add .
git commit -m "Deploy documentation"
git push origin gh-pages
```

## 🔥 Netlify

### Развертывание через веб-интерфейс

1. **Перейдите на [netlify.com](https://netlify.com)**
2. **Нажмите "New site from Git"**
3. **Подключите ваш GitHub репозиторий**
4. **Настройте сборку:**
   - Build command: `echo "No build needed"`
   - Publish directory: `docs`
5. **Нажмите "Deploy site"**

### Развертывание через CLI

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Войдите в аккаунт
netlify login

# Разверните сайт
netlify deploy --dir=docs --prod
```

### Настройка через netlify.toml

Создайте файл `netlify.toml` в корне репозитория:

```toml
[build]
  publish = "docs"
  command = "echo 'No build needed'"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## ⚡ Vercel

### Развертывание через веб-интерфейс

1. **Перейдите на [vercel.com](https://vercel.com)**
2. **Нажмите "New Project"**
3. **Подключите ваш GitHub репозиторий**
4. **Настройте проект:**
   - Framework Preset: "Other"
   - Root Directory: `docs`
   - Build Command: `echo "No build needed"`
   - Output Directory: `.`
5. **Нажмите "Deploy"**

### Развертывание через CLI

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт
vercel login

# Разверните проект
vercel --cwd docs
```

### Настройка через vercel.json

Создайте файл `vercel.json` в корне репозитория:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "docs/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/docs/$1"
    }
  ]
}
```

## 🔧 Firebase Hosting

### Настройка Firebase

1. **Установите Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Инициализируйте проект:**
   ```bash
   firebase init hosting
   ```

3. **Настройте firebase.json:**
   ```json
   {
     "hosting": {
       "public": "docs",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Разверните:**
   ```bash
   firebase deploy
   ```

## 🌍 Другие платформы

### Surge.sh

```bash
# Установите Surge
npm install -g surge

# Разверните
surge docs/ your-domain.surge.sh
```

### GitLab Pages

1. **Создайте файл `.gitlab-ci.yml`:**
   ```yaml
   pages:
     script:
       - echo "Deploying documentation"
     artifacts:
       paths:
         - docs
   ```

2. **Зафиксируйте и отправьте:**
   ```bash
   git add .gitlab-ci.yml
   git commit -m "Add GitLab Pages configuration"
   git push origin main
   ```

### AWS S3 + CloudFront

1. **Создайте S3 bucket**
2. **Загрузите файлы из папки docs**
3. **Настройте статический хостинг**
4. **Создайте CloudFront distribution**

## 🔄 Автоматическое обновление

### GitHub Actions

Файл `.github/workflows/docs.yml` уже настроен для автоматического развертывания.

### Webhooks

Настройте webhooks для автоматического обновления при изменениях в репозитории.

## 📊 Мониторинг

### Google Analytics

Добавьте в `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### Yandex Metrica

Добавьте в `index.html`:

```html
<!-- Yandex Metrica -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/watch.js", "ym");

   ym(YANDEX_METRICA_ID, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
```

## 🛠️ Локальная разработка

### Простой HTTP сервер

```bash
# Python 3
cd docs
python -m http.server 8000

# Node.js
npx serve docs

# PHP
php -S localhost:8000 -t docs
```

### Live Reload

```bash
# Установите live-server
npm install -g live-server

# Запустите с автоперезагрузкой
live-server docs
```

## 🔍 SEO оптимизация

### Sitemap

Создайте файл `sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### Robots.txt

Создайте файл `robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

## 🚨 Устранение неполадок

### Проблемы с GitHub Pages

1. **Проверьте настройки репозитория**
2. **Убедитесь, что файлы в папке docs/**
3. **Проверьте Actions для ошибок**
4. **Очистите кеш браузера**

### Проблемы с Netlify

1. **Проверьте настройки сборки**
2. **Убедитесь, что папка docs существует**
3. **Проверьте логи развертывания**

### Проблемы с Vercel

1. **Проверьте настройки проекта**
2. **Убедитесь, что Root Directory указан правильно**
3. **Проверьте логи развертывания**

## 📞 Поддержка

Если у вас возникли проблемы с развертыванием:

1. **Проверьте логи развертывания**
2. **Убедитесь, что все файлы на месте**
3. **Создайте Issue в репозитории**
4. **Опишите проблему подробно**

## 📄 Лицензия

Инструкции по развертыванию распространяются под той же лицензией, что и основной проект.
