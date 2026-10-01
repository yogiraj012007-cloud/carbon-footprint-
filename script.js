/* =========================================================
   Landing + Auth System
   
   This IIFE (Immediately Invoked Function Expression) initializes
   the entire landing page experience including:
   - Three.js 3D Earth globe with Milky Way skybox and starfield
   - GSAP ScrollTrigger-driven scroll animations for the intro sequence
   - Authentication modal system (Login, Signup, Forgot Password)
   - Post-authentication transition with loader animation
   
   It runs on DOMContentLoaded to ensure all HTML elements are available.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Three.js Scene Setup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    var container = document.getElementById('canvas-container');
    if (!container) return; // Guard: if landing layer missing, skip

    // Enable scrolling for the landing page scroll-driven animation
    // (body has overflow:hidden by default for the main app layout)
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';



    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.z = 5;

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Milky Way Skybox ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * createSkybox() — Creates a large inverted sphere around the entire scene to simulate
     * a Milky Way night sky background. Uses THREE.BackSide rendering so the texture
     * appears on the inside of the sphere. Loads a night-sky texture from unpkg CDN;
     * if loading fails, falls back to a plain white semi-transparent material.
     * The sphere is rotated slightly for a natural tilt effect.
     */
    (function createSkybox() {
        var skyGeom = new THREE.SphereGeometry(900, 32, 32);
        var skyMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.35,
        });
        var skybox = new THREE.Mesh(skyGeom, skyMat);
        skybox.rotation.x = 0.3;
        skybox.rotation.z = 0.15;
        scene.add(skybox);

        var skyLoader = new THREE.TextureLoader();
        skyLoader.load(
            'https://unpkg.com/three-globe@2.31.1/example/img/night-sky.png',
            function (texture) {
                skyMat.map = texture;
                skyMat.needsUpdate = true;
            },
            undefined,
            function () {
                console.warn('Milky Way texture failed ΓÇö starfield only.');
            }
        );
    })();

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Layered Starfield ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * Starfield Layer 1 — Creates 3500 small, dim, distant star particles.
     * 
     * This self-executing function generates a particle system of randomized stars
     * distributed in a spherical shell (radius 300–800 units). Each star gets a random
     * color temperature (cool blue-white, neutral white, or warm yellow-white) to simulate
     * realistic star color variation. Uses THREE.Points with sizeAttenuation for depth.
     * 
     * @param {number} count — Number of star particles (3500)
     * @param {number} minSize — Minimum particle size (0.4)
     * @param {number} maxSize — Maximum particle size (1.0)
     * @param {number} opacity — Layer transparency (0.5)
     * @param {number} radiusMin — Inner shell radius (300)
     * @param {number} radiusMax — Outer shell radius (800)
     */
    (function (count, minSize, maxSize, opacity, radiusMin, radiusMax) {
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);

        for (var i = 0; i < count; i++) {
            var radius = radiusMin + Math.random() * (radiusMax - radiusMin);
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            var temp = Math.random();
            if (temp < 0.3) {
                colors[i * 3] = 0.8 + Math.random() * 0.15;
                colors[i * 3 + 1] = 0.85 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
            } else if (temp < 0.6) {
                var w = 0.9 + Math.random() * 0.1;
                colors[i * 3] = w;
                colors[i * 3 + 1] = w;
                colors[i * 3 + 2] = w;
            } else {
                colors[i * 3] = 0.95 + Math.random() * 0.05;
                colors[i * 3 + 1] = 0.88 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.75 + Math.random() * 0.15;
            }
        }

        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var mat = new THREE.PointsMaterial({
            size: minSize + (maxSize - minSize) * 0.5,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
        });

        scene.add(new THREE.Points(geom, mat));
    })(3500, 0.4, 1.0, 0.5, 300, 800);

    /**
     * Starfield Layer 2 — Creates 600 brighter, larger highlight stars.
     * 
     * Similar to Layer 1 but with fewer, larger, and more visible particles.
     * These serve as "bright stars" that stand out against the dimmer background.
     * Distributed in a slightly closer shell (radius 250–700) with higher opacity.
     * All stars in this layer have a cool blue-white tint.
     * 
     * @param {number} count — Number of star particles (600)
     * @param {number} minSize — Minimum particle size (1.2)
     * @param {number} maxSize — Maximum particle size (2.2)
     * @param {number} opacity — Layer transparency (0.7)
     * @param {number} radiusMin — Inner shell radius (250)
     * @param {number} radiusMax — Outer shell radius (700)
     */
    (function (count, minSize, maxSize, opacity, radiusMin, radiusMax) {
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);

        for (var i = 0; i < count; i++) {
            var radius = radiusMin + Math.random() * (radiusMax - radiusMin);
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            var bw = 0.9 + Math.random() * 0.1;
            colors[i * 3] = bw;
            colors[i * 3 + 1] = bw;
            colors[i * 3 + 2] = 0.92 + Math.random() * 0.08;
        }

        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var mat = new THREE.PointsMaterial({
            size: minSize + (maxSize - minSize) * 0.5,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
        });

        scene.add(new THREE.Points(geom, mat));
    })(600, 1.2, 2.2, 0.7, 250, 700);

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Lighting ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    var ambientLight = new THREE.AmbientLight(0x222233, 0.12);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    sunLight.position.set(5, 2, 4);
    scene.add(sunLight);

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Earth Sphere ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    var earthRadius = 1.6;
    var geometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    var material = new THREE.MeshPhongMaterial({
        color: 0x2255aa,
        emissive: 0x0a0a14,
        emissiveIntensity: 0.08,
        shininess: 25,
        specular: 0x333333,
    });

    var earth = new THREE.Mesh(geometry, material);
    earth.scale.set(1.0, 1.0, 1.0);
    scene.add(earth);

    // Load 2K Earth texture
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
        function (texture) {
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            material.map = texture;
            material.color.set(0xffffff);
            material.emissive.set(0x050510);
            material.needsUpdate = true;
        },
        undefined,
        function () {
            console.warn('Earth texture failed to load ΓÇö using procedural material.');
        }
    );

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Rotation State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    var rotationState = { speed: 0.0015 };

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Responsive Resize ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    /**
     * onResize() — Handles browser window resize events for the Three.js scene.
     * 
     * Updates the camera's aspect ratio to match the new window dimensions,
     * recalculates the projection matrix, and resizes the WebGL renderer canvas.
     * This prevents the 3D scene from appearing stretched or squished when
     * the user resizes their browser window.
     */
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ Render Loop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    var landingActive = true;

    /**
     * animate() — The main Three.js render loop for the landing page.
     * 
     * Called recursively via requestAnimationFrame to create smooth 60fps rendering.
     * On each frame it:
     * 1. Checks if the landing page is still active (stops if user has transitioned to app).
     * 2. Rotates the Earth globe by rotationState.speed radians per frame.
     * 3. Renders the entire Three.js scene (earth, stars, skybox) to the canvas.
     * 
     * The rotation speed is animated by GSAP ScrollTrigger — it starts at 0.0015
     * and decelerates to 0 as the user scrolls through the landing page.
     */
    function animate() {
        if (!landingActive) return; // Stop render loop after transition
        requestAnimationFrame(animate);
        earth.rotation.y += rotationState.speed;
        renderer.render(scene, camera);
    }
    animate();

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ GSAP ScrollTrigger Timeline ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    gsap.registerPlugin(ScrollTrigger);

    var cards = document.querySelectorAll('#overlay .info-card');
    var ctaButtons = document.getElementById('cta-buttons');

    // Master timeline ΓÇö scrub: true for direct 1:1 scroll tracking
    var tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
        },
    });

    // ΓòÉΓòÉΓòÉ EARTH ANIMATION ΓÇö 0% to 50% ΓòÉΓòÉΓòÉ

    tl.to(earth.position, { y: -1.4, duration: 0.25, ease: 'none' }, 0);
    tl.to(earth.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 0.175, ease: 'none' }, 0);

    tl.to(earth.position, { y: -2.0, duration: 0.125, ease: 'none' }, 0.25);

    tl.to(earth.scale, { x: 2.34, y: 1.81, z: 2.34, duration: 0.125, ease: 'none' }, 0.375);
    tl.to(earth.position, { y: -3.4, duration: 0.125, ease: 'none' }, 0.375);
    tl.to(rotationState, { speed: 0, duration: 0.125, ease: 'none' }, 0.375);

    // ΓòÉΓòÉΓòÉ TITLE TEXT ΓòÉΓòÉΓòÉ

    var titleEl = document.getElementById('title-text');

    gsap.set(titleEl, { top: '50%', scale: 0.15, opacity: 0, xPercent: -50, yPercent: -50 });

    tl.to(titleEl, {
        top: '14%',
        scale: 1,
        opacity: 1,
        duration: 0.15,
        ease: 'power2.out',
        onUpdate: function () {
            var currentTop = parseFloat(gsap.getProperty(titleEl, 'top'));
            var viewH = window.innerHeight;
            if (currentTop < viewH * 0.35) {
                titleEl.style.zIndex = '5';
            } else {
                titleEl.style.zIndex = '1';
            }
        },
    }, 0);

    tl.to(titleEl, {
        opacity: 0,
        top: '8%',
        scale: 0.9,
        duration: 0.08,
        ease: 'power2.in',
        onComplete: function () { titleEl.style.zIndex = '1'; },
    }, 0.42);

    // ΓòÉΓòÉΓòÉ INFO CARDS ΓÇö 52% to 88% ΓòÉΓòÉΓòÉ

    var cardCount = cards.length;
    var cardsStart = 0.52;
    var cardsEnd = 0.88;
    var totalCardRange = cardsEnd - cardsStart;
    var perCard = totalCardRange / cardCount;

    var enterDur = 0.025;
    var exitDur = 0.02;

    cards.forEach(function (card, i) {
        var cardStart = cardsStart + i * perCard;
        var cardEnd = cardStart + perCard;

        var enterX = (i % 2 === 0) ? -80 : 80;

        tl.fromTo(
            card,
            { opacity: 0, x: enterX, y: 30 },
            { opacity: 1, x: 0, y: 0, duration: enterDur, ease: 'power1.out' },
            cardStart
        );

        tl.to(
            card,
            { opacity: 0, y: -30, duration: exitDur, ease: 'power1.in' },
            cardEnd - exitDur
        );
    });

    // ΓòÉΓòÉΓòÉ CTA BUTTONS ΓÇö 90% to 97% ΓòÉΓòÉΓòÉ

    tl.fromTo(
        ctaButtons,
        { opacity: 0, y: 24 },
        {
            opacity: 1,
            y: 0,
            duration: 0.07,
            ease: 'power1.out',
            onStart: function () { ctaButtons.classList.add('active'); },
            onReverseComplete: function () { ctaButtons.classList.remove('active'); },
        },
        0.92
    );

    // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    //

    // ── Enter Button Navigation ──
    /**
     * handleEnter() — Called when the Enter button is clicked.
     * Directs user to the external/separate login page.
     */
    function handleEnter() {
        window.location.href = 'https://mycarbonfootprint-peach.vercel.app/';
    }

    // Expose globally so external scripts/handlers can hook into it
    window.handleEnter = handleEnter;

    var btnEnter = document.getElementById('btn-enter');
    if (btnEnter) {
        btnEnter.addEventListener('click', function (e) {
            e.preventDefault();
            handleEnter();
        });
    }

    var navEnter = document.getElementById('nav-enter');
    if (navEnter) {
        navEnter.addEventListener('click', function (e) {
            e.preventDefault();
            handleEnter();
        });
    }

}); // end DOMContentLoaded
