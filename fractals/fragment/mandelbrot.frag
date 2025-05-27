#version 430 core
//#pragma optionNV(fastmath on)
#define RECURSION_LIMIT 100000

/*
 * Based on original work by Pedro T.R. Schneider
 * https://github.com/pedrotrschneider/shader-fractals/
 */

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;

uniform vec2 uCenter; // Centro del frattale
uniform float uZoom;  // Livello di zoom

void main() {

    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 c = 2.0 * ((TexCoords - 0.5)*res)/res.y * zoom + center;
    vec2 z = vec2(0.0);

    uint maxIterations = 1000u;
    uint i;
    for (i = 0u; i < maxIterations; ++i) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    float t = float(i) / float(maxIterations);
 
    vec3 color;
    color = vec3(0.05);
    if (i != maxIterations) { // If it is in the mandelbrot set itself, colors black
        float smoothness = 1.0;
        float offset = 1.5;
        color.r = smoothstep(0.0, smoothness, t) * (TexCoords.x * 0.5 + 0.5) * offset;
        color.b = smoothstep(0.0, smoothness, t) * (TexCoords.y * 0.5 + 0.5) * offset;
        color.g = smoothstep(0.0, smoothness, t) * (-TexCoords.x * 0.5 + 0.5) * offset;
    }

    FragColor = vec4(color, 1.0);
}