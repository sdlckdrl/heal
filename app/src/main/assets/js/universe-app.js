(function() {
    const data = window.SolarSystemData;
    const textureLoader = new THREE.TextureLoader();

    const state = {
        simulatedTimeMs: Date.now(),
        speedMultiplier: 1,
        currentTarget: 'sun',
        previousTargetPosition: new THREE.Vector3(),
        isTransitioning: false,
        lastFrameTime: performance.now()
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    const particleTexture = createGlowTexture();
    const solarSystemGroup = new THREE.Group();
    const galaxyGroup = new THREE.Group();
    const andromedaGroup = new THREE.Group();
    let skyDome;
    const bodyRegistry = {};
    const allOrbiters = [];
    const selectableBodies = [];
    const SOLAR_X = 2200;
    const LIGHT_YEAR_VIEW_SCALE = 105;
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();

    function init() {
        camera.position.set(0, 100, 200);

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(renderer.domElement);

        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 80000;
        controls.minDistance = 2;
        controls.addEventListener('start', function() {
            state.isTransitioning = false;
        });

        scene.add(new THREE.AmbientLight(0xffffff, 0.05));
        skyDome = createSkyDome();
        scene.add(skyDome);
        scene.add(galaxyGroup);
        solarSystemGroup.position.set(SOLAR_X, 0, 0);
        galaxyGroup.add(solarSystemGroup);
        solarSystemGroup.add(new THREE.PointLight(0xffffff, 2.5, 3000));

        buildGalaxies();
        buildNebulae();
        buildBelts();
        data.bodies.forEach(function(body) {
            buildBody(body, solarSystemGroup, null);
        });
        buildStarSystems();
        buildButtons();
        bindTimeControls();
        bindResize();

        requestAnimationFrame(animate);
    }

    function textureUrl(textureName) {
        if (!textureName) return null;
        if (/^https?:\/\//.test(textureName)) return textureName;
        return data.textureBase + textureName;
    }

    function loadTexture(textureName) {
        const url = textureUrl(textureName);
        if (!url) return null;

        if (!/^https?:\/\//.test(url)) {
            const image = new Image();
            const texture = new THREE.Texture(image);
            if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
            image.onload = function() {
                texture.needsUpdate = true;
            };
            image.onerror = function() {
                console.warn('Texture failed:', url);
            };
            image.src = url;
            return texture;
        }

        textureLoader.setCrossOrigin('anonymous');
        const texture = textureLoader.load(url, undefined, undefined, function() {
            console.warn('Texture failed:', url);
        });
        if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    function createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    function createSkyDome() {
        const width = 2048;
        const height = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, '#02030d');
        bg.addColorStop(0.48, '#05061a');
        bg.addColorStop(1, '#010105');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 11000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const band = Math.exp(-Math.pow((y - height * 0.52) / (height * 0.105), 2));
            const alpha = 0.08 + Math.random() * (0.45 + band * 0.35);
            const size = Math.random() < 0.96 ? 1 : 1.8 + Math.random() * 1.8;
            ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.fillRect(x, y, size, size);
        }

        for (let i = 0; i < 5200; i++) {
            const x = Math.random() * width;
            const y = height * 0.5 + Math.sin(x / width * Math.PI * 4.5) * height * 0.08 + (Math.random() - 0.5) * height * 0.2;
            const alpha = 0.035 + Math.random() * 0.1;
            const radius = 1 + Math.random() * 2.6;
            ctx.fillStyle = Math.random() > 0.48 ? 'rgba(116, 185, 255, ' + alpha + ')' : 'rgba(255, 220, 170, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(48000, 64, 32),
            new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
                depthWrite: false
            })
        );
        dome.renderOrder = -10;
        return dome;
    }

    function createGalaxyTexture(options) {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;
        const arms = options.arms || 4;
        const spin = options.spin || 4.8;
        const coreColor = options.coreColor || 'rgba(255, 230, 170, 1)';
        const armColor = options.armColor || 'rgba(118, 184, 255, 1)';
        const dustColor = options.dustColor || 'rgba(80, 110, 170, 0.35)';

        ctx.clearRect(0, 0, size, size);

        const core = ctx.createRadialGradient(center, center, 0, center, center, size * 0.28);
        core.addColorStop(0, coreColor);
        core.addColorStop(0.28, 'rgba(255, 215, 145, 0.55)');
        core.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = core;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 42000; i++) {
            const radiusNorm = Math.pow(Math.random(), 0.68);
            const radius = radiusNorm * center * 0.92;
            const arm = Math.floor(Math.random() * arms);
            const baseAngle = (arm / arms) * Math.PI * 2;
            const angle = baseAngle + radiusNorm * spin + (Math.random() - 0.5) * (0.52 - radiusNorm * 0.28);
            const scatter = Math.pow(Math.random(), 2.3) * center * (0.14 + radiusNorm * 0.18);
            const x = center + Math.cos(angle) * radius + (Math.random() - 0.5) * scatter;
            const y = center + Math.sin(angle) * radius * (options.flatten || 0.72) + (Math.random() - 0.5) * scatter * 0.55;
            const alpha = Math.max(0, 0.5 - radiusNorm * 0.36) + Math.random() * 0.28;
            const dotSize = 0.45 + Math.random() * (radiusNorm < 0.2 ? 1.7 : 1.05);

            ctx.fillStyle = Math.random() > 0.22 ? armColor.replace('1)', alpha + ')') : dustColor;
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 2600; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.pow(Math.random(), 1.8) * center * 0.82;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius * (options.flatten || 0.72);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.12 + Math.random() * 0.5) + ')';
            ctx.fillRect(x, y, 1.2, 1.2);
        }

        const fade = ctx.createRadialGradient(center, center, center * 0.1, center, center, center * 0.98);
        fade.addColorStop(0, 'rgba(255, 255, 255, 1)');
        fade.addColorStop(0.78, 'rgba(255, 255, 255, 0.72)');
        fade.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function createEdgeOnGalaxyTexture(options) {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;
        const coreColor = options.coreColor || 'rgba(255, 226, 170, 1)';
        const armColor = options.armColor || 'rgba(140, 190, 255, 1)';
        const dustColor = options.dustColor || 'rgba(55, 70, 110, 0.45)';

        ctx.clearRect(0, 0, size, size);

        const halo = ctx.createRadialGradient(center, center, 0, center, center, size * 0.48);
        halo.addColorStop(0, coreColor);
        halo.addColorStop(0.18, 'rgba(255, 218, 150, 0.42)');
        halo.addColorStop(0.58, 'rgba(116, 185, 255, 0.12)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 52000; i++) {
            const xNorm = Math.random() * 2 - 1;
            const falloff = Math.max(0, 1 - Math.abs(xNorm));
            const lane = (Math.random() - 0.5) * Math.pow(falloff, 0.42);
            const x = center + xNorm * center * 0.94;
            const y = center + lane * center * 0.2 + Math.sin(xNorm * Math.PI * 2.2) * center * 0.025;
            const alpha = (0.04 + Math.random() * 0.22) * Math.pow(falloff, 0.34);
            const radius = 0.35 + Math.random() * (1.8 * falloff + 0.4);

            ctx.fillStyle = Math.random() > 0.34 ? armColor.replace('1)', alpha + ')') : dustColor;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * (1.5 + Math.random() * 2.4), radius, (Math.random() - 0.5) * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        const dust = ctx.createLinearGradient(0, center - 30, 0, center + 46);
        dust.addColorStop(0, 'rgba(0,0,0,0)');
        dust.addColorStop(0.48, 'rgba(10,12,24,0.38)');
        dust.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dust;
        ctx.fillRect(0, center - 56, size, 112);

        const fade = ctx.createRadialGradient(center, center, center * 0.05, center, center, center * 0.98);
        fade.addColorStop(0, 'rgba(255,255,255,1)');
        fade.addColorStop(0.74, 'rgba(255,255,255,0.72)');
        fade.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function addGalaxyDisk(targetGroup, options) {
        const geometry = new THREE.PlaneGeometry(options.width, options.height, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            map: options.edgeOn ? createEdgeOnGalaxyTexture(options) : createGalaxyTexture(options),
            transparent: true,
            opacity: options.opacity || 0.86,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const disk = new THREE.Mesh(geometry, material);
        disk.rotation.x = -Math.PI / 2;
        disk.renderOrder = -2;
        targetGroup.add(disk);
        return disk;
    }

    function createNebulaTexture(config) {
        const size = 768;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const palette = config.palette || ['#7bc6ff', '#9d6bff', '#ff8a6c'];

        ctx.clearRect(0, 0, size, size);
        for (let i = 0; i < 180; i++) {
            const x = size * (0.2 + Math.random() * 0.6);
            const y = size * (0.2 + Math.random() * 0.6);
            const radius = size * (0.08 + Math.random() * 0.24);
            const color = new THREE.Color(palette[i % palette.length]);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(' + Math.floor(color.r * 255) + ', ' + Math.floor(color.g * 255) + ', ' + Math.floor(color.b * 255) + ', ' + (0.06 + Math.random() * 0.12) + ')');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        for (let i = 0; i < 260; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.12 + Math.random() * 0.42) + ')';
            ctx.fillRect(x, y, 1.2, 1.2);
        }

        const fade = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.56);
        fade.addColorStop(0, 'rgba(255,255,255,1)');
        fade.addColorStop(0.65, 'rgba(255,255,255,0.72)');
        fade.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        return new THREE.CanvasTexture(canvas);
    }

    function buildNebulae() {
        (data.nebulae || []).forEach(function(nebula) {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(nebula.width, nebula.height),
                new THREE.MeshBasicMaterial({
                    map: createNebulaTexture(nebula),
                    transparent: true,
                    opacity: nebula.opacity || 0.36,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            mesh.position.fromArray(nebula.position);
            mesh.rotation.set(nebula.rotation[0], nebula.rotation[1], nebula.rotation[2]);
            mesh.renderOrder = -4;
            scene.add(mesh);
        });
    }

    function buildGalaxies() {
        createMilkyWay(galaxyGroup);

        const andromeda = data.galaxies.find(function(item) { return item.id === 'andromeda'; });
        if (andromeda) {
            andromedaGroup.position.fromArray(andromeda.position);
            andromedaGroup.rotation.set(andromeda.rotation[0], andromeda.rotation[1], andromeda.rotation[2]);
            scene.add(andromedaGroup);
            createAndromeda(andromedaGroup);
        }

        const bgStarCount = 3000;
        const bgStarGeo = new THREE.BufferGeometry();
        const bgStarPos = new Float32Array(bgStarCount * 3);
        for (let i = 0; i < bgStarCount; i++) {
            let bx, by, bz, dist;
            do {
                bx = (Math.random() - 0.5) * 100000;
                by = (Math.random() - 0.5) * 100000;
                bz = (Math.random() - 0.5) * 100000;
                dist = Math.sqrt(bx * bx + by * by + bz * bz);
            } while (dist < 8000);
            bgStarPos[i * 3] = bx;
            bgStarPos[i * 3 + 1] = by;
            bgStarPos[i * 3 + 2] = bz;
        }
        bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
        scene.add(new THREE.Points(bgStarGeo, new THREE.PointsMaterial({
            color: 0xffffff,
            size: 20,
            map: particleTexture,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        })));
    }

    function applySolarExclusion(px, py, pz) {
        const exclusionRadius = 250;
        const dist = Math.sqrt(Math.pow(px - SOLAR_X, 2) + Math.pow(py, 2) + Math.pow(pz, 2));
        if (dist < exclusionRadius) {
            const f = exclusionRadius / Math.max(dist, 0.0001);
            return { x: SOLAR_X + (px - SOLAR_X) * f, y: py * f, z: pz * f };
        }
        return { x: px, y: py, z: pz };
    }

    function createMilkyWay(targetGroup) {
        addGalaxyDisk(targetGroup, {
            width: 10500,
            height: 7200,
            arms: 4,
            spin: 5.2,
            flatten: 0.72,
            opacity: 0.82,
            coreColor: 'rgba(255, 232, 176, 1)',
            armColor: 'rgba(116, 185, 255, 1)',
            dustColor: 'rgba(70, 95, 150, 0.32)'
        });

        const count = 50000;
        const radiusMax = 5000;
        const branches = 4;
        const spin = 1.3;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const coreColor = new THREE.Color('#ffeaa7');
        const armColor = new THREE.Color('#74b9ff');

        for (let i = 0; i < count; i++) {
            let radius = Math.random() * radiusMax;
            if (Math.random() > 0.4) radius = Math.pow(Math.random(), 3) * radiusMax * 0.4;
            const spinAngle = (radius / radiusMax) * spin * Math.PI * 2;
            const branchAngle = ((i % branches) / branches) * Math.PI * 2;
            let px = Math.cos(branchAngle + spinAngle) * radius + Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
            let py = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.15 * radius;
            let pz = Math.sin(branchAngle + spinAngle) * radius + Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
            if (radius < 800) {
                px *= 1.8;
                pz *= 0.5;
                py *= 1.5;
            }

            const cleanPos = applySolarExclusion(px, py, pz);
            positions[i * 3] = cleanPos.x;
            positions[i * 3 + 1] = cleanPos.y;
            positions[i * 3 + 2] = cleanPos.z;

            const c = (radius < 1000) ? coreColor : coreColor.clone().lerp(armColor, radius / radiusMax);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        targetGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
            size: 25,
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            transparent: true,
            opacity: 1
        })));
    }

    function createAndromeda(targetGroup) {
        addGalaxyDisk(targetGroup, {
            width: 13500,
            height: 7000,
            arms: 2,
            spin: 2.6,
            flatten: 0.38,
            opacity: 0.76,
            coreColor: 'rgba(255, 226, 170, 1)',
            armColor: 'rgba(140, 190, 255, 1)',
            dustColor: 'rgba(82, 96, 140, 0.22)'
        });

        const count = 18000;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const coreColor = new THREE.Color('#ffe2aa');
        const rimColor = new THREE.Color('#8cbaff');
        for (let i = 0; i < count; i++) {
            const radiusNorm = Math.pow(Math.random(), 0.58);
            const radius = radiusNorm * 6400;
            const arm = i % 2;
            const angle = arm * Math.PI + radiusNorm * 2.6 + (Math.random() - 0.5) * 0.58;
            const scatter = Math.pow(Math.random(), 2.1) * (430 + radiusNorm * 780);
            const falloff = 1 - radiusNorm;
            positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * scatter;
            positions[i * 3 + 1] = (Math.random() - 0.5) * (120 + 360 * Math.pow(falloff, 0.65));
            positions[i * 3 + 2] = Math.sin(angle) * radius * 0.38 + (Math.random() - 0.5) * scatter * 0.32;

            const color = coreColor.clone().lerp(rimColor, radiusNorm);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        targetGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
            size: 70,
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.78
        })));
    }

    function buildBelts() {
        data.belts.forEach(function(belt) {
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(belt.count * 3);
            for (let i = 0; i < belt.count; i++) {
                const distance = belt.innerDistance + Math.random() * (belt.outerDistance - belt.innerDistance);
                const angle = Math.random() * Math.PI * 2;
                positions[i * 3] = Math.cos(angle) * distance;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
                positions[i * 3 + 2] = Math.sin(angle) * distance;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            solarSystemGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
                color: belt.color,
                size: belt.size,
                transparent: true,
                opacity: 0.75
            })));
        });
    }

    function buildStarSystems() {
        (data.starSystems || []).forEach(function(systemData) {
            const group = new THREE.Group();
            group.position.copy(getStarSystemPosition(systemData));
            galaxyGroup.add(group);
            buildBody(systemData.star, group, null);
        });
    }

    function getStarSystemPosition(systemData) {
        if (typeof systemData.raDeg !== 'number' || typeof systemData.decDeg !== 'number' || typeof systemData.distancePc !== 'number') {
            return new THREE.Vector3().fromArray(systemData.position || [0, 0, 0]);
        }

        const galacticDirection = equatorialToGalacticDirection(systemData.raDeg, systemData.decDeg);
        const distanceLy = systemData.distancePc * 3.26156;
        const visualDistance = Math.sqrt(distanceLy) * LIGHT_YEAR_VIEW_SCALE;
        return new THREE.Vector3(
            SOLAR_X + galacticDirection.x * visualDistance,
            galacticDirection.y * visualDistance,
            galacticDirection.z * visualDistance
        );
    }

    function equatorialToGalacticDirection(raDeg, decDeg) {
        const ra = THREE.MathUtils.degToRad(raDeg);
        const dec = THREE.MathUtils.degToRad(decDeg);
        const cosDec = Math.cos(dec);
        const eqX = cosDec * Math.cos(ra);
        const eqY = cosDec * Math.sin(ra);
        const eqZ = Math.sin(dec);

        return new THREE.Vector3(
            -0.0548755604 * eqX - 0.8734370902 * eqY - 0.4838350155 * eqZ,
            -0.8676661490 * eqX - 0.1980763734 * eqY + 0.4559837762 * eqZ,
            0.4941094279 * eqX - 0.4448296300 * eqY + 0.7469822445 * eqZ
        ).normalize();
    }

    function buildBody(body, parentGroup, parentRecord) {
        const orbitPivot = new THREE.Group();
        parentGroup.add(orbitPivot);

        const system = new THREE.Group();
        system.position.x = body.distance || 0;
        orbitPivot.add(system);

        const tiltGroup = new THREE.Group();
        if (body.axialTilt) {
            tiltGroup.rotation.z = body.axialTilt * Math.PI / 180;
        }
        system.add(tiltGroup);

        const material = makeBodyMaterial(body);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(body.radius, 64, 64), material);
        tiltGroup.add(mesh);
        if (body.cloudTexture) addCloudLayer(mesh, body);
        if (body.atmosphereTexture) addAtmosphereLayer(mesh, body);

        if (body.glow) addGlow(system, body.glow);
        if (body.type === 'star') addStarLight(system, body);
        if (body.ring) addRing(mesh, body);
        if (body.distance > 0) addOrbitLine(parentGroup, body.distance, body.type);

        const record = {
            body,
            mesh,
            system,
            orbitPivot,
            parent: parentRecord,
            globalPos: new THREE.Vector3()
        };
        bodyRegistry[body.id] = record;
        allOrbiters.push(record);

        if (body.focus || body.type !== 'moon' || body.selectable) {
            selectableBodies.push(body);
        }

        (body.children || []).forEach(function(child) {
            buildBody(child, system, record);
        });

        return record;
    }

    function makeBodyMaterial(body) {
        const map = body.procedural ? createProceduralTexture(body) : loadTexture(body.texture);
        if (body.type === 'star') {
            return new THREE.MeshBasicMaterial({ map, color: body.color || 0xffffff });
        }
        return new THREE.MeshStandardMaterial({
            map,
            color: map ? 0xffffff : (body.color || 0xffffff),
            roughness: 0.62,
            metalness: 0.05
        });
    }

    function addCloudLayer(mesh, body) {
        const cloudMap = loadTexture(body.cloudTexture);
        if (!cloudMap) return;

        mesh.add(new THREE.Mesh(
            new THREE.SphereGeometry(body.radius * 1.018, 64, 64),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: cloudMap,
                alphaMap: cloudMap,
                transparent: true,
                opacity: 0.72,
                roughness: 0.78,
                metalness: 0,
                depthWrite: false
            })
        ));
    }

    function addAtmosphereLayer(mesh, body) {
        const atmosphereMap = loadTexture(body.atmosphereTexture);
        if (!atmosphereMap) return;

        mesh.add(new THREE.Mesh(
            new THREE.SphereGeometry(body.radius * 1.025, 64, 64),
            new THREE.MeshBasicMaterial({
                map: atmosphereMap,
                transparent: true,
                opacity: 0.58,
                depthWrite: false
            })
        ));
    }

    function createProceduralTexture(body) {
        if (body.type === 'star') return createStarTexture(body.procedural, body.color || 0xffffff);
        return createExoplanetTexture(body.procedural, body.color || 0x888888);
    }

    function createStarTexture(kind, colorValue) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const color = new THREE.Color(colorValue);
        const base = 'rgb(' + Math.floor(color.r * 255) + ', ' + Math.floor(color.g * 255) + ', ' + Math.floor(color.b * 255) + ')';

        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 8) {
                const heat = 0.7 + Math.random() * 0.55;
                ctx.fillStyle = 'rgba(255, ' + Math.floor(160 * heat) + ', ' + Math.floor(110 * heat) + ', 0.13)';
                ctx.beginPath();
                ctx.arc(x + Math.random() * 8, y + Math.random() * 8, 2 + Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (kind === 'red-dwarf') {
            ctx.fillStyle = 'rgba(80, 0, 0, 0.22)';
            for (let i = 0; i < 28; i++) ctx.fillRect(Math.random() * size, Math.random() * size, 70 + Math.random() * 140, 5 + Math.random() * 12);
        }

        return new THREE.CanvasTexture(canvas);
    }

    function createExoplanetTexture(kind, colorValue) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const base = new THREE.Color(colorValue);
        const accent = base.clone().offsetHSL(0.08, 0.12, 0.16);
        const dark = base.clone().offsetHSL(-0.04, -0.1, -0.22);

        const background = ctx.createLinearGradient(0, 0, size, size);
        background.addColorStop(0, toRgb(accent.clone().offsetHSL(0, 0.08, 0.08)));
        background.addColorStop(0.52, toRgb(base));
        background.addColorStop(1, toRgb(dark.clone().offsetHSL(0, 0.05, -0.08)));
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);

        if (kind === 'hot-jupiter') {
            for (let y = -20; y < size + 20; y += 14) {
                const c = y % 42 === 0 ? accent.clone().offsetHSL(0, 0.18, 0.16) : dark.clone().offsetHSL(0, 0.12, -0.04);
                ctx.fillStyle = toRgba(c, 0.72);
                drawWavyBand(ctx, y, 7 + Math.random() * 9, Math.random() * 18, size);
            }
            addStorm(ctx, size, size * 0.68, size * 0.54, '#dce8ff');
        } else {
            const terrainCount = kind === 'rocky-cloud' ? 170 : 125;
            for (let i = 0; i < terrainCount; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const rx = 18 + Math.random() * 70;
                const ry = 8 + Math.random() * 32;
                const patch = Math.random() > 0.45 ? accent.clone().offsetHSL(0.02, 0.18, 0.1) : dark.clone().offsetHSL(-0.03, 0.16, -0.04);
                ctx.fillStyle = toRgba(patch, 0.32 + Math.random() * 0.32);
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            if (kind === 'icy-ocean') {
                ctx.fillStyle = 'rgba(225, 250, 255, 0.62)';
                for (let i = 0; i < 46; i++) {
                    ctx.save();
                    ctx.translate(Math.random() * size, Math.random() * size);
                    ctx.rotate((Math.random() - 0.5) * 0.6);
                    ctx.fillRect(0, 0, 90 + Math.random() * 220, 2 + Math.random() * 7);
                    ctx.restore();
                }
            }

            if (kind === 'temperate') {
                ctx.fillStyle = 'rgba(230, 244, 225, 0.55)';
                for (let i = 0; i < 72; i++) {
                    ctx.beginPath();
                    ctx.ellipse(Math.random() * size, Math.random() * size, 25 + Math.random() * 100, 5 + Math.random() * 24, Math.random() * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            if (kind === 'rocky-cloud') {
                ctx.fillStyle = 'rgba(255, 235, 210, 0.28)';
                for (let i = 0; i < 36; i++) {
                    ctx.beginPath();
                    ctx.ellipse(Math.random() * size, Math.random() * size, 18 + Math.random() * 52, 4 + Math.random() * 16, Math.random() * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        addTerminatorShading(ctx, size);

        return new THREE.CanvasTexture(canvas);
    }

    function drawWavyBand(ctx, y, height, phase, width) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= width; x += 24) {
            ctx.lineTo(x, y + Math.sin(x * 0.025 + phase) * 7);
        }
        for (let x = width; x >= 0; x -= 24) {
            ctx.lineTo(x, y + height + Math.sin(x * 0.025 + phase + 1.7) * 7);
        }
        ctx.closePath();
        ctx.fill();
    }

    function addTerminatorShading(ctx, size) {
        const shade = ctx.createLinearGradient(0, 0, size, 0);
        shade.addColorStop(0, 'rgba(255,255,255,0.08)');
        shade.addColorStop(0.52, 'rgba(255,255,255,0)');
        shade.addColorStop(1, 'rgba(0,0,0,0.32)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, size, size);
    }

    function addStorm(ctx, width, x, y, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.46;
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.09, width * 0.045, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function toRgb(color) {
        return 'rgb(' + Math.floor(color.r * 255) + ', ' + Math.floor(color.g * 255) + ', ' + Math.floor(color.b * 255) + ')';
    }

    function toRgba(color, alpha) {
        return 'rgba(' + Math.floor(color.r * 255) + ', ' + Math.floor(color.g * 255) + ', ' + Math.floor(color.b * 255) + ', ' + alpha + ')';
    }

    function addStarLight(system, body) {
        const light = new THREE.PointLight(body.color || 0xffffff, body.lightIntensity || 1.8, body.lightDistance || 130);
        system.add(light);
    }

    function addGlow(system, glowLayers) {
        glowLayers.forEach(function(layer) {
            system.add(new THREE.Mesh(
                new THREE.SphereGeometry(layer.radius, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: layer.color,
                    map: particleTexture,
                    transparent: true,
                    opacity: layer.opacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            ));
        });
    }

    function addRing(mesh, body) {
        const ringTexture = loadTexture(body.ring.texture);
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(body.ring.innerRadius, body.ring.outerRadius, 96),
            new THREE.MeshStandardMaterial({
                map: ringTexture,
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95,
                roughness: 0.4
            })
        );
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }

    function addOrbitLine(parentGroup, distance, type) {
        const opacity = type === 'moon' ? 0.12 : 0.15;
        const points = new THREE.Path().absarc(0, 0, distance, 0, Math.PI * 2, false).getPoints(128);
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity })
        );
        line.rotation.x = Math.PI / 2;
        parentGroup.add(line);
    }

    function buildButtons() {
        const uiContainer = document.getElementById('ui-container');
        const contextPanel = document.getElementById('context-panel');
        uiContainer.innerHTML = '';
        contextPanel.innerHTML = '';

        data.galaxies.forEach(function(galaxy) {
            const button = makeButton(galaxy.id, galaxy.name, galaxy.buttonClass);
            uiContainer.appendChild(button);
        });

        getPrimaryBodies().forEach(function(body) {
            uiContainer.appendChild(makeBodyButton(body));
        });

        const contextBodies = getContextBodies();
        if (contextBodies.length) {
            const title = getContextTitle();
            contextPanel.dataset.title = title;
            contextPanel.classList.add('visible');
            contextBodies.forEach(function(body) {
                contextPanel.appendChild(makeBodyButton(body));
            });
        } else {
            contextPanel.classList.remove('visible');
            contextPanel.removeAttribute('data-title');
        }

        markActiveButton();
    }

    function getPrimaryBodies() {
        return selectableBodies.filter(function(body) {
            return body.type !== 'moon' && body.type !== 'exoplanet';
        });
    }

    function getContextBodies() {
        const current = bodyRegistry[state.currentTarget];
        if (!current) return [];

        if (current.body.children && current.body.children.length) {
            return current.body.children.filter(function(child) {
                return child.selectable !== false;
            });
        }

        if (current.parent && current.parent.body.children) {
            return current.parent.body.children.filter(function(sibling) {
                return sibling.selectable !== false;
            });
        }

        return [];
    }

    function getContextTitle() {
        const current = bodyRegistry[state.currentTarget];
        if (!current) return '하위 천체';
        if (current.body.children && current.body.children.length) return current.body.name + ' 주변 천체';
        if (current.parent) return current.parent.body.name + ' 주변 천체';
        return '하위 천체';
    }

    function makeBodyButton(body) {
        const buttonClass = body.type === 'dwarf' ? 'btn-dwarf' : body.type === 'moon' ? 'btn-moon' : body.type === 'exoplanet' ? 'btn-exoplanet' : body.type === 'star' && body.id !== 'sun' ? 'btn-exostar' : '';
        return makeButton(body.id, body.name, buttonClass);
    }

    function markActiveButton() {
        document.querySelectorAll('#ui-container button, #context-panel button').forEach(function(button) {
            button.classList.remove('active');
        });
        const activeButton = document.getElementById('btn-' + state.currentTarget);
        if (activeButton) activeButton.classList.add('active');
    }

    function makeButton(id, label, className) {
        const button = document.createElement('button');
        button.id = 'btn-' + id;
        button.type = 'button';
        button.textContent = label;
        if (className) button.classList.add(className);
        button.addEventListener('click', function() {
            focusPlanet(id);
        });
        return button;
    }

    function bindTimeControls() {
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');
        speedSlider.addEventListener('input', function(event) {
            const val = parseInt(event.target.value, 10);
            if (val === 0) {
                state.speedMultiplier = 1;
                speedDisplay.innerHTML = '<span style="color:#ffcc00">리얼타임 (현실 속도)</span>';
            } else {
                state.speedMultiplier = val * 10000;
                speedDisplay.innerHTML = '시간 가속: <b>' + (state.speedMultiplier / 10000).toFixed(0) + '만배</b>';
            }
        });
        speedSlider.dispatchEvent(new Event('input'));
    }

    function bindResize() {
        window.addEventListener('resize', function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    function resetToRealTime() {
        state.simulatedTimeMs = Date.now();
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.value = 0;
        speedSlider.dispatchEvent(new Event('input'));
    }

    function focusPlanet(id) {
        if (state.currentTarget === id && !state.isTransitioning) {
            buildButtons();
            return;
        }
        state.currentTarget = id;
        state.isTransitioning = true;
        buildButtons();
    }

    function animate(now) {
        requestAnimationFrame(animate);
        const deltaMs = now - state.lastFrameTime;
        state.lastFrameTime = now;

        state.simulatedTimeMs += deltaMs * state.speedMultiplier;
        const elapsedDays = (state.simulatedTimeMs - J2000) / (1000 * 60 * 60 * 24);
        document.getElementById('date-display').innerText = new Date(state.simulatedTimeMs).toISOString().split('T')[0];

        galaxyGroup.rotation.y = -(elapsedDays * 0.000001);
        andromedaGroup.rotation.y = elapsedDays * 0.0000005;

        updateBodies(elapsedDays);
        updateCameraTarget();
        if (skyDome) skyDome.position.copy(camera.position);

        controls.update();
        renderer.render(scene, camera);
    }

    function updateBodies(elapsedDays) {
        allOrbiters.forEach(function(record) {
            const body = record.body;
            if (body.distance > 0 && body.orbitPeriodDays) {
                const orbitAngle = body.baseAngle + (elapsedDays / body.orbitPeriodDays) * Math.PI * 2;
                record.orbitPivot.rotation.y = orbitAngle;
            }

            if (body.realtimeRotation) {
                const timeFraction = (state.simulatedTimeMs % 86400000) / 86400000;
                record.mesh.rotation.y = timeFraction * Math.PI * 2 + Math.PI * 1.35;
            } else {
                record.mesh.rotation.y += body.spinSpeed * (state.speedMultiplier / 50000);
            }

            record.mesh.getWorldPosition(record.globalPos);
        });
    }

    function updateCameraTarget() {
        if (state.isTransitioning) {
            const targetAim = getTargetPosition(state.currentTarget);
            const idealCamPos = getIdealCameraPosition(state.currentTarget, targetAim);
            controls.target.lerp(targetAim, 0.04);
            camera.position.lerp(idealCamPos, 0.04);

            const distCheck = isWideFocus(state.currentTarget) ? 100 : 0.5;
            if (controls.target.distanceTo(targetAim) < distCheck) {
                state.isTransitioning = false;
                if (!isWideFocus(state.currentTarget)) {
                    state.previousTargetPosition.copy(targetAim);
                }
            }
            return;
        }

        if (state.currentTarget === 'galaxy') {
            controls.target.copy(galaxyGroup.position);
        } else if (state.currentTarget === 'andromeda') {
            controls.target.copy(andromedaGroup.position);
        } else {
            const currentPos = bodyRegistry[state.currentTarget].globalPos;
            camera.position.add(currentPos.clone().sub(state.previousTargetPosition));
            controls.target.copy(currentPos);
            state.previousTargetPosition.copy(currentPos);
        }
    }

    function getTargetPosition(id) {
        if (id === 'galaxy') return galaxyGroup.position;
        if (id === 'andromeda') return andromedaGroup.position;
        return bodyRegistry[id].globalPos;
    }

    function getIdealCameraPosition(id, targetAim) {
        if (id === 'galaxy') return new THREE.Vector3(targetAim.x, 7000, targetAim.z + 4500);
        if (id === 'andromeda') return targetAim.clone().add(new THREE.Vector3(0, 5000, 4000));

        const body = bodyRegistry[id].body;
        const scale = body.type === 'moon' ? 10 : 4;
        return targetAim.clone().add(new THREE.Vector3(body.radius * scale, body.radius * scale * 0.75, body.radius * scale));
    }

    function isWideFocus(id) {
        return id === 'galaxy' || id === 'andromeda';
    }

    window.UniverseApp = {
        resetToRealTime,
        focusPlanet
    };

    init();
})();
