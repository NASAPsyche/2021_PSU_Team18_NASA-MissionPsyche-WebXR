import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.120.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/renderers/CSS3DRenderer.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/webxr/VRButton.js';

// check for XR support
// displaying enter AR if XR is supported
// if not it will display session not supported in the web dev browser
async function checkForXRSupport() {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
            console.log('xr supported.');
            enterXRExperiencePrompt();
        } else {
            console.log("xr not supported.");
            if(isUsingAndroidDevice()) {
                window.alert("WebXR experience not supported. Try downloading the \"Google Play Services for Ar\" application on the Google Play Store, and rescanning this QR code.");
            }
            else if(isUsingAppleDevice()) {
                window.alert("WebXR experience not supported. Try downloading the \"WebXR Viewer\" application on the Apple App Store, and rescanning this QR code.");
            }
            else {
                window.alert("WebXR experience not supported on Desktop devices.");
            }
            // comment this line out if you are using on a PC.
            window.history.back()
        }
    });
}

function isUsingAndroidDevice() {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("android") > -1;
}

function isUsingAppleDevice() {
    return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

function enterXRExperiencePrompt() {
    let promptText = "This is a webXR experience based on the Psyche Asteroid Misson, 2022. To load the WebXR application, press OK. To exit, press cancel.";
    if (confirm(promptText) == true) {
        console.log("loading WebXR experience...");
    } else {
        // exit webXR experience by navigating "back" in the browser.
        // If there are no pages in the history, this will exit the browser.
        window.history.back();
    }
}


var mesh,
    renderer,
    cssrenderer,
    css2Drenderer,
    scene,
    camera,
    orbitControls,
    geometry,
    cubes,
    points,
    lineGeometry,
    material,
    line,
    spacecraftMesh,
    neutronSpectrometerMesh,
    magnetometerMesh,
    raycaster,
    INTERSECTED,
    objectSelected,
    // track mouse
    mouseX = 0, mouseY = 0,
    // hold particles
    particleSystem1,
    particleSystem2,
    cameraAxis = true,
    systemsHaveStarted = false,
    buttonOrbitA, buttonOrbitB, buttonOrbitC, buttonOrbitD;

var orbit           = "init",
    tempOrbit       = "init";
var moveAway        = true;
var loaded          = false;
var instrumentView  = false;

const amount = parseInt( window.location.search.substr( 1 ) ) || 10;

// This pointer is used for the raycaster
const pointer = new THREE.Vector2();

init();

function init() {
    //=================//
    // Create a scene ||
    //=================//

    // -- scene: parent obj where all rendered obj, lights, and cameras live
    scene = new THREE.Scene();

    // -- camera: obj allows us to see other obj
    // Parameters:
    // FOV - Field of View - number in degrees representing vertical field of view - up down
    // Aspect Ratio: ratio between width and height (width divided by height) - innerWidth/Height grabs window size
    // Near Clipping Plane: plane closest to the camera - current val is max - anything closer and nothing is rendered
    // Far Clipping Plane: plane furtherst from camera - current val is max - anything bigger and nothing will be rendered
    // setting far clipping to be =< near clipping then nothing will be rendered
    camera = new THREE.PerspectiveCamera(
        60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(amount, amount, amount);

    // -- renderer: obj renders scene using WebGL
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;

    // -- raycaster: intersect object models & register events based on mouse interactions
    raycaster = new THREE.Raycaster();

   // document.body.appendChild( VRButton.createButton( renderer ) );
    renderer.xr.enabled = true;

    // -- lighting
    scene.add(new THREE.AmbientLight(0x888888));

    var light = new THREE.DirectionalLight(0xcccccc, 1);
    light.position.set(0.5, 5, 5);
    scene.add(light);
    light.caseShadow = true;
    light.shadow.camera.near = 0.01;
    light.shadow.camera.far = 45;
    light.shadow.camera.fov = 55;

    light.shadow.camera.left = -10;
    light.shadow.camera.right = 1;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -10;

    light.shadow.bias = 0.001;
    light.shadow.mapSize.width = 1024 * 3;

    // sets size of app
    renderer.setSize(window.innerWidth, window.innerHeight);

    // appends renderer to html doc as canvas to draw in browser
    document.body.appendChild(renderer.domElement);

    // -- controls: allows mouse controls such as click+drag, zoom, etc.
    // Add mouse controls
    orbitControls = new OrbitControls(camera, renderer.domElement);

    // limiting zoom determine how far zoom in and zoom out
    orbitControls.minDistance = 4;
    orbitControls.maxDistance = 100;
    orbitControls.maxPolarAngle = Math.PI / 2;
    orbitControls.enableDamping = true;

    // allows me to display the css elements in our scene
    cssrenderer = new CSS3DRenderer();
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
    cssrenderer.domElement.style.position = 'absolute';
    document.getElementById('info').appendChild(cssrenderer.domElement);

    css2Drenderer = new CSS2DRenderer();
    css2Drenderer.domElement.style.position = 'absolute';
    css2Drenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('info').appendChild(css2Drenderer.domElement);

    // -- models: load object model resources
    loadPsyche('../src/res/mtl/base psyche/Psyche_.mtl',-125,-25,0,0);

    // -- HEY TAREN -- Hello again Marissa :)
    loadSpacecraftTexturedModel('../src/res/mtl/spacecraft/spacecraftwithframe.mtl', -4, 0, 0, Math.PI/2);

    spacecraftMesh = new THREE.Mesh(geometry, material)
    // -- tracers: add movement tracers behind spacecraft
    particleSystem1 = [];
    particleSystem2 = [];
    addTracers(particleSystem1);
    addTracers(particleSystem2);

    if(orbit=="init")
    {
        const initButton = document.getElementById("initialize");
        initButton.style.visibility = "hidden"
        initButton.click();

        document.getElementById("offcanvasBottomLabel").style.visibility = 'hidden';

        document.getElementById("canvas3").style.visibility = 'visible';
        document.getElementById("INIT").style.visibility = 'visible';

        document.getElementById("OA").style.visibility = 'hidden';
        document.getElementById("OB").style.visibility = 'hidden';
        document.getElementById("OC").style.visibility = 'hidden';
        document.getElementById("OD").style.visibility = 'hidden';
    }

    // Button listeners for the orbits
    buttonOrbitA = document.getElementById('orbitA');
    buttonOrbitA.addEventListener('click', function(){
        if(orbit != "A") {
            tempOrbit = orbit;
            orbit = "A";
            changeOrbit(orbit);

            document.getElementById("offcanvasBottomLabel").style.visibility = 'visible';
            document.getElementById("orbit-a").style.visibility = 'visible';
            document.getElementById("orbit-b").style.visibility = 'hidden';
            document.getElementById("orbit-c").style.visibility = 'hidden';
            document.getElementById("orbit-d").style.visibility = 'hidden';

            document.getElementById("OA").style.visibility = 'visible';
            document.getElementById("OB").style.visibility = 'hidden';
            document.getElementById("OC").style.visibility = 'hidden';
            document.getElementById("OD").style.visibility = 'hidden';
            document.getElementById("INIT").style.visibility = 'hidden';
        }

        const OrbitA = document.getElementById('orbit-a');
        OrbitA.style.marginTop = '-1em';
        OrbitA.style.fontSize = '10px';
        OrbitA.style.color = 'white';
        const orbitALabel = new CSS3DObject(OrbitA);
        orbitALabel.position.set(-400,10,-300);
        scene.add(orbitALabel);
    });

    buttonOrbitB = document.getElementById('orbitB');
    buttonOrbitB.addEventListener('click', function(){
        if(orbit != "B") {
            tempOrbit = orbit;
            orbit = "B";
            changeOrbit(orbit);

            document.getElementById("offcanvasBottomLabel").style.visibility = 'visible';
            document.getElementById("orbit-a").style.visibility = 'hidden';
            document.getElementById("orbit-b").style.visibility = 'visible';
            document.getElementById("orbit-c").style.visibility = 'hidden';
            document.getElementById("orbit-d").style.visibility = 'hidden';

            document.getElementById("OB").style.visibility = 'visible';
            document.getElementById("OA").style.visibility = 'hidden';

            document.getElementById("OC").style.visibility = 'hidden';
            document.getElementById("OD").style.visibility = 'hidden';
            document.getElementById("INIT").style.visibility = 'hidden';
        }

        const OrbitB = document.getElementById('orbit-b');
        OrbitB.style.visibility = 'visible';
        OrbitB.style.marginTop = '-1em';
        OrbitB.style.fontSize = '10px';
        OrbitB.style.color = 'white';
        const orbitBLabel = new CSS3DObject(OrbitB);
        orbitBLabel.position.set(-400,10,-300);
        scene.add(orbitBLabel);
    });

    buttonOrbitC = document.getElementById('orbitC');
    buttonOrbitC.addEventListener('click', function(){
        if(orbit != "C") {
            tempOrbit = orbit;
            orbit = "C";
            changeOrbit(orbit);

            document.getElementById("offcanvasBottomLabel").style.visibility = 'visible';
            document.getElementById("orbit-a").style.visibility = 'hidden';
            document.getElementById("orbit-b").style.visibility = 'hidden';
            document.getElementById("orbit-c").style.visibility = 'visible';
            document.getElementById("orbit-d").style.visibility = 'hidden';

            document.getElementById("OC").style.visibility = 'visible';
            document.getElementById("OA").style.visibility = 'hidden';
            document.getElementById("OB").style.visibility = 'hidden';

            document.getElementById("OD").style.visibility = 'hidden';
            document.getElementById("INIT").style.visibility = 'hidden';
        }
        const OrbitC = document.getElementById('orbit-c');
        OrbitC.style.visibility = 'visible';
        OrbitC.style.marginTop = '-1em';
        OrbitC.style.fontSize = '10px';
        OrbitC.style.color = 'white';
        const orbitCLabel = new CSS3DObject(OrbitC);
        orbitCLabel.position.set(-400,10,-300);
        scene.add(orbitCLabel);
    });

    buttonOrbitD = document.getElementById('orbitD');
    buttonOrbitD.addEventListener('click', function(){
        //if commented out this allows multiple presses on a single orbit
        if(orbit != "D") {
            tempOrbit = orbit;
            orbit = "D";
            changeOrbit(orbit);

            document.getElementById("offcanvasBottomLabel").style.visibility = 'visible';
            document.getElementById("orbit-a").style.visibility = 'hidden';
            document.getElementById("orbit-b").style.visibility = 'hidden';
            document.getElementById("orbit-c").style.visibility = 'hidden';
            document.getElementById("orbit-d").style.visibility = 'visible';

            document.getElementById("OD").style.visibility = 'visible';
            document.getElementById("OA").style.visibility = 'hidden';
            document.getElementById("OB").style.visibility = 'hidden';
            document.getElementById("OC").style.visibility = 'hidden';

            document.getElementById("INIT").style.visibility = 'hidden';
        }
        const OrbitD = document.getElementById('orbit-d');
        OrbitD.style.visibility = 'visible';
        OrbitD.style.marginTop = '-1em';
        OrbitD.style.fontSize = '10px';
        OrbitD.style.color = 'white';
        const orbitDLabel = new CSS3DObject(OrbitD);
        orbitDLabel.position.set(-400,10,-300);
        scene.add(orbitDLabel);
    });
    
    let buttonA = document.getElementById('imager');
    buttonA.addEventListener('click', function() {
        if(orbit == 'A') changeTexture('../src/res/mtl/imager/imager.mtl');
    });
    
    let buttonB = document.getElementById('GRNS');
    buttonB.addEventListener('click', function() {
        if(orbit == 'B') changeTexture('../src/res/mtl/grns/grns.mtl');
    });
    
    let buttonC = document.getElementById('magnetometer');
    buttonC.addEventListener('click', function() {
        if(orbit == 'C') changeTexture('../src/res/mtl/magnetometer/magnetometer.mtl');
    });

    scene.fog = new THREE.FogExp2(0x141414, 0.0001);
    document.addEventListener( 'mousemove', onMouseMove );
    document.addEventListener( 'pointerdown', onPointerDown );

    // Responsive Design //
    // allow for window resizing //
    window.addEventListener('resize', () => { // if window is resized
        renderer.setSize(window.innerWidth, window.innerHeight); // identify new win size
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix(); // apply new changes to new win size
    });
}

// for stars random color generator helper
var rgbToHex = function (rgb) {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};

// for stars random color generator
var fullColorHex = function(r,g,b) {
    var red = rgbToHex(r);
    var green = rgbToHex(g);
    var blue = rgbToHex(b);
    return red+green+blue;
};

function onMouseMove( event ) {
    event.preventDefault();
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( pointer, camera );
    
    const intersects = raycaster.intersectObjects( scene.children, true );
    if ( intersects.length > 0 ) {
        const intersect = intersects[0];
    }
}

function onPointerDown(event) {
    event.preventDefault();
    pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, -
        ( event.clientY / window.innerHeight ) * 2 + 1 );

    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( scene.children, true );

    if ( intersects.length > 0 ) {
        const intersect = intersects[ 0 ];
        
        switch(intersect.object.parent.name) {
            case "gammaRaySpectrometer":
                onGammaRaySpectrometerClicked();
                break;
            case "imager1":
                onImagerClicked();
                break;
            case "imager2":
                onImagerClicked();
                break;
            case "psyche":
                onPsycheClicked();
                break;
            default:
                break;
        }

        switch(intersect.object.name) {
            case "spacecraft":
                onSpacecraftClicked();
                break;
            case "neutronSpectrometer":
                onNeutronSpectrometerClicked();
                break;
            case "magnetometer":
                onMagnetometerClicked();
                break;
            default:
                break;
        }
    }
}

// for stars
function generateRandomColor()
{
    var randomColor = randomRange(0,6);
    switch(randomColor) {
        case 0: return '#'+fullColorHex(175,201,255);
        case 1: return '#'+fullColorHex(199,216,255);
        case 2: return '#'+fullColorHex(255,244,243);
        case 3: return '#'+fullColorHex(255,229,207);
        case 4: return '#'+fullColorHex(255,217,178);
        case 5: return '#'+fullColorHex(255,199,142);
        case 6: return '#'+fullColorHex(255,166,81);

        default: break;
    }
    //random color will be freshly served
}

function addStars() {
    const textureLoader = new THREE.TextureLoader();
    const sprite1 = textureLoader.load('./res/spikey.png');
    const radius = 200;
    // particles - called point sprinte or bill-board
    // create random filed of particle objects
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];

    for ( let i = 0; i < 100000; i++ ) {
        vertices.push( ( ( Math.random() * 2 - 1 ) * radius )  ); // x
        vertices.push( (( Math.random() * 2 - 1 ) * radius  ) ); // y
        vertices.push( (( Math.random() * 2 - 1 ) * radius  )); // z

        sizes.push( 20 );
    }

    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geo.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );

        var BGparticles = new THREE.Points(geo, new THREE.PointsMaterial({
            transparent: true,
            map: sprite1
        }));

        BGparticles.rotation.x = Math.random() * 2;
        BGparticles.rotation.y = Math.random() * 2;
        BGparticles.rotation.z = Math.random() * 2;

        scene.add(BGparticles);
    }

// create a random between any two values
function randomRange(min, max) {
    return Math.floor(Math.random() * (max-min + 1) + min);
}

function loadInstruments() {
    var neutronSpectrometerMaterial = loadModelMaterial(0xFFFFFF);
    loadNeutronSpectrometer(neutronSpectrometerMaterial);

    var magnetometerMaterial = loadModelMaterial(0xFFFFFF);
    loadMagnetometers(magnetometerMaterial);

    loadImagers();
    loadGammaRaySpectrometer();
}

function loadGammaRaySpectrometer() {
    const objLoader = new OBJLoader();
    objLoader.load('../src/res/stl/instruments/gamma_ray_spectrometer.obj',
        function (gammaRaySpectrometer) {
            gammaRaySpectrometer.position.set(-1.1, 2.7, 0.1);
            gammaRaySpectrometer.rotation.y = (3 * Math.PI) / 2;
            gammaRaySpectrometer.scale.setScalar(0.2);
            gammaRaySpectrometer.name = "gammaRaySpectrometer";
            scene.add(gammaRaySpectrometer);
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function(error) {
            console.log('An error occurred');
        }
    );
}

function loadNeutronSpectrometer(material) {
    const stlLoader = new STLLoader();
    stlLoader.load(
        '../src/res/stl/instruments/neutron_spectrometer.stl',
        function (geometry) {
            neutronSpectrometerMesh = new THREE.Mesh(geometry, material)
            neutronSpectrometerMesh.position.set(-1.12,1.8,0.115);
            neutronSpectrometerMesh.rotation.x = -1 * Math.PI / 2;
            neutronSpectrometerMesh.rotation.z = 3 * Math.PI / 2;
            neutronSpectrometerMesh.scale.setScalar(0.14);
            neutronSpectrometerMesh.name = "neutronSpectrometer";
            scene.add(neutronSpectrometerMesh)
        },
        (xhr) => {
            console.log(`${( xhr.loaded / xhr.total ) * 100}% loaded`);
        },
        (error) => {
            console.log(error)
        }
    )
}

function loadImagers() {
    loadImager(-1.175, 1.075, -0.25, 1);
    loadImager(-1.175, 1.075, -0.45, 2);
}

function loadImager(x, y, z, id) {
    const objLoader = new OBJLoader();
    objLoader.load('../src/res/stl/instruments/imager.obj',
        function (imager) {
            imager.position.set(x, y, z);
            imager.rotation.y = Math.PI;
            imager.scale.setScalar(0.09);
            imager.name = "imager" + id;
            scene.add(imager);
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function(error) {
            console.log('An error occurred');
        }
    );
}

function loadMagnetometers(material) {
    loadMagnetometer(-1.28, 2.7, -0.85, material);
    loadMagnetometer(-1.28, 2.2, -0.85, material);
}

function loadMagnetometerMaterial() {
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xDEDEDE,
        metalness: 0.25,
        roughness: 0.1,
        transparent: false,
        transmission: 0.99,
        clearcoat: 1.0,
        clearcoatRoughness: 0.25
    })
    return material;
}

function loadMagnetometer(x, y, z, material) {
    const stlLoader = new STLLoader();
    stlLoader.load(
        '../src/res/stl/instruments/magnetometer.stl',
        function (geometry) {
            magnetometerMesh = new THREE.Mesh(geometry, material)
            magnetometerMesh.rotation.set(-Math.PI / 2, 0,  Math.PI / 2);
            magnetometerMesh.rotation.y = Math.PI / 2;
            magnetometerMesh.position.set(x,y,z);
            magnetometerMesh.scale.setScalar(0.05);
            magnetometerMesh.name = "magnetometer";
            scene.add(magnetometerMesh)
        },
        (xhr) => {
            console.log(`${( xhr.loaded / xhr.total ) * 100}% loaded`);
        },
        (error) => {
            console.log(error)
        }
    )
}

function loadModelMaterial(color) {
    const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.25,
        roughness: 0.1,
        transparent: false,
        transmission: 0.99,
        clearcoat: 1.0,
        clearcoatRoughness: 0.25
    })
    return material;
}

function loadSpacecraftModel(material) {
    const stlLoader = new STLLoader();
    stlLoader.load(
        '../src/res/stl/spacecraft/spacecraft_with_frame.stl',
        function (geometry) {
            spacecraftMesh = new THREE.Mesh(geometry, material)
            spacecraftMesh.rotation.set(-Math.PI / 2, 0,  Math.PI / 2);
            spacecraftMesh.rotation.z = Math.PI / 2;
            spacecraftMesh.position.set(-4,0,0);
            spacecraftMesh.name = 'spacecraft';
            spacecraftMesh.scale.set(0.025,0.025,0.025);

            scene.add(spacecraftMesh)
            camera.position.x = -80;
            camera.position.y = -20;
            camera.position.z = 50;
        },
        (xhr) => {
            console.log(`${( xhr.loaded / xhr.total ) * 100}% loaded`);
        },
        (error) => {
            console.log(error)
        }
    )
}


// -- HEY TAREN! -- Hey Marissa :)
// loads the mtl file, along with the obj file
function loadSpacecraftTexturedModel(filePath=string, x=int, y=int, z=int, yRotation=int) {
    new MTLLoader().load(filePath,
        (material) => {
            material.preload()
            // spacecraftwithframe loader
            new OBJLoader()
                .setMaterials(material)
                .setPath('../src/res/')
                .load('spacecraftwithframe.obj', (craft) => {
                        craft.position.set(x, y, z);
                        craft.scale.set(0.025,0.025,0.025);
                        craft.name = "craft";
                        craft.rotation.y = yRotation;
                        scene.add(craft);
                        camera.position.x = 10;
                        camera.position.y = 5;
                        camera.position.z = -5;
                        camera.lookAt(craft);
                    },
                    function(xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    function(error) {
                        console.log('An error occurred');
                    }
                );
        })
}

// update radius
function changeOrbit(orbit = char){
    var psyche = scene.getObjectByName( "psyche" );
    var x, y, z;

    switch(orbit) {
        case "A":
            x = -125;
            y = -10;
            z = 0;
            break;
        case "B":
            x = -100;
            y = -10;
            z = 0;
            break;
        case "C":
            x = -75;
            y = -10;
            z = 0;
            break;
        case "D":
            x = -50;
            y = -10;
            z = 0;
            break;
    }
    if (instrumentView==false) psyche.position.set(x, y, z);
    else{
        var yRotation = psyche.rotation.y;
        if(instrumentView == true)
        {
            removePsyche();
            loadPsyche('../src/res/mtl/base psyche/Psyche_.mtl', x, y, z, yRotation);
            instrumentView = false;
            return;
        }
    }
}

// Psyche object
function loadPsyche(filePath=string, x=int, y=int, z=int, yRotation=int) {
    new MTLLoader().load(filePath,
            (material) => {
            material.preload()

            // psyche loader
            new OBJLoader()
                .setMaterials(material)
                .setPath('../src/res/Psyche/')
                .load('Psyche_.obj', (psyche) => {
                        psyche.position.set(x, y, z);
                        psyche.rotation.y = yRotation;
                        psyche.scale.setScalar(25);
                        psyche.name = "psyche";
                        scene.add(psyche);
                    },
                    function(xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    function(error) {
                        console.log('An error occurred');
                    }
                );
        })
}

function removePsyche() {
    var psyche = scene.getObjectByName( "psyche" );
    scene.remove( psyche );
}

// ability to interact with obj on screen
function renderRaycaster() {
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED){
                material = INTERSECTED.material;
                if(material.emissive){
                    material.emissive.setHex(INTERSECTED.currentHex);
                }
                else{
                    material.color = INTERSECTED.currentHex;
                }
            }
            INTERSECTED = intersects[0].object;
            material = INTERSECTED.material;
            if(material.emissive){
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                material.emissive.needsUpdate = true;
                console.log(INTERSECTED.object);

            }
            else{
                INTERSECTED.currentHex = material.color;
            }
            objectSelected = INTERSECTED;
        }
    } else {
        if (INTERSECTED){
            material = INTERSECTED.material;
            if(material.emissive){
                material.emissive.setHex(INTERSECTED.currentHex);
            }
            else
            {
                material.color = INTERSECTED.currentHex;
            }
        }
        INTERSECTED = null;
    }
}

function onPsycheClicked() {
    console.log("Psyche clicked");
}

function onSpacecraftClicked() {
    console.log("Spacecraft clicked");
    document.getElementById("canvas3").style.visibility = 'visible';
}

function onMagnetometerClicked() {
    console.log("Magnetometer clicked");
    document.getElementById("canvas3").style.visibility = 'visible';
    if(orbit == 'C') changeTexture('../src/res/mtl/magnetometer/magnetometer.mtl');
}

function onImagerClicked() {
    console.log("Imager clicked");
    document.getElementById("canvas3").style.visibility = 'visible';
    if(orbit == 'A') changeTexture('../src/res/mtl/imager/imager.mtl');
}

function onNeutronSpectrometerClicked() {
    console.log("Neutron Spectrometer clicked");
    document.getElementById("canvas3").style.visibility = 'visible';
    if(orbit == 'B') changeTexture('../src/res/mtl/grns/grns.mtl');
}

function onGammaRaySpectrometerClicked() {
    console.log("Gamma Ray Spectrometer clicked");
    if(orbit == 'B') changeTexture('../src/res/mtl/grns/grns.mtl');
}

function changeTexture(instrumentFilePath = string){
    var psyche = scene.getObjectByName( "psyche");
    var x = psyche.position.x;
    var y = psyche.position.y;
    var z = psyche.position.z;
    var yRotation = psyche.rotation.y;

    if(instrumentView==false)
    {
        instrumentView = true;
    }
    else
    {
        instrumentFilePath = '../src/res/mtl/base psyche/Psyche_.mtl';
        instrumentView = false;
    }
    removePsyche();
    loadPsyche(instrumentFilePath,x,y,z,yRotation);
    return;
}

function animatePsyche(){
    var psyche = scene.getObjectByName( "psyche" );
    if(psyche != null && orbit != "init") {
        psyche.rotation.y += 0.0006;
    }
}

function updateTracers() {
    updateSystem(particleSystem1);
    updateSystem(particleSystem2);
    if(systemsHaveStarted) {
        setTimeout(() => {  updateSystem(particleSystem1); }, 3500);
        setTimeout(() => {  updateSystem(particleSystem2); }, 1000);
    }
    else {
        updateSystem(particleSystem2);
    }
    systemsHaveStarted = true;
}

function updateSystem(system) {
    for (var i = 0; i < system.length; ++i) {
        var points = system[i];
        var material = points.material;
        var particle = points.geometry.vertices[0];

        points.position.z -= 0.005 + Math.random() * (0.0075 - 0.0025) + 0.0025;
        points.position.x -= 0.0075;

        if (points.position.z < -4 && points.position.x < 0.0075) {
            points.position.z = 0;
            points.position.x = 0;
            material.size = 2;
        }
        if (material.size < 40) {
            material.size -= 0.005;
        }
    }
}

// render scene
// animation loop
// redraw scene 60FPS
// keep function at bottom
// needs to reference the above definitions
function animate() {
    // Rotate scene constantly

    updateTracers();
    render();
    cssrenderer.render(scene, camera);
    renderRaycaster();
    orbitControls.update();
    css2Drenderer.render(scene,camera);
    requestAnimationFrame(animate); // recursive call to animate function
    animatePsyche();
    setTimeout(() => {  agitateSpacecraft(); }, 500);
}

function render() {
    renderer.render(scene, camera);
}

function addTracers(system) {
    var texture = new THREE.TextureLoader().load("./res/smoketexture.png");
    let particleSystemCount = 32;
    for (var i = 0; i < particleSystemCount; i++) {
        var geometry = new THREE.Geometry();
        var pMaterial = new THREE.PointsMaterial({
            size: 1.5,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            sizeAttenuation: true,
        });
        var px = -2.1 + i / 10;
        var py = 0.6
        var pz = -7 - Math.random() * 4 + 1;

        if (i > 8 && i < 24) {
            pz += -1.5;
        }
        var particle = new THREE.Vector3(px, py, pz);
        particle.velocity = new THREE.Vector3(0, 0, 0);
        particle.color = new THREE.Color(0xf50c0c);
        geometry.vertices.push(particle);
        var points = new THREE.Points(geometry, pMaterial);
        scene.add(points);
        system.push(points);
    }
}

function agitateSpacecraft() {
        camera.position.z += 0.001;
}

function degInRad(deg) {
    return deg * Math.PI / 180;
}

addStars();
loadInstruments();
animate();