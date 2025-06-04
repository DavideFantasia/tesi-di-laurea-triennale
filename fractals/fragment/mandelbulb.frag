#version 430 core
#pragma optionNV(fastmath on)
#define MaximumRaySteps 500
#define MaximumDistance 4.
#define MinimumDistance 0.000001
#define PI 3.141592653589793238

/*
 * Based on original work by Pedro T.R. Schneider
 * https://github.com/pedrotrschneider/shader-fractals/
 */

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
uniform float uTime;

uniform float uZoom;
uniform float uPower;

uniform mat4 uView;
uniform vec3 uCamPos;

const int NUM_LIGHTS = 1;
vec3 lightPositions[NUM_LIGHTS] = vec3[](
    vec3(2.0, 2.0, -3.0)
);

vec3 hsv2rgb (vec3 c) {
  vec4 K = vec4 (1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs (fract (c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix (K.xxx, clamp (p - K.xxx, 0.0, 1.0), c.y);
}

float mandelbulb (vec3 position) {
  vec3 z = position;
  float dr = 1.0;
  float r = 0.0;
  int iterations = 0;
  float power = uPower;
  
  for (int i = 0; i < 10; i++) {
    iterations = i;
    r = length(z);

    //viene superata la distanza di 2, che da mandelbrot sappiamo essere divergente
    if (r > 2.0){ break; }

    // convert to polar coordinates
    float theta = acos (z.z / r);
    float phi = atan (z.y, z.x);
    dr = pow(r, power - 1.0) * power * dr + 1.0;

    // scale and rotate the point
    float zr = pow (r, power);
    theta = theta * power;
    phi = phi * power;

    // convert back to cartesian coordinates
    vec2 sincosTheta = sin(vec2(theta, phi));
    vec2 coscosTheta = cos(vec2(theta, phi));

    z = zr * vec3(sincosTheta.x * coscosTheta.y, sincosTheta.y * sincosTheta.x, coscosTheta.x);
    z += position;
  }
  float dst = 0.5 * log (r) * r / dr;
  return dst;
}

// Calculates de distance from a position p to the scene
float DistanceEstimator(vec3 p) {
  return mandelbulb (p);
}

vec3 computeNormal(vec3 p) {
    float eps = MinimumDistance * 2.0;
    vec3 grad;
    grad.x = DistanceEstimator(p + vec3(eps,0,0)) - DistanceEstimator(p - vec3(eps,0,0));
    grad.y = DistanceEstimator(p + vec3(0,eps,0)) - DistanceEstimator(p - vec3(0,eps,0));
    grad.z = DistanceEstimator(p + vec3(0,0,eps)) - DistanceEstimator(p - vec3(0,0,eps));
    
    return normalize(grad);
    //return (grad/(2*eps));
}

vec3 horizonBasedAO(vec3 pos, vec3 normal, vec3 viewDir, int numDirs, int numSamples, vec3 baseColor) {
    float ao = 0.0;
    float ambientFactor = 0.4;
    float maxAngle = 0.0;

    // Costruzione sistema tangente-bitangente
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    
    float tangent_fallback = step(dot(tangent, tangent),0.0001); //if (dot(tangent,tangent) < 0.0001)
    tangent = mix(vec3(1.0, 0.0, 0.0), tangent, tangent_fallback); //tangent = vec3(1.0, 0.0, 0.0);

    vec3 bitangent = normalize(cross(normal, tangent));

    for (int i = 0; i < numDirs; i++) {
        float angleOffset = float(i) * 2.0 * PI / float(numDirs);
        vec3 dir = cos(angleOffset) * tangent + sin(angleOffset) * bitangent;

        float maxHorizonAngle = 0.0;

        for (int j = 1; j <= numSamples; j++) {
            float stepDist = float(j) * 0.05;
            vec3 samplePos = pos + dir * stepDist;

            float height = DistanceEstimator(samplePos);
            vec3 vecToSample = samplePos - pos;
            float distance = length(vecToSample);

            float angle = asin(height / distance); // altezza angolare
            
            float updateMaxAngle = step(angle, maxHorizonAngle); //if (angle > maxHorizonAngle) {
            maxHorizonAngle = mix(angle, maxHorizonAngle, updateMaxAngle); //maxHorizonAngle = angle};
        }

        float visibility = clamp(1.0 - maxHorizonAngle / (PI * 0.5), 0.4, 1.0);
        ao += visibility;
    }

    ao /= float(numDirs);
    return vec3(ao) * baseColor * ambientFactor;
}

//modello di illuminazione di Blinn-Phong
vec3 blinnPhongMultipleLights(vec3 position, vec3 normal, vec3 viewPos, vec3 diffuseColor){
    float ambientStrength = 0.3;
    float diffuseStrength = 0.7;
    float specularStrength = 0.5;
    float shininess = 16.0;

    vec3 viewDir = normalize(viewPos - position);
    vec3 ambient = diffuseColor * ambientStrength;
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec3 lightDir = normalize(lightPositions[i] - position);
        float distance = length(lightPositions[i] - position);
        float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);

        float diff = max(dot(normal, lightDir), 0.0);
        totalDiffuse += diffuseStrength * diff * diffuseColor * attenuation;

        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
        totalSpecular += specularStrength * spec * vec3(0.8) * attenuation;
    }

    // SOMMA DELLE COMPONENTI
    vec3 ao =  horizonBasedAO(position, normal, viewDir, 8, 6, vec3(1.0));
    return (ambient + totalDiffuse)*ao + totalSpecular;
}

// Marches the ray in the scene
vec4 RayMarcher (vec3 ro, vec3 rd) {
    float steps = 0.0, totalDistance = 0.0, minDistToScene = 100.0, minDistToOrigin = 100.0;
    vec3 minDistToScenePos = ro, minDistToOriginPos = ro, curPos = ro;
    vec4 col = vec4 (0.0, 0.0, 0.0, 1.0);
    bool hit = false;

    for (steps = 0.0; steps < float(MaximumRaySteps); steps++) {
        vec3 p = ro + totalDistance * rd; // Current position of the ray
        float distance = DistanceEstimator(p); // Distance from the current position to the scene
        curPos = ro + rd * totalDistance;
        
        // step da 1.0 se distance <= minDistToScene
        float updateScene = step(distance, minDistToScene); //if (minDistToScene > distance) {
        minDistToScene = mix(minDistToScene, distance, updateScene); //minDistToScene = distance;
        minDistToScenePos = mix(minDistToScenePos, curPos, updateScene);//minDistToScenePos = curPos;}
        
        float len_curPos = length(curPos);
        float updateOrigin = step(len_curPos, minDistToOrigin);//if(minDistToOrigin > length (curPos)){
        minDistToOrigin = mix(minDistToOrigin, len_curPos, updateOrigin);//minDistToOrigin = length (curPos);
        minDistToOriginPos = mix(minDistToOriginPos, curPos, updateOrigin);//minDistToOriginPos = curPos;

        totalDistance += distance; // Increases the total distance armched
        float dynamicEps = max(MinimumDistance, 0.0001 * totalDistance); //dynamic minimum distance 
        if (distance < dynamicEps) {
            hit = true;
            break;
        }else if (distance > MaximumDistance) {
            break;
        }
    }

    col.rgb = vec3(0.0);
    if (hit) {
        vec3 normal = computeNormal(curPos);
    
        float stepFactor = float(steps) / float(MaximumRaySteps);  // Normalized steps value
    
        vec3 colorBase = vec3(0.6 + 0.2 * sin(length(curPos) * 3.0), 0.7, 0.9);
        colorBase = hsv2rgb(colorBase);
        colorBase *= (1.0 - stepFactor);  // Darken the color as steps increase

        col.rgb = blinnPhongMultipleLights(curPos, normal, ro, colorBase);
        
        float invSteps = 1.0 / (steps * 0.08);
        col.rgb *= invSteps; // Ambient occlusion
        col.rgb *= 3.0;
    }
    return col;
}

void main() {
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = (TexCoords * 2.0 - 1.0) * uResolution / uResolution.y * uZoom;

  vec3 ro = uCamPos;
  vec3 rd =  normalize((inverse(uView) * vec4(uv.x, uv.y, -1.0, 0.0)).xyz);

  vec4 col = RayMarcher(ro, rd);

  //Reinhard tone mapping
  col.rgb = col.rgb / (1.0 + col.rgb);
  col.rgb = pow(col.rgb, vec3(1.0 / 2.2)); // gamma correction
  // Output to screen
  FragColor = vec4 (col);
}