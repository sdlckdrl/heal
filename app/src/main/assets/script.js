$(document).ready(function() {
    const waterLayer = $('#water-layer');
    const riverbedCanvas = document.getElementById('riverbed-layer');
    const riverbedCtx = riverbedCanvas.getContext('2d');
    const weatherCanvas = document.getElementById('weather-layer');
    const weatherCtx = weatherCanvas.getContext('2d');
    const activePointers = new Map();

    let pebbles = [];
    let mode = 'clear';
    let ripplesReady = false;
    let lastIdleDrop = 0;
    let lastRainDrop = 0;
    let snowLevel = 0;
    let rainParticles = [];
    let snowParticles = [];

    try {
        waterLayer.ripples({
            resolution: 512,
            dropRadius: 38,
            perturbance: 0.15,
        });
        ripplesReady = true;
    } catch (e) {
        console.error('Ripples not supported', e);
    }

    function seededRandom(seed) {
        let value = seed % 2147483647;
        return function() {
            value = value * 16807 % 2147483647;
            return (value - 1) / 2147483646;
        };
    }

    function resizeCanvas(canvas) {
        const ratio = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function makePebbles(width, height) {
        const random = seededRandom(20260511);
        const colors = ['#9a8f7a', '#b9ad93', '#7f8b82', '#c8b99a', '#6f7771', '#a59883'];
        const nextPebbles = [];
        const count = Math.ceil((width * height) / 3200);

        for (let i = 0; i < count; i++) {
            const radius = 8 + random() * 22;
            nextPebbles.push({
                x: random() * width,
                y: random() * height,
                rx: radius * (0.75 + random() * 0.85),
                ry: radius * (0.55 + random() * 0.65),
                rotation: random() * Math.PI,
                color: colors[Math.floor(random() * colors.length)],
                alpha: 0.62 + random() * 0.26
            });
        }

        return nextPebbles;
    }

    function drawRiverbed() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const base = riverbedCtx.createLinearGradient(0, 0, width, height);
        base.addColorStop(0, '#d4c39d');
        base.addColorStop(0.45, '#b8b39b');
        base.addColorStop(1, '#77938f');
        riverbedCtx.fillStyle = base;
        riverbedCtx.fillRect(0, 0, width, height);

        pebbles.forEach(function(pebble) {
            riverbedCtx.save();
            riverbedCtx.translate(pebble.x, pebble.y);
            riverbedCtx.rotate(pebble.rotation);
            riverbedCtx.globalAlpha = pebble.alpha;
            riverbedCtx.fillStyle = pebble.color;
            riverbedCtx.beginPath();
            riverbedCtx.ellipse(0, 0, pebble.rx, pebble.ry, 0, 0, Math.PI * 2);
            riverbedCtx.fill();

            riverbedCtx.globalAlpha = 0.18;
            riverbedCtx.fillStyle = '#ffffff';
            riverbedCtx.beginPath();
            riverbedCtx.ellipse(-pebble.rx * 0.22, -pebble.ry * 0.28, pebble.rx * 0.38, pebble.ry * 0.22, 0, 0, Math.PI * 2);
            riverbedCtx.fill();
            riverbedCtx.restore();
        });

        const waterTint = riverbedCtx.createLinearGradient(0, 0, 0, height);
        waterTint.addColorStop(0, 'rgba(120, 205, 213, 0.2)');
        waterTint.addColorStop(1, 'rgba(31, 120, 148, 0.34)');
        riverbedCtx.fillStyle = waterTint;
        riverbedCtx.fillRect(0, 0, width, height);
    }

    function initScene() {
        resizeCanvas(riverbedCanvas);
        resizeCanvas(weatherCanvas);
        pebbles = makePebbles(window.innerWidth, window.innerHeight);
        rainParticles = [];
        snowParticles = [];
        drawRiverbed();
    }

    function dropRipple(x, y, radius, strength) {
        if (ripplesReady) {
            waterLayer.ripples('drop', x, y, radius, strength);
        }
    }

    function spawnRain(count) {
        for (let i = 0; i < count; i++) {
            rainParticles.push({
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 120,
                length: 14 + Math.random() * 18,
                speed: 760 + Math.random() * 360,
                drift: -90 + Math.random() * 55
            });
        }
    }

    function spawnSnow(count) {
        for (let i = 0; i < count; i++) {
            snowParticles.push({
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 160,
                radius: 1.4 + Math.random() * 3.2,
                speed: 28 + Math.random() * 54,
                drift: -18 + Math.random() * 36,
                sway: Math.random() * Math.PI * 2
            });
        }
    }

    function touchBurst(x, y) {
        if (mode === 'stone') {
            dropRipple(x, y, 44, 0.09);
            setTimeout(function() { dropRipple(x, y, 28, 0.045); }, 130);
            return;
        }

        if (mode === 'wave') {
            dropRipple(x, y, 76, 0.07);
            return;
        }

        if (mode === 'rain') {
            dropRipple(x, y, 26, 0.05);
            for (let i = 0; i < 8; i++) {
                rainParticles.push({
                    x: x - 36 + Math.random() * 72,
                    y: y - 90 - Math.random() * 40,
                    length: 12 + Math.random() * 14,
                    speed: 700 + Math.random() * 260,
                    drift: -60 + Math.random() * 45
                });
            }
            return;
        }

        if (mode === 'snow') {
            snowLevel = Math.min(1, snowLevel + 0.018);
            for (let i = 0; i < 10; i++) {
                snowParticles.push({
                    x: x - 48 + Math.random() * 96,
                    y: y - 110 - Math.random() * 70,
                    radius: 1.8 + Math.random() * 3.4,
                    speed: 20 + Math.random() * 44,
                    drift: -24 + Math.random() * 48,
                    sway: Math.random() * Math.PI * 2
                });
            }
            return;
        }

        dropRipple(x, y, 34, 0.055);
    }

    function drawSnowCover() {
        if (snowLevel <= 0.002) {
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const alpha = Math.min(0.46, snowLevel * 0.46);
        const cover = weatherCtx.createLinearGradient(0, 0, 0, height);
        cover.addColorStop(0, 'rgba(248, 253, 255, ' + (alpha * 0.76) + ')');
        cover.addColorStop(1, 'rgba(232, 245, 247, ' + alpha + ')');
        weatherCtx.fillStyle = cover;
        weatherCtx.fillRect(0, 0, width, height);

        weatherCtx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(0.32, snowLevel * 0.36) + ')';
        for (let y = 16; y < height; y += 42) {
            weatherCtx.beginPath();
            weatherCtx.ellipse(width * 0.5, y, width * 0.58, 8 + snowLevel * 16, 0, 0, Math.PI * 2);
            weatherCtx.fill();
        }
    }

    function updateWeather(delta, now) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        weatherCtx.clearRect(0, 0, width, height);

        if (mode === 'rain') {
            spawnRain(3);
            if (now - lastRainDrop > 140) {
                dropRipple(Math.random() * width, Math.random() * height, 18, 0.026);
                lastRainDrop = now;
            }
        }

        if (mode === 'snow') {
            spawnSnow(2);
            snowLevel = Math.min(1, snowLevel + delta * 0.018);
        } else {
            snowLevel = Math.max(0, snowLevel - delta * 0.025);
        }

        rainParticles = rainParticles.filter(function(drop) {
            drop.x += drop.drift * delta;
            drop.y += drop.speed * delta;

            weatherCtx.strokeStyle = 'rgba(205, 239, 255, 0.58)';
            weatherCtx.lineWidth = 1.3;
            weatherCtx.beginPath();
            weatherCtx.moveTo(drop.x, drop.y);
            weatherCtx.lineTo(drop.x - drop.drift * 0.035, drop.y - drop.length);
            weatherCtx.stroke();

            if (drop.y > height) {
                dropRipple(drop.x, height - 4, 12, 0.018);
                return false;
            }
            return drop.x > -80 && drop.x < width + 80;
        });

        drawSnowCover();

        snowParticles = snowParticles.filter(function(flake) {
            flake.sway += delta * 2.1;
            flake.x += (flake.drift + Math.sin(flake.sway) * 12) * delta;
            flake.y += flake.speed * delta;

            weatherCtx.fillStyle = 'rgba(255, 255, 255, 0.82)';
            weatherCtx.beginPath();
            weatherCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            weatherCtx.fill();

            if (flake.y > height - 8) {
                snowLevel = Math.min(1, snowLevel + flake.radius * 0.0008);
                return false;
            }
            return flake.x > -40 && flake.x < width + 40;
        });

        if (now - lastIdleDrop > 780) {
            const radius = mode === 'wave' ? 34 : 18;
            const strength = mode === 'wave' ? 0.05 : 0.032;
            dropRipple(Math.random() * width, Math.random() * height, radius, strength);
            lastIdleDrop = now;
        }
    }

    function animate(now) {
        if (!animate.lastTime) {
            animate.lastTime = now;
        }
        const delta = Math.min(0.05, (now - animate.lastTime) / 1000);
        animate.lastTime = now;
        updateWeather(delta, now);
        requestAnimationFrame(animate);
    }

    $('.event-button').on('click', function() {
        mode = this.dataset.mode;
        $('.event-button').removeClass('active');
        $(this).addClass('active');
    });

    waterLayer.on('pointerdown', function(e) {
        activePointers.set(e.originalEvent.pointerId, { x: e.clientX, y: e.clientY, lastDrop: 0 });
        waterLayer[0].setPointerCapture(e.originalEvent.pointerId);
        touchBurst(e.clientX, e.clientY);
        e.preventDefault();
    });

    waterLayer.on('pointermove', function(e) {
        const pointer = activePointers.get(e.originalEvent.pointerId);
        if (!pointer) {
            return;
        }

        const now = performance.now();
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        if (now - pointer.lastDrop > 130) {
            touchBurst(pointer.x, pointer.y);
            pointer.lastDrop = now;
        }
        e.preventDefault();
    });

    waterLayer.on('pointerup pointercancel pointerleave', function(e) {
        activePointers.delete(e.originalEvent.pointerId);
    });

    window.addEventListener('resize', initScene);
    initScene();
    requestAnimationFrame(animate);
});
