#version 430 core
#define RECURSION_LIMIT 100000

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;

uniform vec2 uCenter; // Centro del frattale
uniform double uZoom;  // Livello di zoom

dvec3 palette(double t) {
    // Simula una transizione da nero -> arancio scuro -> oro -> bianco caldo
    dvec3 darkOrange = dvec3(0.4, 0.15, 0.0);
    dvec3 gold        = dvec3(1.0, 0.75, 0.0);
    dvec3 warmWhite   = dvec3(1.0, 0.9, 0.7);

    // Controllo delle soglie per fondere i colori
    if (t < 0.2)
        return mix(dvec3(0.0), darkOrange, t / 0.2);
    else if (t < 0.6)
        return mix(darkOrange, gold, (t - 0.2) / 0.4);
    else
        return mix(gold, warmWhite, (t - 0.6) / 0.4);
}

void main() {

    dvec2 res = dvec2(uResolution);
    dvec2 center = dvec2(uCenter);
    double zoom = uZoom;
    
    dvec2 uv = (dvec2(TexCoords) - 0.5) * res / res.y;
    uv.y = -uv.y; // Invertimento dell'asse Y
    dvec2 c = uv * zoom + center;
    dvec2 z = dvec2(0.0);

    uint maxIterations = 100u;
    uint i;
    for (i = 0u; i < maxIterations; ++i) {
        if (dot(z, z) > 4.0) break;
        z = dvec2(abs(z.x), abs(z.y));
        z = dvec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    float t = float(i) + 1.0 - log2(0.5*log2(float(dot(z,z))));
    t = t / float(maxIterations);
    
    dvec3 color = dvec3(0.0);
    if (i != maxIterations) {
        double offset = 0.0;
        double glow = double(pow(t, 0.8));
        color = palette(offset+glow);
    }

    FragColor = vec4(color, 1.0);
}