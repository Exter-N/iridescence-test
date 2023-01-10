export default /* glsl */ `
float lab2rgb_h1(float v) {
    float v3 = v * v * v;

    return mix(v3, (v - 16./116.) / 7.787, step(v3, 0.008856));
}

float lab2rgb_h2(float v) {
    return mix((1.055 * pow(v, 1./2.4) - 0.055), 12.92 * v, step(v, 0.0031308));
}

vec3 lab2rgb(vec3 lab) {
    float y = (lab.x + 16.) / 116.,
          x = lab.y / 500. + y,
          z = y - lab.z / 200.,
          r, g, b;

    x = 0.95047 * lab2rgb_h1(x);
    y = 1.00000 * lab2rgb_h1(y);
    z = 1.08883 * lab2rgb_h1(z);

    r = x *  3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y *  1.8758 + z *  0.0415;
    b = x *  0.0557 + y * -0.2040 + z *  1.0570;

    r = lab2rgb_h2(r);
    g = lab2rgb_h2(g);
    b = lab2rgb_h2(b);

    return vec3(saturate(r), saturate(g), saturate(b));
}

float rgb2lab_h1(float v) {
    return mix(pow((v + 0.055) / 1.055, 2.4), v / 12.92, step(v, 0.04045));
}

float rgb2lab_h2(float v) {
    return mix(pow(v, 1./3.), (7.787 * v) + 16./116., step(v, 0.008856));
}

vec3 rgb2lab(vec3 rgb) {
    float r = rgb.x,
          g = rgb.y,
          b = rgb.z,
          x, y, z;

    r = rgb2lab_h1(r);
    g = rgb2lab_h1(g);
    b = rgb2lab_h1(b);

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = rgb2lab_h2(x);
    y = rgb2lab_h2(y);
    z = rgb2lab_h2(z);

    return vec3((116. * y) - 16., 500. * (x - y), 200. * (y - z));
}
`;
