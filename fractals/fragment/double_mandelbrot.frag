#version 430 core
#define RECURSION_LIMIT 100000

/*
 * Based on original work by Pedro T.R. Schneider
 * https://github.com/pedrotrschneider/shader-fractals/
 */

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform double uZoom;

void main() {
    dvec2 res = dvec2(uResolution);
    dvec2 center = dvec2(uCenter);
    double zoom = uZoom;

    dvec2 c = 2.0 * ((dvec2(TexCoords) - 0.5) * res) / res.y * zoom + center;

    dvec2 z = dvec2(0.0);
    int i;
    const int maxIterations = 1000;

    for (i = 0; i < maxIterations; ++i) {
        if(dot(z, z) > 4.0) break;
        z = dvec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    double t = double(i) / double(maxIterations);

    dvec3 color;
    if (i == maxIterations) {
        color = dvec3(0.05);
    } else {
        double smoothness = 1.0;
        double offset = 1.5;
        color.r = smoothstep(0.0, smoothness, t) * (TexCoords.x * 0.5 + 0.5) * offset;
        color.b = smoothstep(0.0, smoothness, t) * (TexCoords.y * 0.5 + 0.5) * offset;
        color.g = smoothstep(0.0, smoothness, t) * (-TexCoords.x * 0.5 + 0.5) * offset;
    }

    FragColor = vec4(vec3(color), 1.0);
}