import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, rmSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const buildDir = path.join(rootDir, 'build');
const remoteUrl = 'https://github.com/uongsuadaubung/switch_games_web.git';
const gitUser = 'uongsuadaubung';
const gitEmail = 'manhkien13041997@gmail.com';
const branch = 'main';

async function deploy() {
    console.log('🚀 Starting deployment process...');

    // Bước 1: Build project với DEPLOY_TARGET=gh-pages
    console.log('\n📦 Building project for GitHub Pages...');
    try {
        execSync('npm run build', {
            cwd: rootDir,
            stdio: 'inherit',
            env: { ...process.env, DEPLOY_TARGET: 'gh-pages' }, // ← set base path
        });
        console.log('✅ Build successful!');
    } catch (err) {
        console.error('❌ Build failed:', err.message);
        process.exit(1);
    }

    // Bước 2: Kiểm tra thư mục build
    if (!existsSync(buildDir)) {
        console.error(`❌ build/ folder not found at: ${buildDir}`);
        process.exit(1);
    }

    // Bước 3: Deploy
    console.log(`\n🌐 Deploying to: ${remoteUrl}`);
    console.log(`   Branch: ${branch}`);

    try {
        const gitDir = path.join(buildDir, '.git');

        // Xóa .git cũ nếu có để đảm bảo clean history
        if (existsSync(gitDir)) {
            rmSync(gitDir, { recursive: true, force: true });
            console.log('🗑️  Cleared old git history.');
        }

        // Tạo .nojekyll để GitHub Pages không bỏ qua thư mục _app
        writeFileSync(path.join(buildDir, '.nojekyll'), '');
        console.log('📄 Created .nojekyll');

        const commands = [
            `git init -b ${branch}`,
            `git config user.name "${gitUser}"`,
            `git config user.email "${gitEmail}"`,
            `git remote add origin ${remoteUrl}`,
            'git add .',
            `git commit -m "🚀 Deploy - ${new Date().toLocaleString('vi-VN')}"`,
            `git push -f origin ${branch}`,
        ];

        for (const cmd of commands) {
            console.log(`  ▶ ${cmd}`);
            execSync(cmd, { cwd: buildDir, stdio: 'inherit' });
        }

        console.log('\n✅ Successfully deployed to GitHub!');
        console.log(`🔗 https://uongsuadaubung.github.io/switch_games_web/`);

        // Bước 4: Dọn dẹp
        console.log('\n🧹 Cleaning up build folder...');
        if (existsSync(buildDir)) {
            rmSync(buildDir, { recursive: true, force: true });
            console.log('✅ Deleted build folder.');
        }
    } catch (err) {
        console.error('\n❌ Deployment failed:', err.message);
        process.exit(1);
    }

    console.log('\n🎉 Deployment finished!');
}

deploy();
