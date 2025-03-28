#version 430 core

#define RECURSION_LIMIT 10000
#define PI 3.141592653589793238

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
uniform vec2 uCenter; // Centro del frattale
uniform double uZoom;  // Livello di zoom

uniform vec2 uCostant;

dvec2 final_pos;

// Metodo per la costruzione dell'insieme di Julia con precisione double
int juliaSet(dvec2 c, dvec2 constant) {
    int recursionCount;
    dvec2 z = c;

    for (recursionCount = 0; recursionCount < RECURSION_LIMIT; recursionCount++) {
        z = dvec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + constant;

        if (length(z) > 2.0) {
            break;
        }
    }

    final_pos = z;
    return recursionCount;
}

vec3 colorize(int iteration, dvec2 z) {
    if (iteration == RECURSION_LIMIT) {
        return vec3(1.0); // Colore bianco per i punti interni
    }
    
    // Smooth iteration count per ridurre le bande di colore
    float smooth_iter = iteration + 1.0 - log2(log2(length(vec2(z))));
    float t = smooth_iter / float(RECURSION_LIMIT);
    
    // Funzione di contrasto: enfatizza i punti con alto numero di iterazioni
    float exposure = exp(.5 * t);

    // Color mapping basato su funzioni sinusoidali
    vec3 color = 0.5 + 0.5 * cos(3.0 + t * 6.28318 + vec3(0.0, 0.6, 1.0));

    // maggior esposizione nei punti che impiegano più tempo a divergere
     color *= exposure * 3.0;  // Più brillantezza per i punti vicini alla convergenza
     
    return clamp(color, 0.0, 1.0); // colore nel range [0,1]
}

// Metodo principale dello shader
void main() {
    dvec2 res = dvec2(uResolution);
    dvec2 center = dvec2(uCenter);
    double zoom = uZoom;
    
    dvec2 uv = 2.0 * ((dvec2(TexCoords) - 0.5) * res) / res.y * zoom + center;
    dvec2 uv2 = uv; // Copia per colorazione
    vec3 col = vec3(1.0); // Colore iniziale

    float a = PI / 3.0; // Angolo di rotazione in radianti
    dvec2 U = dvec2(cos(a), sin(a)); // Vettore base U (nuovo asse x)
    dvec2 V = dvec2(-U.y, U.x); // Vettore base V (nuovo asse y)
    uv = dvec2(dot(uv, U), dot(uv, V)); // Rotazione delle UV
    uv *= 0.9;

    dvec2 c = uv;
    int recursionCount = juliaSet(c, uCostant);
    
    col = colorize(recursionCount, final_pos);

    FragColor = vec4(col, 1.0); // Conversione da double a float
}