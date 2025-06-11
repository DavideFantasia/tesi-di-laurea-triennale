#version 430 core
#define RECURSION_LIMIT 10000
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
uniform float uTime; //tempo in secondi

// Returns a normalized directoin based on an angle
vec2 polarToCartesian (float angle) {
  return vec2(sin (angle), cos (angle));
}

// Reflects the UV based on a relfection line centered in the point p with a given angle
vec2 ref (vec2 uv, vec2 p, float angle) {
  vec2 dir = polarToCartesian (angle); // Direction of the reflection line
  return uv - dir * min(dot (uv - p, dir), 0.0) * 2.0; // Returns the reflected uv coordinate
}

// Returns the signed distance of a point p to a equilateral triangle centered on the screen
float sigendDistTriangle (vec2 p) {
  const float sqrt3 = sqrt(3.0);
  p.x = abs (p.x) - 1.0;
  p.y = p.y + 1.0 / sqrt3;
  if (p.x + sqrt3 * p.y > 0.0) {
    p = vec2 (p.x - sqrt3 * p.y, -sqrt3 * p.x - p.y) / 2.0;
  }
  p.x -= clamp (p.x, -2.0, 0.0);
  return -length (p) * sign (p.y);
}

// Folds the 2d space to generate the fractal and returns the distance to it
float sierpinskiTriangle (inout vec2 uv, int recursionCount) {
    float scale = 0.9; // Scale of the UV
    uv *= scale; // Scales the UV to make the fractal fit on the screen
    for (int i = 0; i < recursionCount; ++i) {
        scale *= 2.0;
        uv *= 2.0; // Scales down the fractal
        uv.y -= 2.0 * sqrt (3.0) / 3.0; // Translates the fractal to the new Y position (sends it to the top)
        uv.x = abs (uv.x); // Makes a reflection plane on the Y axis
        uv = ref (uv, vec2 (1.0, -sqrt (3.0) / 3.0), (11.0 / 6.0) * PI); // Makes a reflection plane on the bototm right vertex of the triangle, with an angle of 330°
    }

    float d = sigendDistTriangle (uv) / scale; // Calculates de tistance to an equilateral triangle centered on the center of the screen
    uv /= scale; // Resets the scale of the uv
    return d; // Returns the distance to the triangle
}

void main() {
    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 uv = 2.0 * ((TexCoords - 0.5)*res)/res.y * zoom + center;
    // Creates a copy of the uvs for coloring
    vec2 uv2 = uv;
    // Color to be drawn on the screen
    vec3 col = vec3 (0.0);
    // Offsets the uvs to center the fractal in the middle of the screen
    uv += vec2 (0.0, 0.30); 
    // Number of iterations of the fractal (increases with time)
    int recursionCount = int(floor(mod(floor(uTime),40)*0.5))+2;
    // Distance to the fractal
    float d = sierpinskiTriangle(uv, recursionCount); 
    
    float lineSmoothness = 0.000001;
    // Offset for the blending of the colors in the middle
    float offset = 0.5; 
    // Red channel
    float r = smoothstep (lineSmoothness, 0.0, d) * 0.5 * (uv2.x * 0.5 + 0.5 + offset); 
    col.r += r;
    // Blue channel
    float b = smoothstep (lineSmoothness, 0.0, d) * 0.5 * (uv2.y * 0.5 + 0.5 + offset);
    col.b += b;
    // Green channel
    float g = smoothstep (lineSmoothness, 0.0, d) * 0.5 * (-uv2.x * 0.5 + 0.5 + offset);
    col.g += g;
    
    FragColor = vec4 (col, 1.0); // Outputs the result color to the screen
}