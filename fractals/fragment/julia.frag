#version 430 core
#define RECURSION_LIMIT 10000
#define PI 3.141592653589793238

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;

uniform vec2 uCenter; // Centro del frattale
uniform float uZoom;  // Livello di zoom

uniform vec2 uCostant;


vec2 final_pos;

// Method for the mathematical construction of the julia set
int juliaSet (vec2 c, vec2 constant) {
  int recursionCount;

  vec2 z = c;

  for (recursionCount = 0; recursionCount < RECURSION_LIMIT; recursionCount++) {
    z = vec2 (z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + constant;

    if (length (z) > 2.0) {
      break;
    }
  }

  final_pos = z;
  return recursionCount;
}

vec3 colorize(int iteration, vec2 z) {
    if (iteration == RECURSION_LIMIT) {
        return vec3(1.0); // Colore bianco per i punti interni
    }
    
    // Smooth iteration count per ridurre le bande di colore
    float smooth_iter = float(iteration) + 1.0 - log2(log2(length(z)));
    float t = smooth_iter / float(RECURSION_LIMIT);
    
    // Funzione di contrasto: enfatizza i punti con alto numero di iterazioni
    float exposure = exp(.5 * t);

    // Color mapping basato su funzioni sinusoidali
    vec3 color = 0.5 + 0.5 * cos(3.0 + t * 6.28318 + vec3(0.0, 0.6, 1.0));

    // maggior esposizione nei punti che impiegano più tempo a divergere
     color *= exposure * 3.0;  // Più brillantezza per i punti vicini alla convergenza
     
    return clamp(color, 0.0, 1.0); // colore nel range [0,1]
}

// Main method of the sahder
void main(){
    vec2 res = uResolution;
    vec2 center = uCenter;
    float zoom = uZoom;
    
    vec2 uv = 2.0 * ((TexCoords - 0.5)*res)/res.y * zoom + center;
    vec2 uv2 = uv; // Creates a copy of the uvs for coloring
    vec3 col = vec3 (1.0); // Color to be drawn on the screen

    float a = PI / 3.0; // rotation angle [rad]
    vec2 U = vec2 (cos (a), sin (a)); // U basis vector (new x axis)
    vec2 V = vec2 (-U.y, U.x); // V basis vector (new y axis)
    uv = vec2 (dot (uv, U), dot (uv, V)); // Rotationg the uv
    uv *= 0.9;

    vec2 c = uv;
    int recursionCount = juliaSet (c, uCostant);
    
    col = colorize(recursionCount, final_pos);
    
    FragColor = vec4 (col.rgb, 1.0); // Outputs the result color to the screen
}