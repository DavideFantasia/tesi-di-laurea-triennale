#version 430 core
#define PI 3.141592653589793238

/*
 * Based on original work by Pedro T.R. Schneider
 * https://github.com/pedrotrschneider/shader-fractals/
 */

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;

uniform vec2 uCenter; // Centro del frattale
uniform float uZoom;  // Livello di zoom

uniform vec2 uConstant;

uniform int uRecLimit;


vec2 final_pos;

// Method for the mathematical construction of the julia set
int juliaSet (vec2 c, vec2 constant) {
  int recursionCount;

  vec2 z = c;

  for (recursionCount = 0; recursionCount < uRecLimit; recursionCount++) {
    z = vec2 (z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + constant;

    if (dot(z,z) > 4.0) break;
  }

  final_pos = z;
  return recursionCount;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 colorize(int iteration, vec2 z){
    float smooth_iter = float(iteration) + 1.0 - log2(0.5 * log2(dot(z, z)));
    float t = smooth_iter / float(uRecLimit);

    float hue = fract(0.8 + 0.2 * t); // valore tra 0 e 1
    float sat = 1.0;
    float val = pow(t*2.5, 0.5);

    return hsv2rgb(vec3(hue, sat, val));
}

// Main method of the sahder
void main(){
    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 uv = 2.0 * ((TexCoords - 0.5)*res)/res.y * zoom + center;
    
    //cos(PI/3) = 1/2 ; sin(PI/3) = ~0.866025 ; per dare una rotazione di PI/3
    vec2 U = vec2 (0.5, 0.866025); // U basis vector (new x axis)
    vec2 V = vec2 (-U.y, U.x); // V basis vector (new y axis)
    uv = vec2 (dot (uv, U), dot (uv, V)); // Rotationg the uv
    uv *= 0.9;

    vec2 c = uv;
    int recursionCount = juliaSet (c, uConstant);
    
    vec3 col = vec3(1.0); // Color to be drawn on the screen
    if (recursionCount != uRecLimit) col = colorize(recursionCount, final_pos);
    
    FragColor = vec4(col.rgb, 1.0); // Outputs the result color to the screen
}