#version 430 core
#define MaximumRaySteps 250
#define MaximumDistance 200.0
#define MinimumDistance 0.0001
#define PI 3.141592653589793238

out vec4 FragColor;
in vec2 TexCoords;

// Uniform passate dalla CPU
uniform vec2 uResolution;
uniform float uTime;
uniform mat4 uView, uProj;    // Matrice combinata Proiezione * Vista
//uniform mat4 uVP;
uniform vec3 uCamPos; // Posizione della camera nel mondo

// Converte colore da HSV a RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Mappa un valore da un intervallo a un altro
float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// Calcola il Mandelbulb per una data posizione
float mandelbulb(vec3 position) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    float power = 8.0 + (5.0 * map(sin(uTime * PI / 10.0 + PI), -1.0, 1.0, 0.0, 1.0));
    
    for (int i = 0; i < 10; i++) {
        r = length(z);
        if (r > 2.0)
            break;
            
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        float zr = pow(r, power);
        theta *= power;
        phi *= power;
        z = zr * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
        z += position;
    }
    return 0.5 * log(r) * r / dr;
}

// Applica una rotazione 2D alla componente YZ del punto p
float DistanceEstimator(vec3 p) {
    float angle = -0.3 * PI;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    p.yz = rot * p.yz;
    return mandelbulb(p);
}

// Funzione di Ray Marching: muove il raggio nella scena fino a colpire la superficie o oltrepassare il massimo
vec4 RayMarcher(vec3 ro, vec3 rd) {
    float totalDistance = 0.0;
    vec3 curPos = ro;
    bool hit = false;
    float steps;
    
    for (steps = 0.0; steps < float(MaximumRaySteps); steps++) {
        vec3 p = ro + totalDistance * rd;
        float dist = DistanceEstimator(p);
        totalDistance += dist;
        curPos = ro + rd * totalDistance;
        if (dist < MinimumDistance) {
            hit = true;
            break;
        } else if (totalDistance > MaximumDistance) {
            break;
        }
    }
    
    vec4 col = vec4(0.0);
    if (hit) {
        // Se il raggio colpisce la superficie, colora in base alla distanza dalla camera
        col.rgb = vec3(0.8 + (length(curPos) / 0.5), 1.0, 0.8);
        col.rgb = hsv2rgb(col.rgb);
    } else {
        // Se il raggio non colpisce, usa la distanza minima per determinare il colore
        col.rgb = vec3(0.8 + (length(ro + rd * totalDistance) / 0.5), 1.0, 0.8);
        col.rgb = hsv2rgb(col.rgb);
        col.rgb *= 1.0 / (totalDistance * totalDistance);
        col.rgb /= map(sin(uTime * 3.0), -1.0, 1.0, 3000.0, 50000.0);
    }
    
    // Alcune operazioni per simulare ambient occlusion e attenuazione
    col.rgb /= steps * 0.08;
    col.rgb /= pow(distance(ro, curPos), 2.0);
    col.rgb *= 3.0;
    return col;
}

// Calcola la direzione del raggio a partire dalle coordinate UV e dalla matrice VP
vec3 getRayDirection(vec2 uv, mat4 VP) {
    vec4 clipSpace = vec4(uv, -1.0, 1.0); // Coordinate in clip space
    vec4 worldSpace = inverse(VP) * clipSpace; // Trasformazione in world space
    return normalize(worldSpace.xyz / worldSpace.w);
}

void main() {
    // Calcola coordinate normalizzate: da 0 a 1 -> da -1 a 1 con correzione per il rapporto d'aspetto
    vec2 uv = (TexCoords * 2.0 - 1.0) * uResolution / uResolution.y;
    
    // Imposta l'origine del raggio dalla posizione della camera (passata dalla CPU)
    vec3 ro = uCamPos;
    // Calcola la direzione del raggio usando la matrice VP
    vec3 rd = getRayDirection(uv, uView*uProj);
    
    vec4 col = RayMarcher(ro, rd);
    FragColor = vec4(col.rgb, 1.0);
}
