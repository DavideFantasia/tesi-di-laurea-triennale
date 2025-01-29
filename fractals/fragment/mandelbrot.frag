#version 430 core
#define RECURSION_LIMIT 10000

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
//uniform vec2 uMouse;
uniform vec2 uCenter; // Centro del frattale
uniform float uZoom;  // Livello di zoom
uniform int uFrame;
uniform float uTime;

// Method for the mathematical constructoin of the mandelbrot set
int mandelbrot (vec2 c) {
  int recursionCount;

  vec2 z = vec2 (0.0, 0.0);

  for (recursionCount = 0; recursionCount < RECURSION_LIMIT; recursionCount++) {
    z = vec2 (z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;

    if (length (z) > 2.0) {
      break;
    }
  }

  return recursionCount;
}
/*
void main(){
  const vec2[5] locations = vec2[] (
    vec2 (0.281717921930775, 0.5771052841488505),
    vec2 (-0.81153120295763, 0.20142958206181),
    vec2 (0.452721018749286, 0.39649427698014),
    vec2 (-0.745428, 0.113009), vec2(-0.5,0)
  );

  vec2 uv = 2.0 * (TexCoords - 0.5 * uResolution.xy) / uResolution.y; // Normalized pixel coordinates (from 0 to 1)
  vec2 uv2 = uv; // Creates a copy of the uvs for coloring
  //vec2 mouse = uMouse / uResolution; // Gets the coordinates of the mouse to aply zoom

  //float time = 0.032 * float(uFrame);
  float time = uTime;
  float zoom = uZoom;
  vec3 col = vec3 (1.0); // Color to be drawn on the screen


  uv /= (zoom); // Scales the uv based of the zoom
  vec2 c = uv; // Initializes c as the current pixel position
  c += locations[4]; // Offsets the current pixel position to put the desired location in the middle
  int recursionCount = mandelbrot (c); // Calculates the amount of iterations until the point went out of bounds

  float f = float(recursionCount) / float(RECURSION_LIMIT); // Puts the amount of iterations in range [0, 1]

  // Coloring the fractal
  if (recursionCount == RECURSION_LIMIT) { // If it is in the mandelbrot set itself, colors black
    col.r = 0.0;
    col.b = 0.0;
    col.g = 0.0;
  }
  else { // If its close to the mandelbrot set, colors based on how close it is to beeing on the mandelbrot
    float offset = 0.5;
    float ff = pow (f, 1.0 - (f * max (0.0, (50.0 - time))));
    float smoothness = 1.0;
    col.r = smoothstep (0.0, smoothness, ff) * (uv2.x * 0.5 + 0.5);
    col.b = smoothstep (0.0, smoothness, ff) * (uv2.y * 0.5 + 0.5);
    col.g = smoothstep (0.0, smoothness, ff) * (-uv2.x * 0.5 + 0.5);
  }

  FragColor = vec4 (col.rgb, 1.0); // Outputs the result color to the screen
}
*/

void main() {

    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 c = 2.0 * ((TexCoords - 0.5)*res)/res.y * zoom + center;
    vec2 z = vec2(0.0);

    uint maxIterations = 100u;
    uint i;
    for (i = 0u; i < maxIterations; ++i) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    float t = float(i) / float(maxIterations);
 
    vec3 color;
    if (i == maxIterations) { // If it is in the mandelbrot set itself, colors black
        color = vec3(0.05);
    }
    else { // If its close to the mandelbrot set, colors based on how close it is to beeing on the mandelbrot
        float offset = 0.5;
        float smoothness = 1.0;
        color.r = smoothstep (0.0, smoothness, t) * (TexCoords.x * 0.5 + 0.5);
        color.b = smoothstep (0.0, smoothness, t) * (TexCoords.y * 0.5 + 0.5);
        color.g = smoothstep (0.0, smoothness, t) * (-TexCoords.x * 0.5 + 0.5);
    }

    FragColor = vec4(color, 1.0);
}
