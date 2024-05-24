// asgn4.js
var VSHADER_SOURCE = `
precision mediump float;
attribute vec2 a_UV;
attribute vec3 a_Normal;
attribute vec4 a_Position;

varying vec2 v_UV;
varying vec3 v_Normal;
varying vec4 v_VertPos;

uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform bool u_normal_ON;
uniform mat4 u_NormalMatrix;
void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    if (u_normal_ON) {
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    }
    else {
        v_Normal = a_Normal;
    }
    v_VertPos = u_ModelMatrix * a_Position;
}`


var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;

    uniform vec3 u_light_position;
    uniform vec3 u_cam_position;
    uniform vec4 u_FragColor;

    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform sampler2D u_Sampler4;

    uniform int u_whichTexture;
    uniform bool u_light_ON;
    uniform vec3 u_light_color;

    void main() {
        if (u_whichTexture == -3) {
            gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);
        }
        else if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        }
        else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        }
        else if (u_whichTexture == 0) { 
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        }
        else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        }
        else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        }
        else if (u_whichTexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        }
        else if (u_whichTexture == 4) {
            gl_FragColor = vec4(0.15686274, 0.541176, 0.152941, 1);
        }
        else if (u_whichTexture == 5) {
            gl_FragColor = vec4(0.2, 0.2, 0.2, 1);
        }
        else if (u_whichTexture == 6) {
            gl_FragColor = texture2D(u_Sampler4, v_UV);
        }            
        else {
            gl_FragColor = vec4(1, 0.5, 0.5,1);
        }

        vec3 lightVector = u_light_position - vec3(v_VertPos);
        float r=length(lightVector);
        vec3 L = normalize(lightVector);
        vec3 N = normalize(v_Normal);
        float nDotL = max(dot(N,L), 0.0);
        vec3 R = reflect(L, N);
        vec3 E = normalize(u_cam_position-vec3(v_VertPos));
        float specular = pow(max(dot(E,R), 0.0),30.0);
        vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
        vec3 ambient = vec3(gl_FragColor) * 0.3;

        if (u_light_ON) {
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(diffuse+ambient, 1.0);
            }
            else {
                gl_FragColor = vec4(specular * u_light_color + diffuse * u_light_color + ambient, gl_FragColor.a);
            }
        }

    }`


let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let a_UV;
let a_Normal;
let u_ProjectionMatrix;
let u_ViewMatrix;

let u_whichTexture;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;

let u_light_ON;
let u_light_position;
let u_cam_position;
let u_light_color;
let u_normal_ON;


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function convertCoordinatesEventToGL(click_event) {
    const rectangle = click_event.target.getBoundingClientRect();
    const x = ((click_event.clientX - rectangle.left) - canvas.width / 2) / (canvas.width / 2);
    const y = (canvas.height / 2 - (click_event.clientY - rectangle.top)) / (canvas.height / 2);
    return [x, y];
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_light_position = gl.getUniformLocation(gl.program, 'u_light_position');
    if (!u_light_position) {
      console.log('Failed to get the storage location of u_light_position');
      return;
    }
  
    u_light_ON = gl.getUniformLocation(gl.program, 'u_light_ON');
    if (!u_light_ON) {
      console.log('Failed to get u_light_ON');
      return;
    }

    u_light_color = gl.getUniformLocation(gl.program, 'u_light_color');
    if (!u_light_color) {
      console.log('Failed to get the storage location of u_light_color');
      return;
    }
  
    u_cam_position = gl.getUniformLocation(gl.program, 'u_cam_position');
    if (!u_cam_position) {
      console.log('Failed to get the storage location of u_cam_position');
      return;
    }
  
    u_normal_ON = gl.getUniformLocation(gl.program, 'u_normal_ON');
    if (!u_normal_ON) {
      console.log('Failed to get the storage location of u_normal_ON');
      return;
    }

    // Get the storage location of u_Modelmatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_Modelmatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_NormalMatrix) {
      console.log('Failed to get the storage location of u_NormalMatrix');
      return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    } 

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get u_ViewMatrix');
        return;
    } 

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get u_ProjectionMatrix');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get u_whichTexture');
        return;
    }

    // BLUE_ICE SAMPLER FOR TEXTURE
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0'); 
    if (!u_Sampler0) {
        console.log('Failed to get u_Sampler0');
        return false;
    }
    // COBBLESTONE SAMPLER FOR TEXTURE
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1'); 
    if (!u_Sampler1) {
        console.log('Failed to get u_Sampler1');
        return false;
    }
    // GRASS SAMPLER FOR TEXTURE
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
        console.log('Failed to get u_Sampler2');
        return false;
    }
    // DIRT SAMPLER FOR TEXTURE
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
        console.log('Failed to get u_Sampler3');
        return false;
    }

    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    if (!u_Sampler4) {
        console.log('Failed to get u_Sampler4');
        return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// TEXTURES
function initTextures() {
    // BLUE_ICE TEXTURE
    var image0 = new Image();
    if (!image0) {
        console.log('Failed to get image0');
        return false;
    }
    image0.onload = function () { sendImageToTEXTURE0(image0); };
    image0.crossOrigin = "anonymous";
    image0.src = './textures/blue_ice.png';
    
    // COBBLESTONE TEXTURE
    var image1 = new Image();
    if (!image1) {
        console.log('Failed to get image1');
        return false;
    }
    image1.onload = function () { sendImageToTEXTURE1(image1); };
    image1.crossOrigin = "anonymous";
    image1.src = './textures/cobblestone.png';
  
    // DIAMOND TEXTUREE
    var image2 = new Image();
    if (!image2) {
        console.log('Failed to get image2');
        return false;
    }
    image2.onload = function () { sendImageToTEXTURE2(image2); };
    image2.crossOrigin = "anonymous";
    image2.src = './textures/Diamond64.png';

    // DIRT TEXTURE
    var image3 = new Image();
        if (!image3) {
        console.log('Failed to get image3');
        return false;
    }
    image3.onload = function () { sendImageToTEXTURE3(image3); };
    image3.crossOrigin = "anonymous";
    image3.src = './textures/dirt.png';

    // DIAMOND BLOCK TEXTURE
    var image4 = new Image();
    if (!image4) {
    console.log('Failed to get image4');
    return false;
    }
    image4.onload = function () { sendImageToTEXTURE4(image4); };
    image4.crossOrigin = "anonymous";
    image4.src = './textures/Diamond_Block.png';

}
// BLUE_ICE TEXTURE
function sendImageToTEXTURE0(image0) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to get texture0');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
    gl.uniform1i(u_Sampler0, 0);
}

// COBBLSETONE TEXTURE
function sendImageToTEXTURE1(image1) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to get texture1');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
    gl.uniform1i(u_Sampler1, 1);
}

// DIAMOND TEXTURE
function sendImageToTEXTURE2(image2) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to get texture1');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2);
    gl.uniform1i(u_Sampler2, 2);
}

// DIRT TEXTURE
function sendImageToTEXTURE3(image3) { 
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to get texture3');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE3); 
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image3);
    gl.uniform1i(u_Sampler3, 3); 
}

function sendImageToTEXTURE4(image4) { 
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to get texture4');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE4); 
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image4);
    gl.uniform1i(u_Sampler4, 4); 
}

// Global variables
let global_X = 0;
let global_camera = 0;
let global_Y = 0;

let global_front_left = 0;
let global_front_right = 0;
let global_back_left = 0;
let global_back_right = 0;
let global_tongue_base = 0;
let global_tongue_mid = 0;
let global_tongue_tip = 0;
let global_ANIMATE = false;
let ctrl_key = false;
let global_poop_ANIMATED = 0;
var global_Time = performance.now() / 1000.0;
var global_s = performance.now() / 1000.0 - global_Time;

let global_Normal_ON = false;
let global_light_ON = false;
let global_light_position = [0, 1, -2];
let global_light_color = [1.0, 1.0, 1.0];
let global_light_ANIMATION = true;

// Synchronizes JS stuff to HTML stuff
function addActionForHtmlUI() {
    // Blocky Animal Buttons
    document.getElementById('on').addEventListener('click', function () { global_ANIMATE = true; });
    document.getElementById('off').addEventListener('click', function () { global_ANIMATE = false; });

    // Lighting Buttons
    document.getElementById('normal_on').addEventListener('click', function () { global_Normal_ON = true; });
    document.getElementById('normal_off').addEventListener('click', function () { global_Normal_ON = false; });

    document.getElementById('light_on').addEventListener('click', function () { global_light_ON = true; });
    document.getElementById('light_off').addEventListener('click', function () { global_light_ON = false; });

    document.getElementById('light_animate_ON').addEventListener('click', function () { global_light_ANIMATION = true; });
    document.getElementById('light_animate_OFF').addEventListener('click', function () { global_light_ANIMATION = false; });

    // Blocky Animal Sliders
    document.getElementById('angleSlide').addEventListener('mousemove', function () { global_camera = this.value; renderScene(); }); 
    document.getElementById('base').addEventListener('mousemove', function () { global_tongue_base = this.value; renderScene(); });
    document.getElementById('mid').addEventListener('mousemove', function () { global_tongue_mid = this.value; renderScene(); });
    document.getElementById('end').addEventListener('mousemove', function () { global_tongue_tip = this.value; renderScene(); });
    document.getElementById('front_Left').addEventListener('mousemove', function () { global_front_left = this.value; renderScene(); });
    document.getElementById('front_Right').addEventListener('mousemove', function () { global_front_right = this.value; renderScene(); });
    document.getElementById('back_Left').addEventListener('mousemove', function () { global_back_left = this.value; renderScene(); });
    document.getElementById('back_Right').addEventListener('mousemove', function () { global_back_right = this.value; renderScene(); });
    
    // Lighting Sliders
    document.getElementById('light_pos_X').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { global_light_position[0] = this.value / 100; renderScene(); } })
    document.getElementById('light_pos_Y').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { global_light_position[1] = this.value / 100; renderScene(); } })
    document.getElementById('light_pos_Z').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { global_light_position[2] = this.value / 100; renderScene(); } })
    
    document.getElementById('light_color').addEventListener('mousemove', function () { global_light_color[2] = 1 - this.value / 10; });

}

// Main
var coordinates_X_Y = [0,0];
function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionForHtmlUI();
    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) { 
        if (ev.buttons == 1) { 
            click(ev, 1) 
        }
        else {
            if (coordinates_X_Y[0] != 0){
                coordinates_X_Y = [0,0];
            }
        }
    }
    camera = new Camera();
    document.onkeydown = camera_Controls;

    initTextures();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(tick);
}

// Tick function
let time = 0;
function tick() {
    // Calculate the elapsed time
    global_s = (performance.now() - global_Time) / 1000.0;

    // Update animation angles
    updateAnimationAngles();

    // If ctrl_key is true, animate the poop
    if (ctrl_key) {
        global_poop_ANIMATED -= 0.03;
        time += 0.1;
        
        // Reset animation after a certain duration
        if (time >= 4.0) {
            time = 0;
            ctrl_key = false;
        }
    }

    // Render the scene
    renderScene();

    // Request the next frame
    requestAnimationFrame(tick);
}

// Click function
function click(click_event) {
    // Update ctrl_key based on whether the Ctrl key is pressed
    ctrl_key = click_event.ctrlKey;

    // Convert mouse event coordinates to WebGL coordinates
    let [x, y] = convertCoordinatesEventToGL(click_event);

    // Calculate the difference between current and initial coordinates
    let deltaX = coordinates_X_Y[0] !== 0 ? coordinates_X_Y[0] - x : 0;
    let deltaY = coordinates_X_Y[0] !== 0 ? coordinates_X_Y[1] - y : 0;

    // Update global rotation angles based on mouse movement
    global_X += deltaX;
    global_Y += deltaY;

    // Reset rotation angles if they exceed 360 degrees
    if (Math.abs(global_X / 360) > 1 || Math.abs(global_Y / 360) > 1) {
        global_X = 0;
        global_Y = 0;
    }

    // Store initial coordinates if it's the first click
    coordinates_X_Y = coordinates_X_Y[0] === 0 ? [x, y] : coordinates_X_Y;
}

// Animations
function updateAnimationAngles() {
    if (global_light_ANIMATION) {
        global_light_position = [8 * Math.cos(-1 * global_s), 1.3, 8 * Math.sin(-1 * global_s)];
    }
    if (global_ANIMATE) {
        const legAmplitude = 25;
        const tongueAmplitude = 2;

        // Calculate angles for leg animation
        global_front_left = legAmplitude * Math.sin(global_s);
        global_front_right = legAmplitude * Math.sin(global_s);
        global_back_left = 10 * Math.sin(global_s);
        global_back_right = 10 * Math.sin(global_s);

        // Calculate angle for tongue animation
        global_tongue_base = tongueAmplitude * Math.sin(global_s);
    }
}

// Hardcoded map
// var g_map = [
//     [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 0, 0, 3, 4],
//     [1, 3, 0, 0, 0, 0, 0, 5, 4, 5, 4, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 5, 4, 0, 0, 0, 2, 0, 0, 2, 4],
//     [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 8, 0, 0, 8, 4],
//     [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4],
//     [0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4],
//     [1, 4, 4, 4, 4, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 4, 0, 0, 4, 0, 4, 4, 4, 4, 4, 0, 0, 4, 4, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4, 4],
//     [4, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 4, 5, 4],
//     [4, 0, 0, 0, 0, 4, 0, 0, 4, 4, 4, 4, 4, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 4, 4, 4, 4, 0, 0, 4, 0, 4],
//     [4, 0, 4, 4, 4, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 4, 4, 4, 4, 0, 4, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 4, 7, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4],
//     [4, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 4, 0, 4, 4, 0, 0, 0, 4, 0, 0, 0, 0, 4, 4, 0, 0, 0, 4],
//     [4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 4, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 4, 0, 4, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 4, 4, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 4, 0, 4, 0, 4, 0, 0, 4, 4, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4],
//     [4, 0, 0, 4, 5, 4, 0, 4, 0, 0, 4, 0, 4, 0, 4, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4],
//     [4, 0, 0, 4, 4, 4, 0, 4, 0, 0, 4, 0, 4, 0, 4, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 4, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 4, 0, 7, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 4, 0, 4, 4, 0, 0, 4, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
//     [4, 0, 0, 0, 4, 4, 4, 4, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4],
//     [4, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 4, 4, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 4],
//     [4, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 4, 7, 4, 0, 4, 0, 4, 6, 4, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4],
//     [4, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 4, 4, 4],
//     [4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 4, 0, 4, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4],
//     [4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4],
//     [4, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 4, 0, 0, 4, 0, 0, 4],
//     [4, 0, 0, 6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 4, 0, 0, 4],
//     [4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 7, 0, 4],
//     [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
// ];

var g_map = [
    [5, 1, 1, 1, 1, 1, 1, 1, 1, 4],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [5, 0, 0, 8, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Draw map function
function drawMap() {
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            // COBBLESTONE BLOCK
            if (g_map[x][y] == 1) {
                // Draw 4 cubes stacked on top of each other
                for (let i = 0; i < 1; i++) { 
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 1;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.renderfaster();
                }
            }
            // 2 STACKED COBBLESTONE BLOCK
            else if (g_map[x][y] == 2) {
                for (let i = 0; i < 2; i++) {
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 1;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.renderfaster();
                }
            }
            // 3 STACKED COBBLESTONE BLOCK
            else if (g_map[x][y] == 3) {
                for (let i = 0; i < 3; i++) {
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 1;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.renderfaster();
                }
            }
            // 4 STACKED DIRT BLOCK
            else if (g_map[x][y] == 4) {
                for (let i = 0; i < 4; i++) {
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 3;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.renderfaster();
                }
            }  
            // DIAMOND ORE BLOCK
            else if (g_map[x][y] == 5) {
                var body = new Cube();
                if (global_Normal_ON) {
                    body.textureNum = -3;
                }
                else {
                    body.textureNum = 2;
                }
                body.matrix.translate(x - 4, -0.270, y - 4);
                body.normalMatrix.setInverseOf(body.matrix).transpose();
                body.render();
            }
            // 2 DIAMOND ORE BLOCK STACKED
            else if (g_map[x][y] == 6) {
                for (let i = 0; i < 2; i++) {
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 2;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.render();
                }
            }
            // 3 DIAMOND ORE BLOCK STACKED
            else if (g_map[x][y] == 7) {
                for (let i = 0; i < 3; i++) {
                    var body = new Cube();
                    if (global_Normal_ON) {
                        body.textureNum = -3;
                    }
                    else {
                        body.textureNum = 2;
                    }
                    // Increase the vertical translation for each cube
                    body.matrix.translate(x - 4, -0.27 + i * 1, y - 4);
                    body.normalMatrix.setInverseOf(body.matrix).transpose();
                    body.render();
                }
            }
            // DIAMOND BLOCK
            else if (g_map[x][y] == 8) {
                var body = new Cube();
                if (global_Normal_ON) {
                    body.textureNum = -3;
                }
                else {
                    body.textureNum = 6;
                }
                body.matrix.translate(x - 4, -0.270, y - 4);
                body.normalMatrix.setInverseOf(body.matrix).transpose();
                body.render();
            }
        }
    }
}

// Camera control 
function camera_Controls(event) {
    if (event.key == "w") {
        camera.moveForward();
    }    
    else if (event.key == "a") {
        // camera.eye.elements[0] -= 0.2;
        camera.moveLeft();
    }    
    else if (event.key == "s") {
        camera.moveBackward();
    }    
    else if (event.key == "d") {
        // camera.eye.elements[0] += 0.2;
        camera.moveRight();
    }
    else if (event.key == "q") {
        camera.panLeft();
    }
    else if (event.key == "e") {
        camera.panRight();
    }
    // else if (event.key == "z") {
    //     camera.panUp();
    // }
    // else if (event.key == "c") {
    //     camera.panDown();
    // }
    renderScene();
}



// Builds pig + renders scene
function renderScene() {
    const startTime = performance.now();
    
    // Set up the projection matrix
    const projectionMatrix = new Matrix4().setPerspective(50, canvas.width / canvas.height, 0.1, 1000);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
    
    // Set up the view matrix
    const viewMatrix = new Matrix4().setLookAt(
        camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
        camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
        camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    const rotationM = new Matrix4().rotate(global_X, 0, -1, 0);
    rotationM.rotate(global_camera, 0, 1, 0);
    rotationM.rotate(global_Y, -1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotationM.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Lighting Initialization
    gl.uniform3f(u_light_position, global_light_position[0], global_light_position[1], global_light_position[2]);
    gl.uniform3f(u_light_color, global_light_color[0], global_light_color[1], global_light_color[2]);
    gl.uniform3f(u_cam_position, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
    gl.uniform1i(u_normal_ON, global_Normal_ON);
    gl.uniform1i(u_light_ON, global_light_ON);

    var red = [0.65, 0.13, 0.10, 1.0];
    var pink = [1.0, 0.55, 0.6, 1.0];
    //var light_pink = [.9, 0.55, 0.6, 1.0]; 
    var brown = [0.5, 0.25, 0.1, 1.0];
    var white = [1, 1, 1, 1.0];
    var black = [0, 0, 0, 1];

    // Sphere
    var sphere = new Sphere();
    sphere.matrix.translate(1, 1, 0);
    sphere.matrix.scale(.5, .5, .5);
    if (global_Normal_ON) {
        sphere.textureNum = -3;
    } else {
        sphere.textureNum = 6;
    }
    sphere.normalMatrix.setInverseOf(sphere.matrix).transpose();
    sphere.render();

    // Animated Light
    var light = new Cube();
    light.color = [global_light_color[0], global_light_color[1], global_light_color[2], 1.0];
    light.matrix.translate(global_light_position[0], global_light_position[1], global_light_position[2]);
    light.matrix.scale(.5, .5, .5);
    // light.matrix.scale(-0.1, -0.1, -0.1);
    light.matrix.translate(-0.5, -.5, -.5);
    light.render();

    // Ground
    var ground = new Cube();
    if (global_Normal_ON) {
        ground.textureNum = -3;
    }
    else {
        ground.textureNum = 4;
    }
    ground.matrix.translate(5, -.271, 3);
    ground.matrix.scale(40, 0, 40);
    ground.matrix.translate(-.3, 0, -.3);
    ground.render();

    // Sky Box
    var skyBox = new Cube();
    skyBox.color = [0, 1, 1, 1];
    if (global_Normal_ON) {
        skyBox.textureNum = -3;
    }
    else {
        skyBox.textureNum = 0;
    }
    skyBox.matrix.scale(100, 100, 100);
    skyBox.matrix.translate(-.5, -.5, -.5);
    skyBox.render();

    drawMap();

    // Blocky Pig Start
    // HEAD
    var head = new Cube();
    if (global_Normal_ON) {
        head.textureNum = -3;
    }
    else {
        head.textureNum = -2;
    }
    head.color = pink;
    head.matrix.scale(0.4, 0.4, 0.4);
    head.matrix.translate(-0.5, 0.5, -2);
    head.normalMatrix.setInverseOf(sphere.matrix).transpose();
    head.render();
     
    // Body
    var body = new Cube();
    if (global_Normal_ON) {
        body.textureNum = -3;
    }
    else {
        body.textureNum = -2;
    }
    body.color = pink;
    body.matrix.scale(0.8, 0.5, 0.9);
    body.matrix.translate(-0.5, 0, -0.5);
    body.normalMatrix.setInverseOf(sphere.matrix).transpose();
    body.render();
 
    // Eyes
    var eyelid_Left = new Cube();
    if (global_Normal_ON) {
        eyelid_Left.textureNum = -3;
    }
    else {
        eyelid_Left.textureNum = -2;
    }
    eyelid_Left.color = black;
    eyelid_Left.matrix.scale(0.07, 0.07, 0.05);
    eyelid_Left.matrix.translate(-3, 5.5, -16.5);
    eyelid_Left.normalMatrix.setInverseOf(sphere.matrix).transpose();
    eyelid_Left.render();
 
    var eye_Left = new Cube();
    if (global_Normal_ON) {
        eye_Left.textureNum = -3;
    }
    else {
        eye_Left.textureNum = -2;
    }
    eye_Left.color = white;
    eye_Left.matrix.scale(0.07, 0.07, 0.05);
    eye_Left.matrix.translate(-2, 5.5, -16.5);
    eye_Left.normalMatrix.setInverseOf(sphere.matrix).transpose();
    eye_Left.render();
 
    var eyelid_Right = new Cube();
    if (global_Normal_ON) {
        eyelid_Right.textureNum = -3;
    }
    else {
        eyelid_Right.textureNum = -2;
    }
    eyelid_Right.color = black;
    eyelid_Right.matrix.scale(0.07, 0.07, 0.05);
    eyelid_Right.matrix.translate(2, 5.5, -16.5);
    eyelid_Right.normalMatrix.setInverseOf(sphere.matrix).transpose();
    eyelid_Right.render();
    
    var eye_Right = new Cube();
    if (global_Normal_ON) {
        eye_Right.textureNum = -3;
    }
    else {
        eye_Right.textureNum = -2;
    }
    eye_Right.color = white;
    eye_Right.matrix.scale(0.07, 0.07, 0.05);
    eye_Right.matrix.translate(1, 5.5, -16.5);
    eye_Right.normalMatrix.setInverseOf(sphere.matrix).transpose();
    eye_Right.render();

    // Nose
    var nose = new Cube();
    if (global_Normal_ON) {
        nose.textureNum = -3;
    }
    else {
        nose.textureNum = -2;
    }
    nose.color = pink;
    nose.matrix.scale(0.2, 0.1, 0.05);
    nose.matrix.translate(-0.5, 2.5, -16.75);
    nose.normalMatrix.setInverseOf(sphere.matrix).transpose();
    nose.render();

    var nose_Left = new Cube();
    if (global_Normal_ON) {
        nose_Left.textureNum = -3;
    }
    else {
        nose_Left.textureNum = -2;
    }
    nose_Left.color = brown;
    nose_Left.matrix.scale(0.0499, 0.0499, 0.05);
    nose_Left.matrix.translate(-2, 5.5, -17);
    nose_Left.normalMatrix.setInverseOf(sphere.matrix).transpose();
    nose_Left.render();

    var nose_Right = new Cube();
    if (global_Normal_ON) {
        nose_Right.textureNum = -3;
    }
    else {
        nose_Right.textureNum = -2;
    }
    nose_Right.color = brown;
    nose_Right.matrix.scale(0.0499, 0.0499, 0.05);
    nose_Right.matrix.translate(1, 5.5, -17);
    nose_Right.normalMatrix.setInverseOf(sphere.matrix).transpose();
    nose_Right.render();    
    
    // LEGS
    var legL_front = new Cube();
    if (global_Normal_ON) {
        legL_front.textureNum = -3;
    }
    else {
        legL_front.textureNum = -2;
    }
    legL_front.color = pink;
    legL_front.matrix.rotate(global_front_left, 1, 0, 0);
    legL_front.matrix.scale(0.2, 0.45, 0.2);
    legL_front.matrix.translate(-1.5, -0.6, -2);
    legL_front.normalMatrix.setInverseOf(sphere.matrix).transpose();
    legL_front.render();

    var legR_front = new Cube();
    if (global_Normal_ON) {
        legR_front.textureNum = -3;
    }
    else {
        legR_front.textureNum = -2;
    }
    legR_front.color = pink;
    legR_front.matrix.rotate(-global_front_right, 1, 0, 0);
    legR_front.matrix.scale(0.2, 0.45, 0.2);
    legR_front.matrix.translate(0.5, -0.6, -2);
    legR_front.normalMatrix.setInverseOf(sphere.matrix).transpose();
    legR_front.render();

    var legL_Back = new Cube();
    if (global_Normal_ON) {
        legL_Back.textureNum = -3;
    }
    else {
        legL_Back.textureNum = -2;
    }
    legL_Back.color = pink;
    legL_Back.matrix.rotate(-global_back_left, 1, 0, 0);
    legL_Back.matrix.scale(0.2, 0.45, 0.2);
    legL_Back.matrix.translate(-1.5, -0.6, 1);
    legL_Back.normalMatrix.setInverseOf(sphere.matrix).transpose();
    legL_Back.render();

    var legR_Back = new Cube();
    if (global_Normal_ON) {
        legR_Back.textureNum = -3;
    }
    else {
        legR_Back.textureNum = -2;
    }
    legR_Back.color = pink;
    legR_Back.matrix.rotate(global_back_right, 1, 0, 0);
    legR_Back.matrix.scale(0.2, 0.45, 0.2);
    legR_Back.matrix.translate(0.5, -0.6, 1);
    legR_Back.normalMatrix.setInverseOf(sphere.matrix).transpose();
    legR_Back.render();

    // Tongue
    var tongue_Base = new Cube();
    if (global_Normal_ON) {
        tongue_Base.textureNum = -3;
    }
    else {
        tongue_Base.textureNum = -2;
    }
    tongue_Base.color = red;
    tongue_Base.matrix.setRotate(180, 1, 0, 0);
    tongue_Base.matrix.rotate(global_tongue_base, 0, 0, 1);
    var middleCoord = new Matrix4(tongue_Base.matrix);
    tongue_Base.matrix.scale(0.05, 0.05, 0.1);
    tongue_Base.matrix.translate(-0.5, -5.5, 8);
    tongue_Base.normalMatrix.setInverseOf(sphere.matrix).transpose();
    tongue_Base.render();

    var tongue_Mid = new Cube();
    if (global_Normal_ON) {
        tongue_Mid.textureNum = -3;
    }
    else {
        tongue_Mid.textureNum = -2;
    }
    tongue_Mid.color = red;
    tongue_Mid.matrix = middleCoord;
    tongue_Mid.matrix.rotate(global_tongue_mid, 0, 1, 1);
    var tipCoord = new Matrix4(tongue_Mid.matrix);
    tongue_Mid.matrix.scale(0.05, 0.05, 0.15);
    tongue_Mid.matrix.translate(-0.5, -5.5, 6);
    tongue_Mid.normalMatrix.setInverseOf(sphere.matrix).transpose();
    tongue_Mid.render();

    var tongue_End = new Cube();
    if (global_Normal_ON) {
        tongue_End.textureNum = -3;
    }
    else {
        tongue_End.textureNum = -2;
    }
    tongue_End.color = red;
    tongue_End.matrix = tipCoord;
    tongue_End.matrix.rotate(global_tongue_tip, 0, 1, 1);
    tongue_End.matrix.scale(0.05, 0.05, 0.05);
    tongue_End.matrix.translate(-0.5, -5.5, 21);
    tongue_End.normalMatrix.setInverseOf(sphere.matrix).transpose();
    tongue_End.render();

    // Poop
    var poop = new Cube();
    if (global_Normal_ON) {
        poop.textureNum = -3;
    }
    else {
        poop.textureNum = -2;
    }
    poop.color = brown;
    poop.matrix.scale(0.05, 0.15, 0.05);
    poop.matrix.translate(-0.75, 1.75, 6);
    poop.matrix.translate(0, global_poop_ANIMATED, 0);
    poop.normalMatrix.setInverseOf(sphere.matrix).transpose();
    poop.render()
 
    // Tail
    //  var tail = new Cone();
    //  tail.color = light_pink;
    //  tail.matrix.rotate(-180,1,0,0);
    //  tail.matrix.translate(-0.014, -.35, -0.54)
    //  tail.matrix.scale(1, 1, .5)
    //  tail.render();

    // END BLOCKY PIG

    // Performance stuff
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
    }

    function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}