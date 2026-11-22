import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(edgePath) ? edgePath : chromePath;

console.log('Using browser executable:', executablePath);

async function record() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const htmlPath = path.resolve('public', 'demo.html');
  await page.goto(`file://${htmlPath}`);

  console.log('Page loaded, generating video...');

  const videoBase64 = await page.evaluate(() => {
    return new Promise((resolve) => {
      const canvas = document.getElementById('record-canvas');
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();

      // Render frames
      let frame = 0;
      const totalFrames = 140; // ~4.5 seconds of high-frame animation
      const interval = setInterval(() => {
        const stepTarget = Math.floor((frame / totalFrames) * timeline.length);
        if (stepTarget !== stepIndex && stepTarget < timeline.length) {
          stepIndex = stepTarget;
          timeline[stepIndex].action();
          subtitle.textContent = timeline[stepIndex].text;
        }

        // Render to canvas
        ctx.fillStyle = '#f5f0e8';
        ctx.fillRect(0, 0, 800, 500);

        ctx.fillStyle = '#2d2d2d';
        ctx.font = 'bold 22px serif';
        ctx.fillText('CHHAYA — Shadow Strategy Board Game', 30, 38);

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('PASS & PLAY (2 PLAYERS)', 30, 58);

        ctx.fillStyle = turnText.textContent.includes('White') ? '#78350f' : '#1c1917';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(turnText.textContent, 540, 42);

        ctx.fillStyle = '#44403c';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(scoreWhite.textContent, 540, 62);
        ctx.fillText(scoreBlack.textContent, 670, 62);

        // 7x7 board
        const bx = 160, by = 80, bw = 320, cs = bw / 7;
        ctx.fillStyle = '#f1ebe0';
        ctx.fillRect(bx, by, bw, bw);
        ctx.strokeStyle = '#d4c8b0';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bw);

        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            ctx.strokeRect(bx + c * cs, by + r * cs, cs, cs);
          }
        }

        // Claims
        const claims = shadowLayer.querySelectorAll('rect');
        claims.forEach((rect) => {
          const rx = parseFloat(rect.getAttribute('x'));
          const ry = parseFloat(rect.getAttribute('y'));
          const c = Math.round((rx - 15) / 60);
          const r = Math.round((ry - 15) / 60);
          ctx.fillStyle = rect.getAttribute('fill');
          ctx.fillRect(bx + c * cs + 2, by + r * cs + 2, cs - 4, cs - 4);
        });

        // Stones
        const stones = stoneLayer.querySelectorAll('circle');
        stones.forEach((stone) => {
          const scx = parseFloat(stone.getAttribute('cx'));
          const scy = parseFloat(stone.getAttribute('cy'));
          const c = Math.round((scx - 15 - 30) / 60);
          const r = Math.round((scy - 15 - 30) / 60);
          const isWhite = stone.getAttribute('fill').includes('f5eee3');
          ctx.beginPath();
          ctx.arc(bx + c * cs + cs / 2, by + r * cs + cs / 2, cs * 0.36, 0, Math.PI * 2);
          ctx.fillStyle = isWhite ? '#f5eee3' : '#2d2d2d';
          ctx.fill();
          ctx.strokeStyle = isWhite ? '#c0ad91' : '#111';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Subtitle box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.roundRect ? ctx.roundRect(30, 420, 740, 56, 10) : ctx.fillRect(30, 420, 740, 56);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🎙️ Gameplay Demo:', 45, 453);

        ctx.fillStyle = '#ffffff';
        ctx.font = '500 13px sans-serif';
        ctx.fillText(subtitle.textContent, 195, 453);

        frame++;
        if (frame >= totalFrames) {
          clearInterval(interval);
          setTimeout(() => recorder.stop(), 500);
        }
      }, 35);
    });
  });

  const buffer = Buffer.from(videoBase64, 'base64');
  fs.writeFileSync('public/chhaya-demo.webm', buffer);
  fs.writeFileSync('public/chhaya-demo.mp4', buffer);
  console.log(`Video saved successfully! Size: ${buffer.length} bytes`);

  await browser.close();
}

record().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
