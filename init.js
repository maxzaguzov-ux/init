const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Цвета для консоли
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

// --- СПИСОК ФАЙЛОВ ПРОЕКТА ---
const projectFiles = [
    {
        path: 'package.json',
        content: `{
  "name": "@maxzaguzov-ux/gulp-custom",
  "version": "1.0.0",
  "description": "My build",
  "license": "ISC",
  "author": "maxzaguzov",
  "type": "commonjs",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "start": "nps"
  },
  "keywords": [
    "gulp",
    "build",
    "custom"
  ],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "devDependencies": {
    "browser-sync": "^3.0.4",
    "del": "^6.1.1",
    "gulp": "^5.0.1",
    "gulp-autoprefixer": "^8.0.0",
    "gulp-concat": "^2.6.1",
    "gulp-imagemin": "^7.1.0",
    "gulp-rename": "^2.1.0",
    "gulp-sass": "^6.0.1",
    "gulp-uglify": "^3.0.2",
    "nps": "^5.10.0",
    "sass": "^1.97.3"
  }
}
`,
        deleteIfExists: true
    },
    {
        path: 'package-scripts.js',
        content: `module.exports = {
  scripts: {
    start: 'gulp',
    build: 'gulp build',
    init: 'gulp init',
    clean: 'gulp cleandist'
  }
}
`,
        deleteIfExists: true
    },
    {
        path: 'readme.txt',
        content: `если профиля нет, или выпадает ошибка, то нужно в командной строке ее создать
if (!(Test-Path -Path $PROFILE)) {
New-Item -Type File -Path $PROFILE -Force
}
notepad $PROFILE
далее скопировать из файла notepad $PROFILE и вставить в командную строку
`,
        deleteIfExists: true
    },
    {
        path: 'gulpfile.js',
        content: `// ===== ИМПОРТЫ =====
const {
    src,
    dest,
    parallel,
    series,
    watch
} = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer').default;
const scss = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const del = require('del');
const fs = require('fs');
const path = require('path');
const rename = require('gulp-rename');

// ===== BROWSERSYNC =====
function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'app/'
        },
        notify: false,
        online: true
    });
}

// ===== СКРИПТЫ =====
function scripts() {
    return src('app/js/main.js', {
            allowEmpty: true
        })
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream());
}

// ===== СТИЛИ =====
function styles() {
    return src('app/scss/style.scss', {
            allowEmpty: true
        })
        .pipe(scss({
            outputStyle: 'expanded'
        }))
        .pipe(concat('style.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true
        }))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream());
}

// ===== ИЗОБРАЖЕНИЯ =====
function images() {
    if (!fs.existsSync('app/images')) {
        return Promise.resolve();
    }
    return src('app/images/**/*.{jpg,jpeg,png,gif,svg}', {
            allowEmpty: true,
            encoding: false
        })
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { name: 'removeViewBox', active: false },
                    { name: 'cleanupIDs', params: { minify: false } },
                    { name: 'removeComments', active: true }
                ]
            })
        ]))
        .on('error', (err) => {
            console.error('❌ Ошибка оптимизации:', err.message);
        })
        .pipe(dest('dist/images'));
}

// ===== WATCH =====
function watching() {
    watch(['app/**/*.html']).on('change', browserSync.reload);
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
    watch(['app/scss/**/*.scss'], styles);
}

// ===== ОЧИСТКА dist =====
function cleandist() {
    return del('dist');
}

// ===== ОЧИСТКА APP (Исходников) =====
function cleanApp() {
    return del([
        'app',
        'dist'
    ]);
}

// ===== СОЗДАНИЕ ИСХОДНИКОВ =====
function createSource() {
    const folders = ['app', 'app/css', 'app/js', 'app/scss', 'app/scss/components', 'app/images'];
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {
                recursive: true
            });
        }
    });

    const files = {
        'app/index.html': '<!DOCTYPE html>\\n<html lang="ru">\\n<head>\\n    <meta charset="UTF-8">\\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n    <link rel="stylesheet" href="css/style.min.css">\\n    <title>Project</title>\\n</head>\\n<body>\\n    <h1>Project Ready</h1>\\n    <script src="js/main.min.js"></script>\\n</body>\\n</html>',
        'app/scss/style.scss': \`@import 'components/style';
@import 'components/main';
@import 'components/header';
@import 'components/footer';\`,
        'app/js/main.js': \`document.addEventListener('DOMContentLoaded', () => {
    console.log('Project initialized!');
})\`,
        'app/scss/components/_style.scss': \`@function rem($pixels) {
    @return calc($pixels/10)+rem;
}

html {
    font-size: calc(100vw/1920 * 10);
    box-sizing: border-box;
    scroll-behavior: smooth;
    overflow-x: hidden;
}

*,
*::before,
*::after {
    box-sizing: inherit;
}

body,
h1,
h2,
h3,
h4,
h5,
h6,
p,
ul,
ol,
li,
figure,
figcaption,
blockquote,
dl,
dd {
    margin: 0;
    padding: 0;
}

ul {
    list-style: none;
}

img {
    max-width: 100%;
    display: block;
}

a {
    text-decoration: none;
    color: inherit;
}

input,
button,
textarea,
select {
    font: inherit;
}

button {
    border: none;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    border: 0;
    padding: 0;
    white-space: nowrap;
    clip-path: inset(100%);
    clip: rect(0 0 0 0);
    overflow: hidden;
}\`,
        'app/scss/components/_mixin.scss': \`@mixin backgroundProps($repeat, $position, $size) {
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
}\`,
        'app/scss/components/_main.scss': '',
        'app/scss/components/_header.scss': '',
        'app/scss/components/_footer.scss': ''
    };

    Object.entries(files).forEach(([filePath, content]) => {
        fs.writeFileSync(filePath, content, 'utf8');
    });

    console.log('✅ Исходники созданы!');
    return Promise.resolve();
}

// ===== BUILD =====
function buildFiles() {
    return src([
            'app/**/*.html',
            'app/css/style.min.css',
            'app/js/main.min.js'
        ], {
            base: 'app',
            allowEmpty: true
        })
        .pipe(rename(function (path) {
            path.basename = path.basename.replace('.min', '');
        }))
        .pipe(dest('dist'));
}

// ===== ЭКСПОРТ =====
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.watching = watching;
exports.cleandist = cleandist;
exports.cleanApp = cleanApp;
exports.createSource = createSource;
exports.buildFiles = buildFiles;

exports.build = series(cleandist, parallel(styles, scripts), images, buildFiles);
exports.init = series(cleanApp, createSource);
exports.default = parallel(styles, scripts, browsersync, watching);
`,
        deleteIfExists: true
    }
];
// -----------------------------

// 🔥 Функция для удаления папки .git
function deleteGitFolder() {
    const gitPath = path.resolve('.git');
    
    return new Promise((resolve, reject) => {
        if (fs.existsSync(gitPath)) {
            try {
                fs.rmSync(gitPath, { recursive: true, force: true });
                console.log(`${colors.cyan}🗑️  Папка .git удалена${colors.reset}`);
                resolve();
            } catch (err) {
                console.error(`${colors.red}❌ Ошибка удаления .git:${colors.reset} ${err.message}`);
                reject(err);
            }
        } else {
            console.log(`${colors.yellow}ℹ️  Папка .git не найдена (пропущено)${colors.reset}`);
            resolve();
        }
    });
}

// Функция для создания файлов проекта
async function createProjectFiles() {
    console.log(`${colors.yellow}🚀 Начало инициализации проекта...${colors.reset}\n`);

    for (const file of projectFiles) {
        const fullPath = path.resolve(file.path);
        const dir = path.dirname(fullPath);

        try {
            // 🔥 1. Если файл существует и стоит флаг удаления — удаляем его
            if (file.deleteIfExists && fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`${colors.cyan}🗑️  Удалён старый:${colors.reset} ${file.path}`);
            }

            // 2. Создаем папки, если их нет
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`${colors.green}📁 Создана папка:${colors.reset} ${dir}`);
            }

            // 3. Создаём файл
            fs.writeFileSync(fullPath, file.content);
            console.log(`${colors.green}📄 Создан файл:${colors.reset} ${file.path}`);

        } catch (err) {
            console.error(`${colors.red}❌ Ошибка при создании ${file.path}:${colors.reset} ${err.message}`);
        }
    }

    console.log(`\n${colors.green}✅ Все файлы проекта созданы!${colors.reset}\n`);
}

// Функция для запроса подтверждения
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

// Функция для запуска npm install
function runNpmInstall() {
    return new Promise((resolve, reject) => {
        console.log(`${colors.yellow}⏳ Установка зависимостей...${colors.reset}\n`);
        
        const install = exec('npm install', (error, stdout, stderr) => {
            if (error) {
                console.error(`${colors.red}❌ Ошибка установки:${colors.reset} ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`${colors.yellow}⚠️  Предупреждения:${colors.reset} ${stderr}`);
            }
            console.log(stdout);
            resolve();
        });

        install.stdout.on('data', (data) => {
            process.stdout.write(data);
        });
    });
}

// 🔥 Функция для самоудаления init.js
function deleteInitScript() {
    const initPath = path.resolve('init.js');
    
    return new Promise((resolve, reject) => {
        if (fs.existsSync(initPath)) {
            try {
                fs.unlinkSync(initPath);
                console.log(`${colors.cyan}🗑️  init.js удалён${colors.reset}`);
                resolve();
            } catch (err) {
                console.error(`${colors.red}❌ Ошибка удаления init.js:${colors.reset} ${err.message}`);
                reject(err);
            }
        } else {
            resolve();
        }
    });
}

// Основная функция
async function main() {
    try {
        // 🔥 0. Удаляем папку .git если она есть
        await deleteGitFolder();
        console.log('');

        // 1. Создаём файлы проекта
        await createProjectFiles();

        // 2. Запрашиваем подтверждение для npm install
        const answer = await askQuestion(
            `${colors.blue}❓ Выполнить команду "npm install"? (Y/n): ${colors.reset}`
        );

        const normalizedAnswer = answer.trim().toLowerCase();

        // 3. Если пользователь согласен (Y, yes, пустой ввод)
        if (normalizedAnswer === '' || normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
            await runNpmInstall();
            console.log(`\n${colors.green}✅ Зависимости установлены!${colors.reset}\n`);
            
            // 🔥 4. Удаляем init.js после успешной установки
            await deleteInitScript();
            
            console.log(`\n${colors.green}🎉 Проект готов к работе!${colors.reset}\n`);
            console.log(`${colors.yellow}📌 Доступные команды:${colors.reset}`);
            console.log(`   ${colors.cyan}npm start${colors.reset}      → Запуск Gulp + BrowserSync`);
            console.log(`   ${colors.cyan}npm run build${colors.reset}  → Сборка в папку dist`);
            console.log(`   ${colors.cyan}npm run init${colors.reset}   → Создание структуры исходников (app/)`);
            console.log(`   ${colors.cyan}npm run clean${colors.reset}  → Очистка папки dist`);
            console.log(`\n${colors.yellow}📌 Для нового git-репозитория выполните:${colors.reset}`);
            console.log(`   ${colors.cyan}git init${colors.reset}`);
            console.log(`   ${colors.cyan}git add .${colors.reset}`);
            console.log(`   ${colors.cyan}git commit -m "Initial commit"${colors.reset}\n`);
        } else {
            console.log(`\n${colors.yellow}⚠️  Установка пропущена.${colors.reset}`);
            console.log(`${colors.yellow}📌 Запустите ${colors.cyan}npm install${colors.yellow} вручную, когда будете готовы.${colors.reset}\n`);
            console.log(`${colors.yellow}⚠️  init.js сохранён для повторного использования.${colors.reset}\n`);
        }

    } catch (err) {
        console.error(`${colors.red}❌ Критическая ошибка:${colors.reset} ${err.message}`);
        process.exit(1);
    }
}

main();