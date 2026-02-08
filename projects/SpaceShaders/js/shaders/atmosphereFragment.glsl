uniform vec3 uSunPosition;
uniform vec3 uColor;
uniform float uPlanetRadius;
uniform float uAtmosphereRadius;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

// Simple Pseudo-Noise
float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

// Ray-Sphere Intersection
float raySphereIntersect(vec3 ro, vec3 rd, float rad) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - rad * rad;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    h = sqrt(h);
    return -b - h;
}

float raySphereIntersectFar(vec3 ro, vec3 rd, float rad) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - rad * rad;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    h = sqrt(h);
    return -b + h;
}

void main() {
    vec3 viewDir = normalize(vPosition - cameraPosition);
    vec3 sunDir = normalize(uSunPosition);
    vec3 ro = cameraPosition;
    
    float tAtmNear = raySphereIntersect(ro, viewDir, uAtmosphereRadius);
    float tAtmFar = raySphereIntersectFar(ro, viewDir, uAtmosphereRadius);
    float tPlanet = raySphereIntersect(ro, viewDir, uPlanetRadius);
    
    float rayStart = 0.0;
    float rayEnd = 0.0;
    
    if (length(ro) < uAtmosphereRadius) {
        rayStart = 0.0;
        rayEnd = tAtmFar;
        if (tPlanet > 0.0) rayEnd = min(rayEnd, tPlanet);
    } else {
        if (tAtmNear < 0.0) discard;
        rayStart = tAtmNear;
        rayEnd = tAtmFar;
        if (tPlanet > 0.0 && tPlanet > tAtmNear) rayEnd = min(rayEnd, tPlanet);
    }
    
    float opticalDepth = rayEnd - rayStart;
    
    // Color Palette
    vec3 colorZenith = vec3(0.0, 0.3, 0.7);
    vec3 colorHorizon = vec3(0.4, 0.6, 0.9);
    vec3 colorSunset = vec3(1.0, 0.4, 0.1);
    
    float t = opticalDepth / 4.0;
    
    vec3 atmosphereColor = mix(colorZenith, colorHorizon, smoothstep(0.0, 0.6, t));
    atmosphereColor = mix(atmosphereColor, colorSunset, smoothstep(0.6, 1.2, t));
    
    float density = smoothstep(0.0, 1.0, opticalDepth);
    vec3 finalColor = atmosphereColor * density;

    // Day/Night calculation (Sun Halo)
    float sunViewDot = dot(viewDir, sunDir);
    float mie = pow(max(sunViewDot, 0.0), 16.0) * 0.5;
    
    // Night Side Fade - FIX
    // Instead of fading based purely on surface normal/position, we should fade based on
    // how much of the ray path is in shadow.
    // Simplified: If optical depth is high (limb), we allow it to be visible even if slightly "behind" the planet.
    
    vec3 posDir = normalize(vPosition);
    float sunOrientation = dot(posDir, sunDir);
    
    // We relax the fade for thick atmosphere
    // If t (optical depth factor) is high, we push the fade threshold back
    float fadeThreshold = -0.2 - (t * 0.5); 
    float nightFade = smoothstep(fadeThreshold, 0.2, sunOrientation);
    
    // Ensure the limb is always somewhat visible if it's catching light
    // The "limb" is where viewDir is perpendicular to normal.
    // But here we just use the relaxed fade.
    
    finalColor *= nightFade;
    density *= nightFade;
    
    // Ion Flow Effect
    // Flow direction opposite to sun
    vec3 flowDir = -sunDir;
    
    // Project position onto flow plane or just move along flowDir
    // We want the noise to move AWAY from the sun.
    // So we subtract flowDir * time from the coordinate.
    vec3 noiseCoord = vPosition * 2.0 - flowDir * uTime * 2.0;
    
    float flowNoise = noise(noiseCoord);
    
    // Mask flow to the night side / tail
    // We want it visible where sunOrientation is low (night side)
    float flowMask = smoothstep(0.5, -0.5, sunOrientation);
    
    // Add subtle glow
    vec3 flowColor = vec3(0.4, 0.8, 1.0) * flowNoise * 0.3 * flowMask * density;
    finalColor += flowColor;

    // Add Sun Glare (Mie)
    finalColor += vec3(1.0) * mie;
    
    float alpha = clamp(density, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, alpha);
}
