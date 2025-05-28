#version 430 core
#pragma optionNV(fastmath on)
#define MaximumRaySteps 250
#define MaximumDistance 4.0
#define MinimumDistance 0.00005
#define PI 3.141592653589793238

out vec4 FragColor;

in vec2 TexCoords;

uniform vec2 uResolution;
uniform double uTime;

uniform float uZoom;

uniform mat4 uView;
uniform vec3 uCamPos;  // Cambiato da vec3 a dvec3

double map(double value, double min1, double max1, double min2, double max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

dvec3 R (vec2 uv, dvec3 p, dvec3 l, double z) {
  dvec3 f = normalize(l - p),
        r = normalize(cross(dvec3(0.0, 1.0, 0.0), f)),
        u = cross(f, r),
        c = p + f * z,
        i = c + uv.x * r + uv.y * u,
        d = normalize(i - p);
  return d;
}

dvec3 hsv2rgb(dvec3 c) {
    dvec4 K = dvec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    dvec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

double mandelbulb(dvec3 position) {
    dvec3 z = position;
    double dr = 1.0;
    double r = 0.0;
    int iterations = 0;
    double power = 8.0 + (5.0 * float(map(sin(float(uTime) * float(PI) / 10.0 + float(PI)), -1.0, 1.0, 0.0, 1.0)));
    
    for (int i = 0; i < 10; i++) {
        iterations = i;
        r = length(z);

        if (r > 2.0) {
            break;
        }

        double theta = acos(float(z.z) / float(r)); // Convert double to float
        double phi = atan(float(z.y), float(z.x)); // Convert double to float
        dr = pow(float(r), float(power - 1.0)) * power * dr + 1.0;

        double zr = pow(float(r), float(power));
        theta = theta * power;
        phi = phi * power;

        dvec2 sincosTheta = sin(vec2(float(theta), float(phi))); // Convert to float
        dvec2 coscosTheta = cos(vec2(float(theta), float(phi))); // Convert to float

        z = zr * dvec3(sincosTheta.x * coscosTheta.y, sincosTheta.y * sincosTheta.x, coscosTheta.x);
        z += position;
    }
    double dst = 0.5 * log(float(r)) * r / dr;
    return dst;
}

double DistanceEstimator(dvec3 p) {
    return mandelbulb(p);
}

dvec3 computeNormal(dvec3 p) {
    double eps = MinimumDistance;
    dvec2 e = dvec2(eps, 0.0);
    return normalize(dvec3(
        DistanceEstimator(p + e.xyy) - DistanceEstimator(p - e.xyy),
        DistanceEstimator(p + e.yxy) - DistanceEstimator(p - e.yxy),
        DistanceEstimator(p + e.yyx) - DistanceEstimator(p - e.yyx)
    ));
}

dvec3 blinnPhong(dvec3 position, dvec3 normal, dvec3 lightPos, dvec3 viewPos, dvec3 diffuseColor) {
    double distanceToLight = length(lightPos - position);
    double attenuation = 1.0 / (1.0 + 0.09 * distanceToLight + 0.032 * (distanceToLight * distanceToLight));

    double ambientStrength = 0.2;
    double diffuseStrength = 0.7;
    double specularStrength = 0.5;
    double shininess = 16.0;

    dvec3 lightDir = normalize(lightPos - position);

    dvec3 ambient = ambientStrength * dvec3(1.0, 1.0, 1.0);

    double diff = max(dot(normal, lightDir), 0.0);
    dvec3 diffuse = diffuseStrength * diff * diffuseColor;

    dvec3 viewDir = normalize(viewPos - position);
    dvec3 halfDir = normalize(lightDir + viewDir);
    double spec = pow(max(dot(float(normal), float(halfDir)), 0.0), float(shininess));
    dvec3 specular = specularStrength * spec * dvec3(0.8, 0.8, 0.8);
    specular *= min(1.0, 1.0 / distanceToLight);

    return ambient + diffuse + specular;
}

vec4 RayMarcher(dvec3 ro, dvec3 rd) {
    double steps = 0.0;
    double totalDistance = 0.0;
    double minDistToScene = 100.0;
    dvec3 minDistToScenePos = ro;
    double minDistToOrigin = 100.0;
    dvec3 minDistToOriginPos = ro;
    vec3 col = vec3(0.0);
    dvec3 curPos = ro;
    bool hit = false;

    for (steps = 0.0; steps < double(MaximumRaySteps); steps++) {
        dvec3 p = ro + totalDistance * rd;
        double distance = DistanceEstimator(p);
        curPos = ro + rd * totalDistance;
        
        if (minDistToScene > distance) {
            minDistToScene = distance;
            minDistToScenePos = curPos;
        }

        if (minDistToOrigin > length(curPos)) {
            minDistToOrigin = length(curPos);
            minDistToOriginPos = curPos;
        }

        totalDistance += distance;

        if (distance < MinimumDistance) {
            hit = true;
            break;
        }
        else if (distance > MaximumDistance) {
            break;
        }
    }

    if (hit) {
        dvec3 normal = computeNormal(curPos);
        dvec3 lightPos = dvec3(2.0, 2.0, -3.0);
        
        double stepFactor = double(steps) / double(MaximumRaySteps);
        dvec3 colorBase = dvec3(0.8 + (length(curPos) / 0.5), 1.0, 0.8);
        colorBase = hsv2rgb(colorBase);

        colorBase *= (1.0 - stepFactor);

        col.rgb = vec3(blinnPhong(curPos, normal, lightPos, ro, colorBase));
    } else {
        col.rgb = vec3(0.0);
    }

    col.rgb /= float(steps) * 0.08;
    col.rgb *= 3.0;

    return col;
}

void main() {
    dvec2 uv = (TexCoords * 2.0 - 1.0) * uResolution / uResolution.y * uZoom;

    dvec3 ro = uCamPos;
    dvec3 rd = normalize((inverse(uView) * vec4(uv.x, uv.y, -1.0, 0.0)).xyz);

    vec4 col = RayMarcher(ro, rd);

    col.rgb = col.rgb / (1.0 + col.rgb);
    col.rgb = pow(col.rgb, vec3(1.0 / 2.2));

    FragColor = vec4(col);
}
