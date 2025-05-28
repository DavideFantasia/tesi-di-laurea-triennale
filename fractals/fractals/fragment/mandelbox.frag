#version 430 core
#pragma optionNV(fastmath on)

#define MaximumRaySteps 5000
#define MaximumDistance 200.
#define MinimumDistance .0001
#define PI 3.141592653589793238

/*
 * Based on original work by Pedro T.R. Schneider
 * https://github.com/pedrotrschneider/shader-fractals/
 */

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
uniform float uZoom;

uniform mat4 uView;
uniform vec3 uCamPos;

const int NUM_LIGHTS = 1;
vec3 lightPositions[NUM_LIGHTS] = vec3[](
    vec3(2.0, 2.0, -3.0)
);

// Converts a color from the HSV colorspace to RGB
vec3 hsv2rgb (vec3 c) {
  vec4 K = vec4 (1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs (fract (c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix (K.xxx, clamp (p - K.xxx, 0.0, 1.0), c.y);
}

// SDF FUNCTIONS //
// SDF sphere
vec4 sphere (vec4 z) {
  float r2 = dot (z.xyz, z.xyz);
  if (r2 < 2.0)
    z *= (1.0 / r2);
  else z *= 0.5;

  return z;
}

// SDF box
vec3 box (vec3 z) {
  return clamp (z, -1.0, 1.0) * 2.0 - z;
}

float DE0 (vec3 pos) {
  vec3 from = vec3 (0.0);
  vec3 z = pos - from;
  float r = dot (pos - from, pos - from) * pow (length (z), 2.0);
  return (1.0 - smoothstep (0.0, 0.01, r)) * 0.01;
}

float DE2 (vec3 pos) {
  //vec3 params = vec3 (0.22, 0.5, 0.5);
  vec3 params = vec3 (0.5, 0.5, 0.5);
  vec4 scale = vec4 (-20.0 * 0.272321);
  vec4 p = vec4 (pos, 1.0), p0 = p;
  vec4 c = vec4 (params, 0.5) - 0.5; // param = 0..1

  for (float i = 0.0; i < 10.0; i++) {
    p.xyz = box (p.xyz);
    p = sphere (p);
    p = p * scale + c;
  }

  return length (p.xyz) / p.w;
}

float DE (vec3 pos) {

  float d0 = DE0 (pos);
  float d2 = DE2 (pos);

  return max(d0, d2);
}

vec3 computeNormal(vec3 p) {
    float eps = MinimumDistance * 2.0;
    vec3 grad;
    grad.x = DE(p + vec3(eps,0,0)) - DE(p - vec3(eps,0,0));
    grad.y = DE(p + vec3(0,eps,0)) - DE(p - vec3(0,eps,0));
    grad.z = DE(p + vec3(0,0,eps)) - DE(p - vec3(0,0,eps));
    
    return normalize(grad);
}

vec3 getTangent(vec3 n) {
    vec3 up = abs(n.y) < 0.999 ? vec3(0,1,0) : vec3(1,0,0);
    return normalize(cross(up, n));
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

            float height = DE(samplePos);
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
  float steps = 0.0;
  float totalDistance = 0.0;
  float minDistToScene = 100.0;
  vec3 minDistToScenePos = ro;
  float minDistToOrigin = 100.0;
  vec3 minDistToOriginPos = ro;
  vec4 col = vec4 (0.0, 0.0, 0.0, 1.0);
  vec3 curPos = ro;
  bool hit = false;

  for (steps = 0.0; steps < float (MaximumRaySteps); steps++) {
    vec3 p = ro + totalDistance * rd; // Current position of the ray
    float distance = DE (p); // Distance from the current position to the scene
    curPos = ro + rd * totalDistance;
    if (minDistToScene > distance) {
      minDistToScene = distance;
      minDistToScenePos = curPos;
    }
    if (minDistToOrigin > length (curPos)) {
      minDistToOrigin = length (curPos);
      minDistToOriginPos = curPos;
    }
    totalDistance += distance; // Increases the total distance armched
    if (distance < MinimumDistance) {
      hit = true;
      break; // If the ray marched more than the max steps or the max distance, breake out
    }
    else if (distance > MaximumDistance) {
      break;
    }
  }

  float iterations = float (steps) + log (log (MaximumDistance)) / log (2.0) - log (log (dot (curPos, curPos))) / log (2.0);

    if (hit) {
        vec3 normal = computeNormal(curPos);
    
        float stepFactor = float(steps) / float(MaximumRaySteps);  // Normalized steps value
    
        vec3 colorBase = vec3(0.6 + 0.2 * sin(length(curPos) * 3.0), 0.7, 0.9);
        colorBase = hsv2rgb(colorBase);
        colorBase *= (1.0 - stepFactor);  // Darken the color as steps increase

        col.rgb = blinnPhongMultipleLights(curPos, normal, ro, colorBase);

        float invSteps = 1.0 / (steps * 0.08);
        col.rgb *= invSteps; // Ambeint occlusion
        col.rgb *= 3.0;
  }

  return col;
}

void main(){
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = (TexCoords * 2.0 - 1.0) * uResolution / uResolution.y * uZoom;
  
  vec3 ro = uCamPos;
  vec3 rd =  normalize((inverse(uView) * vec4(uv.x, uv.y, -1.0, 0.0)).xyz);

  vec4 col = RayMarcher (ro, rd);

  //Reinhard tone mapping
  col.rgb = col.rgb / (1.0 + col.rgb);
  col.rgb = pow(col.rgb, vec3(1.0 / 2.2)); // gamma correction

  // Output to screen
  FragColor = vec4 (col);
}