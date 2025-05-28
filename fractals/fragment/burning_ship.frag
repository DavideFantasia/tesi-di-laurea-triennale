#version 430 core
//#pragma optionNV(fastmath on)

out vec4 FragColor;
in vec2 TexCoords;

uniform vec2 uResolution;
uniform vec2 uCenter; // Centro del frattale
uniform float uZoom;  // Livello di zoom

const uint maxIterations = 100u;

vec3 palette(float t) {
    // Simula una transizione da nero -> arancio scuro -> oro -> bianco caldo
    vec3 darkOrange = vec3(0.4, 0.15, 0.0);
    vec3 gold        = vec3(1.0, 0.75, 0.0);
    vec3 warmWhite   = vec3(1.0, 0.9, 0.7);

    // Controllo delle soglie per fondere i colori
    if (t < 0.2)
        return mix(vec3(0.0), darkOrange, t / 0.2);
    else if (t < 0.6)
        return mix(darkOrange, gold, (t - 0.2) / 0.4);
    else
        return mix(gold, warmWhite, (t - 0.6) / 0.4);
}

void main() {

    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 uv = (TexCoords - 0.5) * uResolution / uResolution.y;
    uv.y = -uv.y; // Invertimento dell'asse Y
    vec2 c = uv * uZoom + uCenter;
    vec2 z = vec2(0.0);

    uint i;
    for (i = 0u; i < maxIterations; ++i) {
        if(dot(z, z) > 4.0) break;
        z = vec2(abs(z.x), abs(z.y));
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    float t = float(i) + 1.0 - log2(0.5*log2(dot(z,z)));
    t = t / float(maxIterations);

    vec3 color;
    color = vec3(0.0);
    if (i != maxIterations) {
        float offset = 0.0;
        float glow = pow(t, 0.8);
        color = palette(offset+glow);
    }

    FragColor = vec4(color, 1.0);
}