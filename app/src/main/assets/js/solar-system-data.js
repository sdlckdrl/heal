(function() {
    const textureBase = 'textures/';

    window.SolarSystemData = {
        textureBase,
        textureCredits: 'Solar System Scope, CC BY 4.0, https://www.solarsystemscope.com/textures/',
        galaxies: [
            { id: 'galaxy', name: '우리 은하', buttonClass: 'btn-galaxy', cameraOffset: [0, 7000, 4500] },
            { id: 'andromeda', name: '안드로메다', buttonClass: 'btn-other-galaxy', position: [35000, 15000, -25000], rotation: [0.5, 0, 0.3], cameraOffset: [0, 5000, 4000] }
        ],
        bodies: [
            {
                id: 'sun',
                name: '태양',
                type: 'star',
                radius: 8,
                distance: 0,
                orbitPeriodDays: 1,
                baseAngle: 0,
                spinSpeed: 0.002,
                texture: '2k_sun.jpg',
                color: 0xffdd88,
                focus: true,
                glow: [
                    { radius: 11, color: 0xffddaa, opacity: 0.8 },
                    { radius: 28, color: 0xffaa00, opacity: 0.3 }
                ]
            },
            { id: 'mercury', name: '수성', type: 'planet', radius: 0.8, distance: 15, orbitPeriodDays: 88, baseAngle: 4.3, spinSpeed: 0.01, texture: '2k_mercury.jpg', color: 0x8d8680 },
            { id: 'venus', name: '금성', type: 'planet', radius: 1.5, distance: 22, orbitPeriodDays: 225, baseAngle: 3.1, spinSpeed: 0.005, texture: '2k_venus_surface.jpg', atmosphereTexture: '2k_venus_atmosphere.jpg', color: 0xc99658 },
            {
                id: 'earth',
                name: '지구',
                type: 'planet',
                radius: 1.6,
                distance: 32,
                orbitPeriodDays: 365.25,
                baseAngle: 1.7,
                spinSpeed: 0.02,
                axialTilt: 23.44,
                texture: '2k_earth_daymap.jpg',
                cloudTexture: '2k_earth_clouds.jpg',
                color: 0x4b78d0,
                realtimeRotation: true,
                children: [
                    { id: 'moon', name: '달', type: 'moon', radius: 0.4, distance: 3.5, orbitPeriodDays: 27.3, baseAngle: 0, spinSpeed: 0.02, texture: '2k_moon.jpg', color: 0xbbbbbb, selectable: true }
                ]
            },
            {
                id: 'mars',
                name: '화성',
                type: 'planet',
                radius: 1.0,
                distance: 42,
                orbitPeriodDays: 687,
                baseAngle: 6.2,
                spinSpeed: 0.018,
                texture: '2k_mars.jpg',
                color: 0xb45535,
                children: [
                    { id: 'phobos', name: '포보스', type: 'moon', radius: 0.18, distance: 2.0, orbitPeriodDays: 0.32, baseAngle: 1.1, spinSpeed: 0.018, color: 0x8b8076, selectable: true },
                    { id: 'deimos', name: '데이모스', type: 'moon', radius: 0.13, distance: 2.8, orbitPeriodDays: 1.26, baseAngle: 3.3, spinSpeed: 0.015, color: 0x9a8d81, selectable: true }
                ]
            },
            {
                id: 'jupiter',
                name: '목성',
                type: 'planet',
                radius: 4.5,
                distance: 60,
                orbitPeriodDays: 4333,
                baseAngle: 0.6,
                spinSpeed: 0.04,
                texture: '2k_jupiter.jpg',
                color: 0xd2a46d,
                children: [
                    { id: 'io', name: '이오', type: 'moon', radius: 0.32, distance: 6.5, orbitPeriodDays: 1.77, baseAngle: 0.2, spinSpeed: 0.02, color: 0xd7bf62, selectable: true },
                    { id: 'europa', name: '유로파', type: 'moon', radius: 0.28, distance: 8.2, orbitPeriodDays: 3.55, baseAngle: 1.7, spinSpeed: 0.018, color: 0xd3c6aa, selectable: true },
                    { id: 'ganymede', name: '가니메데', type: 'moon', radius: 0.42, distance: 10.5, orbitPeriodDays: 7.15, baseAngle: 2.7, spinSpeed: 0.016, color: 0x9a9187, selectable: true },
                    { id: 'callisto', name: '칼리스토', type: 'moon', radius: 0.39, distance: 13.0, orbitPeriodDays: 16.69, baseAngle: 4.3, spinSpeed: 0.014, color: 0x6f675e, selectable: true }
                ]
            },
            {
                id: 'saturn',
                name: '토성',
                type: 'planet',
                radius: 3.8,
                distance: 80,
                orbitPeriodDays: 10759,
                baseAngle: 0.8,
                spinSpeed: 0.038,
                texture: '2k_saturn.jpg',
                color: 0xd6bc84,
                ring: { innerRadius: 5.3, outerRadius: 9.8, texture: '2k_saturn_ring_alpha.png' },
                children: [
                    { id: 'titan', name: '타이탄', type: 'moon', radius: 0.42, distance: 10.8, orbitPeriodDays: 15.95, baseAngle: 0.4, spinSpeed: 0.014, color: 0xc99042, selectable: true },
                    { id: 'enceladus', name: '엔셀라두스', type: 'moon', radius: 0.2, distance: 7.8, orbitPeriodDays: 1.37, baseAngle: 2.2, spinSpeed: 0.012, color: 0xd8e1e8, selectable: true }
                ]
            },
            { id: 'uranus', name: '천왕성', type: 'planet', radius: 2.2, distance: 100, orbitPeriodDays: 30687, baseAngle: 5.5, spinSpeed: 0.025, axialTilt: 97.77, texture: '2k_uranus.jpg', color: 0x85d7e8 },
            { id: 'neptune', name: '해왕성', type: 'planet', radius: 2.1, distance: 120, orbitPeriodDays: 60190, baseAngle: 5.3, spinSpeed: 0.025, texture: '2k_neptune.jpg', color: 0x3d5edb },
            { id: 'ceres', name: '세레스', type: 'dwarf', radius: 0.45, distance: 50, orbitPeriodDays: 1681, baseAngle: 2.1, spinSpeed: 0.014, texture: '2k_ceres_fictional.jpg', color: 0x9b9288, belt: 'asteroid' },
            { id: 'pluto', name: '명왕성', type: 'dwarf', radius: 0.55, distance: 145, orbitPeriodDays: 90560, baseAngle: 4.7, spinSpeed: 0.012, color: 0xb48a70 },
            { id: 'haumea', name: '하우메아', type: 'dwarf', radius: 0.48, distance: 155, orbitPeriodDays: 103468, baseAngle: 2.9, spinSpeed: 0.02, texture: '2k_haumea_fictional.jpg', color: 0xd8d2c8 },
            { id: 'makemake', name: '마케마케', type: 'dwarf', radius: 0.5, distance: 164, orbitPeriodDays: 111845, baseAngle: 1.4, spinSpeed: 0.016, texture: '2k_makemake_fictional.jpg', color: 0xb05b44 },
            { id: 'eris', name: '에리스', type: 'dwarf', radius: 0.52, distance: 175, orbitPeriodDays: 203830, baseAngle: 5.8, spinSpeed: 0.011, texture: '2k_eris_fictional.jpg', color: 0xd6d6d6 }
        ],
        belts: [
            { id: 'asteroid-belt', name: '소행성대', innerDistance: 47, outerDistance: 55, count: 850, color: 0xaaa08f, size: 0.09 },
            { id: 'kuiper-belt', name: '카이퍼 벨트', innerDistance: 132, outerDistance: 182, count: 1200, color: 0x8aa6c8, size: 0.12 }
        ],
        nebulae: [
            { id: 'orion-nebula', name: '오리온 성운', position: [-8200, 2400, -6200], rotation: [0.15, 0.72, -0.2], width: 5200, height: 2600, palette: ['#ff8a6c', '#b565ff', '#5bc7ff'], opacity: 0.42 },
            { id: 'eagle-nebula', name: '독수리 성운', position: [6400, -1400, -7600], rotation: [-0.25, -0.68, 0.18], width: 4300, height: 3100, palette: ['#d89a43', '#6dd6a7', '#274c9c'], opacity: 0.36 },
            { id: 'crab-nebula', name: '게 성운', position: [-12400, -2200, 5400], rotation: [0.42, 0.2, 0.36], width: 3600, height: 2600, palette: ['#6bd0ff', '#f7d36b', '#fb6f92'], opacity: 0.34 }
        ],
        starSystems: [
            {
                id: 'trappist-1-system',
                name: 'TRAPPIST-1계',
                position: [3650, 140, 1250],
                raDeg: 346.6263919,
                decDeg: -5.0434618,
                distancePc: 12.42988881,
                star: {
                    id: 'trappist-1',
                    name: 'TRAPPIST-1',
                    type: 'star',
                    radius: 2.3,
                    distance: 0,
                    orbitPeriodDays: 1,
                    baseAngle: 0,
                    spinSpeed: 0.01,
                    color: 0xff6a4a,
                    procedural: 'red-dwarf',
                    focus: true,
                    glow: [
                        { radius: 4.2, color: 0xff6a4a, opacity: 0.58 },
                        { radius: 8.5, color: 0xff2f1f, opacity: 0.22 }
                    ],
                    children: [
                        { id: 'trappist-1e', name: 'TRAPPIST-1e', type: 'exoplanet', radius: 0.8, distance: 7.5, orbitPeriodDays: 6.1, baseAngle: 1.2, spinSpeed: 0.012, color: 0x4f8f7a, procedural: 'temperate', selectable: true },
                        { id: 'trappist-1f', name: 'TRAPPIST-1f', type: 'exoplanet', radius: 0.86, distance: 10.2, orbitPeriodDays: 9.2, baseAngle: 3.8, spinSpeed: 0.01, color: 0x7aa5b8, procedural: 'icy-ocean', selectable: true },
                        { id: 'trappist-1g', name: 'TRAPPIST-1g', type: 'exoplanet', radius: 0.93, distance: 13.0, orbitPeriodDays: 12.4, baseAngle: 5.1, spinSpeed: 0.01, color: 0x8d7d68, procedural: 'rocky-cloud', selectable: true }
                    ]
                }
            },
            {
                id: 'kepler-186-system',
                name: 'Kepler-186계',
                position: [-3300, -130, 1850],
                raDeg: 298.652736,
                decDeg: 43.9549884,
                distancePc: 177.594,
                star: {
                    id: 'kepler-186',
                    name: 'Kepler-186',
                    type: 'star',
                    radius: 2.8,
                    distance: 0,
                    orbitPeriodDays: 1,
                    baseAngle: 0,
                    spinSpeed: 0.008,
                    color: 0xffb06a,
                    procedural: 'orange-dwarf',
                    focus: true,
                    glow: [
                        { radius: 5.2, color: 0xffb06a, opacity: 0.52 },
                        { radius: 9.8, color: 0xff7a2f, opacity: 0.2 }
                    ],
                    children: [
                        { id: 'kepler-186f', name: 'Kepler-186f', type: 'exoplanet', radius: 0.95, distance: 12.5, orbitPeriodDays: 130, baseAngle: 2.4, spinSpeed: 0.009, color: 0x557a5c, procedural: 'temperate', selectable: true }
                    ]
                }
            },
            {
                id: 'hd-189733-system',
                name: 'HD 189733계',
                position: [4200, 180, -1450],
                raDeg: 300.1821223,
                decDeg: 22.7097759,
                distancePc: 19.7638,
                star: {
                    id: 'hd-189733',
                    name: 'HD 189733',
                    type: 'star',
                    radius: 3.0,
                    distance: 0,
                    orbitPeriodDays: 1,
                    baseAngle: 0,
                    spinSpeed: 0.01,
                    color: 0xffc27a,
                    procedural: 'yellow-star',
                    focus: true,
                    glow: [
                        { radius: 5.5, color: 0xffc27a, opacity: 0.54 },
                        { radius: 11.5, color: 0xffa040, opacity: 0.22 }
                    ],
                    children: [
                        { id: 'hd-189733b', name: 'HD 189733 b', type: 'exoplanet', radius: 1.3, distance: 8.0, orbitPeriodDays: 2.2, baseAngle: 0.6, spinSpeed: 0.02, color: 0x2e6cff, procedural: 'hot-jupiter', selectable: true }
                    ]
                }
            },
            {
                id: 'proxima-system',
                name: '프록시마계',
                position: [2550, -90, -520],
                raDeg: 217.3934657,
                decDeg: -62.6761821,
                distancePc: 1.30119,
                star: {
                    id: 'proxima-centauri',
                    name: '프록시마 센타우리',
                    type: 'star',
                    radius: 1.9,
                    distance: 0,
                    orbitPeriodDays: 1,
                    baseAngle: 0,
                    spinSpeed: 0.009,
                    color: 0xff4f3b,
                    procedural: 'red-dwarf',
                    focus: true,
                    glow: [
                        { radius: 3.8, color: 0xff4f3b, opacity: 0.52 },
                        { radius: 7.6, color: 0xff1f1a, opacity: 0.2 }
                    ],
                    children: [
                        { id: 'proxima-b', name: '프록시마 b', type: 'exoplanet', radius: 0.86, distance: 7.0, orbitPeriodDays: 11.2, baseAngle: 4.1, spinSpeed: 0.011, color: 0x8b6044, procedural: 'rocky-cloud', selectable: true }
                    ]
                }
            }
        ]
    };
})();
